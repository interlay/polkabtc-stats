import { Pool } from "pg";
import { PGREPLICAHOST, ENABLE_PG_SSL } from "./constants";
const pool = new Pool({
    host: PGREPLICAHOST,
    ssl: ENABLE_PG_SSL ? { rejectUnauthorized: false } : false
}
);
export default pool;
