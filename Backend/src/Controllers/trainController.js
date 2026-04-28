// src/controllers/trainController.js
// Search trains, get detail, multi-instance tracker, analytics
const { Train, TrainInstance } = require('../models/Train');
const { AppError } = require('../middlewares/errorHandler');

// GET /api/v1/trains?q=doon&type=Express&from=HWH&to=YNRK
exports.searchTrains = async (req, res, next) => {
  try {
    const { q, type, from, to } = req.query;
    const filter = {};
    if (q)    filter.$text = { $search: q };
    if (type) filter.trainType          = type;
    if (from) filter.originStation      = from.toUpperCase();
    if (to)   filter.destinationStation = to.toUpperCase();

    const trains = await Train.find(filter)
      .select('trainNumber trainName trainType originStation destinationStation departureTime analytics.avgDelayMinutes analytics.onTimePercentage')
      .limit(20);

    res.status(200).json({ success: true, count: trains.length, data: { trains } });
  } catch (err) { next(err); }
};

// GET /api/v1/trains/13009
exports.getTrainDetail = async (req, res, next) => {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) return next(new AppError(`No train found with number ${req.params.trainNumber}`, 404));
    res.status(200).json({ success: true, data: { train } });
  } catch (err) { next(err); }
};

// GET /api/v1/trains/13009/instances  ← THE CORE FEATURE
// Returns ALL currently running copies of the same train
// e.g. 3 Doon Express trains running simultaneously
exports.getRunningInstances = async (req, res, next) => {
  try {
    const instances = await TrainInstance.find({
      trainNumber: req.params.trainNumber,
      status: { $in: ['running', 'scheduled'] }
      // $in = status is 'running' OR 'scheduled'
    })
    .sort('originDepartureDate')
    // Oldest departure first = furthest along the route shown at top
    .populate('locoPilot', 'name avatar stats.avgDelayMinutes ratings.average currentDuty.isOnDuty');

    // Add human-readable label to each instance so user can identify their relative's train
    const result = instances.map((inst, i) => {
      const d     = new Date(inst.originDepartureDate);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const diffDays = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
      return {
        ...inst.toObject(),
        instanceLabel: `Instance ${i + 1} — departed ${label}`,
        // e.g. "Instance 1 — departed Mon, 22 Apr"
        dayOfJourney:  diffDays + 1
        // departed yesterday = Day 2 of journey
      };
    });

    res.status(200).json({ success: true, count: result.length, data: { instances: result } });
  } catch (err) { next(err); }
};

// GET /api/v1/trains/13009/analytics
exports.getTrainAnalytics = async (req, res, next) => {
  try {
    const runs = await TrainInstance.find({
      trainNumber: req.params.trainNumber,
      status: 'arrived'
    }).select('originDepartureDate finalDelayMinutes').sort('-originDepartureDate').limit(90);

    if (!runs.length) return res.status(200).json({ success: true, data: { runs: [] } });

    const total    = runs.length;
    const avgDelay = Math.round(runs.reduce((s, r) => s + (r.finalDelayMinutes || 0), 0) / total);
    const onTime   = runs.filter(r => (r.finalDelayMinutes || 0) <= 15).length;
    // Indian Railways "on time" = arrived within 15 minutes of schedule

    res.status(200).json({
      success: true,
      data: {
        chartData: runs.map(r => ({
          date: r.originDepartureDate,
          delayMinutes: r.finalDelayMinutes || 0,
          onTime: (r.finalDelayMinutes || 0) <= 15
        })),
        summary: {
          totalRuns: total,
          onTimeRuns: onTime,
          onTimePercentage: Math.round((onTime / total) * 100),
          avgDelayMinutes: avgDelay
        }
      }
    });
  } catch (err) { next(err); }
};