import express from 'express';
import { getCustomerById ,getAddressesByCustomer, setAddressesByCustomer} from '../controllers/customerController.js';

const router = express.Router();

router.get('/:customer_id', getCustomerById);
router.get('/:customer_id/addresses', getAddressesByCustomer);
router.post('/:customer_id/addresses', setAddressesByCustomer); // Assuming you want to set addresses as well

export default router;
