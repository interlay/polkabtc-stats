// Must be at top
import "reflect-metadata";

import { app } from "./app";
import monitor from "./monitor";
import { PORT, MONITOR } from "./common/constants";
import logFn from './common/logger'

export const logger = logFn({ name: 'server' });

// patch console.log and use pino to output structured log msgs
const consoleLogger = logFn({name: 'consoleLog'})
console.log = consoleLogger.info.bind(consoleLogger)
console.error = consoleLogger.error.bind(consoleLogger)

app.listen(PORT, () =>
    logger.info(`polkabtc-stats listening at http://localhost:${PORT}`)
);

if (MONITOR) {
    // process historical and incoming blocks and
    // propogate to the postgres database
    monitor().catch((error) => {
        logger.error(error);
        process.exit(-1);
    });
}
