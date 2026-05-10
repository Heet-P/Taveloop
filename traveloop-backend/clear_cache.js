const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearCache() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Heetrio@123',
    database: process.env.DB_NAME || 'traveloop',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [result] = await pool.execute('DELETE FROM activity_catalog');
    console.log(`Successfully cleared cache! Deleted ${result.affectedRows} cached activities.`);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  } finally {
    await pool.end();
  }
}

clearCache();
