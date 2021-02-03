import { Pool } from "pg";
const enableSSL = process.env.PGSSLMODE && process.env.PGSSLMODE === "require";
const pool = new Pool(
    enableSSL ? { ssl: { rejectUnauthorized: false } } : { ssl: false }
);
export default pool;
