// routes/thanas.js
import express from 'express';
import { getAllThanas } from '../controllers/ThanaController.js';

const router = express.Router();

router.get('/', getAllThanas);

export default router;
