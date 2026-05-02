// src/routes/train.js
const express = require('express');
const router  = express.Router();

const {
  searchTrains,
  getTrainDetail,
  getRunningInstances,
  getTrainAnalytics,
  getAllRunningTrains
} = require('../controllers/trainController');

router.get('/running/all',            getAllRunningTrains);  // GET /api/v1/train/running/all
router.get('/',                       searchTrains);         // GET /api/v1/train?q=doon
router.get('/:trainNumber',           getTrainDetail);       // GET /api/v1/train/13009
router.get('/:trainNumber/instances', getRunningInstances);  // GET /api/v1/train/13009/instances
router.get('/:trainNumber/analytics', getTrainAnalytics);    // GET /api/v1/train/13009/analytics

module.exports = router;