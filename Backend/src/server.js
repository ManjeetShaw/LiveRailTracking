require('dotenv').config;

const express = require('express');
const http = require('http');                  //Node built in HTTP module
const { Server } = require('socket.io');     //RealTime Web-Socket library
const cors = require('cors');                //Allows forntend to call API
const morgan = require('morgan');           //Logs every HZTTP request in terminal

const rateLimit = require('express-rate-limit'); 


const connectDb = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { startDelayStatsCron } = require('./workers/delayStats');
const { startLiveTracking } = require('./services/LiveTrackingServices');


//route files - one per features
const authRoutes = require('./routes/auth');
const trainRoutes = require('./routes/train');
const pilotRoutes   = require('./routes/pilots');
const postRoutes    = require('./routes/posts');
const pnrRoutes     = require('./routes/pnr');
const hygieneRoutes = require('./routes/hygiene');
const userRoutes    = require('./routes/users');

// Connect to MongoDB 
connectDb();

const app = express();
const server = http.createServer(app);    // Creating http server manually instead of app.listen
                                         //so Socket.io can attach to the same server

                                         
