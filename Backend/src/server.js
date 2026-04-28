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
const server = http.createServer(app); 
// Creating http server manually instead of app.listen
//so Socket.io can attach to the same server

//Socket.io setup
const io = new Server(server,{
    cors : {
        origin: process.env.CLIENT_URL,
        method: ['GET', 'POST' ]
    }
});

//Stores io on app so any route controller can use it:
// const io = req.app.get('io)
//io.to('room').emit('event',data)

app.set('io', io);

io.on('connection', (socket)=> {
    logger.info(`WebSocket connected: ${socket.id}`);

    //client calls this when they open the live tracker for a train
    socket.on('subscribe-train', (trainInstanceId) => {
        socket.join(`train-${trainInstanceId}`);
        // Puts this client in a "room" named after the train instance
    // Later we broadcast: io.to(`train-${id}`).emit('position-update', data)
    // Only clients watching THAT train get the update
    });
    socket.on('unsubscribe-train', (traininstanceId) => {
        socket.leave(`train-${trainInstanceId}`);
    });
});

//Middleware Stack 
// These will run on every request, in this exact order

//CORS - must be first so browser dont block request
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials:true //Allow cookies + Auth headers cross-origin
}));

// Parse incoming json bodies aval as req body
app.use(express.json({ limit: '10kb'}));
//limit prevent huge payload here 10kb

//Parse URL -encoded form data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//http req logger (only in development)
if (process.env.NODE_ENV === 'development') {
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
        //Prints: "GET /api/v1/trains 200 23ms"
    }

    //rate limiting -max 100 req per 15 min per IP
    const limiter = rateLimit({
        windowsMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        message: { sucess : false, message: 'Too many request. Try again in 15 minutes'},
        standardsheaders: true,
        legacyHeaders: false
    });
    app.use('/api/', limiter);

    //health Check 
    //Visit http://localhost:5000/health to verify server is running

    app.get('/health', (req,res) => {
        res.status(200).json({
            success: true,
            message: 'EkkWomm API is running!',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    });
//all routes are prefixed /api/v1/
//The v1 prefix makes future versoning easy

app.use('/api/v1/auth',   authRoutes);
app.use('/api/v1/trains', trainRoutes);
app.use('/api/v1/pilots', pilotRoutes);
app.use('/api/v1/posts',  postRoutes);
app.use('/api/v1/pnr',    pnrRoutes);
app.use('/api/v1/hygiene',hygieneRoutes);
app.use('/api/v1/users',  userRoutes);
 
//404 Handler unmatched Routes if occur
app.all('*', (req,res) => {
    res.status(401).json({
        success: false,
        message: `Route ${req.originalURl} not found.`
    });
});

//Global ERRORHandler
app.use(errorHandler);

const PORT = process.env.PORT ||5000;

server.listen(PORT, () => {
    logger.info(`EkkWomm server running on prot ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`WebSocket ready for live train tracking`);
    logger.info(`Health check -> http://localhost:${PORT}/health `);

    //Start background workers AFTER server is ready
    startDelayStatsCron();   //Will recall the delay stats every 30 mins
    startliveTracking(io);  //polls train positions every 60 secs
});

// When server is stopped (Ctrl+C), finish current requests first
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
 
module.exports = { app, server, io };
 
}




