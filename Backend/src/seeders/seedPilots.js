require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Pilot = require('../models/Pilot');
const { TrainInstance } = require('../models/Train');

const pilots = [
  {
    employeeId: 'EMP001', name: 'Rajesh Kumar Singh', division: 'Howrah', zone: 'Eastern Railway',
    licenceClass: 'Senior Loco Pilot',
    certifications: ['High Speed Traction', 'Electric Loco', 'Diesel Traction'],
    joiningDate: new Date('2005-03-15'),
    stats: { totalTrips: 1842, totalKilometres: 284000, avgDelayMinutes: 8, onTimePercentage: 87,
      govtScore: { overall: 'A+', energySaving: 94, scheduleAdherence: 91, safetyCompliance: 98, speedRegulation: 95 }
    },
    ratings: { average: 4.7, count: 312, punctuality: 4.8, smoothness: 4.6, safetyFeel: 4.9 },
    followerCount: 1240,
    milestones: [
      { title: '1 Million KM Club', description: 'Completed over 1 million kilometres of safe driving', date: new Date('2022-08-10') },
      { title: 'Zero Accident Record', description: '15 years without a single accident', date: new Date('2020-03-15') }
    ],
    regularRoutes: [
      { originCode: 'HWH', destinationCode: 'NDLS', trainNumber: '12301' },
      { originCode: 'HWH', destinationCode: 'DDN',  trainNumber: '13009' }
    ],
    currentDuty: { isOnDuty: true }
  },
  {
    employeeId: 'EMP002', name: 'Suresh Prasad Yadav', division: 'New Delhi', zone: 'Northern Railway',
    licenceClass: 'Senior Loco Pilot',
    certifications: ['Electric Loco', 'High Speed Traction', 'Vande Bharat'],
    joiningDate: new Date('2008-07-20'),
    stats: { totalTrips: 1560, totalKilometres: 220000, avgDelayMinutes: 5, onTimePercentage: 92,
      govtScore: { overall: 'A+', energySaving: 96, scheduleAdherence: 94, safetyCompliance: 99, speedRegulation: 97 }
    },
    ratings: { average: 4.9, count: 428, punctuality: 4.9, smoothness: 4.8, safetyFeel: 5.0 },
    followerCount: 2100,
    milestones: [
      { title: 'Rajdhani Specialist', description: 'Completed 500 Rajdhani runs', date: new Date('2023-01-05') },
      { title: 'Punctuality Award 2023', description: 'Best on-time record in Northern Railway', date: new Date('2023-12-31') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'HWH',  trainNumber: '12302' },
      { originCode: 'NDLS', destinationCode: 'MMCT', trainNumber: '12951' }
    ],
    currentDuty: { isOnDuty: true }
  },
  {
    employeeId: 'EMP003', name: 'Amit Sharma', division: 'Mumbai', zone: 'Western Railway',
    licenceClass: 'Loco Pilot',
    certifications: ['Electric Loco', 'Diesel Traction'],
    joiningDate: new Date('2012-11-01'),
    stats: { totalTrips: 980, totalKilometres: 145000, avgDelayMinutes: 12, onTimePercentage: 81,
      govtScore: { overall: 'B+', energySaving: 82, scheduleAdherence: 84, safetyCompliance: 92, speedRegulation: 88 }
    },
    ratings: { average: 4.3, count: 186, punctuality: 4.2, smoothness: 4.4, safetyFeel: 4.5 },
    followerCount: 654,
    milestones: [
      { title: '100000 KM Milestone', description: 'Crossed 100,000 kilometres of safe driving', date: new Date('2021-06-20') }
    ],
    regularRoutes: [
      { originCode: 'MMCT', destinationCode: 'NDLS', trainNumber: '12953' },
      { originCode: 'CSMT', destinationCode: 'SHV',  trainNumber: '22119' }
    ],
    currentDuty: { isOnDuty: false }
  },
  {
    employeeId: 'EMP004', name: 'Venkatesh Naidu', division: 'Secunderabad', zone: 'South Central Railway',
    licenceClass: 'Senior Loco Pilot',
    certifications: ['Electric Loco', 'High Speed Traction', 'Diesel Traction'],
    joiningDate: new Date('2003-04-10'),
    stats: { totalTrips: 2100, totalKilometres: 310000, avgDelayMinutes: 7, onTimePercentage: 89,
      govtScore: { overall: 'A', energySaving: 90, scheduleAdherence: 88, safetyCompliance: 96, speedRegulation: 93 }
    },
    ratings: { average: 4.6, count: 520, punctuality: 4.7, smoothness: 4.5, safetyFeel: 4.8 },
    followerCount: 1890,
    milestones: [
      { title: '2000 Trips Milestone', description: 'Completed 2000 train journeys', date: new Date('2023-09-15') },
      { title: 'South Zone Best Pilot 2022', description: 'Awarded best pilot in South Central Railway', date: new Date('2022-12-31') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'HYB', trainNumber: '12723' },
      { originCode: 'NDLS', destinationCode: 'MAS', trainNumber: '12621' }
    ],
    currentDuty: { isOnDuty: true }
  },
  {
    employeeId: 'EMP005', name: 'Pradeep Kumar Mishra', division: 'Lucknow', zone: 'North Eastern Railway',
    licenceClass: 'Loco Supervisor',
    certifications: ['Electric Loco', 'High Speed Traction', 'Vande Bharat', 'Diesel Traction', 'Instructor Certified'],
    joiningDate: new Date('1998-08-25'),
    stats: { totalTrips: 3200, totalKilometres: 480000, avgDelayMinutes: 4, onTimePercentage: 95,
      govtScore: { overall: 'A+', energySaving: 98, scheduleAdherence: 97, safetyCompliance: 100, speedRegulation: 99 }
    },
    ratings: { average: 4.95, count: 890, punctuality: 5.0, smoothness: 4.9, safetyFeel: 5.0 },
    followerCount: 5600,
    milestones: [
      { title: 'Railway Ratna Award', description: 'Highest civilian honour for railway service', date: new Date('2020-01-26') },
      { title: '25 Years of Service', description: 'Silver jubilee of accident-free service', date: new Date('2023-08-25') },
      { title: '2 Million KM Club', description: 'One of only 3 pilots to cross 2 million km', date: new Date('2024-03-10') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'BSB', trainNumber: '12560' },
      { originCode: 'RJPB', destinationCode: 'NDLS', trainNumber: '12393' }
    ],
    currentDuty: { isOnDuty: false }
  },
  {
    employeeId: 'EMP006', name: 'Gurpreet Singh Bedi', division: 'Amritsar', zone: 'Northern Railway',
    licenceClass: 'Loco Pilot',
    certifications: ['Electric Loco', 'Diesel Traction'],
    joiningDate: new Date('2015-02-14'),
    stats: { totalTrips: 620, totalKilometres: 92000, avgDelayMinutes: 15, onTimePercentage: 76,
      govtScore: { overall: 'B', energySaving: 78, scheduleAdherence: 79, safetyCompliance: 88, speedRegulation: 82 }
    },
    ratings: { average: 4.1, count: 98, punctuality: 4.0, smoothness: 4.2, safetyFeel: 4.3 },
    followerCount: 320,
    milestones: [
      { title: 'First Solo Rajdhani Run', description: 'Completed first independent Rajdhani Express run', date: new Date('2018-05-10') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'ASR', trainNumber: '12004' },
      { originCode: 'ASR',  destinationCode: 'NDLS', trainNumber: '12029' }
    ],
    currentDuty: { isOnDuty: true }
  },
  {
    employeeId: 'EMP007', name: 'Ramesh Chandra Patel', division: 'Bhopal', zone: 'West Central Railway',
    licenceClass: 'Senior Loco Pilot',
    certifications: ['Electric Loco', 'High Speed Traction', 'Diesel Traction'],
    joiningDate: new Date('2006-09-30'),
    stats: { totalTrips: 1380, totalKilometres: 198000, avgDelayMinutes: 10, onTimePercentage: 84,
      govtScore: { overall: 'A', energySaving: 87, scheduleAdherence: 86, safetyCompliance: 94, speedRegulation: 91 }
    },
    ratings: { average: 4.4, count: 267, punctuality: 4.5, smoothness: 4.3, safetyFeel: 4.6 },
    followerCount: 876,
    milestones: [
      { title: 'Shatabdi Expert', description: 'Completed 300 Shatabdi Express runs', date: new Date('2022-04-15') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'BPL', trainNumber: '12001' },
      { originCode: 'NDLS', destinationCode: 'HYB', trainNumber: '12723' }
    ],
    currentDuty: { isOnDuty: false }
  },
  {
    employeeId: 'EMP008', name: 'Sanjay Dubey', division: 'Varanasi', zone: 'North Eastern Railway',
    licenceClass: 'Assistant Loco Pilot',
    certifications: ['Electric Loco'],
    joiningDate: new Date('2020-06-01'),
    stats: { totalTrips: 180, totalKilometres: 28000, avgDelayMinutes: 18, onTimePercentage: 71,
      govtScore: { overall: 'B', energySaving: 74, scheduleAdherence: 72, safetyCompliance: 85, speedRegulation: 78 }
    },
    ratings: { average: 3.8, count: 42, punctuality: 3.7, smoothness: 3.9, safetyFeel: 4.0 },
    followerCount: 95,
    milestones: [
      { title: 'First Year Complete', description: 'Completed first year as Assistant Loco Pilot', date: new Date('2021-06-01') }
    ],
    regularRoutes: [
      { originCode: 'NDLS', destinationCode: 'BSB', trainNumber: '12560' }
    ],
    currentDuty: { isOnDuty: true }
  },
];

const seedPilots = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Pilot.deleteMany({});
    console.log('🗑️  Cleared existing pilots');

    const insertedPilots = await Pilot.insertMany(pilots);
    console.log(`✅ Inserted ${insertedPilots.length} pilots`);

    // Assign pilots to running train instances
    const instances = await TrainInstance.find({ status: 'running' });
    for (let i = 0; i < instances.length; i++) {
      const pilot = insertedPilots[i % insertedPilots.length];
      instances[i].locoPilot = pilot._id;
      if (pilot.currentDuty.isOnDuty) {
        pilot.currentDuty.trainInstance = instances[i]._id;
        await pilot.save();
      }
      await instances[i].save();
    }
    console.log('✅ Assigned pilots to train instances');

    console.log('\n🎉 Pilots seeded successfully!');
    insertedPilots.forEach(p => console.log(`  ${p.employeeId} - ${p.name} (${p.licenceClass})`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedPilots();