const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');

function createLogger(filename) {
  const transport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
  });

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      transport,
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
}

const loggers = {
  access: createLogger('access'),
  error: createLogger('error'),
  auth: createLogger('auth'),
  socket: createLogger('socket'),
  bot: createLogger('bot'),
  export: createLogger('export')
};

module.exports = loggers;
