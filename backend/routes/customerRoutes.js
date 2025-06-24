import express from 'express';
import { getCustomerById ,getAddressesByCustomer} from '../controllers/customerController.js';

const router = express.Router();

router.get('/:customer_id', getCustomerById);
router.get('/addresses', getAddressesByCustomer);

export default router;
