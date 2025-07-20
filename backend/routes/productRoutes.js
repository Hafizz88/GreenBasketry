import express from 'express';
const router = express.Router();
import { 
  getAllProducts, 
  getAllCategories, 
  getProductsByCategory, 
  SearchProductByname, 
  getTopSellingProducts, 
  createProduct 
} from '../controllers/productController.js';
import { upload } from '../controllers/cloudinaryController.js'; // Import multer configuration for Cloudinary

// Routes for product operations
router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/search', SearchProductByname);
router.get('/top-selling', getTopSellingProducts);

// Route for creating a new product with image upload
router.post('/create', upload.single('image'), createProduct); // Multer middleware to handle image upload

export default router;
