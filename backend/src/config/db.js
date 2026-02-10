import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection error:", err.message);
  });

export default pool;
