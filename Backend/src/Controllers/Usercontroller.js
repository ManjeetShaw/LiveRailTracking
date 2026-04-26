// / Handles all user profile operations:
// // view profile, update info, upload avatar,
// // save/unsave trains, follow/unfollow pilots,
// // and the "My Contributions" page data.


// src/controllers/userController.js
// -----------------------------------------------
// Handles all user profile operations:
// view profile, update info, upload avatar,
// save/unsave trains, follow/unfollow pilots,
// and the "My Contributions" page data.
// -----------------------------------------------

const User   = require('../models/User');
const Post   = require('../models/Post');
const { Rating, HygieneReport } = require('../models/Rating');
const { cloudinary, uploadAvatar } = require('../config/cloudinary');
const { AppError } = require('../middlewares/errorHandler');

// -----------------------------------------------
//  GET /api/v1/users/:id
//  View any user's public profile
// -----------------------------------------------
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar xp rank badges createdAt');
    // Only return public fields — never email, phone, password, settings.

    if (!user || !user.isActive) {
      return next(new AppError('User not found.', 404));
    }

    // Count their contributions
    const [postCount, ratingCount, hygieneCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Rating.countDocuments({ ratedBy: user._id, isVerified: true }),
      HygieneReport.countDocuments({ reportedBy: user._id })
    ]);
    // Promise.all runs all three DB queries in PARALLEL.
    // Much faster than running them one after another.

    res.status(200).json({
      success: true,
      data: {
        user,
        contributions: { posts: postCount, ratings: ratingCount, hygieneReports: hygieneCount }
      }
    });
  } catch (error) { next(error); }
};

// -----------------------------------------------
//  PATCH /api/v1/users/updateMe
//  Update own profile (name, phone, theme, notifications)
// -----------------------------------------------
exports.updateMe = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'theme', 'notifications'];
    // Whitelist which fields the user is allowed to update.
    // This prevents a user from updating their own 'role' or 'xp'.

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    // Only include fields that were actually sent in the request.

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
      // new: true → return the updated document, not the old one.
      // runValidators: true → run schema validation on the update too.
    );

    res.status(200).json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

// -----------------------------------------------
//  PATCH /api/v1/users/updateAvatar
//  Upload a new profile photo
//  (uses uploadAvatar multer middleware, set in route)
// -----------------------------------------------
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image file.', 400));
    }
    // req.file is set by the multer middleware after upload.
    // It contains: path (Cloudinary URL), filename (public_id), etc.

    const user = await User.findById(req.user._id);

    // Delete the old avatar from Cloudinary to save storage
    if (user.avatar.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
      // This deletes the OLD image from Cloudinary.
      // Without this, old avatars pile up forever.
    }

    user.avatar.url      = req.file.path;
    // req.file.path is the Cloudinary delivery URL when using CloudinaryStorage.
    user.avatar.publicId = req.file.filename;
    // req.file.filename is the Cloudinary public_id.

    await user.save();

    res.status(200).json({ success: true, data: { avatar: user.avatar } });
  } catch (error) { next(error); }
};

// -----------------------------------------------
//  POST /api/v1/users/savedTrains/:trainId
//  Save or unsave a train (toggle)
// -----------------------------------------------
exports.toggleSavedTrain = async (req, res, next) => {
  try {
    const user    = await User.findById(req.user._id);
    const trainId = req.params.trainId;

    const index = user.savedTrains.indexOf(trainId);
    // indexOf returns -1 if the trainId is NOT in the array.

    if (index === -1) {
      user.savedTrains.push(trainId);
      // Not saved → save it.
    } else {
      user.savedTrains.splice(index, 1);
      // Already saved → unsave it (remove from array).
    }

    await user.save();

    res.status(200).json({
      success: true,
      saved: index === -1,
      // true = just saved, false = just unsaved
      message: index === -1 ? 'Train saved.' : 'Train removed from saved.'
    });
  } catch (error) { next(error); }
};

// -----------------------------------------------
//  GET /api/v1/users/contributions
//  "My Contributions" page — all the user's activity
// -----------------------------------------------
exports.getMyContributions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [posts, ratings, hygieneReports] = await Promise.all([

      Post.find({ author: userId })
        .select('title category upvotes images createdAt trainNumber')
        .sort('-createdAt')
        .limit(20),
      // Last 20 posts the user created.

      Rating.find({ ratedBy: userId, isVerified: true })
        .populate('pilot', 'name avatar')
        .populate('trainInstance', 'trainNumber originDepartureDate')
        .sort('-createdAt')
        .limit(20),
      // Last 20 verified pilot ratings.

      HygieneReport.find({ reportedBy: userId })
        .populate('trainInstance', 'trainNumber originDepartureDate')
        .sort('-createdAt')
        .limit(20)
    ]);

    // Calculate total XP breakdown
    const xpBreakdown = {
      fromPosts:    posts.filter(p => p.upvotes.length >= 50).length * 60,
      fromRatings:  ratings.length * 40,
      fromHygiene:  hygieneReports.length * 30,
      total:        req.user.xp
    };

    res.status(200).json({
      success: true,
      data: { posts, ratings, hygieneReports, xpBreakdown }
    });
  } catch (error) { next(error); }
};