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
      { id: admin.id, role: 'admin', email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({ message: 'Admin login successful', token,admin });
  } catch (err) {
    console.error('❌ Admin Login Error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { adminLogin };
