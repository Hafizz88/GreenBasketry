import { client } from "../db.js";
import { io } from '../index.js';
import { addNotification } from './notificationController.js';

// Rider login
const riderLogin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const riderQuery = await client.query(
      `SELECT rider_id, name, email, phone, vehicle_info, available, password_hash 
       FROM riders WHERE email = $1`,
      [email]
    );
    
    if (riderQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const rider = riderQuery.rows[0];
    
    // TODO: Add password verification here using your hash utility
    // const isValidPassword = await verifyPassword(password, rider.password_hash);
    // if (!isValidPassword) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }
    
    res.status(200).json({
      rider_id: rider.rider_id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicle_info: rider.vehicle_info,
      available: rider.available
    });
    
    console.log(`🚚 Rider ${rider.name} logged in successfully`);
  } catch (error) {
    console.error('Error during rider login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update rider location
const updateRiderLocation = async (req, res) => {
  const { riderId } = req.params;
  const { latitude, longitude, zone } = req.body;
  
  try {
    // Verify rider exists
    const riderQuery = await client.query(
      `SELECT rider_id FROM riders WHERE rider_id = $1`,
      [riderId]
    );
    
    if (riderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    res.status(200).json({ 
      message: 'Location updated successfully',
      zone: zone,
      coordinates: { latitude, longitude }
    });
    
    console.log(`📍 Rider ${riderId} location updated to zone: ${zone}`);
  } catch (error) {
    console.error('Error updating rider location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available orders for rider's zone
const getAvailableOrdersForRider = async (req, res) => {
  const { riderId } = req.params;
  const { zone } = req.query; // Get zone from query parameter
  console.log('getAvailableOrdersForRider called:', { riderId, zone });
  try {
    // Verify rider exists
    const riderQuery = await client.query(
      `SELECT rider_id FROM riders WHERE rider_id = $1`,
      [riderId]
    );
    if (riderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    if (!zone) {
      return res.status(400).json({ error: 'Zone parameter is required' });
    }
    // Get unassigned orders in rider's zone
    const ordersQuery = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.order_status,
        o.total_amount,
        o.payment_status,
        d.delivery_id,
        d.delivery_status,
        c.name as customer_name,
        c.phone as customer_phone,
        addr.address_line,
        addr.postal_code,
        t.thana_name,
        dz.zone_name
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN addresses addr ON o.address_id = addr.address_id
      LEFT JOIN "Thanas" t ON addr.thana_id = t.id
      JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
      WHERE dz.zone_name = $1 
        AND d.delivery_status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM delivery_assignments da 
          WHERE da.delivery_id = d.delivery_id
        )
      ORDER BY o.order_date ASC`,
      [zone]
    );
    console.log('ordersQuery result:', ordersQuery.rows);
    res.status(200).json(ordersQuery.rows);
    console.log(`📦 Found ${ordersQuery.rows.length} available orders in zone ${zone}`);
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept order (assign delivery to rider)
const acceptOrder = async (req, res) => {
  const { riderId } = req.params;
  const { deliveryId } = req.body;
  
  try {
    // Check if delivery is already assigned
    const existingAssignment = await client.query(
      `SELECT * FROM delivery_assignments WHERE delivery_id = $1`,
      [deliveryId]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ error: 'Order already accepted by another rider' });
    }
    
    // Check if rider is available
    const riderQuery = await client.query(
      `SELECT available FROM riders WHERE rider_id = $1`,
      [riderId]
    );
    
    if (riderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    if (!riderQuery.rows[0].available) {
      return res.status(400).json({ error: 'Rider is not available' });
    }
    
    // Assign delivery to rider
    const assignmentQuery = await client.query(
      `INSERT INTO delivery_assignments (delivery_id, rider_id) VALUES ($1, $2) RETURNING *`,
      [deliveryId, riderId]
    );
    
    // Update delivery status to 'assigned'
    await client.query(
      `UPDATE deliveries SET delivery_status = 'assigned' WHERE delivery_id = $1`,
      [deliveryId]
    );

    // Update order status to 'shipped'
    await client.query(
      `UPDATE orders SET order_status = 'shipped' 
       WHERE order_id = (SELECT order_id FROM deliveries WHERE delivery_id = $1)`,
      [deliveryId]
    );

    // Find customerId for this delivery
    const customerResult = await client.query(
      `SELECT c.customer_id FROM deliveries d
       JOIN orders o ON d.order_id = o.order_id
       JOIN carts c ON o.cart_id = c.cart_id
       WHERE d.delivery_id = $1`,
      [deliveryId]
    );
    if (customerResult.rows.length > 0) {
      const customerId = customerResult.rows[0].customer_id;
      io.to(customerId.toString()).emit('orderAccepted', {
        deliveryId,
        message: 'Your order has been accepted by a rider.'
      });
      // Store notification in DB
      await addNotification({
        body: { delivery_id: deliveryId, rider_id: riderId, message: 'Your order has been accepted by a rider.' }
      }, { status: () => ({ json: () => {} }) });
    }
    
    res.status(201).json({
      message: 'Order accepted successfully',
      assignment: assignmentQuery.rows[0]
    });
    
    console.log(`✅ Rider ${riderId} accepted delivery ${deliveryId} - Order status changed to 'shipped'`);
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set delivery time (random time generation)
const setDeliveryTime = async (req, res) => {
  const { deliveryId } = req.params;
  
  try {
    // Generate random delivery time between 15-45 minutes from now
    const minMinutes = 15;
    const maxMinutes = 45;
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + randomMinutes);
    
    const updateQuery = await client.query(
      `UPDATE deliveries 
       SET delivery_status = 'out_for_delivery', estimated_time = $1
       WHERE delivery_id = $2 RETURNING *`,
      [estimatedTime, deliveryId]
    );
    
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.status(200).json({
      message: 'Delivery time set successfully',
      estimated_time: estimatedTime,
      delivery_status: 'out_for_delivery'
    });
    
    console.log(`⏰ Delivery ${deliveryId} estimated time set to ${estimatedTime}`);
  } catch (error) {
    console.error('Error setting delivery time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark arrival at customer location
const markArrival = async (req, res) => {
  const { deliveryId } = req.params;
  const { riderId } = req.body;
  
  try {
    // Update delivery status
    await client.query(
      `UPDATE deliveries SET delivery_status = 'out_for_delivery' WHERE delivery_id = $1`,
      [deliveryId]
    );

    // Update order status to 'delivered'
    await client.query(
      `UPDATE orders SET order_status = 'delivered' 
       WHERE order_id = (SELECT order_id FROM deliveries WHERE delivery_id = $1)`,
      [deliveryId]
    );

    // Find customerId for this delivery
    const customerResult = await client.query(
      `SELECT c.customer_id FROM deliveries d
       JOIN orders o ON d.order_id = o.order_id
       JOIN carts c ON o.cart_id = c.cart_id
       WHERE d.delivery_id = $1`,
      [deliveryId]
    );
    if (customerResult.rows.length > 0) {
      const customerId = customerResult.rows[0].customer_id;
      io.to(customerId.toString()).emit('riderArrived', {
        deliveryId,
        message: 'Your rider has arrived!'
      });
      // Store notification in DB
      await addNotification({
        body: { delivery_id: deliveryId, rider_id: riderId, message: 'Rider has arrived at your location' }
      }, { status: () => ({ json: () => {} }) });
    }
    
    res.status(200).json({
      message: 'Arrival marked successfully'
    });
    
    console.log(`🚚 Rider ${riderId} marked arrival for delivery ${deliveryId} - Order status changed to 'delivered'`);
  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper to handle stock, points, and notifications for delivery completion or failure
const handleOrderCompletionOrFailure = async ({ deliveryId, delivery_status, riderId }) => {
  // Find riderId for this delivery if not provided
  let usedRiderId = riderId;
  if (!usedRiderId) {
    const assignmentResult = await client.query(
      `SELECT rider_id FROM delivery_assignments WHERE delivery_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
      [deliveryId]
    );
    if (assignmentResult.rows.length > 0) {
      usedRiderId = assignmentResult.rows[0].rider_id;
    }
  }
  // Find orderId and customerId for this delivery
  let orderId = null, customerId = null;
  const orderResult = await client.query(
    `SELECT o.order_id, c.customer_id FROM deliveries d
     JOIN orders o ON d.order_id = o.order_id
     JOIN carts c ON o.cart_id = c.cart_id
     WHERE d.delivery_id = $1`,
    [deliveryId]
  );
  if (orderResult.rows.length > 0) {
    orderId = orderResult.rows[0].order_id;
    customerId = orderResult.rows[0].customer_id;
  }
  // Insert into arrival_notifications for both failed and successful
  if (usedRiderId) {
    let message = '';
    if (delivery_status === 'failed') {
      message = 'Your delivery attempt failed. Please contact support or reorder.';
    } else if (delivery_status === 'delivered') {
      message = 'Your order was delivered successfully! Thank you for shopping with us.';
    }
    if (message) {
      await client.query(
        `INSERT INTO arrival_notifications (delivery_id, rider_id, message, is_read, created_at)
         VALUES ($1, $2, $3, false, NOW())`,
        [deliveryId, usedRiderId, message]
      );
      // Emit real-time notification
      if (io && customerId) {
        io.to(customerId.toString()).emit('orderStatus', { deliveryId, message });
      }
      console.log(`[ARRIVAL_NOTIFICATION] Inserted: delivery_id=${deliveryId}, rider_id=${usedRiderId}, message=${message}`);
    }
  }
  // If successful delivery, update product stock and customer points
  /*if (delivery_status === 'delivered' && orderId && customerId) {
    const itemsResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.points_rewarded
       FROM cart_items ci
       JOIN orders o ON ci.cart_id = o.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE o.order_id = $1`,
      [orderId]
    );
    let totalPoints = 0;
    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
      totalPoints += (item.points_rewarded || 0) * item.quantity;
    }
    if (totalPoints > 0) {
      await client.query(
        `UPDATE customers SET points_earned = points_earned + $1 WHERE customer_id = $2`,
        [totalPoints, customerId]
      );
    }
    console.log(`[ORDER SUCCESS] Updated stock and points for order_id=${orderId}, customer_id=${customerId}, points=${totalPoints}`);
  }*/
};


const confirmPaymentReceived = async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, riderId } = req.body;
  try {
    await client.query('BEGIN');
    const updateQuery = await client.query(
      `UPDATE orders SET payment_status = true, payment_date = CURRENT_TIMESTAMP WHERE order_id = $1 RETURNING *`,
      [orderId]
    );
    if (updateQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const deliveryResult = await client.query(
      `UPDATE deliveries SET delivery_status = 'delivered' WHERE order_id = $1 RETURNING *`,
      [orderId]
    );
    await client.query(
      `UPDATE orders SET order_status = 'delivered' WHERE order_id = $1`,
      [orderId]
    );
    let deliveryId = null;
    if (deliveryResult.rows.length > 0) {
      deliveryId = deliveryResult.rows[0].delivery_id;
    } else {
      const dRes = await client.query(
        `SELECT delivery_id FROM deliveries WHERE order_id = $1 LIMIT 1`,
        [orderId]
      );
      if (dRes.rows.length > 0) deliveryId = dRes.rows[0].delivery_id;
    }
    if (deliveryId) {
      await handleOrderCompletionOrFailure({ deliveryId, delivery_status: 'delivered', riderId });
    }
    await client.query('COMMIT');
    res.status(200).json({
      message: 'Payment confirmed and delivery completed',
      order_id: orderId,
      payment_status: true,
      payment_date: new Date()
    });
    console.log(`💰 Payment confirmed for order ${orderId} - Order status changed to 'delivered'`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle order cancellation from rider's side
const handleOrderCancellation = async (req, res) => {
  const { deliveryId } = req.params;
  const { riderId } = req.body;

  try {
    await client.query('BEGIN');

    // Check if delivery exists and is assigned to this rider
    const deliveryCheck = await client.query(
      `SELECT d.*, da.rider_id, o.order_id, o.points_used, o.points_value, c.customer_id
       FROM deliveries d
       LEFT JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
       JOIN orders o ON d.order_id = o.order_id
       JOIN carts cart ON o.cart_id = cart.cart_id
       JOIN customers c ON cart.customer_id = c.customer_id
       WHERE d.delivery_id = $1 AND da.rider_id = $2`,
      [deliveryId, riderId]
    );

    if (deliveryCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found or not assigned to this rider' });
    }

    const delivery = deliveryCheck.rows[0];

    // Update delivery status to failed
    await client.query(
      `UPDATE deliveries SET delivery_status = 'failed' WHERE delivery_id = $1`,
      [deliveryId]
    );

    // Update order status to cancelled
    await client.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE order_id = $1`,
      [delivery.order_id]
    );

    // Refund points to customer if points were used
    console.log(`🔍 Order ${delivery.order_id} - Points used: ${delivery.points_used}, Points value: ${delivery.points_value}`);
    
    if (delivery.points_used && delivery.points_used > 0) {
      await client.query(
        `UPDATE customers SET points_used = points_used - $1 WHERE customer_id = $2`,
        [delivery.points_used, delivery.customer_id]
      );
      console.log(`💰 Refunded ${delivery.points_used} points to customer ${delivery.customer_id}`);
    }

    // Also refund any points that were earned but not yet credited
    // Get the points that would have been earned for this order
    const pointsEarnedQuery = await client.query(`
      SELECT COALESCE(SUM(ci.quantity * p.points_rewarded), 0) as points_earned
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN orders o ON ci.cart_id = o.cart_id
      WHERE o.order_id = $1
    `, [delivery.order_id]);

    const pointsEarned = pointsEarnedQuery.rows[0].points_earned;
    console.log(`🔍 Points that would have been earned for order ${delivery.order_id}: ${pointsEarned}`);
    
    if (pointsEarned > 0) {
      // Since the order is cancelled, we need to reverse any points that were already earned
      await client.query(
        `UPDATE customers SET points_earned = points_earned - $1 WHERE customer_id = $2`,
        [pointsEarned, delivery.customer_id]
      );
      console.log(`💰 Reversed ${pointsEarned} earned points for customer ${delivery.customer_id}`);
    }

    // Debug: Check current customer points after refund
    const customerPointsQuery = await client.query(
      `SELECT points_earned, points_used FROM customers WHERE customer_id = $1`,
      [delivery.customer_id]
    );
    if (customerPointsQuery.rows.length > 0) {
      const customer = customerPointsQuery.rows[0];
      console.log(`📊 Customer ${delivery.customer_id} points after refund - Earned: ${customer.points_earned}, Used: ${customer.points_used}`);
    }

    // Create notification for rider about cancellation
    await client.query(
      `INSERT INTO arrival_notifications (delivery_id, rider_id, message, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [deliveryId, riderId, 'Order cancelled. Please return to base.']
    );

    // Emit real-time notification to rider
    if (io) {
      io.to(`rider_${riderId}`).emit('orderCancelled', {
        deliveryId,
        message: 'Order cancelled. Please return to base.'
      });
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. Points refunded to customer.',
      points_used_refunded: delivery.points_used || 0,
      points_earned_reversed: pointsEarned || 0,
      total_points_affected: (delivery.points_used || 0) + (pointsEarned || 0)
    });

    console.log(`❌ Order ${delivery.order_id} cancelled by rider ${riderId}. Points used refunded: ${delivery.points_used || 0}, Points earned reversed: ${pointsEarned || 0}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error handling order cancellation:', error);
    res.status(500).json({ error: 'Failed to process order cancellation' });
  }
};

// Update getRiderCurrentAssignments to filter out cancelled orders
const getRiderCurrentAssignments = async (req, res) => {
  const { riderId } = req.params;
  try {
    const result = await client.query(
      `SELECT 
        d.delivery_id,
        o.order_id,
        o.order_status,
        o.total_amount,
        c.name as customer_name,
        c.phone as customer_phone,
        a.address_line,
        d.delivery_status,
        d.estimated_time
       FROM deliveries d
       JOIN orders o ON d.order_id = o.order_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
       JOIN addresses a ON o.address_id = a.address_id
       JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
      WHERE da.rider_id = $1 
         AND o.order_status != 'restored'
      ORDER BY da.assigned_at DESC`,
      [riderId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rider assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// Get all orders assigned to a specific rider
const getRiderOrders = async (req, res) => {
  const { riderId } = req.params;
  
  try {
    const ordersQuery = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.order_status,
        o.total_amount,
        o.payment_status,
        d.delivery_id,
        d.delivery_status,
        d.estimated_time,
        da.assigned_at,
        c.name as customer_name,
        c.phone as customer_phone,
        addr.address_line,
        addr.postal_code,
        t.thana_name,
        dz.zone_name
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN addresses addr ON o.address_id = addr.address_id
      LEFT JOIN "Thanas" t ON addr.thana_id = t.id
      JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
      WHERE da.rider_id = $1
      ORDER BY da.assigned_at DESC`,
      [riderId]
    );
    
    res.status(200).json(ordersQuery.rows);
    console.log(`🚚 Orders for rider ${riderId} fetched successfully:`, ordersQuery.rows.length);
  } catch (error) {
    console.error('Error fetching rider orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get orders by zone (existing function)
const getOrdersByZone = async (req, res) => {
  const { zone } = req.params;
  try {
    const ordersQuery = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.order_status,
        o.total_amount,
        o.payment_status,
        d.delivery_id,
        d.delivery_status,
        d.estimated_time,
        c.name as customer_name,
        c.phone as customer_phone,
        addr.address_line,
        addr.postal_code,
        t.thana_name,
        dz.zone_name
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN addresses addr ON o.address_id = addr.address_id
      LEFT JOIN "Thanas" t ON addr.thana_id = t.id
      JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
      WHERE dz.zone_name = $1 AND d.delivery_status = 'pending'
      ORDER BY o.order_date ASC`,
      [zone]
    );
    res.status(200).json(ordersQuery.rows);
    console.log(`📦 Orders in zone "${zone}" fetched successfully:`, ordersQuery.rows.length);
  } catch (error) {
    console.error('Error fetching orders by zone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign delivery to rider
const assignDeliveryToRider = async (req, res) => {
  const { deliveryId, riderId } = req.body;
  
  try {
    // Check if delivery is already assigned
    const existingAssignment = await client.query(
      `SELECT * FROM delivery_assignments WHERE delivery_id = $1`,
      [deliveryId]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ error: 'Delivery already assigned to a rider' });
    }
    
    // Check if rider is available
    const riderQuery = await client.query(
      `SELECT available FROM riders WHERE rider_id = $1`,
      [riderId]
    );
    
    if (riderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    if (!riderQuery.rows[0].available) {
      return res.status(400).json({ error: 'Rider is not available' });
    }
    
    // Assign delivery to rider
    const assignmentQuery = await client.query(
      `INSERT INTO delivery_assignments (delivery_id, rider_id) VALUES ($1, $2) RETURNING *`,
      [deliveryId, riderId]
    );
    
    res.status(201).json(assignmentQuery.rows[0]);
    console.log(`✅ Delivery ${deliveryId} assigned to rider ${riderId}`);
  } catch (error) {
    console.error('Error assigning delivery to rider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  const { deliveryId } = req.params;
  const { deliveryStatus, estimatedTime } = req.body;
  
  try {
    const updateQuery = await client.query(
      `UPDATE deliveries 
       SET delivery_status = $1, estimated_time = $2
       WHERE delivery_id = $3 RETURNING *`,
      [deliveryStatus, estimatedTime, deliveryId]
    );
    
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.status(200).json(updateQuery.rows[0]);
    console.log(`📦 Delivery ${deliveryId} status updated to ${deliveryStatus}`);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { order_status } = req.body;
  
  // Validate allowed order statuses
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowedStatuses.includes(order_status)) {
    return res.status(400).json({ 
      error: 'Invalid order status. Allowed statuses: ' + allowedStatuses.join(', ') 
    });
  }
  
  try {
    const result = await client.query(
      `UPDATE orders SET order_status = $1 WHERE order_id = $2 RETURNING *`,
      [order_status, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(200).json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
    
    console.log(`📦 Order ${orderId} status updated to ${order_status}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDeliveryAndOrderStatus = async (req, res) => {
  const { deliveryId } = req.params;
  const { delivery_status, order_status, riderId } = req.body;
  const allowedOrderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (order_status && !allowedOrderStatuses.includes(order_status)) {
    return res.status(400).json({ 
      error: 'Invalid order status. Allowed statuses: ' + allowedOrderStatuses.join(', ') 
    });
  }
  try {
    await client.query('BEGIN');
    if (delivery_status) {
      await client.query(
        `UPDATE deliveries SET delivery_status = $1 WHERE delivery_id = $2`,
        [delivery_status, deliveryId]
      );
    }
    if (order_status) {
      await client.query(
        `UPDATE orders SET order_status = $1 WHERE order_id = (SELECT order_id FROM deliveries WHERE delivery_id = $2)`,
        [order_status, deliveryId]
      );
    }
    await handleOrderCompletionOrFailure({ deliveryId, delivery_status, riderId });
    await client.query('COMMIT');
    res.status(200).json({
      message: 'Delivery and order status updated successfully',
      delivery_status,
      order_status
    });
    console.log(`📦 Delivery ${deliveryId} updated - Delivery: ${delivery_status}, Order: ${order_status}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating delivery and order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get rider profile
const getRiderProfile = async (req, res) => {
  const { riderId } = req.params;
  
  try {
    const riderQuery = await client.query(
      `SELECT 
        rider_id,
        name,
        phone,
        email,
        vehicle_info,
        available
      FROM riders WHERE rider_id = $1`,
      [riderId]
    );
    
    if (riderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    res.status(200).json(riderQuery.rows[0]);
  } catch (error) {
    console.error('Error fetching rider profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update rider availability
const updateRiderAvailability = async (req, res) => {
  const { riderId } = req.params;
  const { available } = req.body;
  console.log('updateRiderAvailability called:', { riderId, available });
  try {
    const updateQuery = await client.query(
      `UPDATE riders SET available = $1 WHERE rider_id = $2 RETURNING *`,
      [available, riderId]
    );
    console.log('updateQuery result:', updateQuery.rows);
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    res.status(200).json(updateQuery.rows[0]);
    console.log(`🚚 Rider ${riderId} availability updated to ${available}`);
  } catch (error) {
    console.error('Error updating rider availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delivery statistics for rider
const getRiderDeliveryStats = async (req, res) => {
  const { riderId } = req.params;
  
  try {
    const statsQuery = await client.query(
      `SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END) as completed_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'pending' THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'out_for_delivery' THEN 1 END) as out_for_delivery_deliveries
      FROM delivery_assignments da
      JOIN deliveries d ON da.delivery_id = d.delivery_id
      WHERE da.rider_id = $1`,
      [riderId]
    );
    
    res.status(200).json(statsQuery.rows[0]);
  } catch (error) {
    console.error('Error fetching rider delivery stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create arrival notification
const createArrivalNotification = async (req, res) => {
  const { deliveryId, riderId, message } = req.body;
  
  try {
    const notificationQuery = await client.query(
      `INSERT INTO arrival_notifications (delivery_id, rider_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [deliveryId, riderId, message]
    );
    
    res.status(201).json(notificationQuery.rows[0]);
    console.log(`🔔 Arrival notification created for delivery ${deliveryId}`);
  } catch (error) {
    console.error('Error creating arrival notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get notifications for rider
const getRiderNotifications = async (req, res) => {
  const { riderId } = req.params;
  
  try {
    const notificationsQuery = await client.query(
      `SELECT 
        an.notification_id,
        an.message,
        an.is_read,
        an.created_at,
        d.delivery_id,
        o.order_id
      FROM arrival_notifications an
      JOIN deliveries d ON an.delivery_id = d.delivery_id
      JOIN orders o ON d.order_id = o.order_id
      WHERE an.rider_id = $1
      ORDER BY an.created_at DESC`,
      [riderId]
    );
    
    res.status(200).json(notificationsQuery.rows);
  } catch (error) {
    console.error('Error fetching rider notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  
  try {
    const updateQuery = await client.query(
      `UPDATE arrival_notifications SET is_read = true WHERE notification_id = $1 RETURNING *`,
      [notificationId]
    );
    
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json(updateQuery.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available riders
const getAvailableRiders = async (req, res) => {
  try {
    const ridersQuery = await client.query(
      `SELECT 
        rider_id,
        name,
        phone,
        email,
        vehicle_info,
        available
      FROM riders 
      WHERE available = true AND is_active = true
      ORDER BY name`,
      []
    );
    
    res.status(200).json(ridersQuery.rows);
  } catch (error) {
    console.error('Error fetching available riders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all active riders for admin management
const getAllActiveRiders = async (req, res) => {
  try {
    const ridersQuery = await client.query(
      `SELECT 
        rider_id,
        name,
        phone,
        email,
        vehicle_info,
        available
      FROM riders 
      WHERE is_active = true
      ORDER BY name`,
      []
    );
    
    res.status(200).json(ridersQuery.rows);
  } catch (error) {
    console.error('Error fetching active riders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Soft delete a rider
const deleteRider = async (req, res) => {
  const { id } = req.params;
  console.log('deleteRider called with id:', id);
  
  try {
    const result = await client.query(
      'UPDATE riders SET is_active = false WHERE rider_id = $1 AND is_active = true RETURNING *',
      [id]
    );
    
    console.log('Update result:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No rider found or already inactive');
      return res.status(404).json({ error: 'Rider not found or already inactive' });
    }
    
    console.log('Rider deactivated successfully:', result.rows[0]);
    res.json({ message: 'Rider deactivated successfully', rider: result.rows[0] });
  } catch (err) {
    console.error('Error soft deleting rider:', err);
    res.status(500).json({ error: 'Failed to deactivate rider' });
  }
};

// Update rider details
const updateRider = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, vehicle_info } = req.body;
  
  try {
    const result = await client.query(
      `UPDATE riders 
       SET name = $1, email = $2, phone = $3, vehicle_info = $4
       WHERE rider_id = $5 AND is_active = true RETURNING *`,
      [name, email, phone, vehicle_info, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating rider:', err);
    res.status(500).json({ error: 'Failed to update rider' });
  }
};

export {
  riderLogin,
  updateRiderLocation,
  getAvailableOrdersForRider,
  acceptOrder,
  setDeliveryTime,
  markArrival,
  confirmPaymentReceived,
  getRiderCurrentAssignments,
  getRiderOrders,
  getOrdersByZone,
  assignDeliveryToRider,
  updateDeliveryStatus,
  getRiderProfile,
  updateRiderAvailability,
  getRiderDeliveryStats,
  createArrivalNotification,
  getRiderNotifications,
  markNotificationAsRead,
  getAvailableRiders,
  getAllActiveRiders,
  deleteRider,
  updateRider,
  updateOrderStatus,
  updateDeliveryAndOrderStatus,
  handleOrderCancellation
};