require('dotenv').config();  // ← THE MOST IMPORTANT FIX

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB               = require('./config/database');
const logger                  = require('./utils/logger');
const { errorHandler }        = require('./middlewares/errorHandler');
const { startDelayStatsCron } = require('./workers/delayStats');
const { startLiveTracking }   = require('./services/LiveTrackingService');

const authRoutes    = require('./routes/auth');
const trainRoutes   = require('./routes/trains');
const pilotRoutes   = require('./routes/pilots');
const postRoutes    = require('./routes/posts');
const pnrRoutes     = require('./routes/pnr');
const hygieneRoutes = require('./routes/hygiene');
const userRoutes    = require('./routes/users');

connectDB();

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);
  socket.on('subscribe-train',   (id) => socket.join(`train-${id}`));
  socket.on('unsubscribe-train', (id) => socket.leave(`train-${id}`));
  socket.on('disconnect', () => logger.info(`WebSocket disconnected: ${socket.id}`));
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message:  { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false
}));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'EkkWomm API is running!', environment: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth',    authRoutes);
app.use('/api/v1/trains',  trainRoutes);
app.use('/api/v1/pilots',  pilotRoutes);
app.use('/api/v1/posts',   postRoutes);
app.use('/api/v1/pnr',     pnrRoutes);
app.use('/api/v1/hygiene', hygieneRoutes);
app.use('/api/v1/users',   userRoutes);

app.all('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚂 EkkWomm server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`🏥 Health check → http://localhost:${PORT}/health`);
  startDelayStatsCron();
  startLiveTracking(io);
});

process.on('SIGTERM', () => {
  server.close(() => { logger.info('Server closed.'); process.exit(0); });
});

module.exports = { app, server, io };