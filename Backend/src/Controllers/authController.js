// src/controllers/authController.js
// Register, login, get current user, change password
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Helper — generates a JWT token for a user
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Helper — sends token + user data in response
const sendTokenResponse = (user, statusCode, res) => {
  const token   = generateToken(user._id);
  user.password = undefined; // never send password back, even hashed
  res.status(statusCode).json({ success: true, token, data: { user } });
};

// POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    // Only destructure known fields — never do User.create(req.body)
    // A malicious user could send { role: 'admin' } otherwise!

    if (await User.findOne({ email }))
      return next(new AppError('An account with this email already exists.', 400));

    const user = await User.create({ name, email, phone, password });
    // Pre-save hook in User.js auto-hashes the password before saving

    logger.info(`New user registered: ${email}`);
    sendTokenResponse(user, 201, res); // 201 = Created
  } catch (err) { next(err); }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError('Please provide email and password.', 400));

    const user = await User.findOne({ email }).select('+password');
    // .select('+password') overrides select:false so we can verify it

    if (!user || !(await user.comparePassword(password)))
      return next(new AppError('Incorrect email or password.', 401));
    // Deliberately vague — don't reveal which field is wrong

    if (!user.isActive)
      return next(new AppError('Your account has been suspended.', 401));

    logger.info(`User logged in: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// GET /api/v1/auth/me  (requires login)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedTrains',    'trainNumber trainName trainType')
      .populate('followedPilots', 'name avatar stats.avgDelayMinutes currentDuty.isOnDuty');
    res.status(200).json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/auth/updatePassword  (requires login)
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return next(new AppError('Please provide current and new password.', 400));

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return next(new AppError('Current password is incorrect.', 401));

    user.password = newPassword; // pre-save hook hashes it automatically
    await user.save();
    sendTokenResponse(user, 200, res); // send new token after password change
  } catch (err) { next(err); }
};