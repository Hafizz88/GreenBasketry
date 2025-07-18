import { client } from '../db.js';

// POST /api/orders - Create a new order
export const createOrder = async (req, res) => {
  const {
    customer_id,
    cart_id,
    address_id,
    subtotal,
    vat_amount,
    delivery_fee,
    discount_amount,
    points_used,
    points_value,
    total_amount,
    applied_coupon_id
  } = req.body;

  try {
    await client.query('BEGIN');

    // 1. Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (
        cart_id, address_id, subtotal, vat_amount, delivery_fee, 
        discount_amount, points_used, points_value, total_amount, 
        order_status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', false) 
      RETURNING *`,
      [cart_id, address_id, subtotal, vat_amount, delivery_fee, 
       discount_amount, points_used || 0, points_value || 0, total_amount]
    );

    const order = orderResult.rows[0];

    // 2. Apply coupon if provided
    if (applied_coupon_id) {
      await client.query(
        `INSERT INTO applied_coupons (order_id, coupon_id) VALUES ($1, $2)`,
        [order.order_id, applied_coupon_id]
      );
    }

    // 3. Update customer points
    if (points_used > 0) {
      await client.query(
        `UPDATE customers SET points_used = COALESCE(points_used, 0) + $1 WHERE customer_id = $2`,
        [points_used, customer_id]
      );
    }

    // 4. Calculate and add points earned from this order (e.g., 1 point per 100 BDT)
    const pointsEarned = Math.floor(total_amount / 100);
    if (pointsEarned > 0) {
      await client.query(
        `UPDATE customers SET points_earned = COALESCE(points_earned, 0) + $1 WHERE customer_id = $2`,
        [pointsEarned, customer_id]
      );
      
      // Update order with points earned
      await client.query(
        `UPDATE orders SET points_earned = $1 WHERE order_id = $2`,
        [pointsEarned, order.order_id]
      );
    }

    // 5. Update buy history for each product
    const cartItems = await client.query(
      `SELECT product_id, quantity FROM cart_items WHERE cart_id = $1`,
      [cart_id]
    );

    for (const item of cartItems.rows) {
      // Check if customer has bought this product before
      const historyCheck = await client.query(
        `SELECT * FROM buy_history WHERE customer_id = $1 AND product_id = $2`,
        [customer_id, item.product_id]
      );

      if (historyCheck.rows.length > 0) {
        // Update existing history
        await client.query(
          `UPDATE buy_history SET 
           last_purchased = CURRENT_TIMESTAMP,
           times_purchased = times_purchased + $1
           WHERE customer_id = $2 AND product_id = $3`,
          [item.quantity, customer_id, item.product_id]
        );
      } else {
        // Create new history record
        await client.query(
          `INSERT INTO buy_history (customer_id, product_id, last_purchased, times_purchased)
           VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
          [customer_id, item.product_id, item.quantity]
        );
      }

      // Update product stock
    }

    // 6. Create delivery record
    const deliveryResult = await client.query(
      `INSERT INTO deliveries (order_id, delivery_status, estimated_time)
       VALUES ($1, 'pending', CURRENT_TIMESTAMP + INTERVAL '45 minutes')
       RETURNING *`,
      [order.order_id]
    );

    const delivery = deliveryResult.rows[0];

    // 7. (Removed auto-assignment to rider)
    // 8. Clear the cart by setting it to inactive
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order_id: order.order_id,
      delivery_id: delivery.delivery_id,
      total_amount: order.total_amount,
      message: 'Order placed successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order' 
    });
  }
};

// GET /api/orders/:orderId - Get specific order details
export const getOrder = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const orderResult = await client.query(
      `SELECT o.*, a.address_line, a.postal_code, c.name as customer_name
       FROM orders o
       JOIN addresses a ON o.address_id = a.address_id
       JOIN customers c ON a.customer_id = c.customer_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await client.query(
      `SELECT ci.quantity, p.name, p.price, p.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1`,
      [order.cart_id]
    );

    // Get delivery status
    const deliveryResult = await client.query(
      `SELECT d.*, r.name as rider_name, r.phone as rider_phone
       FROM deliveries d
       LEFT JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
       LEFT JOIN riders r ON da.rider_id = r.rider_id
       WHERE d.order_id = $1`,
      [orderId]
    );

    res.json({
      order,
      items: itemsResult.rows,
      delivery: deliveryResult.rows[0] || null
    });

  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// GET /api/orders - Get customer orders
export const getCustomerOrders = async (req, res) => {
  const { customer_id } = req.query;
  
  try {
    const ordersResult = await client.query(
      `SELECT o.*, a.address_line, d.delivery_status, d.estimated_time
       FROM orders o
       JOIN addresses a ON o.address_id = a.address_id
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       WHERE a.customer_id = $1
       ORDER BY o.order_date DESC`,
      [customer_id]
    );

    res.json(ordersResult.rows);

  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// GET /api/addresses - Get customer addresses
export const getCustomerAddresses = async (req, res) => {
  const { customer_id } = req.query;
  
  try {
    const addressesResult = await client.query(
      `SELECT a.*, t.thana_name, dz.zone_name, dz.default_delivery_fee
       FROM addresses a
       LEFT JOIN Thanas t ON a.thana_id = t.id
       LEFT JOIN delivery_zones dz ON a.zone_id = dz.zone_id
       WHERE a.customer_id = $1
       ORDER BY a.is_default DESC`,
      [customer_id]
    );

    res.json(addressesResult.rows);

  } catch (error) {
    console.error('❌ Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

// GET /api/delivery-zones - Get all delivery zones
export const getDeliveryZones = async (req, res) => {
  try {
    const zonesResult = await client.query(
      `SELECT * FROM delivery_zones ORDER BY zone_name`
    );

    res.json(zonesResult.rows);

  } catch (error) {
    console.error('❌ Error fetching delivery zones:', error);
    res.status(500).json({ error: 'Failed to fetch delivery zones' });
  }
};

// POST /api/orders/place - Place an order (simplified but complete)
// POST /api/orders/place - Place an order (simplified but complete)
export const placeOrder = async (req, res) => {
  const { customer_id, cart_id, coupon_code, points_used } = req.body;

  // Validate required fields
  if (!customer_id || !cart_id) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID and Cart ID are required'
    });
  }

  try {
    await client.query('BEGIN');

    // 1. Verify customer exists
    const customerCheck = await client.query(
      `SELECT customer_id FROM customers WHERE customer_id = $1`,
      [customer_id]
    );
    if (customerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // 2. Get default address_id for the customer
    const addressResult = await client.query(
      `SELECT address_id, zone_id FROM addresses WHERE customer_id = $1 AND is_default = true LIMIT 1`,
      [customer_id]
    );
    if (addressResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No default address found for customer. Please add a default address first.'
      });
    }
    const { address_id, zone_id } = addressResult.rows[0];

    // 3. Fetch cart items with product details (price, vat_percantage, points_rewarded)
    const cartItemsResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.vat_percantage, p.points_rewarded, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1`,
      [cart_id]
    );
    const cartItems = cartItemsResult.rows;
    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // 4. Calculate subtotal, VAT, and product points
    let subtotal = 0;
    let vat_amount = 0;
    let total_product_points = 0;
    for (const item of cartItems) {
      // Check stock availability
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ID ${item.product_id}. Available: ${item.stock}, Requested: ${item.quantity}`
        });
      }
      const itemSubtotal = Number(item.price) * Number(item.quantity);
      subtotal += itemSubtotal;
      // Calculate VAT for this product
      const itemVAT = itemSubtotal * ((Number(item.vat_percantage) || 0) / 100);
      vat_amount += itemVAT;
      // Calculate product points
      total_product_points += (Number(item.points_rewarded) || 0) * Number(item.quantity);
    }
    vat_amount = Math.round(vat_amount); // or use toFixed(2) for decimals

    // 5. Get delivery fee from zone
    const zoneResult = await client.query(
      `SELECT default_delivery_fee FROM delivery_zones WHERE zone_id = $1`,
      [zone_id]
    );
    const delivery_fee = Number(zoneResult.rows[0]?.default_delivery_fee) || 70;

    // 6. Handle coupon discount
    let discount_amount = 0;
    let applied_coupon_id = null;
    if (coupon_code) {
      const couponResult = await client.query(
        `SELECT coupon_id, discount_percent FROM coupons
         WHERE code = $1 AND is_active = true
         AND valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE`,
        [coupon_code]
      );
      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        applied_coupon_id = coupon.coupon_id;
        discount_amount = subtotal * (Number(coupon.discount_percent) / 100);
      }
    }

    // 7. Validate and calculate points value
    const pointsToUse = Number(points_used) || 0;
    let points_value = 0;
    if (pointsToUse > 0) {
      // Check if customer has enough points
      const customerPoints = await client.query(
        `SELECT (COALESCE(points_earned, 0) - COALESCE(points_used, 0)) as available_points
         FROM customers WHERE customer_id = $1`,
        [customer_id]
      );
      const availablePoints = Number(customerPoints.rows[0]?.available_points) || 0;
      if (pointsToUse > availablePoints) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient points. Available: ${availablePoints}, Requested: ${pointsToUse}`
        });
      }
      points_value = pointsToUse; // assuming 1 point = 1 BDT
    }

    // Debug log for calculation values (after all assignments)
    console.log({
      subtotal,
      vat_amount,
      delivery_fee,
      discount_amount,
      points_value
    });

    // 8. Calculate total
    const total_amount = Math.max(0, subtotal + vat_amount + delivery_fee - discount_amount - points_value);
    console.log({ total_amount });

    // 9. Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (
        cart_id, address_id, subtotal, vat_amount, delivery_fee,
        discount_amount, points_used, points_value, total_amount,
        order_status, payment_status, order_date, points_earned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', false, CURRENT_TIMESTAMP, $10)
      RETURNING order_id`,
      [cart_id, address_id, subtotal, vat_amount, delivery_fee,
        discount_amount, pointsToUse, points_value, total_amount, total_product_points]
    );
    const order_id = orderResult.rows[0].order_id;

    // 10. Apply coupon if provided
    if (applied_coupon_id) {
      await client.query(
        `INSERT INTO applied_coupons (order_id, coupon_id) VALUES ($1, $2)`,
        [order_id, applied_coupon_id]
      );
    }

    // 11. Update customer points (used)
    if (pointsToUse > 0) {
      await client.query(
        `UPDATE customers SET points_used = COALESCE(points_used, 0) + $1 WHERE customer_id = $2`,
        [pointsToUse, customer_id]
      );
    }

    // 12. Add product points to customer
    if (total_product_points > 0) {
      await client.query(
        `UPDATE customers SET points_earned = COALESCE(points_earned, 0) + $1 WHERE customer_id = $2`,
        [total_product_points, customer_id]
      );
    }

    // 13. Update buy history and product stock
    for (const item of cartItems) {
      // Check if customer has bought this product before
      const historyCheck = await client.query(
        `SELECT * FROM buy_history WHERE customer_id = $1 AND product_id = $2`,
        [customer_id, item.product_id]
      );
      if (historyCheck.rows.length > 0) {
        // Update existing history
        await client.query(
          `UPDATE buy_history SET
           last_purchased = CURRENT_TIMESTAMP,
           times_purchased = times_purchased + $1
           WHERE customer_id = $2 AND product_id = $3`,
          [item.quantity, customer_id, item.product_id]
        );
      } else {
        // Create new history record
        await client.query(
          `INSERT INTO buy_history (customer_id, product_id, last_purchased, times_purchased)
           VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
          [customer_id, item.product_id, item.quantity]
        );
      }
      // Update product stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 14. Create delivery record
    const deliveryResult = await client.query(
      `INSERT INTO deliveries (order_id, delivery_status, estimated_time)
       VALUES ($1, 'pending', CURRENT_TIMESTAMP + INTERVAL '45 minutes')
       RETURNING delivery_id`,
      [order_id]
    );
    const delivery_id = deliveryResult.rows[0].delivery_id;

    // 15. (Removed auto-assignment to rider)
    // 16. Clear the cart by setting it to inactive
    await client.query(
      `UPDATE carts SET is_active = false WHERE cart_id = $1`,
      [cart_id]
    );
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order_id: order_id,
      delivery_id: delivery_id,
      total_amount: total_amount,
      points_earned: total_product_points
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order placement error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to place order',
      details: err.message
    });
  }
};