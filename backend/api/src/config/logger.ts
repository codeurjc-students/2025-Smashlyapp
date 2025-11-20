import * as winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Choose the aspect of your log customizing the log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports: winston.transport[] = [
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  // Allow to print all the messages inside the all.log file
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Console logging only when not running tests
if (process.env.NODE_ENV !== 'test') {
  transports.unshift(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Create the logger instance that has to be exported 
// and used to log messages
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : (process.env.NODE_ENV === 'test' ? 'error' : 'debug'),
  levels,
  format,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

export default logger;