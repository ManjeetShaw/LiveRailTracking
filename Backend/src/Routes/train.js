// src/routes/trains.js
const express = require('express');
const router  = express.Router();
const { searchTrains, getTrainDetail, getRunningInstances, getTrainAnalytics } = require('../controllers/trainController');
router.get('/',                       searchTrains);        // GET /api/v1/trains?q=doon
router.get('/:trainNumber',           getTrainDetail);      // GET /api/v1/trains/13009
router.get('/:trainNumber/instances', getRunningInstances); // GET /api/v1/trains/13009/instances ← KEY FEATURE
router.get('/:trainNumber/analytics', getTrainAnalytics);   // GET /api/v1/trains/13009/analytics
module.exports = router;