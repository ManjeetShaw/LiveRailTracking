// src/services/LiveTrackingService.js
// Polls train positions every 60 seconds
// Broadcasts updates to WebSocket clients watching each train
const cron   = require('node-cron');
const { TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');

// Mock position fetch — replace with real NTES API when available
const fetchPosition = async (trainNumber) => ({
  lastStation:     { code: 'MGS', name: 'Mughalsarai Junction' },
  nextStation:     { code: 'LKO', name: 'Lucknow Charbagh'    },
  progressPercent: Math.min(95, Math.floor(Math.random() * 10) + 50),
  delayMinutes:    Math.floor(Math.random() * 90),
  updatedAt:       new Date()
  // TODO: Replace with: GET https://api.railapi.com/v1/train/liveStatus?trainNo=...
});

const updateTrainPositions = async (io) => {
  try {
    const running = await TrainInstance.find({ status: 'running' })
      .select('trainNumber originDepartureDate');

    logger.info(`Updating positions for ${running.length} running trains`);

    for (const inst of running) {
      try {
        const pos = await fetchPosition(inst.trainNumber);

        // Save latest position to database
        await TrainInstance.findByIdAndUpdate(inst._id, {
          currentPosition: { lastStation: pos.lastStation, nextStation: pos.nextStation, progressPercent: pos.progressPercent, updatedAt: pos.updatedAt },
          delayMinutes: pos.delayMinutes
        });

        // Push update ONLY to clients watching this specific train
        // They subscribed via: socket.emit('subscribe-train', instanceId)
        io.to(`train-${inst._id}`).emit('position-update', {
          trainInstanceId: inst._id,
          trainNumber:     inst.trainNumber,
          ...pos
        });

        await new Promise(r => setTimeout(r, 200));
        // 200ms pause between each train to avoid NTES rate limits
      } catch (e) {
        logger.error(`Position update failed for ${inst.trainNumber}: ${e.message}`);
      }
    }
  } catch (err) {
    logger.error(`Position update batch error: ${err.message}`);
  }
};

const startLiveTracking = (io) => {
  cron.schedule('*/1 * * * *', () => updateTrainPositions(io));
  // Every 1 minute
  logger.info('Live tracking started (every 60 seconds)');
};

module.exports = { startLiveTracking, updateTrainPositions };