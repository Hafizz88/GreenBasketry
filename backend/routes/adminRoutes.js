import express from 'express';
import {
  addProduct,
  updateProductPrice,
  createCoupon,
  getAllProducts,
  deleteProduct,
  updateProduct,
  getAllCoupons,
  deleteCoupon,
  updateCoupon
} from '../controllers/adminController.js';

const router = express.Router();

// Route to add a new product
router.post('/add-product', addProduct);

// Route to update product price
router.put('/update-product-price', updateProductPrice);

// Route to create a new discount coupon
router.post('/create-coupon', createCoupon);

// New admin routes:
router.get('/products', getAllProducts);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id', updateProduct); // update all fields

router.get('/coupons', getAllCoupons);
router.delete('/coupons/:id', deleteCoupon);
router.put('/coupons/:id', updateCoupon);

export default router;
