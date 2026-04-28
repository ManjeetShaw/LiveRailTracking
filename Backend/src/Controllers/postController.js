// src/controllers/postController.js
// Community feed, create post, upvote, comment, save
const Post  = require('../models/Post');
const { Train } = require('../models/Train');
const { AppError } = require('../middlewares/errorHandler');

// GET /api/v1/posts?category=sighting&train=13009&page=1
exports.getPosts = async (req, res, next) => {
  try {
    const { category, train, tag, page = 1, limit = 10 } = req.query;
    const filter = { isHidden: false };
    if (category) filter.category   = category;
    if (train)    filter.trainNumber = train;
    if (tag)      filter.tags        = tag.toLowerCase();

    const skip = (page - 1) * limit;
    // Page 1 = skip 0, page 2 = skip 10, page 3 = skip 20...

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name avatar rank')
        .select('-comments') // exclude comments from feed for speed
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total, page: parseInt(page),
          pages:   Math.ceil(total / limit),
          hasMore: skip + posts.length < total
        }
      }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/posts/:id  — single post with all comments
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } }, // increment view count on every open
      { new: true }
    )
    .populate('author',          'name avatar rank xp')
    .populate('comments.author', 'name avatar rank')
    .populate('relatedTrain',    'trainNumber trainName');

    if (!post || post.isHidden) return next(new AppError('Post not found.', 404));
    res.status(200).json({ success: true, data: { post } });
  } catch (err) { next(err); }
};

// POST /api/v1/posts
exports.createPost = async (req, res, next) => {
  try {
    const { title, body, category, tags, trainNumber, stationCode, travelDate, journeyRating } = req.body;
    const images = req.files ? req.files.map(f => ({ url: f.path, publicId: f.filename })) : [];

    let relatedTrain = null;
    if (trainNumber) {
      const t = await Train.findOne({ trainNumber });
      if (t) relatedTrain = t._id;
    }

    const post = await Post.create({
      author: req.user._id, title, body, category, tags,
      trainNumber, stationCode, travelDate, journeyRating, relatedTrain, images
    });

    // Award XP based on post type — encyclopedia earns the most
    const xpMap = { forum: 30, sighting: 50, 'journey-story': 80, encyclopedia: 100 };
    await req.user.addXP(xpMap[category] || 30);

    res.status(201).json({ success: true, data: { post } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/posts/:id/upvote  — toggle upvote on/off
exports.toggleUpvote = async (req, res, next) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found.', 404));

    const userId  = req.user._id.toString();
    const index   = post.upvotes.map(id => id.toString()).indexOf(userId);
    const upvoted = index === -1;

    if (upvoted) post.upvotes.push(req.user._id);
    else         post.upvotes.splice(index, 1);

    await post.save();
    res.status(200).json({ success: true, upvoted, upvoteCount: post.upvotes.length });
  } catch (err) { next(err); }
};

// POST /api/v1/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found.', 404));
    post.comments.push({ author: req.user._id, content: req.body.content });
    await post.save();
    res.status(201).json({ success: true, data: { comment: post.comments[post.comments.length - 1] } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/posts/:id/save  — bookmark a post
exports.toggleSavePost = async (req, res, next) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found.', 404));
    const userId = req.user._id.toString();
    const index  = post.savedBy.map(id => id.toString()).indexOf(userId);
    if (index === -1) post.savedBy.push(req.user._id);
    else              post.savedBy.splice(index, 1);
    await post.save();
    res.status(200).json({ success: true, saved: index === -1 });
  } catch (err) { next(err); }
};