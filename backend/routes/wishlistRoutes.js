import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import verifyToken from '../middleware/verifytoken.js'; // Import the token verification middleware if needed
const router = express.Router();
// Define routes for wishlist operations
router.get('/', verifyToken, getWishlist); // GET /api/wishlist?customer_id=1
router.post('/', verifyToken, addToWishlist); // POST /api/wishlist
router.delete('/', verifyToken, removeFromWishlist); // DELETE /api/wishlist
export default router; // Export the router to be used in the main app
// This will allow the main app to use these routes for wishlist operations