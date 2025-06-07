const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const pool = require('./db');

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/', routes);
//app.use(signupRoute); 
app.use('/api/auth', authRoutes);
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
