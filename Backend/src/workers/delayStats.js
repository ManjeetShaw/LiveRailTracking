//  Cron job — runs every 30 min
//  Recalculates avg delay + on-time % for every
//  train that completed a run recently
const cron   = require('node-cron');
const { Train, TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');
 
const recalculateTrainStats = async (trainNumber) => {
  try {
    const runs  = await TrainInstance.find({ trainNumber, status: 'arrived', finalDelayMinutes: { $exists: true } }).select('finalDelayMinutes');
    if (!runs.length) return;
 
    const total    = runs.length;
    const totalDelay = runs.reduce((s, r) => s + (r.finalDelayMinutes || 0), 0);
    const onTime   = runs.filter(r => (r.finalDelayMinutes || 0) <= 15).length;
    // Indian Railways "on time" = arrived within 15 minutes of schedule
 
    await Train.findOneAndUpdate({ trainNumber }, {
      'analytics.totalCompletedRuns': total,
      'analytics.onTimeRuns':         onTime,
      'analytics.avgDelayMinutes':    Math.round(totalDelay / total),
      'analytics.onTimePercentage':   Math.round((onTime / total) * 100 * 10) / 10
    });
    logger.info(`Stats updated for ${trainNumber}: avg delay ${Math.round(totalDelay/total)} min`);
  } catch (err) {
    logger.error(`Stats update failed for ${trainNumber}: ${err.message}`);
  }
};
 
const startDelayStatsCron = () => {
  cron.schedule('*/30 * * * *', async () => {
    // '*/30 * * * *' = every 30 minutes
    // Cron format: minute hour day month weekday
    logger.info('Running delay stats cron...');
    try {
      const recentlyArrived = await TrainInstance.find({
        status: 'arrived',
        updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        // Updated in the last 60 minutes
      }).select('trainNumber').distinct('trainNumber');
      // .distinct() = unique train numbers only
 
      for (const tn of recentlyArrived) await recalculateTrainStats(tn);
    } catch (err) {
      logger.error(`Delay stats cron error: ${err.message}`);
    }
  });
  logger.info('Delay stats cron scheduled (every 30 min)');
};
 
module.exports = { startDelayStatsCron, recalculateTrainStats };
 
 
//  src/services/LiveTrackingService.js
//  Polls train positions every 60 seconds
//  Broadcasts updates to WebSocket clients
const LiveCron = require('node-cron');
const { TrainInstance: TI } = require('../models/Train');
 
// Mock position fetcher
// TODO: Replace with real NTES API call
const fetchPositionFromNTES = async (trainNumber) => {
  const progress = Math.min(95, Math.floor(Math.random() * 10) + 50);
  const delay    = Math.floor(Math.random() * 90);
  return {
    lastStation:     { code: 'MGS', name: 'Mughalsarai Junction' },
    nextStation:     { code: 'LKO', name: 'Lucknow Charbagh'    },
    progressPercent: progress,
    delayMinutes:    delay,
    updatedAt:       new Date()
  };
};
 
const updateTrainPositions = async (io) => {
  try {
    const running = await TI.find({ status: 'running' }).select('trainNumber originDepartureDate');
    logger.info(`Updating positions for ${running.length} running trains`);
 
    for (const inst of running) {
      try {
        const pos = await fetchPositionFromNTES(inst.trainNumber);
 
        await TI.findByIdAndUpdate(inst._id, {
          currentPosition: { lastStation: pos.lastStation, nextStation: pos.nextStation, progressPercent: pos.progressPercent, updatedAt: pos.updatedAt },
          delayMinutes: pos.delayMinutes
        });
 
        io.to(`train-${inst._id}`).emit('position-update', { trainInstanceId: inst._id, trainNumber: inst.trainNumber, ...pos });
        // Emit ONLY to clients watching this specific train
        // They subscribed via socket.emit('subscribe-train', instanceId)
 
        await new Promise(r => setTimeout(r, 200));
        // 200ms pause between trains to avoid rate-limiting NTES
      } catch (e) {
        logger.error(`Position update failed for ${inst.trainNumber}: ${e.message}`);
      }
    }
  } catch (err) {
    logger.error(`Position update batch failed: ${err.message}`);
  }
};
 
const startLiveTracking = (io) => {
  LiveCron.schedule('*/1 * * * *', () => updateTrainPositions(io));
  // '*/1 * * * *' = every 1 minute
  logger.info('Live tracking cron started (every 60 seconds)');
};
 
module.exports = { startLiveTracking, updateTrainPositions };
 
