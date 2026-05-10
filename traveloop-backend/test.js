const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  try {
    const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
    
    const city = {
        name: 'Mumbai', country: 'India', region: 'Asia', cost_index: 2, popularity_score: 4.5
    };
    const q = `INSERT INTO cities (name, country, region, cost_index, popularity_score)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = ? AND country = ?)`;
    const [res] = await conn.execute(q, [city.name, city.country, city.region, city.cost_index, city.popularity_score, city.name, city.country]);
    console.log('Insert Result:', res.affectedRows);
    
    const [rows] = await conn.execute('SELECT * FROM cities WHERE name LIKE ?', ['%Mumbai%']);
    console.log('Select Result:', rows.length);

    await conn.end();
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
