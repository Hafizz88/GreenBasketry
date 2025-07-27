import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
  getCustomerHomeData,
  getCustomerWishlist,
  getCustomerOrderHistory,
  getTopSellingByZone
} from '../controllers/customerHomeController.js';

const router = express.Router();

// Get personalized customer home data
router.get('/:customerId/home-data', verifyToken, getCustomerHomeData);

// Get customer's wishlist
router.get('/:customerId/wishlist', verifyToken, getCustomerWishlist);

// Get customer's order history
router.get('/:customerId/order-history', verifyToken, getCustomerOrderHistory);

// Get top selling products by zone
router.get('/zone/:zoneName/top-selling', verifyToken, getTopSellingByZone);

export default router; 