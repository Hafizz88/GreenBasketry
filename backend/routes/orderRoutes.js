import express from 'express';
import { 
  createOrder, 
  getOrder, 
  getCustomerOrders, 
  getCustomerAddresses, 
  getDeliveryZones,
  placeOrder 
} from '../controllers/orderController.js';
import verifyToken from '../middleware/verifytoken.js';

const router = express.Router();

// Order routes
router.post('/', verifyToken, placeOrder);                    // POST /api/orders - Fixed: This matches the frontend call
router.post('/place', verifyToken, placeOrder);               // POST /api/orders/place - Alternative route for backward compatibility
router.get('/:orderId', verifyToken, getOrder);               // GET /api/orders/123
router.get('/', verifyToken, getCustomerOrders);              // GET /api/orders?customer_id=1

// Address routes  
router.get('/addresses', verifyToken, getCustomerAddresses);   // GET /api/orders/addresses?customer_id=1

// Delivery zones routes
router.get('/delivery-zones', verifyToken, getDeliveryZones);  // GET /api/orders/delivery-zones

export default router;