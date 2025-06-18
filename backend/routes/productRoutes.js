import express from 'express';
const router = express.Router();
import { getAllProducts,getAllCategories,getProductsByCategory ,SearchProductByname} from '../controllers/productController.js'; // Adjust the path as necessary

router.get('/', getAllProducts); // Public or protected depending on your design
router.get('/categories', getAllCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/search', SearchProductByname);

export default router;

