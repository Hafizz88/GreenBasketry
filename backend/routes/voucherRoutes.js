import express from 'express'
import { showVouchers } from '../controllers/vouchercontroller.js'
import verifyToken from '../middleware/verifytoken.js'
const router = express.Router()
// Route to get all vouchers
router.get('/:customer_id', verifyToken, showVouchers)
export default router

