import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';          // include .js extension
import authRoutes from './routes/authRoutes.js'; // include .js extension
import dotenv from 'dotenv';
import { client, connectDB } from './db.js';     // include .js extension
import productRoutes from './routes/productRoutes.js'; // include .js extension
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js'; // include .js extension
import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js'; // include .js extension
import ThanaRoutes from './routes/ThanaRoutes.js'; // include .js extension
import voucherRoutes from './routes/voucherRoutes.js'; // include .js extension
import orderRoutes from './routes/orderRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import http from 'http';
import { Server } from 'socket.io';
import notificationRoutes from './routes/notificationRoutes.js'; // include .js extension

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081','http://192.168.10.59:8081'], credentials: true }));
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/', routes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Add product routes
app.use('/api/cart', cartRoutes); // Add cart routes
app.use('/api/wishlist', wishlistRoutes); // Add wishlist routes
app.use('/api/customers', customerRoutes); // Add customer routes
app.use('/api/thanas', ThanaRoutes); // Add Thana routes
app.use('/api/vouchers', voucherRoutes); // Add voucher routes
app.use('/api/orders', orderRoutes);
app.use('/api/rider', riderRoutes); // Add rider routes
app.use('/api/notifications', notificationRoutes); // Add notification routes

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081','http://192.168.10.59:8081'], credentials: true } });

// Socket.io logic for customer room joining
io.on('connection', (socket) => {
  socket.on('joinCustomerRoom', (customerId) => {
    socket.join(customerId.toString());
  });
});

export { io };

(async () => {
  try {
    await connectDB(); // connect once before starting the server
    server.listen(PORT, () => {
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


