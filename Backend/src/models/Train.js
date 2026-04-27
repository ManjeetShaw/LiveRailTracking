// ================================================
//  src/models/Train.js
//  TWO models in one file — tightly related:
//
//  Train         = the TEMPLATE for a train
//                  e.g. "13009 - Doon Express"
//                  Fixed info: route, schedule, stops
//                  ONE document per train number
//
//  TrainInstance = one ACTUAL RUN of a train
//                  e.g. "Doon Express that left HWH on 22 Apr"
//                  Live data: position, delay, pilot
//                  MANY documents per train
//
//  THIS IS THE CORE INVENTION OF EKKWOMM
//  Without this split, you can't show multiple
//  running copies of the same train simultaneously
// ================================================

const mongoose = require('mongoose');

// ── Sub-schema: one station stop ───────────────
const stationStopSchema = new mongoose.Schema({
  stationCode: { type: String, required: true, uppercase: true },
  // e.g. "HWH", "MGS", "LKO", "YNRK"

  stationName: { type: String, required: true },
  // e.g. "Howrah Junction"

  arrivalTime:   { type: String },
  departureTime: { type: String },
  // Times as strings like "08:05"
  // We store as string because it's a TIME OF DAY
  // not a specific date (date changes each run)

  dayOffset: { type: Number, default: 0 },
  // Days after origin departure this stop is reached
  // HWH=0, MGS=1, YNRK=2 for Doon Express
  // Critical for multi-day trains showing correct dates

  distanceFromOrigin: { type: Number }
  // Distance in km from first station
  // Used to calculate % progress on the timeline bar
});

// ── Main Train schema ──────────────────────────
const trainSchema = new mongoose.Schema(
  {
    trainNumber: { type: String, required: true, unique: true, trim: true },
    trainName:   { type: String, required: true, trim: true },

    trainType: {
      type: String,
      enum: ['Rajdhani', 'Shatabdi', 'Vande Bharat', 'Duronto', 'Superfast', 'Express', 'Mail', 'Passenger', 'Local'],
      required: true
    },

    originStation:      { type: String, required: true, uppercase: true },
    destinationStation: { type: String, required: true, uppercase: true },
    departureTime:      { type: String, required: true }, // e.g. "08:05"
    totalDuration:      { type: String },  // e.g. "52h 30m"
    totalDistance:      { type: Number },  // km

    runsOn: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      // ['Mon','Tue',...,'Sun'] = daily, ['Mon','Thu'] = twice a week
    },

    stops: [stationStopSchema],
    // Full station list in order, using sub-schema above

    // ── Analytics (auto-updated by cron worker) ─
    analytics: {
      totalCompletedRuns: { type: Number, default: 0 },
      onTimeRuns:         { type: Number, default: 0 },
      avgDelayMinutes:    { type: Number, default: 0 },
      onTimePercentage:   { type: Number, default: 0 }
      // These 4 fields auto-recalculate after every completed run
    },

    photoCount:      { type: Number, default: 0 },
    avgHygieneScore: { type: Number, default: 0, min: 0, max: 10 }
  },
  { timestamps: true }
);

// Text index → powers search bar (search by name or number)
trainSchema.index({ trainName: 'text', trainNumber: 'text' });

// ── TrainInstance schema ────────────────────────
const trainInstanceSchema = new mongoose.Schema(
  {
    train: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Train',
      required: true
      // Which train template does this run belong to?
    },

    trainNumber: { type: String, required: true },
    // Stored flat for fast queries without populating 'train'

    originDepartureDate: {
      type:     Date,
      required: true
      // THE KEY FIELD — the actual calendar date this run
      // departed from its origin station
      // This is what separates two instances of the same train
      // e.g. Doon Express that left HWH on April 22 vs April 23
    },

    status: {
      type:    String,
      enum:    ['scheduled', 'running', 'arrived', 'cancelled'],
      default: 'scheduled'
      // scheduled = not yet departed
      // running   = currently between origin and destination
      // arrived   = completed journey
      // cancelled = cancelled for this date
    },

    // ── Live Position ──────────────────────────
    currentPosition: {
      lastStation: {
        code: { type: String },
        name: { type: String }
        // Last station the train passed
      },
      nextStation: {
        code: { type: String },
        name: { type: String }
        // Next station it's heading to
      },
      progressPercent: { type: Number, min: 0, max: 100, default: 0 },
      // 0-100% through total journey
      // Used to position the dot on the timeline bar
      updatedAt: { type: Date }
      // When was position last fetched? → "Updated 2 mins ago"
    },

    delayMinutes:    { type: Number, default: 0 },
    // Current delay. Negative = running ahead of schedule

    expectedArrival: { type: Date },
    // scheduledArrival + delayMinutes → shown to users

    locoPilot: { type: mongoose.Schema.Types.ObjectId, ref: 'Pilot' },
    // Which pilot is driving this specific run?

    // ── Post-journey (filled when status → 'arrived') ─
    actualArrivalTime: { type: Date   },
    finalDelayMinutes: { type: Number }
    // Used by cron worker to update Train analytics
  },
  { timestamps: true }
);

// Index: quickly find all running instances of one train
// This query runs every time someone opens the multi-train tracker
trainInstanceSchema.index({ train: 1, status: 1 });
trainInstanceSchema.index({ originDepartureDate: -1 });
// -1 = descending (newest first)

const Train         = mongoose.model('Train',         trainSchema);
const TrainInstance = mongoose.model('TrainInstance', trainInstanceSchema);

module.exports = { Train, TrainInstance };