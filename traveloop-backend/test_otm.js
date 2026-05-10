const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
    const OTM_BASE = 'https://api.opentripmap.com/0.1/en/places';
    const OTM_KEY = process.env.OPENTRIPMAP_KEY;
    const name = 'Vadodara';
    const geoResp = await fetch(`${OTM_BASE}/geoname?name=${name}&apikey=${OTM_KEY}`);
    const geoData = await geoResp.json();
    console.log('Geo:', geoData);
    
    if (geoData.lat && geoData.lon) {
        const kinds = 'interesting_places,museums,cultural,architecture,natural,sport,amusements,foods,shops,historic_architecture,religion';
        
        let radiusResp = await fetch(`${OTM_BASE}/radius?radius=10000&lon=${geoData.lon}&lat=${geoData.lat}&kinds=${kinds}&rate=2&limit=50&format=json&apikey=${OTM_KEY}`);
        let features = await radiusResp.json();
        console.log('Features count (rate=2):', features.length);
        
        radiusResp = await fetch(`${OTM_BASE}/radius?radius=10000&lon=${geoData.lon}&lat=${geoData.lat}&kinds=${kinds}&rate=1&limit=50&format=json&apikey=${OTM_KEY}`);
        features = await radiusResp.json();
        console.log('Features count (rate=1):', features.length);
        
        radiusResp = await fetch(`${OTM_BASE}/radius?radius=10000&lon=${geoData.lon}&lat=${geoData.lat}&kinds=${kinds}&limit=50&format=json&apikey=${OTM_KEY}`);
        features = await radiusResp.json();
        console.log('Features count (no rate):', features.length);
    }
})();
