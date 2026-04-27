//  Authentication + Authorisation middleware
//
//  protect     → verifies JWT, blocks if not logged in
//  optionalAuth → attaches user if logged in, but
//                 doesn't block guests
//  restrictTo  → blocks users without the right route
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// protect  require login 
const protect = async (req, res, next) => {
  try {
    let token;

    // JWT tokens arrive in the Authorization header 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      // Split "Bearer eyJhbGci..." → take index [1] = just the token
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'You must be logged in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // verify() checks:
    //   1. Was this token signed with our secret? (prevents forgery)
    //   2. Has it expired?
    // If either fails → throws an error → caught below
    // If both pass → decoded = { id: "userId", iat: ..., exp: ... }

    const currentUser = await User.findById(decoded.id);
    // Look up the user from the database using ID in the token

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been suspended.' });
    }

    req.user = currentUser;
    // Attach the full user document to the request
    // Now any route handler after this can access req.user
    // without doing another database query

    next();
    // All checks passed — continue to the route handler

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// optionalAuth — attach user if logged in 
// Use on routes that work for both guests AND users
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token   = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // Token invalid/expired → that's fine, treat as guest
    // Silently swallow the error — this middleware never blocks
  }
  next(); // Always continue — never blocks the request
};

//  restrictTo  role-based access 
// Call AFTER protect (needs req.user to exist)
// restrictTo('admin')              → admin only
// restrictTo('moderator','admin')  → either role
const restrictTo = (...roles) => {
  //roles = rest parameter, collects all args into array
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to do this.'
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, restrictTo };