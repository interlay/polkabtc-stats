import { Pool } from "pg";
const pool = new Pool({ ssl: false });
export default pool;
