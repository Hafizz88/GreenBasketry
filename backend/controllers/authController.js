// ✅ Correct
const pool = require('../db');

const { hashPassword, comparePassword } = require('../utils/hash');
const { validateEmail, validatePassword } = require('../utils/validator');

const login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const table = role + 's'; // e.g., "riders", "admins", "customers"

  try {
    const userQuery = await pool.query(
      `SELECT * FROM ${table} WHERE email = $1`,
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userId = user[`${role}_id`]; // Safely get admin_id, customer_id, or rider_id

    // Log login time
    await pool.query(
      `INSERT INTO login_history(role, user_id, login_time) VALUES($1, $2, NOW())`,
      [role, userId]
    );

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('❌ Login Error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const signup = async (req, res) => {
  const { name, email, password, phone, vehicle_info, role } = req.body;
  console.log('🚀 Signup Request:', { name, email, password, phone, vehicle_info, role });

  if (!email || !password || !role || !name || !phone)
    return res.status(400).json({ error: 'Missing required fields' });

  if (!validateEmail(email)) {
    console.log('❌ Invalid email');
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!validatePassword(password)) {
    console.log('❌ Weak password');
    return res.status(400).json({ error: 'Weak password' });
  }

  try {
    const hash = await hashPassword(password);
    console.log('✅ Password hashed');

    if (role === 'admin') {
      console.log('📥 Inserting admin...');
      await pool.query(
        `INSERT INTO admins(name, email, password_hash, phone) VALUES($1, $2, $3, $4)`,
        [name, email, hash, phone]
      );
    } else if (role === 'customer') {
      console.log('📥 Inserting customer...');
      await pool.query(
        `INSERT INTO customers(name, email, password_hash, phone, points_earned, points_used) VALUES($1, $2, $3, $4, 0, 0)`,
        [name, email, hash, phone]
      );
    } else if (role === 'rider') {
      if (!vehicle_info) {
        console.log('❌ Missing vehicle info for rider');
        return res.status(400).json({ error: 'Missing vehicle info for rider' });
      }
      console.log('📥 Inserting rider...');
      await pool.query(
        `INSERT INTO riders(name, email, password_hash, phone, vehicle_info) VALUES($1, $2, $3, $4, $5)`,
        [name, email, hash, phone, vehicle_info]
      );
    } else {
      console.log('❌ Invalid role');
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    if (err.code === '23505') {
      // duplicate email
      console.log('❌ Duplicate email:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.error('❌ Signup Error (internal):', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = { login, signup };