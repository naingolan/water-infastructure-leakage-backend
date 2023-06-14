// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

// Middleware function to verify JWT
const authMiddleware = (req, res, next) => {
  // Get the token from the request header or cookie
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify and decode the token using the secret key
    const decoded = jwt.verify(token, config.jwtSecret);

    // Set the decoded payload in the request object
    req.user = decoded;
    console.log(req.user);

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
