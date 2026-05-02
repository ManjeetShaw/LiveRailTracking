// src/controllers/trainController.js
// Search trains, get detail, multi-instance tracker, analytics

const { Train, TrainInstance } = require('../models/Train');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// GET /api/v1/train?q=doon&type=Express&from=HWH&to=NDLS
exports.searchTrains = async (req, res, next) => {
  try {
    const { q, type, from, to } = req.query;
    const filter = {};

    if (q) {
      // Try text search first, fall back to regex if no text index
      filter.$or = [
        { trainName:   { $regex: q, $options: 'i' } },
        { trainNumber: { $regex: q, $options: 'i' } }
      ];
    }
    if (type) filter.trainType          = type;
    if (from) filter.originStation      = from.toUpperCase();
    if (to)   filter.destinationStation = to.toUpperCase();

    const trains = await Train.find(filter)
      .select('trainNumber trainName trainType originStation destinationStation departureTime totalDuration totalDistance runsOn analytics')
      .limit(20);

    res.status(200).json({
      success: true,
      count: trains.length,
      data: { trains }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/train/:trainNumber
exports.getTrainDetail = async (req, res, next) => {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) return next(new AppError(`No train found with number ${req.params.trainNumber}`, 404));

    // Also get currently running instances of this train
    const runningInstances = await TrainInstance.find({
      trainNumber: req.params.trainNumber,
      status: 'running'
    }).select('originDepartureDate status currentPosition delayMinutes expectedArrival locoPilot')
      .populate('locoPilot', 'name avatar stats.avgDelayMinutes');

    res.status(200).json({
      success: true,
      data: {
        train,
        runningInstances,
        runningCount: runningInstances.length
      }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/train/:trainNumber/instances
exports.getRunningInstances = async (req, res, next) => {
  try {
    const { trainNumber } = req.params;
    const { status, date } = req.query;

    const filter = { trainNumber };

    // Filter by status if provided (running, scheduled, arrived, cancelled)
    if (status) filter.status = status;
    else filter.status = { $in: ['running', 'scheduled'] }; // default: active only

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.originDepartureDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const instances = await TrainInstance.find(filter)
      .select('originDepartureDate status currentPosition delayMinutes expectedArrival locoPilot finalDelayMinutes actualArrivalTime')
      .populate('locoPilot', 'name avatar employeeId stats')
      .sort({ originDepartureDate: -1 })
      .limit(10);

    if (!instances.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { instances: [] },
        message: 'No active instances found for this train today'
      });
    }

    res.status(200).json({
      success: true,
      count: instances.length,
      data: { instances }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/train/:trainNumber/analytics
exports.getTrainAnalytics = async (req, res, next) => {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber })
      .select('trainNumber trainName analytics');

    if (!train) return next(new AppError(`No train found with number ${req.params.trainNumber}`, 404));

    // Get last 30 completed runs for detailed breakdown
    const recentRuns = await TrainInstance.find({
      trainNumber: req.params.trainNumber,
      status: 'arrived',
      finalDelayMinutes: { $exists: true }
    })
      .select('originDepartureDate finalDelayMinutes actualArrivalTime')
      .sort({ originDepartureDate: -1 })
      .limit(30);

    // Build delay distribution
    const delayBuckets = {
      onTime:      recentRuns.filter(r => r.finalDelayMinutes <= 15).length,
      slight:      recentRuns.filter(r => r.finalDelayMinutes > 15  && r.finalDelayMinutes <= 60).length,
      moderate:    recentRuns.filter(r => r.finalDelayMinutes > 60  && r.finalDelayMinutes <= 120).length,
      severe:      recentRuns.filter(r => r.finalDelayMinutes > 120).length,
    };

    res.status(200).json({
      success: true,
      data: {
        trainNumber:      train.trainNumber,
        trainName:        train.trainName,
        analytics:        train.analytics,
        recentRuns:       recentRuns.length,
        delayDistribution: delayBuckets,
        last30Runs:       recentRuns.map(r => ({
          date:         r.originDepartureDate,
          delayMinutes: r.finalDelayMinutes
        }))
      }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/train/running/all  ← all currently running trains
exports.getAllRunningTrains = async (req, res, next) => {
  try {
    const instances = await TrainInstance.find({ status: 'running' })
      .select('trainNumber originDepartureDate currentPosition delayMinutes expectedArrival')
      .populate('train', 'trainName trainType originStation destinationStation')
      .populate('locoPilot', 'name avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: instances.length,
      data: { instances }
    });
  } catch (err) { next(err); }
};