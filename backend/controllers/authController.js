import { client } from '../db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { validateEmail, validatePassword } from '../utils/validator.js';
import jwt from 'jsonwebtoken';

const login = async (req, res) => {
  const { email, password, role } = req.body;
  console.log('🚀 Login Request:', req.body);

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const table = role + 's';

  try {
    const userQuery = await client.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    if (userQuery.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];
    let valid = false;
    if (role === 'customer' || role === 'rider') {
      valid = await comparePassword(password, user.password_hash);
    } else {
      valid = password === user.password_hash;
    }
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return the complete user object
    const token = jwt.sign(
      { id: user[`${role}_id`], role, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',  
      { expiresIn: '1d' }
    );  
    
    // Store the new token in database to invalidate old sessions
    try {
      if (role === 'admin') {
        await client.query(
          'UPDATE admins SET last_token = $1, last_login = NOW() WHERE admin_id = $2',
          [token, user[`${role}_id`]]
        );
      } else if (role === 'customer') {
        await client.query(
          'UPDATE customers SET last_token = $1, last_login = NOW() WHERE customer_id = $2',
          [token, user[`${role}_id`]]
        );
      } else if (role === 'rider') {
        await client.query(
          'UPDATE riders SET last_token = $1, last_login = NOW() WHERE rider_id = $2',
          [token, user[`${role}_id`]]
        );
      }
    } catch (err) {
      console.error('Error storing token:', err);
      // Continue with login even if token storage fails
    }
    
    res.status(200).json({ 
      message: 'Login successful', 
      token, // Include the token in the response
      user: user,
      role 
    });
  } catch (err) {
    console.error('❌ Login Error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const signup = async (req, res) => {
  const { name, email, password, phone, vehicle_info, role } = req.body;
  console.log('🚀 Signup Request:', { name, email, password, phone, vehicle_info, role });

  if (!email || !password || !role || !name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Weak password' });
  }

  try {
    let passwordToStore = password;
    if (role === 'customer') {
      passwordToStore = await hashPassword(password);
    }

    if (role === 'admin') {
      await client.query(
        `INSERT INTO admins(name, email, password_hash, phone) VALUES($1, $2, $3, $4)`,
        [name, email, passwordToStore, phone]
      );
      const result = await client.query(`SELECT admin_id FROM admins WHERE email = $1`, [email]);
      const admin_id = result.rows[0].admin_id;
      return res.status(201).json({ message: 'Admin registered successfully', userId: admin_id });
    }

    else if (role === 'customer') {
      const { thana_name, address_line, postal_code, is_default } = req.body;

      if (!thana_name || !address_line) {
        return res.status(400).json({ error: 'Missing thana name or address' });
      }

      // 1. Convert thana_name to thana_id
      const thanaResult = await client.query(
        `SELECT id FROM "Thanas" WHERE thana_name = $1`,
        [thana_name.trim()]
      );
      console.log(`Thana lookup for "${thana_name}":`, thanaResult.rows);
      if (thanaResult.rowCount === 0) {
        return res.status(400).json({ error: `Invalid thana name: ${thana_name}` });
      }

      const thana_id = thanaResult.rows[0].id;
      console.log(`✅ Thana found: ID ${thana_id}`);

      // 2. Call function that returns TABLE(customer_id, address_id)
      const result = await client.query(
        `SELECT * FROM insert_customer_with_address($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          name,
          email,
          passwordToStore,
          phone,
          address_line,
          thana_id,
          postal_code ?? null,
          is_default ?? true
        ]
      );

      const { customer_id, address_id } = result.rows[0];
      console.log(`✅ Customer created: ID ${customer_id}, Address ID ${address_id}`);
      
      // Create token with consistent structure
      const token = jwt.sign(
        { id: customer_id, role, email },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1d' }
      );

      return res.status(201).json({
        message: 'Customer registered successfully',
        token,
        user: {
          customer_id: customer_id,
          name: name,
          email: email,
          phone: phone
        },
        userId: customer_id,
        role: 'customer',
        addressId: address_id
      });
    }
    else if (role === 'rider') {
      if (!vehicle_info) {
        return res.status(400).json({ error: 'Missing vehicle info for rider' });
      }

      await client.query(
        `INSERT INTO riders(name, email, password_hash, phone, vehicle_info) VALUES($1, $2, $3, $4, $5)`,
        [name, email, passwordToStore, phone, vehicle_info]
      );

      const result = await client.query(`SELECT rider_id FROM riders WHERE email = $1`, [email]);
      const rider_id = result.rows[0].rider_id;
      
      // Create token with consistent structure
      const token = jwt.sign(
        { id: rider_id, role, email },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1d' }
      );

      return res.status(201).json({ 
        message: 'Rider registered successfully', 
        token, 
        user: {
          rider_id: rider_id,
          name: name,
          email: email,
          phone: phone,
          vehicle_info: vehicle_info
        },
        userId: rider_id,
        role: 'rider'
      });
    }

    return res.status(400).json({ error: 'Invalid role' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.error('❌ Signup Error (internal):', err.stack || err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Token verification endpoint
const verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (middleware already verified it)
    res.status(200).json({ 
      message: 'Token is valid',
      user: req.user 
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Token verification failed' });
  }
};

export { login, signup, verifyToken };
