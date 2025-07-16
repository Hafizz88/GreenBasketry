import { client } from "../db.js";

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
    
    res.status(201).json({
      message: 'Order accepted successfully',
      assignment: assignmentQuery.rows[0]
    });
    
    console.log(`✅ Rider ${riderId} accepted delivery ${deliveryId}`);
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
    // Create arrival notification
    const notificationQuery = await client.query(
      `INSERT INTO arrival_notifications (delivery_id, rider_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [deliveryId, riderId, 'Rider has arrived at your location']
    );
    
    // Update delivery status
    await client.query(
      `UPDATE deliveries SET delivery_status = 'out_for_delivery' WHERE delivery_id = $1`,
      [deliveryId]
    );
    
    res.status(200).json({
      message: 'Arrival marked successfully',
      notification: notificationQuery.rows[0]
    });
    
    console.log(`🚚 Rider ${riderId} marked arrival for delivery ${deliveryId}`);
  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Confirm payment received
const confirmPaymentReceived = async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod } = req.body; // 'cash', 'card', etc.
  
  try {
    // Update order payment status
    const updateQuery = await client.query(
      `UPDATE orders 
       SET payment_status = true, payment_date = CURRENT_TIMESTAMP
       WHERE order_id = $1 RETURNING *`,
      [orderId]
    );
    
    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update delivery status to delivered
    await client.query(
      `UPDATE deliveries 
       SET delivery_status = 'delivered' 
       WHERE order_id = $1`,
      [orderId]
    );
    
    res.status(200).json({
      message: 'Payment confirmed and delivery completed',
      order_id: orderId,
      payment_status: true,
      payment_date: new Date()
    });
    
    console.log(`💰 Payment confirmed for order ${orderId}`);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get rider's current assignments
const getRiderCurrentAssignments = async (req, res) => {
  const { riderId } = req.params;
  
  try {
    const assignmentsQuery = await client.query(
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
        AND d.delivery_status IN ('assigned', 'out_for_delivery')
      ORDER BY da.assigned_at DESC`,
      [riderId]
    );
    
    res.status(200).json(assignmentsQuery.rows);
  } catch (error) {
    console.error('Error fetching rider assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      WHERE available = true
      ORDER BY name`,
      []
    );
    
    res.status(200).json(ridersQuery.rows);
  } catch (error) {
    console.error('Error fetching available riders:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  getAvailableRiders
};