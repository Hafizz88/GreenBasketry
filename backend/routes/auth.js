// routes/auth.js
import express from 'express';
import { login, signup } from '../controllers/authController.js'; // include .js extension
import verifyToken from '../middleware/verifytoken.js';

const router = express.Router();

router.post('/login',login);
router.post('/signup', signup);

export default router;

