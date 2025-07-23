import { client } from '../db.js';
import jwt from 'jsonwebtoken';

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log('🚀 Admin Login Request:', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // Query the admins table for the admin with the given email
    const adminQuery = await client.query(
      `SELECT * FROM admins WHERE email = $1`,
      [email]
    );
    console.log('📥 Admin Query Result:', adminQuery.rows);

    if (adminQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = adminQuery.rows[0];

    // For admins, we directly compare the plain-text password
    if (password !== admin.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Admin is successfully authenticated
    const token = jwt.sign(
      { id: admin.admin_id, role: 'admin', email: admin.email }, // Keep this as is
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    // Update the response structure to match what frontend expects
    res.status(200).json({ 
      message: 'Admin login successful', 
      token,
      user: {
        admin_id: admin.admin_id
      },
      userId: admin.admin_id,
      role: 'admin'
    });
  } catch (err) {
    console.error('❌ Admin Login Error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { adminLogin };