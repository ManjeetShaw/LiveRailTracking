// src/models/Post.js
// All community content — forum, sighting, journey-story, encyclopedia
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true, trim: true, maxlength: 1000 },
  upvotes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isHidden: { type: Boolean, default: false }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true, enum: ['forum','sighting','journey-story','encyclopedia'] },
  title:    { type: String, required: true, trim: true, maxlength: 200 },
  body:     { type: String, required: true, trim: true, maxlength: 20000 },
  tags:     [{ type: String, trim: true, lowercase: true }],

  relatedTrain: { type: mongoose.Schema.Types.ObjectId, ref: 'Train' },
  trainNumber:  String,
  stationCode:  { type: String, uppercase: true },

  images: [{
    url:        String,
    publicId:   String,
    caption:    { type: String, trim: true },
    isVerified: { type: Boolean, default: false }
  }],

  upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:    [commentSchema],
  viewCount:   { type: Number, default: 0 },
  savedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  isHidden:    { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },

  // Only for journey-story posts
  journeyRating: {
    overall:     { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    food:        { type: Number, min: 1, max: 5 },
    staff:       { type: Number, min: 1, max: 5 }
  },
  travelDate: Date
}, { timestamps: true });

postSchema.index({ title: 'text', body: 'text', tags: 'text' });
postSchema.index({ relatedTrain: 1, category: 1 });
postSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);