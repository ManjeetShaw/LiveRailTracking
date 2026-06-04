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

router.get('/running/all', getAllRunningTrains);
router.get('/', searchTrains);

//  specific first
router.get('/:trainNumber/instances', getRunningInstances);
router.get('/:trainNumber/analytics', getTrainAnalytics);

//  generic last
router.get('/:trainNumber', getTrainDetail);

module.exports = router;