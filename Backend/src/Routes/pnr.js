// src/routes/pnr.js
const express    = require('express');
const router     = express.Router();
const { protect }    = require('../middlewares/auth');
const { AppError }   = require('../middlewares/errorHandler');

// GET /api/v1/pnr/:pnrNumber
router.get('/:pnrNumber', protect, async (req, res, next) => {
  try {
    const { pnrNumber } = req.params;
    if (!/^\d{10}$/.test(pnrNumber))
      return next(new AppError('PNR must be exactly 10 digits.', 400));

    // TODO: Replace with real IRCTC API call when API access is approved
    // Returning realistic mock data so frontend can be built now
    res.status(200).json({
      success: true,
      data: {
        pnrNumber,
        trainNumber:    '13009',
        trainName:      'Doon Express',
        journeyDate:    new Date().toISOString().split('T')[0],
        from:           'HWH',
        to:             'YNRK',
        passengers:     [{ name: 'Passenger 1', coachNumber: 'B4', berthNumber: 32, berthType: 'LB', bookingStatus: 'CNF', currentStatus: 'CNF' }],
        chartStatus:    'Chart Prepared',
        boardingStation:'HWH',
        reservationUpTo:'YNRK'
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;