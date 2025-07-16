import express from 'express';
const router = express.Router();
import { getAllProducts,getAllCategories,getProductsByCategory ,SearchProductByname,getTopSellingProducts} from '../controllers/productController.js'; // Adjust the path as necessary
import verifyToken from '../middleware/verifytoken.js'; // Uncomment if you want to protect these routes

router.get('/', verifyToken, getAllProducts); // Public or protected depending on your design
router.get('/categories', getAllCategories);
router.get('/category/:category', verifyToken, getProductsByCategory);
router.get('/search', verifyToken, SearchProductByname);
router.get('/top-selling', getTopSellingProducts);

export default router;

