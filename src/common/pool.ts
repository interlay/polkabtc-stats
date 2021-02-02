import { Pool } from "pg";
const isRemote = process.env.PGHOST && process.env.PGHOST !== "localhost";
const pool = new Pool(
    isRemote ? { ssl: { rejectUnauthorized: false } } : { ssl: false }
);
export default pool;
