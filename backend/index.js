import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';          // include .js extension
import authRoutes from './routes/authRoutes.js'; // include .js extension
import dotenv from 'dotenv';
import { client, connectDB } from './db.js';     // include .js extension
import productRoutes from './routes/productRoutes.js'; // include .js extension

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/', routes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Add product routes

(async () => {
  try {
    await connectDB(); // connect once before starting the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      const customers= async () => {
        try {
          const res = await client.query('SELECT * FROM customers');
          console.log('👥 Customers:', res.rows);
        } catch (err) {
          console.error('❌ Error fetching customers:', err.message);
        }
      };
      customers();
    });
  } catch (err) {
    console.error('❌ Failed to start server due to DB connection error:', err.message);
    process.exit(1);
  }
})();


