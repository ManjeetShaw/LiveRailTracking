// src/controllers/hygieneController.js
// File hygiene reports + view per-coach scores
const { HygieneReport }  = require('../models/Rating');
const { TrainInstance, Train } = require('../models/Train');
const { AppError }       = require('../middlewares/errorHandler');
const logger             = require('../utils/logger');

// POST /api/v1/hygiene  — file a hygiene report for a coach
exports.createReport = async (req, res, next) => {
  try {
    const { trainInstanceId, coachNumber, coachType, overallCleanliness,
            toiletCleanliness, beddingQuality, pestSighting, description } = req.body;

    const images = req.files ? req.files.map(f => ({ url: f.path, publicId: f.filename })) : [];

    const report = await HygieneReport.create({
      trainInstance: trainInstanceId, reportedBy: req.user._id,
      coachNumber, coachType, overallCleanliness, toiletCleanliness,
      beddingQuality, pestSighting, description, images
    });

    // Update the train's rolling average hygiene score
    const instance  = await TrainInstance.findById(trainInstanceId);
    if (instance) {
      const allReports = await HygieneReport.find({ trainInstance: trainInstanceId }).select('overallCleanliness');
      if (allReports.length) {
        const avg = allReports.reduce((s, r) => s + r.overallCleanliness, 0) / allReports.length;
        await Train.findOneAndUpdate({ trainNumber: instance.trainNumber }, {
          avgHygieneScore: Math.round(avg * 10) / 10
        });
      }
    }

    await req.user.addXP(30); // reward the reporter

    // Alert if pest is sighted — serious issue
    if (pestSighting) logger.warn(`PEST SIGHTING reported: train ${instance?.trainNumber} coach ${coachNumber}`);

    res.status(201).json({ success: true, data: { report } });
  } catch (err) { next(err); }
};

// GET /api/v1/hygiene/:trainInstanceId  — view all hygiene scores grouped by coach
exports.getHygieneScores = async (req, res, next) => {
  try {
    const reports = await HygieneReport.find({ trainInstance: req.params.trainInstanceId })
      .select('coachNumber coachType overallCleanliness toiletCleanliness pestSighting description createdAt');

    // Group reports by coach number
    const byCoach = {};
    reports.forEach(r => {
      if (!byCoach[r.coachNumber])
        byCoach[r.coachNumber] = { coachNumber: r.coachNumber, coachType: r.coachType, reports: [] };
      byCoach[r.coachNumber].reports.push(r);
    });

    // Calculate average score per coach
    Object.values(byCoach).forEach(c => {
      c.avgScore      = Math.round((c.reports.reduce((s, r) => s + r.overallCleanliness, 0) / c.reports.length) * 10) / 10;
      c.hasPestReport = c.reports.some(r => r.pestSighting);
    });

    const overallAvg = reports.length
      ? Math.round((reports.reduce((s, r) => s + r.overallCleanliness, 0) / reports.length) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: { coaches: Object.values(byCoach), overallScore: overallAvg, totalReports: reports.length }
    });
  } catch (err) { next(err); }
};