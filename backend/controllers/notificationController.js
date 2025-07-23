import { client } from '../db.js';

// Store a notification in the arrival_notifications table
export const addNotification = async (req, res) => {
  const { delivery_id, rider_id, message } = req.body;
  console.log('[addNotification] Called with:', { delivery_id, rider_id, message });
  if (!delivery_id || !message) {
    console.log('[addNotification] Missing delivery_id or message');
    return res.status(400).json({ error: 'delivery_id and message are required' });
  }
  try {
    const result = await client.query(
      `INSERT INTO arrival_notifications (delivery_id, rider_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [delivery_id, rider_id || null, message]
    );
    console.log('[addNotification] Notification added:', result.rows[0]);
    res.status(201).json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error('[addNotification] Error:', err);
    res.status(500).json({ error: 'Failed to add notification' });
  }
};

// Get notifications for a customer (by customer_id)
export const getCustomerNotifications = async (req, res) => {
  const { customer_id } = req.params;
  console.log('[getCustomerNotifications] Called with customer_id:', customer_id);
  if (!customer_id) {
    console.log('[getCustomerNotifications] Missing customer_id');
    return res.status(400).json({ error: 'customer_id is required' });
  }
  try {
    const result = await client.query(
      `SELECT an.* FROM arrival_notifications an
       JOIN deliveries d ON an.delivery_id = d.delivery_id
       JOIN orders o ON d.order_id = o.order_id
       JOIN carts c ON o.cart_id = c.cart_id
       WHERE c.customer_id = $1
       ORDER BY an.created_at DESC`,
      [customer_id]
    );
    console.log('[getCustomerNotifications] Result:', result.rows);
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('[getCustomerNotifications] Error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get notifications for a rider (by rider_id)
export const getRiderNotifications = async (req, res) => {
  const { rider_id } = req.params;
  console.log('[getRiderNotifications] Called with rider_id:', rider_id);
  if (!rider_id) {
    console.log('[getRiderNotifications] Missing rider_id');
    return res.status(400).json({ error: 'rider_id is required' });
  }
  try {
    const result = await client.query(
      `SELECT * FROM arrival_notifications WHERE rider_id = $1 ORDER BY created_at DESC`,
      [rider_id]
    );
    console.log('[getRiderNotifications] Result:', result.rows);
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('[getRiderNotifications] Error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  const { notification_id } = req.params;
  console.log('[markNotificationAsRead] Called with notification_id:', notification_id);
  if (!notification_id) {
    console.log('[markNotificationAsRead] Missing notification_id');
    return res.status(400).json({ error: 'notification_id is required' });
  }
  try {
    const result = await client.query(
      `UPDATE arrival_notifications SET is_read = true WHERE notification_id = $1 RETURNING *`,
      [notification_id]
    );
    if (result.rows.length === 0) {
      console.log('[markNotificationAsRead] Notification not found');
      return res.status(404).json({ error: 'Notification not found' });
    }
    console.log('[markNotificationAsRead] Notification marked as read:', result.rows[0]);
    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    console.error('[markNotificationAsRead] Error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}; 