// src/models/Rating.js
// Pilot ratings + hygiene reports — two models in one file
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  pilot:         { type: mongoose.Schema.Types.ObjectId, ref: 'Pilot',         required: true },
  ratedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',          required: true },
  trainInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainInstance', required: true },
  pnrNumber:     { type: String, required: true },
  punctuality:   { type: Number, required: true, min: 1, max: 5 },
  smoothness:    { type: Number, required: true, min: 1, max: 5 },
  safetyFeel:    { type: Number, required: true, min: 1, max: 5 },
  overall:       { type: Number, required: true, min: 1, max: 5 },
  review:        { type: String, trim: true, maxlength: 500 },
  isVerified:    { type: Boolean, default: false }
}, { timestamps: true });

// One rating per user per journey — no duplicates
ratingSchema.index({ ratedBy: 1, trainInstance: 1 }, { unique: true });
ratingSchema.index({ pilot: 1, createdAt: -1 });

const Rating = mongoose.model('Rating', ratingSchema);

//  Hygiene Report
const hygieneReportSchema = new mongoose.Schema({
  trainInstance:      { type: mongoose.Schema.Types.ObjectId, ref: 'TrainInstance', required: true },
  reportedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User',          required: true },
  coachNumber:        { type: String, required: true, uppercase: true },
  coachType:          { type: String, enum: ['SL','3A','2A','1A','CC','EC','GS','Pantry'], required: true },
  overallCleanliness: { type: Number, required: true, min: 1, max: 10 },
  toiletCleanliness:  { type: Number, min: 1, max: 10 },
  beddingQuality:     { type: Number, min: 1, max: 10 },
  pestSighting:       { type: Boolean, default: false },
  description:        { type: String, trim: true, maxlength: 500 },
  images:             [{ url: String, publicId: String }],
  status:             { type: String, enum: ['pending','reviewed','actioned'], default: 'pending' }
}, { timestamps: true });

// One report per user per coach per journey
hygieneReportSchema.index({ reportedBy: 1, trainInstance: 1, coachNumber: 1 }, { unique: true });

const HygieneReport = mongoose.model('HygieneReport', hygieneReportSchema);

module.exports = { Rating, HygieneReport };