// backend/src/config/db.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vetconnect',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ✅ Database wrapper with query method
export const db = {
  query: async (sql: string, params?: any[]) => {
    try {
      const [rows] = await pool.execute(sql, params || []);
      return rows;
    } catch (error) {
      console.error('❌ Database query error:', error);
      console.error('❌ SQL:', sql);
      console.error('❌ Params:', params);
      throw error;
    }
  },
  getConnection: async () => {
    return await pool.getConnection();
  },
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function connectDB(retries = 5) {
  console.log('🔄 Attempting to connect to MySQL...');
  console.log(`📊 Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'vetconnect'}`);
  console.log(`📊 User: ${process.env.DB_USER || 'root'}`);

  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ MySQL Connected successfully');
      connection.release();
      return true;
    } catch (err: any) {
      console.error(`❌ DB connection attempt ${i}/${retries} failed`);
      console.error(`❌ Error: ${err.message}`);

      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('❌ Access denied - check your DB_USER and DB_PASSWORD in .env');
        return false;
      }

      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.error('❌ Cannot reach MySQL server - make sure MySQL is running');
      }

      if (i < retries) {
        console.log(`⏳ Retrying in 3 seconds... (${retries - i} attempts left)`);
        await delay(3000);
      }
    }
  }

  console.error('💥 Database connection failed after all retries');
  console.error('Please check:');
  console.error('  1. MySQL is running (services.msc or XAMPP/WAMP)');
  console.error('  2. Database name is correct');
  console.error('  3. Username and password are correct');
  console.error('  4. Port is correct (3306 default)');
  return false;
}

export default pool;