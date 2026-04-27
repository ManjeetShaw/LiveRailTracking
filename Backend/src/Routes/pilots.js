const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/auth');
const { getPilotProfile, toggleFollow, ratePilot } = require('../controllers/pilotController');
 
router.get('/:id',          getPilotProfile);           // public
router.post('/:id/follow',  protect, toggleFollow);     // login required
router.post('/:id/rate',    protect, ratePilot);        // login required
 
module.exports = router;
 
 
//  src/routes/posts.js
const postRouter = require('express').Router();
const { optionalAuth } = require('../middlewares/auth');
const { uploadTrainPhoto } = require('../config/cloudinary');
const { getPosts, getPost, createPost, toggleUpvote, addComment, toggleSavePost } = require('../controllers/postController');
 
postRouter.get('/',              optionalAuth, getPosts);
postRouter.get('/:id',           optionalAuth, getPost);
postRouter.post('/',             protect, uploadTrainPhoto.array('images', 5), createPost);
postRouter.patch('/:id/upvote',  protect, toggleUpvote);
postRouter.post('/:id/comments', protect, addComment);
postRouter.patch('/:id/save',    protect, toggleSavePost);
 
module.exports = postRouter;
 
 
//  src/routes/users.js
const userRouter = require('express').Router();
const { uploadAvatar } = require('../config/cloudinary');
const { getUserProfile, updateMe, updateAvatar, toggleSavedTrain, getMyContributions } = require('../controllers/userController');
 
userRouter.use(protect);
// router.use(protect) applies protect middleware to ALL routes below
// Cleaner than adding protect to every single route
 
userRouter.get('/contributions',          getMyContributions);
userRouter.patch('/updateMe',             updateMe);
userRouter.patch('/updateAvatar',         uploadAvatar.single('avatar'), updateAvatar);
userRouter.post('/savedTrains/:trainId',  toggleSavedTrain);
userRouter.get('/:id',                    getUserProfile);  // public profile
 
module.exports = userRouter;
 
 
//  src/routes/hygiene.js
const hygieneRouter = require('express').Router();
const { uploadHygienePhoto } = require('../config/cloudinary');
const { createHygieneReport, getHygieneScores } = require('../controllers/hygieneController');
 
hygieneRouter.post('/',                    protect, uploadHygienePhoto.array('images', 3), createHygieneReport);
hygieneRouter.get('/:trainInstanceId',     getHygieneScores); // public
 
module.exports = hygieneRouter;
 
 
//  src/routes/pnr.js
const pnrRouter = require('express').Router();
const { AppError } = require('../middlewares/errorHandler');
 
pnrRouter.get('/:pnrNumber', protect, async (req, res, next) => {
  try {
    const { pnrNumber } = req.params;
    if (!/^\d{10}$/.test(pnrNumber))
      return next(new AppError('PNR must be exactly 10 digits.', 400));
 
    // TODO: Replace with real IRCTC API call
    // For now returning a realistic mock so frontend can be built
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
 
module.exports = pnrRouter;
 
