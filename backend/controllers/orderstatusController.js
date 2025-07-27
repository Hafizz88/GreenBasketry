import { client } from '../db.js';
import { io } from '../index.js';

// Cancel order by customer
export const cancelOrder = async (req, res) => {
  const { order_id } = req.params;
  const customer_id = req.user.id;

  try {
    await client.query('BEGIN');

    // 1. Verify order belongs to customer and get order details
    const orderResult = await client.query(
      `SELECT o.*, d.delivery_id, d.delivery_status, da.rider_id
       FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
       WHERE o.order_id = $1 AND EXISTS (
         SELECT 1 FROM carts c 
         WHERE c.cart_id = o.cart_id AND c.customer_id = $2
       )`,
      [order_id, customer_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    const order = orderResult.rows[0];
    const delivery_status = order.delivery_status;
    const rider_id = order.rider_id;

    // 2. Check if order can be cancelled
    if (order.order_status === 'delivered' || order.order_status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    // 3. Always restore points first (automatic in both cases)
    await restoreCustomerPoints(order_id, customer_id);

    // 4. Handle different delivery states
    if (delivery_status === 'pending') {
      // Order not yet assigned to rider - automatic stock restoration and status update
      await handlePendingCancellation(order_id);
      // Order status is already set to 'restored' in handlePendingCancellation
    } else if (delivery_status === 'assigned' || delivery_status === 'out_for_delivery') {
      // Order assigned to rider - manual stock restoration needed, notify rider
      await handleAssignedCancellation(order_id, delivery_status, rider_id);
      // Set order status to cancelled (will be updated to 'restored' when admin restores stock)
      await client.query(
        `UPDATE orders SET order_status = 'cancelled' WHERE order_id = $1`,
        [order_id]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid delivery status for cancellation' });
    }

    // 6. Always set delivery status to failed
    await client.query(
      `UPDATE deliveries SET delivery_status = 'failed' WHERE order_id = $1`,
      [order_id]
    );

    // 7. Log the cancellation
    await client.query(
      `INSERT INTO greenbasketary_admin_log (
        admin_user_id, timestamp, action_type, table_name, record_id, description
      ) VALUES (
        $1, now(), 'CANCEL', 'orders', $2, 'Order cancelled by customer. Delivery status was: ${delivery_status}'
      )`,
      [customer_id.toString(), order_id.toString()]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: delivery_status === 'pending' 
        ? 'Order cancelled successfully. Stock and points restored automatically. Order status: restored.' 
        : 'Order cancelled. Rider notified to return products. Stock restoration pending admin approval.',
      delivery_status: 'failed',
      order_status: delivery_status === 'pending' ? 'restored' : 'cancelled',
      needs_manual_restoration: delivery_status !== 'pending'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Restore customer points (automatic in both cases)
const restoreCustomerPoints = async (order_id, customer_id) => {
  const orderDetails = await client.query(
    `SELECT points_used, points_earned FROM orders WHERE order_id = $1`,
    [order_id]
  );

  if (orderDetails.rows[0]) {
    const { points_used, points_earned } = orderDetails.rows[0];
    
    if (points_used > 0) {
      await client.query(
        `UPDATE customers SET points_used = points_used - $1 WHERE customer_id = $2`,
        [points_used, customer_id]
      );
    }
    
    if (points_earned > 0) {
      await client.query(
        `UPDATE customers SET points_earned = points_earned - $1 WHERE customer_id = $2`,
        [points_earned, customer_id]
      );
    }
  }
};

// Handle cancellation when delivery is pending (not assigned to rider) - Automatic stock restoration
const handlePendingCancellation = async (order_id) => {
  // Restore product stock automatically
  const cartItems = await client.query(
    `SELECT ci.product_id, ci.quantity FROM cart_items ci
     JOIN orders o ON ci.cart_id = o.cart_id
     WHERE o.order_id = $1`,
    [order_id]
  );

  for (const item of cartItems.rows) {
    await client.query(
      `UPDATE products SET stock = stock + $1 WHERE product_id = $2`,
      [item.quantity, item.product_id]
    );
  }

  // Update order status to restored after automatic stock restoration
  await client.query(
    `UPDATE orders SET order_status = 'restored' WHERE order_id = $1`,
    [order_id]
  );
};

// Handle cancellation when delivery is assigned to rider - Manual stock restoration needed
const handleAssignedCancellation = async (order_id, delivery_status, rider_id) => {
  // Don't restore stock here - admin will do it manually later
  
  // Notify rider about cancellation and return products
  if (rider_id) {
    await client.query(
      `INSERT INTO arrival_notifications (delivery_id, rider_id, message, is_read)
       SELECT d.delivery_id, $1, 'Order cancelled by customer. Please return products to base.', false
       FROM deliveries d WHERE d.order_id = $2`,
      [rider_id, order_id]
    );

    // Emit real-time notification to rider
    if (io) {
      io.to(`rider_${rider_id}`).emit('orderCancelled', {
        order_id,
        message: 'Order cancelled by customer. Please return all products to base immediately for stock restoration.'
      });
    }
  }
};

// Admin: Restore stock for cancelled orders (only for orders that were assigned to riders)
export const restoreStockForCancelledOrder = async (req, res) => {
  const { order_id } = req.params;
  const admin_id = req.user.id;

  try {
    await client.query('BEGIN');

    // 1. Verify order exists, is cancelled, and was assigned to a rider
    const orderResult = await client.query(
      `SELECT o.*, d.delivery_status, d.delivery_id FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       WHERE o.order_id = $1 
         AND o.order_status = 'cancelled'
         AND d.delivery_status = 'failed'
         AND EXISTS (
           SELECT 1 FROM delivery_assignments da 
           WHERE da.delivery_id = d.delivery_id
         )`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'Cancelled order not found or does not require manual stock restoration' 
      });
    }

    const order = orderResult.rows[0];

    // 2. Restore product stock
    const cartItems = await client.query(
      `SELECT ci.product_id, ci.quantity FROM cart_items ci
       JOIN orders o ON ci.cart_id = o.cart_id
       WHERE o.order_id = $1`,
      [order_id]
    );

    for (const item of cartItems.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 3. Update order status to restored
    await client.query(
      `UPDATE orders SET order_status = 'restored' WHERE order_id = $1`,
      [order_id]
    );

    // 4. Log the stock restoration
    await client.query(
      `INSERT INTO greenbasketary_admin_log (
        admin_user_id, timestamp, action_type, table_name, record_id, description
      ) VALUES (
        $1, now(), 'RESTORE_STOCK', 'orders', $2, 'Manual stock restoration for cancelled order that was assigned to rider. Order status updated to restored.'
      )`,
      [admin_id.toString(), order_id.toString()]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Stock restored successfully and order status updated to restored'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error restoring stock:', error);
    res.status(500).json({ error: 'Failed to restore stock' });
  }
};

// Get orders that need manual stock restoration (admin view)
export const getCancelledOrdersNeedingStockRestoration = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.points_used,
        o.points_earned,
        d.delivery_status,
        c.name as customer_name,
        c.phone as customer_phone
       FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN carts cart ON o.cart_id = cart.cart_id
       LEFT JOIN customers c ON cart.customer_id = c.customer_id
       WHERE o.order_status = 'cancelled' 
         AND d.delivery_status = 'failed'
         AND EXISTS (
           -- Only include orders that were assigned to riders (not pending)
           SELECT 1 FROM delivery_assignments da 
           WHERE da.delivery_id = d.delivery_id
         )
       ORDER BY o.order_date DESC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching cancelled orders:', error);
    res.status(500).json({ error: 'Failed to fetch cancelled orders' });
  }
};

// Get customer's cancellable orders
export const getCustomerCancellableOrders = async (req, res) => {
  const customer_id = req.user.id;

  try {
    const result = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.order_status,
        o.total_amount,
        o.points_used,
        o.points_earned,
        d.delivery_status,
        d.delivery_id
       FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN carts c ON o.cart_id = c.cart_id
       WHERE c.customer_id = $1 
         AND o.order_status IN ('pending', 'confirmed', 'shipped')
       ORDER BY o.order_date DESC`,
      [customer_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

