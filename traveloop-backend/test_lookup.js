const mysql = require('mysql2/promise');
require('dotenv').config();

function inferRegion(countryCode, displayName) {
  const cc = countryCode.toUpperCase();
  const asiaCC = ["JP","CN","IN","TH","VN","ID","MY","SG","PH","KH","LA","MM","BD","LK","NP","PK","AF","IR","IQ","KW","SA","AE","OM","QA","BH","YE","JO","LB","SY","AM","GE","AZ","UZ","KZ","TM","KG","TJ","MN","KR","TW","HK","MO"];
  const meCC = ["SA","AE","OM","QA","BH","KW","IQ","IR","JO","LB","SY","YE","IL","PS","TR","CY"];
  const europeCC = ["FR","DE","ES","IT","GB","NL","BE","CH","AT","PT","SE","NO","DK","FI","PL","CZ","HU","RO","BG","GR","HR","SK","SI","EE","LV","LT","UA","RS","BA","ME","MK","AL","IS","LU","MT","IE","BY","MD","MO"];
  const africaCC = ["ZA","EG","MA","KE","NG","ET","GH","TZ","UG","SN","CI","CM","MZ","ZW","BW","NA","RW","TN","DZ","LY","SD","AO","ZM","MW","MG","MU","SC"];
  const oceaniaCC = ["AU","NZ","FJ","PG","SB","VU","WS","TO","TV","KI","FM","MH","PW","NR"];
  const americasCC = ["US","CA","MX","BR","AR","CO","CL","PE","VE","EC","BO","PY","UY","GY","SR","CR","PA","GT","HN","SV","NI","BZ","CU","JM","DO","HT","TT","BB","LC","VC","GD","AG","DM","KN"];
  if (meCC.includes(cc)) return "Middle East";
  if (asiaCC.includes(cc)) return "Asia";
  if (europeCC.includes(cc)) return "Europe";
  if (africaCC.includes(cc)) return "Africa";
  if (oceaniaCC.includes(cc)) return "Oceania";
  if (americasCC.includes(cc)) return "Americas";
  if (/Asia|Japan|China|India|Korea|Vietnam|Thai|Bali|Philip/i.test(displayName)) return "Asia";
  if (/Europe|France|Germany|Spain|Italy|UK|Dutch/i.test(displayName)) return "Europe";
  if (/Africa|Egypt|Morocco|Kenya/i.test(displayName)) return "Africa";
  return "Asia"; // default
}

(async () => {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  try {
    const name = 'London';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=5&featuretype=city&addressdetails=1`;
    console.log('Fetching', url);
    const resp = await fetch(url, { headers: { "User-Agent": "Traveloop/1.0 travel-planning-app" } });
    const results = await resp.json();
    console.log('Got', results.length, 'results');
    
    const toInsert = [];
    for (const r of results.slice(0, 3)) {
      const cityName = r.address?.city ?? r.address?.town ?? r.display_name.split(",")[0].trim();
      const country = r.address?.country ?? "";
      const countryCode = r.address?.country_code ?? "";
      if (!cityName || !country || cityName.length < 2) continue;
      const region = inferRegion(countryCode, r.display_name);
      const popularity = Math.min(4.9, Math.max(3.5, ((r.importance ?? 0.5) * 5)));
      toInsert.push({ name: cityName, country, region, cost_index: 2, popularity_score: Math.round(popularity * 10) / 10 });
    }
    
    console.log('toInsert', toInsert);
    for (const city of toInsert) {
      const res = await conn.execute(
        `INSERT INTO cities (name, country, region, cost_index, popularity_score)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = ? AND country = ?)`,
        [city.name, city.country, city.region, city.cost_index, city.popularity_score, city.name, city.country]
      );
      console.log('Inserted:', res[0].affectedRows);
    }
    
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await conn.end();
  }
})();
