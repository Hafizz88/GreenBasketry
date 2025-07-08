import {client} from '../db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { validateEmail, validatePassword } from '../utils/validator.js';

const login = async (req, res) => {
  const { email, password, role } = req.body;
  console.log('🚀 Login Request:', req.body); // Log incoming request

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const table = role + 's'; // e.g., "customers", "riders"

  try {
    // Query the database for the user with the given email
    const userQuery = await client.query(
      `SELECT * FROM ${table} WHERE email = $1`,
      [email]
    );
    console.log('📥 User Query Result:', userQuery.rows); // Log database query result

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    // For customers or riders, compare the password with bcrypt
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userId = user[`${role}_id`];  // Get the user ID based on the role (e.g., customer_id or rider_id)
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
      await client.query(
        `INSERT INTO admins(name, email, password_hash, phone) VALUES($1, $2, $3, $4)`,
        [name, email, hash, phone]
      );
      userID = await client.query(
        `SELECT admin_id FROM admins WHERE email = $1`,
        [email]
      );
      //localStorage.setItem('userID', userID.rows[0].admin_id);
    } else if (role === 'customer') {
      const { thana_name, address_line, postal_code, is_default } = req.body;

  if (!thana_name || !address_line) {
    return res.status(400).json({ error: 'Missing address or thana name' });
  }

  console.log('📥 Inserting customer with address using procedure...');

  await client.query(
    `CALL register_customer_with_address($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      name,
      email,
      hash,
      phone,
      thana_name,
      address_line,
      postal_code ?? null,
      is_default ?? false
    ]
  );

  res.status(201).json({ message: `Customer registered successfully` });
      localStorage.setItem('userID', userID.rows[0].customer_id);
    } else if (role === 'rider') {
      if (!vehicle_info) {
        console.log('❌ Missing vehicle info for rider');
        return res.status(400).json({ error: 'Missing vehicle info for rider' });
      }
      console.log('📥 Inserting rider...');
      await client.query(
        `INSERT INTO riders(name, email, password_hash, phone, vehicle_info) VALUES($1, $2, $3, $4, $5)`,
        [name, email, hash, phone, vehicle_info]
      );
      userID = await client.query(
        `SELECT rider_id FROM riders WHERE email = $1`,
        [email]
      );
      localStorage.setItem('userID', userID.rows[0].rider_id);
    } else {
      console.log('❌ Invalid role');
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    if (err.code === '23505') {
      console.log('❌ Duplicate email:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.error('❌ Signup Error (internal):', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { login, signup };