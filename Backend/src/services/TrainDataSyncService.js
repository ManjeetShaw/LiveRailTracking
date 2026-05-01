// src/services/TrainDataSyncService.js
// Syncs real train data from Indian Railways APIs

const axios = require('axios');
const { Train, TrainInstance } = require('../models/Train');
const logger = require('../utils/logger');

// Using free Indian Railways API (NTES-based)
const API_BASE = 'https://api.railwayapi.com/v2';
const API_KEY = process.env.RAILWAY_API_KEY || 'demo'; // You can get free key from railwayapi.com

// Fetch a specific train's details
const fetchTrainDetails = async (trainNumber) => {
  try {
    const response = await axios.get(
      `${API_BASE}/train/${trainNumber}`,
      { params: { apikey: API_KEY } }
    );
    return response.data;
  } catch (err) {
    logger.error(`Failed to fetch train ${trainNumber}: ${err.message}`);
    return null;
  }
};

// Fetch live position of a train
const fetchTrainPosition = async (trainNumber) => {
  try {
    const response = await axios.get(
      `${API_BASE}/live/train/${trainNumber}`,
      { params: { apikey: API_KEY } }
    );
    
    if (response.data.position) {
      return {
        lastStation: {
          code: response.data.position.lastStation?.code,
          name: response.data.position.lastStation?.name
        },
        nextStation: {
          code: response.data.position.nextStation?.code,
          name: response.data.position.nextStation?.name
        },
        delayMinutes: response.data.position.delayMinutes || 0,
        progressPercent: response.data.position.progress || 0,
        updatedAt: new Date()
      };
    }
  } catch (err) {
    logger.warn(`Failed to fetch position for ${trainNumber}: ${err.message}`);
    return null;
  }
};

// Sync all running trains with live data
const syncRunningTrains = async () => {
  try {
    const runningTrains = await TrainInstance.find({ status: 'running' })
      .populate('train', 'trainNumber trainName stops');

    let updated = 0;

    for (const instance of runningTrains) {
      const position = await fetchTrainPosition(instance.trainNumber);
      
      if (position) {
        await TrainInstance.findByIdAndUpdate(instance._id, {
          currentPosition: position,
          delayMinutes: position.delayMinutes,
          expectedArrival: new Date(Date.now() + position.delayMinutes * 60000)
        });
        updated++;
      }

      // Rate limit: don't hammer the API
      await new Promise(r => setTimeout(r, 500));
    }

    logger.info(`✅ Synced ${updated}/${runningTrains.length} trains with live data`);
  } catch (err) {
    logger.error(`Train sync error: ${err.message}`);
  }
};

// One-time sync: import major trains from the API
const importMajorTrains = async () => {
  try {
    const majorTrainNumbers = [
      '12301', '12302', '12951', '12953', // Rajdhanis
      '12001', '12004', '12029', // Shatabdis
      '22119', // Vande Bharat
      '12625', '12621', '12723', // Superfasts
    ];

    logger.info('🔄 Importing major trains from API...');

    for (const trainNumber of majorTrainNumbers) {
      const trainData = await fetchTrainDetails(trainNumber);
      
      if (trainData && trainData.train) {
        const existingTrain = await Train.findOne({ trainNumber });
        
        if (!existingTrain) {
          // Map API response to our schema (this depends on API format)
          // For now, we'll just log it
          logger.info(`Found train: ${trainData.train.name} (${trainNumber})`);
        }
      }

      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    logger.error(`Import error: ${err.message}`);
  }
};

module.exports = {
  fetchTrainDetails,
  fetchTrainPosition,
  syncRunningTrains,
  importMajorTrains
};