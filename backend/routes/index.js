// routes/index.js
import express from 'express';
import authRoutes from './auth.js'; // include .js extension for ESM

const router = express.Router();

router.use('/', authRoutes);

export default router;
