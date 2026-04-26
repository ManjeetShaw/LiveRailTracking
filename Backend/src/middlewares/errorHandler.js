// for every routes and formats them consistently

//without this, each route needs its own try/catch
//With this routes can call next(error) and this handles res automatically

const logger = require('../utils/logger');

const errorHandler = (err, req,res,next) => {

    let statusCode = err.StatusCode || 500;
    let message = err.message || 'Something went wrong.';

    //IT handles specific MONGODB errors

    if(err.name ==='CastError') {
        //Invalid MONGIDB object ID passes in URL

        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }
    if (err.code === 11000) {
    // Duplicate key — unique field already exists
    // e.g. registering with an email that's taken
    const field = Object.keys(err.keyValue)[0];
    statusCode  = 400;
    message     = `${field} already exists. Please use a different value.`;
  }
 
  if (err.name === 'ValidationError') {
    // Mongoose schema validation failed
    // e.g. required field missing, wrong enum value
    statusCode = 400;
    message    = Object.values(err.errors).map(e => e.message).join('. ');
    // Collect ALL validation errors and join into one message
  }
 
  // Log server errors (status 500+)
  if (statusCode >= 500) {
    logger.error({ message: err.message, stack: err.stack, url: req.originalUrl });
  }
 
  res.status(statusCode).json({
    success: false,
    message,
    // In development, also show stack trace for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
 
// ── AppError class ─────────────────────────────
// Use this to create intentional errors with a status code
//
// Examples:
//   throw new AppError('Train not found', 404)
//   throw new AppError('You cannot rate twice', 400)
//   return next(new AppError('Not authorised', 401))
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    // super() calls the parent Error class constructor
 
    this.statusCode   = statusCode;
    this.isOperational = true;
    // isOperational = expected, handled error (not a bug)
    // Safe to send these messages to users
 
    Error.captureStackTrace(this, this.constructor);
    // Makes the stack trace cleaner — excludes this constructor
  }
}
 
module.exports = { errorHandler, AppError };
 


