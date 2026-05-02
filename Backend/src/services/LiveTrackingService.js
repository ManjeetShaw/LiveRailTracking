// src/services/LiveTrackingService.js
const cron = require('node-cron');
const { Train, TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');

// Fetch realistic position based on train's actual stops
const fetchPosition = async (trainNumber, instanceId) => {
  try {
    // Get the train's stops to simulate realistic position
    const instance = await TrainInstance.findById(instanceId).populate('train', 'stops totalDistance');

    if (instance && instance.train && instance.train.stops.length > 1) {
      const stops = instance.train.stops;

      // Pick a random stop index (not first, not last)
      const maxIdx = stops.length - 1;
      const currentIdx = Math.max(1, Math.floor(Math.random() * maxIdx));
      const lastStop = stops[currentIdx - 1];
      const nextStop = stops[Math.min(currentIdx, maxIdx)];

      // Progress based on distance
      const totalDist = instance.train.totalDistance || 1000;
      const currentDist = lastStop.distanceFromOrigin || 0;
      const progressPercent = Math.min(95, Math.round((currentDist / totalDist) * 100));

      return {
        lastStation:     { code: lastStop.stationCode,  name: lastStop.stationName  },
        nextStation:     { code: nextStop.stationCode,  name: nextStop.stationName  },
        progressPercent: progressPercent,
        delayMinutes:    Math.floor(Math.random() * 90),
        updatedAt:       new Date()
      };
    }
  } catch (err) {
    logger.warn(`Could not fetch stops for ${trainNumber}: ${err.message}`);
  }

  // Fallback mock data
  return {
    lastStation:     { code: 'MGS', name: 'Mughal Sarai Junction' },
    nextStation:     { code: 'ALD', name: 'Prayagraj Junction'    },
    progressPercent: Math.min(95, Math.floor(Math.random() * 40) + 30),
    delayMinutes:    Math.floor(Math.random() * 90),
    updatedAt:       new Date()
  };
};

const updateTrainPositions = async (io) => {
  try {
    const running = await TrainInstance.find({ status: 'running' })
      .select('trainNumber originDepartureDate train');

    for (const inst of running) {
      try {
        const pos = await fetchPosition(inst.trainNumber, inst._id);

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

    logger.info(`Updated positions for ${running.length} running trains`);
  } catch (err) {
    logger.error(`Position update batch error: ${err.message}`);
  }
};

const startLiveTracking = (io) => {
  cron.schedule('*/1 * * * *', () => updateTrainPositions(io));
  logger.info('Live tracking started (every 60 seconds)');
};

module.exports = { startLiveTracking, updateTrainPositions };