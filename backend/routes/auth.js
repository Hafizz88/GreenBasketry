// routes/auth.js
import express from 'express';
import { login, signup, verifyToken } from '../controllers/authController.js';
import verifyTokenMiddleware from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/verify-token', verifyTokenMiddleware, verifyToken);

export default router;

