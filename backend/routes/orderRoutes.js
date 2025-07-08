import express from 'express';
import { 
  createOrder, 
  getOrder, 
  getCustomerOrders, 
  getCustomerAddresses, 
  getDeliveryZones,
  placeOrder 
} from '../controllers/orderController.js';

const router = express.Router();

// Order routes
router.post('/', placeOrder);                    // POST /api/orders - Fixed: This matches the frontend call
router.post('/place', placeOrder);               // POST /api/orders/place - Alternative route for backward compatibility
router.get('/:orderId', getOrder);               // GET /api/orders/123
router.get('/', getCustomerOrders);              // GET /api/orders?customer_id=1

// Address routes  
router.get('/addresses', getCustomerAddresses);   // GET /api/orders/addresses?customer_id=1

// Delivery zones routes
router.get('/delivery-zones', getDeliveryZones);  // GET /api/orders/delivery-zones

export default router;