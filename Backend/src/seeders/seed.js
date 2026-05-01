// src/seeders/seed.js
// Run with: node src/seeders/seed.js
// Seeds Train + TrainInstance collections with real IR data

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { Train, TrainInstance } = require('../models/Train');

const trains = [
  {
    trainNumber: '12301', trainName: 'Howrah Rajdhani Express', trainType: 'Rajdhani',
    originStation: 'HWH', destinationStation: 'NDLS', departureTime: '14:05',
    totalDuration: '17h 00m', totalDistance: 1441,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'HWH',  stationName: 'Howrah Junction',        arrivalTime: null,  departureTime: '14:05', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'GAYA', stationName: 'Gaya Junction',          arrivalTime: '19:44', departureTime: '19:49', dayOffset: 0, distanceFromOrigin: 435  },
      { stationCode: 'MGS',  stationName: 'Mughal Sarai Junction',  arrivalTime: '21:35', departureTime: '21:45', dayOffset: 0, distanceFromOrigin: 558  },
      { stationCode: 'ALD',  stationName: 'Prayagraj Junction',     arrivalTime: '23:15', departureTime: '23:25', dayOffset: 0, distanceFromOrigin: 680  },
      { stationCode: 'CNB',  stationName: 'Kanpur Central',         arrivalTime: '01:20', departureTime: '01:30', dayOffset: 1, distanceFromOrigin: 830  },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '10:00', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1441 },
    ]
  },
  {
    trainNumber: '12302', trainName: 'New Delhi Rajdhani Express', trainType: 'Rajdhani',
    originStation: 'NDLS', destinationStation: 'HWH', departureTime: '16:55',
    totalDuration: '17h 05m', totalDistance: 1441,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '16:55', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'CNB',  stationName: 'Kanpur Central',         arrivalTime: '20:45', departureTime: '20:55', dayOffset: 0, distanceFromOrigin: 440  },
      { stationCode: 'ALD',  stationName: 'Prayagraj Junction',     arrivalTime: '22:45', departureTime: '22:55', dayOffset: 0, distanceFromOrigin: 628  },
      { stationCode: 'MGS',  stationName: 'Mughal Sarai Junction',  arrivalTime: '00:35', departureTime: '00:45', dayOffset: 1, distanceFromOrigin: 762  },
      { stationCode: 'GAYA', stationName: 'Gaya Junction',          arrivalTime: '02:38', departureTime: '02:43', dayOffset: 1, distanceFromOrigin: 902  },
      { stationCode: 'HWH',  stationName: 'Howrah Junction',        arrivalTime: '10:00', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1441 },
    ]
  },
  {
    trainNumber: '12951', trainName: 'Mumbai Rajdhani Express', trainType: 'Rajdhani',
    originStation: 'MMCT', destinationStation: 'NDLS', departureTime: '17:00',
    totalDuration: '15h 55m', totalDistance: 1384,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'MMCT', stationName: 'Mumbai Central',         arrivalTime: null,    departureTime: '17:00', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '20:05', departureTime: '20:15', dayOffset: 0, distanceFromOrigin: 391  },
      { stationCode: 'RTM',  stationName: 'Ratlam Junction',        arrivalTime: '23:00', departureTime: '23:10', dayOffset: 0, distanceFromOrigin: 622  },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '01:50', departureTime: '01:55', dayOffset: 1, distanceFromOrigin: 861  },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '08:35', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1384 },
    ]
  },
  {
    trainNumber: '12259', trainName: 'Sealdah Duronto Express', trainType: 'Duronto',
    originStation: 'SDAH', destinationStation: 'NDLS', departureTime: '20:05',
    totalDuration: '17h 25m', totalDistance: 1453,
    runsOn: ['Mon','Wed','Fri','Sun'],
    stops: [
      { stationCode: 'SDAH', stationName: 'Sealdah',                arrivalTime: null,    departureTime: '20:05', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '13:30', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1453 },
    ]
  },
  {
    trainNumber: '12001', trainName: 'Bhopal Shatabdi Express', trainType: 'Shatabdi',
    originStation: 'NDLS', destinationStation: 'BPL', departureTime: '06:00',
    totalDuration: '08h 15m', totalDistance: 701,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '06:00', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'AGC',  stationName: 'Agra Cantt',             arrivalTime: '08:00', departureTime: '08:05', dayOffset: 0, distanceFromOrigin: 195 },
      { stationCode: 'GWL',  stationName: 'Gwalior',                arrivalTime: '09:05', departureTime: '09:10', dayOffset: 0, distanceFromOrigin: 305 },
      { stationCode: 'JHS',  stationName: 'Jhansi Junction',        arrivalTime: '10:10', departureTime: '10:15', dayOffset: 0, distanceFromOrigin: 403 },
      { stationCode: 'BPL',  stationName: 'Bhopal Junction',        arrivalTime: '14:15', departureTime: null,    dayOffset: 0, distanceFromOrigin: 701 },
    ]
  },
  {
    trainNumber: '22119', trainName: 'Mumbai CSMT Vande Bharat Express', trainType: 'Vande Bharat',
    originStation: 'CSMT', destinationStation: 'SHV', departureTime: '06:00',
    totalDuration: '06h 30m', totalDistance: 669,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'CSMT', stationName: 'Mumbai CSMT',            arrivalTime: null,    departureTime: '06:00', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'PUN',  stationName: 'Pune Junction',          arrivalTime: '07:55', departureTime: '08:00', dayOffset: 0, distanceFromOrigin: 192 },
      { stationCode: 'STR',  stationName: 'Satara',                 arrivalTime: '09:10', departureTime: '09:15', dayOffset: 0, distanceFromOrigin: 302 },
      { stationCode: 'KRD',  stationName: 'Karad',                  arrivalTime: '09:45', departureTime: '09:50', dayOffset: 0, distanceFromOrigin: 362 },
      { stationCode: 'SHV',  stationName: 'Sangli',                 arrivalTime: '12:30', departureTime: null,    dayOffset: 0, distanceFromOrigin: 669 },
    ]
  },
  {
    trainNumber: '12431', trainName: 'Thiruvananthapuram Rajdhani Express', trainType: 'Rajdhani',
    originStation: 'NDLS', destinationStation: 'TVC', departureTime: '11:00',
    totalDuration: '41h 55m', totalDistance: 3146,
    runsOn: ['Tue','Thu','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '11:00', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'MTJ',  stationName: 'Mathura Junction',       arrivalTime: '12:45', departureTime: '12:47', dayOffset: 0, distanceFromOrigin: 141 },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '16:15', departureTime: '16:20', dayOffset: 0, distanceFromOrigin: 457 },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '21:00', departureTime: '21:15', dayOffset: 0, distanceFromOrigin: 952 },
      { stationCode: 'ST',   stationName: 'Surat',                  arrivalTime: '22:40', departureTime: '22:45', dayOffset: 0, distanceFromOrigin: 1097},
      { stationCode: 'BCT',  stationName: 'Mumbai Central',         arrivalTime: '01:05', departureTime: '01:20', dayOffset: 1, distanceFromOrigin: 1306},
      { stationCode: 'ED',   stationName: 'Erode Junction',         arrivalTime: '20:15', departureTime: '20:20', dayOffset: 1, distanceFromOrigin: 2724},
      { stationCode: 'CBE',  stationName: 'Coimbatore Junction',    arrivalTime: '21:45', departureTime: '21:50', dayOffset: 1, distanceFromOrigin: 2826},
      { stationCode: 'TVC',  stationName: 'Thiruvananthapuram Central', arrivalTime: '04:55', departureTime: null, dayOffset: 2, distanceFromOrigin: 3146},
    ]
  },
  {
    trainNumber: '12625', trainName: 'Kerala Express', trainType: 'Superfast',
    originStation: 'NDLS', destinationStation: 'TVC', departureTime: '11:35',
    totalDuration: '47h 00m', totalDistance: 3146,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '11:35', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'AGC',  stationName: 'Agra Cantt',             arrivalTime: '14:03', departureTime: '14:08', dayOffset: 0, distanceFromOrigin: 195  },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '18:30', departureTime: '18:40', dayOffset: 0, distanceFromOrigin: 457  },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '00:05', departureTime: '00:15', dayOffset: 1, distanceFromOrigin: 952  },
      { stationCode: 'BCT',  stationName: 'Mumbai Central',         arrivalTime: '04:35', departureTime: '04:55', dayOffset: 1, distanceFromOrigin: 1200 },
      { stationCode: 'CBE',  stationName: 'Coimbatore Junction',    arrivalTime: '06:00', departureTime: '06:10', dayOffset: 2, distanceFromOrigin: 2826 },
      { stationCode: 'TVC',  stationName: 'Thiruvananthapuram Central', arrivalTime: '10:35', departureTime: null, dayOffset: 2, distanceFromOrigin: 3146},
    ]
  },
  {
    trainNumber: '12621', trainName: 'Tamil Nadu Express', trainType: 'Superfast',
    originStation: 'NDLS', destinationStation: 'MAS', departureTime: '22:30',
    totalDuration: '33h 30m', totalDistance: 2175,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '22:30', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'AGC',  stationName: 'Agra Cantt',             arrivalTime: '01:03', departureTime: '01:08', dayOffset: 1, distanceFromOrigin: 195  },
      { stationCode: 'JHS',  stationName: 'Jhansi Junction',        arrivalTime: '04:38', departureTime: '04:48', dayOffset: 1, distanceFromOrigin: 403  },
      { stationCode: 'BPL',  stationName: 'Bhopal Junction',        arrivalTime: '08:45', departureTime: '08:55', dayOffset: 1, distanceFromOrigin: 701  },
      { stationCode: 'NGP',  stationName: 'Nagpur Junction',        arrivalTime: '14:00', departureTime: '14:15', dayOffset: 1, distanceFromOrigin: 1092 },
      { stationCode: 'SC',   stationName: 'Secunderabad Junction',  arrivalTime: '21:30', departureTime: '21:45', dayOffset: 1, distanceFromOrigin: 1661 },
      { stationCode: 'MAS',  stationName: 'Chennai Central',        arrivalTime: '07:50', departureTime: null,    dayOffset: 2, distanceFromOrigin: 2175 },
    ]
  },
  {
    trainNumber: '12723', trainName: 'Telangana Express', trainType: 'Superfast',
    originStation: 'NDLS', destinationStation: 'HYB', departureTime: '06:25',
    totalDuration: '25h 40m', totalDistance: 1760,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '06:25', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'AGC',  stationName: 'Agra Cantt',             arrivalTime: '09:15', departureTime: '09:20', dayOffset: 0, distanceFromOrigin: 195  },
      { stationCode: 'JHS',  stationName: 'Jhansi Junction',        arrivalTime: '12:28', departureTime: '12:33', dayOffset: 0, distanceFromOrigin: 403  },
      { stationCode: 'BPL',  stationName: 'Bhopal Junction',        arrivalTime: '16:10', departureTime: '16:20', dayOffset: 0, distanceFromOrigin: 701  },
      { stationCode: 'NGP',  stationName: 'Nagpur Junction',        arrivalTime: '21:30', departureTime: '21:45', dayOffset: 0, distanceFromOrigin: 1092 },
      { stationCode: 'HYB',  stationName: 'Hyderabad Deccan',       arrivalTime: '08:05', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1760 },
    ]
  },
  {
    trainNumber: '12805', trainName: 'Janmabhoomi Express', trainType: 'Superfast',
    originStation: 'HWH', destinationStation: 'VSKP', departureTime: '14:30',
    totalDuration: '13h 30m', totalDistance: 790,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'HWH',  stationName: 'Howrah Junction',        arrivalTime: null,    departureTime: '14:30', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'KGP',  stationName: 'Kharagpur Junction',     arrivalTime: '16:02', departureTime: '16:07', dayOffset: 0, distanceFromOrigin: 123 },
      { stationCode: 'BBS',  stationName: 'Bhubaneswar',            arrivalTime: '20:30', departureTime: '20:35', dayOffset: 0, distanceFromOrigin: 440 },
      { stationCode: 'VSKP', stationName: 'Visakhapatnam',          arrivalTime: '04:00', departureTime: null,    dayOffset: 1, distanceFromOrigin: 790 },
    ]
  },
  {
    trainNumber: '12909', trainName: 'Garib Rath Express', trainType: 'Superfast',
    originStation: 'BDTS', destinationStation: 'NDLS', departureTime: '22:15',
    totalDuration: '13h 45m', totalDistance: 1306,
    runsOn: ['Mon','Wed','Fri'],
    stops: [
      { stationCode: 'BDTS', stationName: 'Bandra Terminus',        arrivalTime: null,    departureTime: '22:15', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '01:30', departureTime: '01:40', dayOffset: 1, distanceFromOrigin: 391  },
      { stationCode: 'RTM',  stationName: 'Ratlam Junction',        arrivalTime: '04:00', departureTime: '04:10', dayOffset: 1, distanceFromOrigin: 622  },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '07:05', departureTime: '07:10', dayOffset: 1, distanceFromOrigin: 861  },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '12:00', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1306 },
    ]
  },
  {
    trainNumber: '11057', trainName: 'Amritsar Express', trainType: 'Express',
    originStation: 'CSMT', destinationStation: 'ASR', departureTime: '19:45',
    totalDuration: '32h 35m', totalDistance: 1925,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'CSMT', stationName: 'Mumbai CSMT',            arrivalTime: null,    departureTime: '19:45', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '00:05', departureTime: '00:15', dayOffset: 1, distanceFromOrigin: 391  },
      { stationCode: 'RTM',  stationName: 'Ratlam Junction',        arrivalTime: '03:10', departureTime: '03:20', dayOffset: 1, distanceFromOrigin: 622  },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '06:40', departureTime: '06:50', dayOffset: 1, distanceFromOrigin: 861  },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '13:00', departureTime: '13:30', dayOffset: 1, distanceFromOrigin: 1452 },
      { stationCode: 'LDH',  stationName: 'Ludhiana Junction',      arrivalTime: '18:00', departureTime: '18:10', dayOffset: 1, distanceFromOrigin: 1721 },
      { stationCode: 'ASR',  stationName: 'Amritsar Junction',      arrivalTime: '20:20', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1925 },
    ]
  },
  {
    trainNumber: '12393', trainName: 'Sampoorna Kranti Express', trainType: 'Superfast',
    originStation: 'RJPB', destinationStation: 'NDLS', departureTime: '20:00',
    totalDuration: '13h 30m', totalDistance: 1000,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'RJPB', stationName: 'Rajendra Nagar Patna',   arrivalTime: null,    departureTime: '20:00', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'PNBE', stationName: 'Patna Junction',         arrivalTime: '20:20', departureTime: '20:30', dayOffset: 0, distanceFromOrigin: 10  },
      { stationCode: 'MGS',  stationName: 'Mughal Sarai Junction',  arrivalTime: '23:40', departureTime: '23:50', dayOffset: 0, distanceFromOrigin: 238 },
      { stationCode: 'ALD',  stationName: 'Prayagraj Junction',     arrivalTime: '01:30', departureTime: '01:35', dayOffset: 1, distanceFromOrigin: 360 },
      { stationCode: 'CNB',  stationName: 'Kanpur Central',         arrivalTime: '03:45', departureTime: '03:55', dayOffset: 1, distanceFromOrigin: 520 },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '09:30', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1000},
    ]
  },
  {
    trainNumber: '12953', trainName: 'August Kranti Rajdhani Express', trainType: 'Rajdhani',
    originStation: 'MMCT', destinationStation: 'NDLS', departureTime: '17:40',
    totalDuration: '16h 35m', totalDistance: 1384,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'MMCT', stationName: 'Mumbai Central',         arrivalTime: null,    departureTime: '17:40', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'BRC',  stationName: 'Vadodara Junction',      arrivalTime: '20:42', departureTime: '20:52', dayOffset: 0, distanceFromOrigin: 391  },
      { stationCode: 'RTM',  stationName: 'Ratlam Junction',        arrivalTime: '23:28', departureTime: '23:33', dayOffset: 0, distanceFromOrigin: 622  },
      { stationCode: 'KOTA', stationName: 'Kota Junction',          arrivalTime: '02:05', departureTime: '02:10', dayOffset: 1, distanceFromOrigin: 861  },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '10:15', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1384 },
    ]
  },
  {
    trainNumber: '12560', trainName: 'Shiv Ganga Express', trainType: 'Superfast',
    originStation: 'NDLS', destinationStation: 'BSB', departureTime: '18:40',
    totalDuration: '12h 30m', totalDistance: 789,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '18:40', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'CNB',  stationName: 'Kanpur Central',         arrivalTime: '23:15', departureTime: '23:25', dayOffset: 0, distanceFromOrigin: 440 },
      { stationCode: 'ALD',  stationName: 'Prayagraj Junction',     arrivalTime: '01:20', departureTime: '01:25', dayOffset: 1, distanceFromOrigin: 628 },
      { stationCode: 'BSB',  stationName: 'Varanasi Junction',      arrivalTime: '05:40', departureTime: null,    dayOffset: 1, distanceFromOrigin: 789 },
    ]
  },
  {
    trainNumber: '12004', trainName: 'New Delhi Swarna Shatabdi Express', trainType: 'Shatabdi',
    originStation: 'NDLS', destinationStation: 'ASR', departureTime: '07:20',
    totalDuration: '06h 05m', totalDistance: 447,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    stops: [
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: null,    departureTime: '07:20', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'AMB',  stationName: 'Ambala Cantt',           arrivalTime: '09:53', departureTime: '09:58', dayOffset: 0, distanceFromOrigin: 199 },
      { stationCode: 'LDH',  stationName: 'Ludhiana Junction',      arrivalTime: '11:00', departureTime: '11:05', dayOffset: 0, distanceFromOrigin: 308 },
      { stationCode: 'JUC',  stationName: 'Jalandhar City',         arrivalTime: '11:45', departureTime: '11:48', dayOffset: 0, distanceFromOrigin: 369 },
      { stationCode: 'ASR',  stationName: 'Amritsar Junction',      arrivalTime: '13:25', departureTime: null,    dayOffset: 0, distanceFromOrigin: 447 },
    ]
  },
  {
    trainNumber: '13009', trainName: 'Doon Express', trainType: 'Express',
    originStation: 'HWH', destinationStation: 'DDN', departureTime: '05:55',
    totalDuration: '29h 30m', totalDistance: 1286,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'HWH',  stationName: 'Howrah Junction',        arrivalTime: null,    departureTime: '05:55', dayOffset: 0, distanceFromOrigin: 0    },
      { stationCode: 'GAYA', stationName: 'Gaya Junction',          arrivalTime: '11:42', departureTime: '11:45', dayOffset: 0, distanceFromOrigin: 435  },
      { stationCode: 'MGS',  stationName: 'Mughal Sarai Junction',  arrivalTime: '13:35', departureTime: '13:45', dayOffset: 0, distanceFromOrigin: 558  },
      { stationCode: 'ALD',  stationName: 'Prayagraj Junction',     arrivalTime: '15:30', departureTime: '15:40', dayOffset: 0, distanceFromOrigin: 680  },
      { stationCode: 'LKO',  stationName: 'Lucknow Charbagh',       arrivalTime: '20:10', departureTime: '20:25', dayOffset: 0, distanceFromOrigin: 867  },
      { stationCode: 'MB',   stationName: 'Moradabad Junction',     arrivalTime: '01:15', departureTime: '01:20', dayOffset: 1, distanceFromOrigin: 1101 },
      { stationCode: 'HW',   stationName: 'Haridwar Junction',      arrivalTime: '06:00', departureTime: '06:05', dayOffset: 1, distanceFromOrigin: 1231 },
      { stationCode: 'DDN',  stationName: 'Dehradun',               arrivalTime: '09:25', departureTime: null,    dayOffset: 1, distanceFromOrigin: 1286 },
    ]
  },
  {
    trainNumber: '12875', trainName: 'Neelachal Express', trainType: 'Superfast',
    originStation: 'HWH', destinationStation: 'PURI', departureTime: '11:35',
    totalDuration: '08h 30m', totalDistance: 500,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    stops: [
      { stationCode: 'HWH',  stationName: 'Howrah Junction',        arrivalTime: null,    departureTime: '11:35', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'KGP',  stationName: 'Kharagpur Junction',     arrivalTime: '13:17', departureTime: '13:22', dayOffset: 0, distanceFromOrigin: 123 },
      { stationCode: 'BBS',  stationName: 'Bhubaneswar',            arrivalTime: '17:30', departureTime: '17:35', dayOffset: 0, distanceFromOrigin: 440 },
      { stationCode: 'PURI', stationName: 'Puri',                   arrivalTime: '20:05', departureTime: null,    dayOffset: 0, distanceFromOrigin: 500 },
    ]
  },
  {
    trainNumber: '12029', trainName: 'Amritsar Swarna Shatabdi', trainType: 'Shatabdi',
    originStation: 'ASR', destinationStation: 'NDLS', departureTime: '16:00',
    totalDuration: '06h 10m', totalDistance: 447,
    runsOn: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    stops: [
      { stationCode: 'ASR',  stationName: 'Amritsar Junction',      arrivalTime: null,    departureTime: '16:00', dayOffset: 0, distanceFromOrigin: 0   },
      { stationCode: 'JUC',  stationName: 'Jalandhar City',         arrivalTime: '17:20', departureTime: '17:23', dayOffset: 0, distanceFromOrigin: 78  },
      { stationCode: 'LDH',  stationName: 'Ludhiana Junction',      arrivalTime: '18:05', departureTime: '18:10', dayOffset: 0, distanceFromOrigin: 139 },
      { stationCode: 'AMB',  stationName: 'Ambala Cantt',           arrivalTime: '19:08', departureTime: '19:13', dayOffset: 0, distanceFromOrigin: 248 },
      { stationCode: 'NDLS', stationName: 'New Delhi',              arrivalTime: '22:10', departureTime: null,    dayOffset: 0, distanceFromOrigin: 447 },
    ]
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Train.deleteMany({});
    await TrainInstance.deleteMany({});
    console.log('🗑️  Cleared existing trains and instances');

    // Insert trains
    const insertedTrains = await Train.insertMany(trains);
    console.log(`✅ Inserted ${insertedTrains.length} trains`);

    // Create running instances for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const instances = insertedTrains.map(train => ({
      train: train._id,
      trainNumber: train.trainNumber,
      originDepartureDate: today,
      status: 'running',
      currentPosition: {
        lastStation: { code: train.stops[0].stationCode, name: train.stops[0].stationName },
        nextStation: { code: train.stops[1].stationCode, name: train.stops[1].stationName },
        progressPercent: Math.floor(Math.random() * 60) + 10,
        updatedAt: new Date()
      },
      delayMinutes: Math.floor(Math.random() * 45),
      expectedArrival: new Date(Date.now() + 3600000 * (Math.floor(Math.random() * 8) + 1))
    }));

    await TrainInstance.insertMany(instances);
    console.log(`✅ Created ${instances.length} running train instances`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('Trains seeded:');
    insertedTrains.forEach(t => console.log(`  ${t.trainNumber} - ${t.trainName}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();