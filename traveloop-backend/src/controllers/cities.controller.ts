import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// ─── OpenTripMap helpers ──────────────────────────────────────────────

const OTM_BASE = "https://api.opentripmap.com/0.1/en/places";
const OTM_KEY = process.env.OPENTRIPMAP_KEY ?? "";

type OtmFeature = {
  properties: { xid: string; name: string; kinds: string; rate: number };
};

type OtmDetails = {
  name?: string;
  kinds?: string;
  wikipedia_extracts?: { text?: string };
  url?: string;
  phone?: string;
  opening_hours?: string;
  preview?: { source?: string };
  otm?: string;
};

function mapOtmKinds(kinds: string): string {
  if (/museum|gallery|cultural|theatre|cinema|art/.test(kinds)) return "culture";
  if (/food|restaurant|cafe|bar|bistro/.test(kinds)) return "food";
  if (/shop|market|mall/.test(kinds)) return "shopping";
  if (/sport|water|beach|nature|park|amusement|zoo/.test(kinds)) return "adventure";
  return "sightseeing";
}

function estimateCostFromKinds(kinds: string, costIndex: number): number {
  const base = costIndex === 1 ? 10 : costIndex === 2 ? 25 : 40;
  if (/park|beach|viewpoint|nature/.test(kinds)) return 0;
  if (/museum|zoo|amusement|castle|historic/.test(kinds)) return Math.round(base * 1.2);
  if (/culture|theatre|art/.test(kinds)) return Math.round(base * 1.5);
  // Default base ticket price
  return Math.round(base * 0.8);
}

function estimateDurationFromKinds(kinds: string): number {
  if (/museum|gallery|cultural/.test(kinds)) return 120;
  if (/zoo|theme_park|amusement/.test(kinds)) return 240;
  if (/restaurant/.test(kinds)) return 75;
  if (/cafe|bar/.test(kinds)) return 45;
  if (/beach|nature_reserve|park/.test(kinds)) return 180;
  return 90;
}

function buildOtmDescription(details: OtmDetails): string {
  const parts: string[] = [];
  if (details.wikipedia_extracts?.text) parts.push(details.wikipedia_extracts.text.slice(0, 180).replace(/\n/g, " "));
  if (details.url) parts.push(`Website: ${details.url}`);
  if (details.phone) parts.push(`Phone: ${details.phone}`);
  if (details.opening_hours) parts.push(`Hours: ${details.opening_hours}`);
  return parts.slice(0, 2).join(" | ");
}

function inferRegion(countryCode: string, displayName: string): string {
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
  // Fallback: check display_name for clues
  if (/Asia|Japan|China|India|Korea|Vietnam|Thai|Bali|Philip/i.test(displayName)) return "Asia";
  if (/Europe|France|Germany|Spain|Italy|UK|Dutch/i.test(displayName)) return "Europe";
  if (/Africa|Egypt|Morocco|Kenya/i.test(displayName)) return "Africa";
  return "Asia"; // default
}

async function lookupAndSeedCity(name: string): Promise<RowDataPacket[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=5&featuretype=city&addressdetails=1`;
    const resp = await fetch(url, { headers: { "User-Agent": "Traveloop/1.0 travel-planning-app" } });
    if (!resp.ok) return [];

    type NominatimResult = { display_name: string; address?: { city?: string; town?: string; state?: string; country?: string; country_code?: string }; importance?: number };
    const results = await resp.json() as NominatimResult[];

    const toInsert: { name: string; country: string; region: string; cost_index: number; popularity_score: number }[] = [];
    for (const r of results.slice(0, 3)) {
      const cityName = r.address?.city ?? r.address?.town ?? r.display_name.split(",")[0].trim();
      const country = r.address?.country ?? "";
      const countryCode = r.address?.country_code ?? "";
      if (!cityName || !country || cityName.length < 2) continue;
      const region = inferRegion(countryCode, r.display_name);
      const popularity = Math.min(4.9, Math.max(3.5, ((r.importance ?? 0.5) * 5)));
      toInsert.push({ name: cityName, country, region, cost_index: 2, popularity_score: Math.round(popularity * 10) / 10 });
    }

    for (const city of toInsert) {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO cities (name, country, region, cost_index, popularity_score)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = ? AND country = ?)`,
        [city.name, city.country, city.region, city.cost_index, city.popularity_score, city.name, city.country]
      );
    }

    if (toInsert.length === 0) return [];
    const [newRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM cities WHERE name LIKE ? ORDER BY popularity_score DESC LIMIT 5`,
      [`%${name}%`]
    );
    return newRows;
  } catch {
    return [];
  }
}

export async function searchCities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search = "", region, costIndex, limit = "20", offset = "0" } = req.query as Record<string, string>;

    const conditions: string[] = ["name LIKE ?"];
    const params: (string | number)[] = [`%${search}%`];

    if (region) {
      conditions.push("region = ?");
      params.push(region);
    }
    if (costIndex) {
      conditions.push("cost_index = ?");
      params.push(parseInt(costIndex));
    }

    const where = conditions.join(" AND ");
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    let [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM cities WHERE ${where} ORDER BY popularity_score DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    // If no results and user typed a search term, look it up via Nominatim and seed into DB
    if (rows.length === 0 && search.trim().length >= 2 && !region && !costIndex) {
      rows = await lookupAndSeedCity(search.trim());
    }

    const normalized = rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      country: String(r.country),
      region: r.region as string,
      costIndex: Number(r.cost_index),
      popularityScore: Number(r.popularity_score),
      imageUrl: r.image_url ? String(r.image_url) : undefined,
    }));
    res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    next(err);
  }
}

export async function getCityById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.id));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city id" });
      return;
    }

    const [cities] = await pool.execute<RowDataPacket[]>("SELECT * FROM cities WHERE id = ?", [cityId]);
    if (cities.length === 0) {
      res.status(404).json({ success: false, error: "City not found" });
      return;
    }

    const [catalog] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_catalog WHERE city_id = ?",
      [cityId]
    );

    const c = cities[0];
    const normalizedCity = {
      id: String(c.id),
      name: String(c.name),
      country: String(c.country),
      region: c.region as string,
      costIndex: Number(c.cost_index),
      popularityScore: Number(c.popularity_score),
      imageUrl: c.image_url ? String(c.image_url) : undefined,
    };
    const normalizedCatalog = catalog.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      category: String(r.category),
      description: r.description ? String(r.description) : undefined,
      cost: Number(r.avg_cost),
      durationMinutes: Number(r.duration_minutes),
    }));

    res.status(200).json({ success: true, data: { city: normalizedCity, activityCatalog: normalizedCatalog } });
  } catch (err) {
    next(err);
  }
}

export async function getCityActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.id));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city id" });
      return;
    }

    const { category, minCost, maxCost } = req.query as Record<string, string>;

    const conditions: string[] = ["city_id = ?"];
    const params: (string | number)[] = [cityId];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (minCost) {
      conditions.push("avg_cost >= ?");
      params.push(parseFloat(minCost));
    }
    if (maxCost) {
      conditions.push("avg_cost <= ?");
      params.push(parseFloat(maxCost));
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_catalog WHERE ${conditions.join(" AND ")}`,
      params
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function discoverActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.id));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city id" });
      return;
    }

    const [cities] = await pool.execute<RowDataPacket[]>("SELECT * FROM cities WHERE id = ?", [cityId]);
    if (cities.length === 0) {
      res.status(404).json({ success: false, error: "City not found" });
      return;
    }
    const city = cities[0];

    // Return cache if already populated
    const [cached] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_catalog WHERE city_id = ? ORDER BY id LIMIT 40",
      [cityId]
    );
    if (cached.length >= 5) {
      const normalized = cached.map((r) => ({
        id: String(r.id),
        name: r.name as string,
        category: r.category as string,
        description: (r.description ?? undefined) as string | undefined,
        cost: r.avg_cost as number,
        durationMinutes: r.duration_minutes as number,
      }));
      res.status(200).json({ success: true, data: normalized, source: "cache" });
      return;
    }

    // Step 1: Try Gemini FIRST for the best tourist places (e.g. Taj Mahal for Agra)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `You are a travel expert API. Give me the top 15 most popular and must-visit tourist attractions in ${city.name}, ${city.country}. Include famous places (like Taj Mahal if in Agra, Eiffel Tower if Paris). For each, estimate the standard entry cost in USD (0 if free). Provide a short 1-sentence engaging description. Categorize into one of these strict exact strings: "sightseeing", "food", "shopping", "culture", "adventure". Return a strict JSON array of objects with keys: name (string), category (string), cost (number), durationMinutes (number, typically 60-180), description (string).`;

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (gRes.ok) {
          const data = await gRes.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text) as { name: string; category: string; cost: number; durationMinutes: number; description: string }[];
            
            for (const act of parsed) {
              await pool.execute<ResultSetHeader>(
                `INSERT INTO activity_catalog (city_id, name, category, description, avg_cost, duration_minutes)
                 SELECT ?, ?, ?, ?, ?, ?
                 WHERE NOT EXISTS (SELECT 1 FROM activity_catalog WHERE city_id = ? AND name = ?)`,
                [cityId, act.name, act.category, act.description, act.cost, act.durationMinutes, cityId, act.name]
              );
            }

            const [fresh] = await pool.execute<RowDataPacket[]>("SELECT * FROM activity_catalog WHERE city_id = ? ORDER BY id LIMIT 40", [cityId]);
            const normalized = fresh.map((r) => ({
              id: String(r.id),
              name: String(r.name),
              category: String(r.category),
              description: r.description ? String(r.description) : undefined,
              avgCost: Number(r.avg_cost),
              durationMinutes: Number(r.duration_minutes),
            }));
            res.status(200).json({ success: true, data: normalized, source: "gemini" });
            return;
          }
        }
      } catch (e) {
        console.error("Gemini direct discovery failed:", e);
      }
    }

    // Step 2: Fallback — geocode via OpenTripMap geoname
    const geoResp = await fetch(
      `${OTM_BASE}/geoname?name=${encodeURIComponent(city.name)}&apikey=${OTM_KEY}`
    );
    if (!geoResp.ok) {
      res.status(200).json({ success: true, data: [], source: "error" });
      return;
    }
    const geoData = await geoResp.json() as { lat?: number; lon?: number; status?: string };
    if (!geoData.lat || !geoData.lon) {
      res.status(200).json({ success: true, data: cached, source: "cache" });
      return;
    }
    const { lat, lon } = geoData;

    // Step 3 — fetch top POIs via radius (strictly tourist attractions, museums, monuments, culture)
    const kinds = "interesting_places,museums,tourist_facilities,cultural,historic_architecture,monuments";
    const radiusResp = await fetch(
      `${OTM_BASE}/radius?radius=20000&lon=${lon}&lat=${lat}&kinds=${kinds}&limit=50&format=json&apikey=${OTM_KEY}`
    );
    const features = await radiusResp.json() as OtmFeature[];

    // Step 4 — fetch details for top 15 results
    const top = (Array.isArray(features) ? features : [])
      .filter((f: any) => f.name && f.name.length >= 3)
      .slice(0, 15);

    const toInsert: { name: string; category: string; description: string; avgCost: number; duration: number }[] = [];
    const seen = new Set<string>();

    await Promise.all(
      top.map(async (f: any) => {
        const { xid, name, kinds: k } = f;
        if (seen.has(name.toLowerCase())) return;
        seen.add(name.toLowerCase());

        let description = "";
        try {
          const detResp = await fetch(`${OTM_BASE}/xid/${xid}?apikey=${OTM_KEY}`);
          if (detResp.ok) {
            const det = await detResp.json() as OtmDetails;
            description = buildOtmDescription(det);
          }
        } catch {
          // use empty description if details fail
        }

        toInsert.push({
          name,
          category: mapOtmKinds(k ?? ""),
          description,
          avgCost: estimateCostFromKinds(k ?? "", city.cost_index),
          duration: estimateDurationFromKinds(k ?? ""),
        });
      })
    );

    // Step 5 — save to activity_catalog (skip duplicates)
    for (const act of toInsert) {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO activity_catalog (city_id, name, category, description, avg_cost, duration_minutes)
         SELECT ?, ?, ?, ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM activity_catalog WHERE city_id = ? AND name = ?)`,
        [cityId, act.name, act.category, act.description, act.avgCost, act.duration, cityId, act.name]
      );
    }

    const [fresh] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_catalog WHERE city_id = ? ORDER BY id LIMIT 40",
      [cityId]
    );
    const normalized = fresh.map((r) => ({
      id: String(r.id),
      name: r.name as string,
      category: r.category as string,
      description: (r.description ?? undefined) as string | undefined,
      cost: Number(r.avg_cost),
      durationMinutes: Number(r.duration_minutes),
    }));

    res.status(200).json({ success: true, data: normalized, source: "discovered" });
  } catch (err) {
    next(err);
  }
}
