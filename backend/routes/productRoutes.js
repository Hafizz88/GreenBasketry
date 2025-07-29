import express from 'express';
const router = express.Router();
import { 
  getAllProducts, 
  getAllCategories, 
  getProductsByCategory, 
  SearchProductByname, 
  getTopSellingProducts, 
  createProduct, 
  getProductDetails, 
  addProductReview, 
  upvoteReview, 
  getProductReviews 
} from '../controllers/productController.js';
import { upload } from '../controllers/cloudinaryController.js'; // Import multer configuration for Cloudinary
import verifyToken from '../middleware/verifyToken.js';

// Routes for product operations
router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/search', SearchProductByname);
router.get('/top-selling', getTopSellingProducts);

// Route for creating a new product with image upload
router.post('/create', upload.single('image'), createProduct); // Multer middleware to handle image upload

// Route for getting product details by ID
router.get('/:id', getProductDetails);

router.post('/:product_id/reviews', verifyToken, addProductReview);
router.get('/:product_id/reviews', getProductReviews);
router.post('/reviews/:review_id/upvote', verifyToken, upvoteReview);

export default router;
