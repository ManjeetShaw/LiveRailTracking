// src/workers/delayStats.js
// Cron job – runs every 30 min
// 1. Fetches real train data from API
// 2. Updates running instances with live delays
// 3. Recalculates analytics for completed runs

const cron = require('node-cron');
const axios = require('axios');
const { Train, TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');

// ── API Integration (choose one based on your data source) ──

// OPTION 1: RapidAPI Train Status (recommended for delays)
const fetchDelayFromAPI = async (trainNumber) => {
  try {
    const response = await axios.get('https://train-status-api.p.rapidapi.com/status', {
      params: { train_number: trainNumber },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'train-status-api.p.rapidapi.com'
      },
      timeout: 5000
    });

    return {
      delayMinutes: response.data.delay || 0,
      lastStation: response.data.lastStation,
      nextStation: response.data.nextStation,
      progressPercent: response.data.progress || 0,
      updatedAt: new Date()
    };
  } catch (err) {
    logger.warn(`API fetch failed for ${trainNumber}: ${err.message}`);
    return null; // Fall back to mock data if API fails
  }
};

// OPTION 2: Free Indian Railways NTES (slower, less reliable)
// const fetchDelayFromNTES = async (trainNumber) => {
//   try {
//     // This would require scraping or a community API
//     // Example: https://api.railwayapi.com/api/v2/livestation
//     // Most free APIs are rate-limited or deprecated
//     return null;
//   } catch (err) {
//     logger.warn(`NTES fetch failed: ${err.message}`);
//     return null;
//   }
// };

// ── Update running instances with real delays ──
const updateRunningTrainDelays = async () => {
  try {
    const running = await TrainInstance.find({ status: 'running' })
      .select('trainNumber _id currentPosition delayMinutes');

    for (const instance of running) {
      // Try fetching from API first
      const apiData = await fetchDelayFromAPI(instance.trainNumber);

      if (apiData) {
        // Real data from API
        await TrainInstance.findByIdAndUpdate(instance._id, {
          currentPosition: {
            lastStation: apiData.lastStation,
            nextStation: apiData.nextStation,
            progressPercent: apiData.progressPercent,
            updatedAt: apiData.updatedAt
          },
          delayMinutes: apiData.delayMinutes
        });

        logger.info(`Updated ${instance.trainNumber}: ${apiData.delayMinutes}min delay`);
      } else {
        // API failed – keep mock data (don't break the app)
        logger.warn(`Using mock data for ${instance.trainNumber}`);
      }

      // Rate limit: don't hammer the API
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err) {
    logger.error(`Running train delay update failed: ${err.message}`);
  }
};

// ── Recalculate statistics for completed trains ──
const recalculateTrainStats = async (trainNumber) => {
  try {
    const runs = await TrainInstance.find({
      trainNumber,
      status: 'arrived',
      finalDelayMinutes: { $exists: true }
    }).select('finalDelayMinutes');

    if (!runs.length) return;

    const total      = runs.length;
    const totalDelay = runs.reduce((s, r) => s + (r.finalDelayMinutes || 0), 0);
    const onTime     = runs.filter(r => (r.finalDelayMinutes || 0) <= 15).length;
    // Indian Railways standard: "on time" = within 15 min of schedule

    const avgDelay = Math.round(totalDelay / total);
    const onTimePercentage = Math.round((onTime / total) * 100 * 10) / 10;

    await Train.findOneAndUpdate({ trainNumber }, {
      'analytics.totalCompletedRuns': total,
      'analytics.onTimeRuns':         onTime,
      'analytics.avgDelayMinutes':    avgDelay,
      'analytics.onTimePercentage':   onTimePercentage
    });

    logger.info(`Stats updated for ${trainNumber}: avg ${avgDelay}min delay, ${onTimePercentage}% on-time`);
  } catch (err) {
    logger.error(`Stats update failed for ${trainNumber}: ${err.message}`);
  }
};

// ── Sync train schedule data from API (optional – for new trains) ──
const syncTrainSchedules = async () => {
  try {
    // This would fetch all trains from the API and update your DB
    // Example: GET /api/v2/trains with route filters
    // For now, we're using the seeded data – add this later if needed
    logger.info('Train schedule sync skipped (using seeded data)');
  } catch (err) {
    logger.error(`Schedule sync error: ${err.message}`);
  }
};

// ── Main cron job ──
const startDelayStatsCron = () => {
  // Every 30 minutes: update running trains + recalculate stats
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running delay stats cron...');

    try {
      // Step 1: Update live delays from API
      await updateRunningTrainDelays();

      // Step 2: Recalculate stats for recently completed trains
      const recentlyArrived = await TrainInstance.find({
        status: 'arrived',
        updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      }).select('trainNumber').distinct('trainNumber');

      for (const tn of recentlyArrived) {
        await recalculateTrainStats(tn);
      }

      logger.info('Delay stats cron completed successfully');
    } catch (err) {
      logger.error(`Delay stats cron error: ${err.message}`);
    }
  });

  logger.info('Delay stats cron scheduled (every 30 min)');
};

module.exports = { startDelayStatsCron, recalculateTrainStats, updateRunningTrainDelays };