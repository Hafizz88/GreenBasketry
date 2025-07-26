import express from 'express';
import { addNotification, getCustomerNotifications, getRiderNotifications, markNotificationAsRead, markAllCustomerNotificationsAsRead } from '../controllers/notificationController.js';

const router = express.Router();

// Add a notification
router.post('/', addNotification);

// Get notifications for a customer
router.get('/customer/:customer_id' ,getCustomerNotifications);

// Get notifications for a rider
router.get('/rider/:rider_id', getRiderNotifications);

// Mark a notification as read
router.patch('/:notification_id/read', markNotificationAsRead);

// Mark all notifications as read for a customer
router.patch('/customer/:customer_id/mark-all-read', markAllCustomerNotificationsAsRead);

export default router; 