// src/controllers/pilotController.js
// Get pilot profile, follow/unfollow, rate a pilot
const Pilot   = require('../models/Pilot');
const User    = require('../models/User');
const { Rating }        = require('../models/Rating');
const { TrainInstance } = require('../models/Train');
const { AppError }      = require('../middlewares/errorHandler');

// GET /api/v1/pilots/:id  — public
exports.getPilotProfile = async (req, res, next) => {
  try {
    const pilot = await Pilot.findById(req.params.id)
      .populate('currentDuty.trainInstance', 'trainNumber originDepartureDate currentPosition');
    if (!pilot || !pilot.isActive) return next(new AppError('Pilot not found.', 404));

    // Last 5 verified passenger reviews
    const recentRatings = await Rating.find({ pilot: pilot._id, isVerified: true })
      .populate('ratedBy',       'name avatar rank')
      .populate('trainInstance', 'trainNumber originDepartureDate')
      .sort('-createdAt').limit(5);

    res.status(200).json({ success: true, data: { pilot, recentRatings } });
  } catch (err) { next(err); }
};

// POST /api/v1/pilots/:id/follow  — toggle follow/unfollow
exports.toggleFollow = async (req, res, next) => {
  try {
    const pilot = await Pilot.findById(req.params.id);
    if (!pilot) return next(new AppError('Pilot not found.', 404));

    const user = await User.findById(req.user._id);
    const index = user.followedPilots.indexOf(req.params.id);
    const isFollowing = index !== -1;

    if (isFollowing) {
      user.followedPilots.splice(index, 1);
      pilot.followerCount = Math.max(0, pilot.followerCount - 1);
    } else {
      user.followedPilots.push(req.params.id);
      pilot.followerCount += 1;
    }

    await Promise.all([user.save(), pilot.save()]);
    // Save both at the same time — faster than sequential saves

    res.status(200).json({ success: true, following: !isFollowing, followerCount: pilot.followerCount });
  } catch (err) { next(err); }
};

// POST /api/v1/pilots/:id/rate  — rate after a verified journey
exports.ratePilot = async (req, res, next) => {
  try {
    const { trainInstanceId, pnrNumber, punctuality, smoothness, safetyFeel, overall, review } = req.body;

    const instance = await TrainInstance.findById(trainInstanceId);
    if (!instance) return next(new AppError('Train journey not found.', 404));
    if (instance.status !== 'arrived')
      return next(new AppError('You can only rate after the journey is complete.', 400));

    const pilot = await Pilot.findById(req.params.id);
    if (!pilot) return next(new AppError('Pilot not found.', 404));

    const rating = await Rating.create({
      pilot: req.params.id, ratedBy: req.user._id, trainInstance: trainInstanceId,
      pnrNumber, punctuality, smoothness, safetyFeel, overall, review, isVerified: true
    });

    // Recalculate pilot's rolling average from ALL verified ratings
    const all   = await Rating.find({ pilot: req.params.id, isVerified: true });
    const count = all.length;
    const avg   = field => Math.round((all.reduce((s, r) => s + r[field], 0) / count) * 10) / 10;
    // * 10 / 10 rounds to 1 decimal place e.g. 4.3

    pilot.ratings = {
      average:     avg('overall'),
      count,
      punctuality: avg('punctuality'),
      smoothness:  avg('smoothness'),
      safetyFeel:  avg('safetyFeel')
    };
    await pilot.save();
    await req.user.addXP(40); // reward reviewer

    res.status(201).json({ success: true, data: { rating } });
  } catch (err) { next(err); }
};