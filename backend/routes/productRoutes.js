import express from 'express';
const router = express.Router();
import { getAllProducts } from '../controllers/productController.js'; // Adjust the path as necessary

router.get('/', getAllProducts); // Public or protected depending on your design
export default router;

