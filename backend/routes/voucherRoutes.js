import express from 'express'
import { showVouchers } from '../controllers/vouchercontroller.js'
const router = express.Router()
// Route to get all vouchers
router.get('/:customer_id', showVouchers)
export default router

