const mongoose = require('mongoose');

const pilotSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name:       { type: String, required: true, trim: true },
    avatar:     { url: {type: String, default: ''}, publicId: { type: String, default: ''} },
    division:   { type: String, required: true },
    zone:     String,
     licenceClass: { type: String, enum: ['Assistant Loco Pilot','Loco Pilot','Senior Loco Pilot','Loco Supervisor'] },
  certifications: [String],
  joiningDate:  Date,
 
  stats: {
    totalTrips:       { type: Number, default: 0 },
    totalKilometres:  { type: Number, default: 0 },
    avgDelayMinutes:  { type: Number, default: 0 },
    onTimePercentage: { type: Number, default: 0, min: 0, max: 100 },
    govtScore: {
      overall:           { type: String, enum: ['A+','A','B+','B','C','D',''], default: '' },
      energySaving:      { type: Number, default: 0 },
      scheduleAdherence: { type: Number, default: 0 },
      safetyCompliance:  { type: Number, default: 0 },
      speedRegulation:   { type: Number, default: 0 }
    }
  },
 
  ratings: {
    average:     { type: Number, default: 0, min: 0, max: 5 },
    count:       { type: Number, default: 0 },
    punctuality: { type: Number, default: 0 },
    smoothness:  { type: Number, default: 0 },
    safetyFeel:  { type: Number, default: 0 }
  },
 
  currentDuty: {
    isOnDuty:      { type: Boolean, default: false },
    trainInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainInstance' }
  },
 
  followerCount: { type: Number, default: 0 },
 
  milestones: [{
    title:       String,
    description: String,
    date:        Date
  }],
 
  regularRoutes: [{
    originCode:      { type: String, uppercase: true },
    destinationCode: { type: String, uppercase: true },
    trainNumber:     String
  }],
 
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
 
pilotSchema.index({ name: 'text' });
pilotSchema.index({ 'currentDuty.isOnDuty': 1 });
 
module.exports = mongoose.model('Pilot', pilotSchema);
