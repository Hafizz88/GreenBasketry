import express from 'express';
import { getCustomerById ,getAddressesByCustomer, setAddressesByCustomer, changePassword } from '../controllers/customerController.js';
import { getAllCoupons } from '../controllers/adminController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/coupons',verifyToken,getAllCoupons);
router.get('/:customer_id', verifyToken, getCustomerById);
router.get('/:customer_id/addresses', verifyToken, getAddressesByCustomer);
router.post('/:customer_id/addresses', verifyToken, setAddressesByCustomer); // Assuming you want to set addresses as well
router.put('/:customer_id/change-password', verifyToken, changePassword); // Route for changing password

// Route for customers to get available coupons


export default router;
