import { app } from "./app";
import monitor from "./monitor";

const PORT = process.env.PORT || 3007;
const MONITOR = process.env.RUN_MONITOR ? true : false;
const ENDPOINT_URL = process.env.ENDPOINT_URL || 'ws://localhost:9944';

app.listen(PORT, () =>
  console.log(`polkabtc-stats listening at http://localhost:${PORT}`)
);

if (MONITOR) {
  // process historical and incoming blocks and
  // propogate to the postgres database
  monitor(ENDPOINT_URL).catch((error) => {
    console.error(error);
    process.exit(-1);
  });
}
