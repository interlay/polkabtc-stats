import { Pool } from "pg";
const pool = new Pool({ ssl: { rejectUnauthorized: false } });
export default pool;
