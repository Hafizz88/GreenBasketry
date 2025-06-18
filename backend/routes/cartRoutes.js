import express from 'express';
import { getCart, addToCart, removeFromCart,updateCartItem } from '../controllers/cartController.js'; // Adjust the path as necessary
const router = express.Router();
// Define the routes for the cart
// GET /api/cart - Get the user's cart
router.get('/', getCart);
// POST /api/cart - Add an item to the cart
router.post('/', addToCart);
// DELETE /api/cart/:itemId - Remove an item from the cart
router.delete('/', removeFromCart);
// PUT /api/cart - Update an item in the cart
router.put('/', updateCartItem);
export default router; // Export the router for use in the main app
// This allows the router to be imported in the main app file or other modules