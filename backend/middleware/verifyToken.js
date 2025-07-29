import jwt from 'jsonwebtoken';
import { client } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader); // Log the raw header
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Token valid, decoded user object:', decoded); // <-- ADD THIS LINE
    console.log('Decoded user ID:', decoded.id); // <-- ADD THIS LINE
    
    // Verify token is still the latest one in database
    try {
      let dbToken = null;
      if (decoded.role === 'admin') {
        const result = await client.query(
          'SELECT last_token FROM admins WHERE admin_id = $1',
          [decoded.id]
        );
        dbToken = result.rows[0]?.last_token;
      } else if (decoded.role === 'customer') {
        const result = await client.query(
          'SELECT last_token FROM customers WHERE customer_id = $1',
          [decoded.id]
        );
        dbToken = result.rows[0]?.last_token;
      } else if (decoded.role === 'rider') {
        const result = await client.query(
          'SELECT last_token FROM riders WHERE rider_id = $1',
          [decoded.id]
        );
        dbToken = result.rows[0]?.last_token;
      }
      
      // If database has a token and it doesn't match, token is invalid
      if (dbToken && dbToken !== token) {
        console.log('Token mismatch - user logged in elsewhere');
        return res.status(403).json({ error: 'Session expired. Please log in again.' });
      }
    } catch (dbError) {
      console.error('Database token verification error:', dbError);
      // Continue with token verification even if DB check fails
    }
    
    next();
  } catch (err) {
    console.log('Invalid or expired token:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export default verifyToken;