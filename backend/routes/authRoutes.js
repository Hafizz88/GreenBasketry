// authRoutes.js
import express from 'express';
import { login, signup } from '../controllers/authController.js';  // Note the .js extension
import { adminLogin } from '../controllers/adminAuthController.js';  // For admin login
import verifyToken from '../middleware/verifyToken.js'; // Middleware for token verification

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);
router.post('/admin/login',  adminLogin);


// POST /api/auth/login
router.post('/login', login);

export default router; 

