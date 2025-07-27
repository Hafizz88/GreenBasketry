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
  updateCoupon,
  resolveComplaint,
  setProductDiscount,
  runDiscountExpiry,
  getAllAdmins
} from '../controllers/adminController.js';
import verifyToken from '../middleware/verifytoken.js';
import { upload } from '../controllers/cloudinaryController.js';

const router = express.Router();

// Route to add a new product with image upload
router.post('/add-product', verifyToken, upload.single('image'), addProduct);

// Route to update product price
router.put('/update-product-price', verifyToken, updateProductPrice);

// Route to create a new discount coupon
router.post('/create-coupon', verifyToken, createCoupon);

// New admin routes:
router.get('/products', verifyToken, getAllProducts);
router.delete('/products/:id', verifyToken, deleteProduct);
router.put('/products/:id', verifyToken, updateProduct); // update all fields
router.put('/products/:product_id/discount', verifyToken, setProductDiscount);

router.get('/coupons', verifyToken, getAllCoupons);
//router.post('/coupons', verifyToken, createCoupon); // Assuming you want to create a coupon
router.delete('/coupons/:id', verifyToken, deleteCoupon);
router.put('/coupons/:id', verifyToken, updateCoupon);

// Route to resolve a complaint
router.patch('/complaints/:id/resolve', verifyToken, resolveComplaint);
router.post('/run-discount-expiry', verifyToken, runDiscountExpiry);
router.get('/admins', verifyToken, getAllAdmins);

export default router;
