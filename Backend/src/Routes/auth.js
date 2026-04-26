// src/routes/auth.js
// -----------------------------------------------
// Defines all authentication-related URL endpoints.
// A "route" connects a URL + HTTP method to a
// controller function that handles the logic.

const express = require('express');
const router  = express.Router();
// express.Router() creates a mini-app that handles
// a group of related routes. We attach it to the
// main app in server.js with:
//   app.use('/api/v1/auth', authRoutes)

const {
  register,
  login,
  getMe,
  updatePassword
} = require('../controllers/authController');

const { protect } = require('../middlewares/auth');
// protect = middleware that verifies the JWT token.
// Routes that need login get 'protect' inserted before the controller.

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// GET /api/v1/auth/me   ← requires login
router.get('/me', protect, getMe);

// PATCH /api/v1/auth/updatePassword  ← requires login
router.patch('/updatePassword', protect, updatePassword);

module.exports = router;