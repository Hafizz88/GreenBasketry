import express from 'express';
import { getCustomerById ,getAddressesByCustomer, setAddressesByCustomer} from '../controllers/customerController.js';
import verifyToken from '../middleware/verifytoken.js';

const router = express.Router();

router.get('/:customer_id', verifyToken, getCustomerById);
router.get('/:customer_id/addresses', verifyToken, getAddressesByCustomer);
router.post('/:customer_id/addresses', verifyToken, setAddressesByCustomer); // Assuming you want to set addresses as well

export default router;
