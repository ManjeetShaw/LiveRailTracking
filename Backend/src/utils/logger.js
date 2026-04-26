//A poroper logger using Winston library
//Better than console.logh because -saves logs to file can be reviewed later
//Timestamps e=on every message
//- Different levels: info, warn, error
//-colour-c0ded in terminal during development

const { createLogger, format, transport } = require('winston');

const logger = createLogger({

    level: 'info',
     // Minimum level to log
    // Levels lowest→highest: error > warn > info > http > debug
    // 'info' = log info, warn, error but NOT debug
    format: format.combine(
        //combine() chains multiple formatter together

        format.timestamps({ format: 'YYY-DD-DD HH:mm:ss' }),

        format.errors({ stack:true }),
        // Critical for debugging - shows exactly which line failed

        format.json()
    ),

    transports: [
        new transport.defaultMaxListeners({ filename: 'logs/error.log', level: 'error' }),    // Checls weatehr somethong breks in production

        new transport.File({ filename: 'logs/comnbined.log' })
        //combined.log -> ALL messages (info, warn, error)
    ]
});

// In development: also print to terminal with colours
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),  // green=info, yellow=warn, red=error
      format.simple()     // "info: Server started on port 5000"
    )
  }));
}
 
module.exports = logger;
