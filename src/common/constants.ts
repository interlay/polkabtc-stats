export const PORT = process.env.PORT || 3007;
export const MONITOR = process.env.MONITOR ? true : false;
export const ENDPOINT_URL = process.env.ENDPOINT_URL || "ws://localhost:9944";
export const BTC_NETWORK = process.env.BTC_NETWORK || "http://localhost:3002"; // for polkabtc-js, regtest must be a URL
export const ENABLE_PG_SSL =
    process.env.PGSSLMODE && process.env.PGSSLMODE === "require";
export const PGREPLICAHOST = process.env.PGREPLICAHOST || process.env.PGHOST
export const SYNC_DB_SCHEMA = process.env.SYNC_DB_SCHEMA && process.env.SYNC_DB_SCHEMA === "1"