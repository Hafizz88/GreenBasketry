import express from 'express';
import verifyToken from '../middleware/verifytoken.js';
import {
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
  updateDeliveryAndOrderStatus,
  getRiderProfile,
  updateRiderAvailability,
  getRiderDeliveryStats,
  createArrivalNotification,
  getRiderNotifications,
  markNotificationAsRead,
  getAvailableRiders,
  handleOrderCancellation
} from '../controllers/riderController.js';

const router = express.Router();

// Rider Authentication (no token required)
router.post('/login', riderLogin);

// Protected routes - require JWT token
// Rider Profile & Status
router.get('/:riderId/profile', verifyToken, getRiderProfile);
router.put('/:riderId/availability', verifyToken, updateRiderAvailability);
router.get('/available', verifyToken, getAvailableRiders);

// Rider Location & Zone Management
router.put('/:riderId/location', verifyToken, updateRiderLocation);

// Order Management
router.get('/:riderId/available-orders', verifyToken, getAvailableOrdersForRider);
router.post('/:riderId/accept-order', verifyToken, acceptOrder);
router.get('/:riderId/current-assignments', verifyToken, getRiderCurrentAssignments);
router.get('/:riderId/orders', verifyToken, getRiderOrders);
router.get('/orders/zone/:zone', verifyToken, getOrdersByZone);

// Delivery Management
router.post('/assign-delivery', verifyToken, assignDeliveryToRider);
router.put('/delivery/:deliveryId/status', verifyToken, updateDeliveryAndOrderStatus);
router.put('/delivery/:deliveryId/set-time', verifyToken, setDeliveryTime);
router.put('/delivery/:deliveryId/arrival', verifyToken, markArrival);

// Order Cancellation
router.post('/delivery/:deliveryId/cancel', verifyToken, handleOrderCancellation);

// Payment & Order Completion
router.put('/order/:orderId/confirm-payment', verifyToken, confirmPaymentReceived);

// Statistics
router.get('/:riderId/stats', verifyToken, getRiderDeliveryStats);

// Notifications
router.post('/notifications', verifyToken, createArrivalNotification);
router.get('/:riderId/notifications', verifyToken, getRiderNotifications);
router.put('/notifications/:notificationId/read', verifyToken, markNotificationAsRead);

export default router; 