import express from 'express';
import { getCart, addToCart, removeFromCart, updateCartItem } from '../controllers/cartController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', verifyToken, getCart);         // GET /api/cart?customer_id=1
router.post('/', verifyToken, addToCart);      // POST /api/cart
router.delete('/', verifyToken, removeFromCart); // DELETE /api/cart
router.put('/', verifyToken, updateCartItem);  // PUT /api/cart

export default router;