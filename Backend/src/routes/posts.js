// src/routes/posts.js
const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middlewares/auth');
const { uploadTrainPhoto }      = require('../config/cloudinary');
const { getPosts, getPost, createPost, toggleUpvote, addComment, toggleSavePost } = require('../controllers/postController');
router.get('/',              optionalAuth, getPosts);  // public, but login adds personalization
router.get('/:id',           optionalAuth, getPost);
router.post('/',             protect, uploadTrainPhoto.array('images', 5), createPost);
router.patch('/:id/upvote',  protect, toggleUpvote);
router.post('/:id/comments', protect, addComment);
router.patch('/:id/save',    protect, toggleSavePost);
module.exports = router;