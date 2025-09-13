import winston from 'winston';
import path from 'path';

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

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: logFormat,
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileLogFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileLogFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileLogFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log levels
export const logError = (message: string, error?: any, meta?: any) => {
  const logData: any = { message };
  if (error) {
    logData.error = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
  }
  if (meta) {
    logData.meta = meta;
  }
  logger.error(logData);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// API request/response logging helper
export const logApiRequest = (method: string, url: string, userId?: string, meta?: any) => {
  logInfo(`API Request: ${method} ${url}`, {
    method,
    url,
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

export const logApiResponse = (method: string, url: string, status: number, duration: number, userId?: string, meta?: any) => {
  const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
  const message = `API Response: ${method} ${url} - ${status} (${duration}ms)`;
  
  const logData = {
    method,
    url,
    status,
    duration,
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  switch (level) {
    case 'error':
      logError(message, null, logData);
      break;
    case 'warn':
      logWarn(message, logData);
      break;
    default:
      logInfo(message, logData);
  }
};

// Database operation logging
export const logDbOperation = (operation: string, collection: string, success: boolean, duration?: number, meta?: any) => {
  const message = `DB ${operation} on ${collection}: ${success ? 'SUCCESS' : 'FAILED'}${duration ? ` (${duration}ms)` : ''}`;
  const logData = {
    operation,
    collection,
    success,
    duration,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (success) {
    logInfo(message, logData);
  } else {
    logError(message, null, logData);
  }
};

// File operation logging
export const logFileOperation = (operation: string, fileName: string, success: boolean, fileSize?: number, meta?: any) => {
  const message = `File ${operation}: ${fileName} - ${success ? 'SUCCESS' : 'FAILED'}${fileSize ? ` (${fileSize} bytes)` : ''}`;
  const logData = {
    operation,
    fileName,
    success,
    fileSize,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (success) {
    logInfo(message, logData);
  } else {
    logError(message, null, logData);
  }
};

// Email operation logging
export const logEmailOperation = (operation: string, recipient: string, template: string, success: boolean, meta?: any) => {
  const message = `Email ${operation}: ${template} to ${recipient} - ${success ? 'SUCCESS' : 'FAILED'}`;
  const logData = {
    operation,
    recipient,
    template,
    success,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (success) {
    logInfo(message, logData);
  } else {
    logError(message, null, logData);
  }
};

// Payment operation logging
export const logPaymentOperation = (operation: string, paymentId: string, amount: number, success: boolean, meta?: any) => {
  const message = `Payment ${operation}: ${paymentId} for ₹${amount} - ${success ? 'SUCCESS' : 'FAILED'}`;
  const logData = {
    operation,
    paymentId,
    amount,
    success,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (success) {
    logInfo(message, logData);
  } else {
    logError(message, null, logData);
  }
};

// Authentication logging
export const logAuthOperation = (operation: string, userId: string, success: boolean, meta?: any) => {
  const message = `Auth ${operation}: ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`;
  const logData = {
    operation,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (success) {
    logInfo(message, logData);
  } else {
    logWarn(message, logData);
  }
};

export default logger;
