import pino from 'pino'
// const expressPino = require('express-pino-logger');
const logFn = (opts = {}) => pino({
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: (process.env.LOG_PRETTY_PRINT && process.env.LOG_PRETTY_PRINT === "1") || false,
    ...opts
});
// const expressLogger = expressPino({ logger });
export default logFn;