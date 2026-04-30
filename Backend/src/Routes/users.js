const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadAvatar } = require('../config/cloudinary');
const{
    getUserProfile,
    updateMe,
    updateAvatar,
    toggleSavedTrain,
    getMyContributions
} = require('../controllers/userController');

router.use(protect);
// router.use(protect) applies the 'protect' middleware to ALL
// Cleaner than adding 'protect' to every single route.

router.get('/contributions', getMyContributions);
router.patch('/updateMe', updateMe);
router.patch('/updateAvatar', uploadAvatar.single('avatar'), updateAvatar);
//uploadAvatar.single('avatar) = expect one file in a field named 'avatar
//Thi runs BEFORE updateAvatar, uploading the files to Cloudinary first,

router.post('/savedTrains/:trainId', toggleSavedTrain);

//Public route - any user's profile (no login required)
router.get('/:id', getUserProfile);

module.exports = router;
 