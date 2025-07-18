/*import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const verifyToken = (req, res, next) => {
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
    console.log('Token valid, user:', decoded);
    next();
  } catch (err) {
    console.log('Invalid or expired token:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export default verifyToken;*/
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const verifyToken = (req, res, next) => {
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
    next();
  } catch (err) {
    console.log('Invalid or expired token:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export default verifyToken;