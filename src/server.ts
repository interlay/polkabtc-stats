// Must be at top
import "reflect-metadata";

import { app } from "./app";
import monitor from "./monitor";
import { PORT, MONITOR } from "./common/constants";
import pino from "pino";

export const logger = pino({ name: 'server' });

app.listen(PORT, () =>
    console.log(`polkabtc-stats listening at http://localhost:${PORT}`)
);

if (MONITOR) {
    // process historical and incoming blocks and
    // propogate to the postgres database
    monitor().catch((error) => {
        console.error(error);
        process.exit(-1);
    });
}
