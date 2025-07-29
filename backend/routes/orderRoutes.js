import express from 'express';
import { 
  createOrder, 
  getOrder, 
  getCustomerOrders, 
  getCustomerAddresses, 
  getDeliveryZones,
  placeOrder 
} from '../controllers/orderController.js';
import {
  cancelOrder,
  restoreStockForCancelledOrder,
  getCancelledOrdersNeedingStockRestoration,
  getCustomerCancellableOrders
} from '../controllers/orderstatusController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Order routes
router.post('/', verifyToken, placeOrder);                    // POST /api/orders - Fixed: This matches the frontend call
router.post('/place', verifyToken, placeOrder);               // POST /api/orders/place - Alternative route for backward compatibility
router.get('/customer/cancellable', verifyToken, getCustomerCancellableOrders);  // GET /api/orders/customer/cancellable
router.get('/admin/cancelled-needing-restoration', verifyToken, getCancelledOrdersNeedingStockRestoration); // GET /api/orders/admin/cancelled-needing-restoration
router.get('/:orderId', verifyToken, getOrder);               // GET /api/orders/123
router.get('/', verifyToken, getCustomerOrders);              // GET /api/orders?customer_id=1

// Order status and cancellation routes
router.post('/:order_id/cancel', verifyToken, cancelOrder);   // POST /api/orders/123/cancel
router.post('/:order_id/restore-stock', verifyToken, restoreStockForCancelledOrder); // POST /api/orders/123/restore-stock (admin)

// Address routes  
router.get('/addresses', verifyToken, getCustomerAddresses);   // GET /api/orders/addresses?customer_id=1

// Delivery zones routes
router.get('/delivery-zones', verifyToken, getDeliveryZones);  // GET /api/orders/delivery-zones

export default router;