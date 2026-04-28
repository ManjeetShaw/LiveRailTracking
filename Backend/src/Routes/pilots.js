// src/routes/pilots.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/auth');
const { getPilotProfile, toggleFollow, ratePilot } = require('../controllers/pilotController');
router.get('/:id',         getPilotProfile);       // public
router.post('/:id/follow', protect, toggleFollow); // login required
router.post('/:id/rate',   protect, ratePilot);    // login required
module.exports = router;