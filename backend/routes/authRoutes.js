// authRoutes.js
import express from 'express';
import { login, signup } from '../controllers/authController.js'; // Note the .js extension

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

export default router; // ✅ Export default for ES module compatibility

