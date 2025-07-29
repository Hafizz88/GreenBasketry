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
  getAllAdmins,
  deleteAdmin,
  getRiderStats,
  getAllRidersWithStats,
  getAdminActivityLogs,
  getAdminActivitySummary,
  getDashboardStats,
  getSalesReport,
  getCancelledOrders,
  restoreCancelledOrder
} from '../controllers/adminController.js';
import verifyToken from '../middleware/verifyToken.js';
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
router.delete('/admins/:id', verifyToken, deleteAdmin);

// Rider statistics routes
router.get('/rider-stats/:riderId', verifyToken, getRiderStats);
router.get('/riders-with-stats', verifyToken, getAllRidersWithStats);

// Admin activity log routes
router.get('/activity-logs', verifyToken, getAdminActivityLogs);
router.get('/activity-summary', verifyToken, getAdminActivitySummary);

// Dashboard statistics route
router.get('/dashboard-stats', verifyToken, getDashboardStats);

// Sales report route
router.get('/sales-report', verifyToken, getSalesReport);

// Cancelled orders management routes
router.get('/cancelled-orders', verifyToken, getCancelledOrders);
router.put('/cancelled-orders/:orderId/restore', verifyToken, restoreCancelledOrder);

export default router;
