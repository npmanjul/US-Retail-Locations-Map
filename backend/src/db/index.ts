import { Pool } from "pg";
import CONFIG from "../constants/index.ts";

export const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
});
