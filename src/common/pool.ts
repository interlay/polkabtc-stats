import { Pool } from "pg";
import { ENABLE_PG_SSL } from "./constants";
const pool = new Pool(
    ENABLE_PG_SSL ? { ssl: { rejectUnauthorized: false } } : { ssl: false }
);
export default pool;
