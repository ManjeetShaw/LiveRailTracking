// src/services/LiveTrackingService.js
const cron   = require('node-cron');
const { TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');

const fetchPosition = async (trainNumber) => ({
  lastStation:     { code: 'MGS', name: 'Mughalsarai Junction' },
  nextStation:     { code: 'LKO', name: 'Lucknow Charbagh' },
  progressPercent: Math.min(95, Math.floor(Math.random() * 10) + 50),
  delayMinutes:    Math.floor(Math.random() * 90),
  updatedAt:       new Date()
});

const updateTrainPositions = async (io) => {
  try {
    const running = await TrainInstance.find({ status: 'running' })
      .select('trainNumber originDepartureDate');

    for (const inst of running) {
      try {
        const pos = await fetchPosition(inst.trainNumber);

        await TrainInstance.findByIdAndUpdate(inst._id, {
          currentPosition: {
            lastStation:     pos.lastStation,
            nextStation:     pos.nextStation,
            progressPercent: pos.progressPercent,
            updatedAt:       pos.updatedAt
          },
          delayMinutes: pos.delayMinutes
        });

        io.to(`train-${inst._id}`).emit('position-update', {
          trainInstanceId: inst._id,
          trainNumber:     inst.trainNumber,
          ...pos
        });

        await new Promise(r => setTimeout(r, 200));
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
  logger.info('Live tracking started (every 60 seconds)');
};

module.exports = { startLiveTracking, updateTrainPositions };