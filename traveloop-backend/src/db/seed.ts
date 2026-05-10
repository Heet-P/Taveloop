import pool from "./connection";
import { ResultSetHeader } from "mysql2";

const cities = [
  { name: "Tokyo", country: "Japan", region: "Asia", cost_index: 3, popularity_score: 4.9 },
  { name: "Bali", country: "Indonesia", region: "Asia", cost_index: 1, popularity_score: 4.7 },
  { name: "Bangkok", country: "Thailand", region: "Asia", cost_index: 1, popularity_score: 4.6 },
  { name: "Singapore", country: "Singapore", region: "Asia", cost_index: 3, popularity_score: 4.5 },
  { name: "Kyoto", country: "Japan", region: "Asia", cost_index: 2, popularity_score: 4.8 },
  { name: "Ho Chi Minh City", country: "Vietnam", region: "Asia", cost_index: 1, popularity_score: 4.3 },
  { name: "Paris", country: "France", region: "Europe", cost_index: 3, popularity_score: 4.8 },
  { name: "Lisbon", country: "Portugal", region: "Europe", cost_index: 2, popularity_score: 4.5 },
  { name: "Barcelona", country: "Spain", region: "Europe", cost_index: 2, popularity_score: 4.7 },
  { name: "Amsterdam", country: "Netherlands", region: "Europe", cost_index: 3, popularity_score: 4.6 },
  { name: "Rome", country: "Italy", region: "Europe", cost_index: 2, popularity_score: 4.7 },
  { name: "Prague", country: "Czech Republic", region: "Europe", cost_index: 1, popularity_score: 4.4 },
  { name: "New York", country: "USA", region: "Americas", cost_index: 3, popularity_score: 4.6 },
  { name: "Mexico City", country: "Mexico", region: "Americas", cost_index: 1, popularity_score: 4.3 },
  { name: "Buenos Aires", country: "Argentina", region: "Americas", cost_index: 1, popularity_score: 4.2 },
  { name: "Cartagena", country: "Colombia", region: "Americas", cost_index: 1, popularity_score: 4.4 },
  { name: "Vancouver", country: "Canada", region: "Americas", cost_index: 3, popularity_score: 4.5 },
  { name: "Cape Town", country: "South Africa", region: "Africa", cost_index: 2, popularity_score: 4.4 },
  { name: "Marrakech", country: "Morocco", region: "Africa", cost_index: 1, popularity_score: 4.5 },
  { name: "Nairobi", country: "Kenya", region: "Africa", cost_index: 1, popularity_score: 4.1 },
  { name: "Cairo", country: "Egypt", region: "Africa", cost_index: 1, popularity_score: 4.2 },
  { name: "Dubai", country: "UAE", region: "Middle East", cost_index: 3, popularity_score: 4.5 },
  { name: "Istanbul", country: "Turkey", region: "Middle East", cost_index: 2, popularity_score: 4.6 },
  { name: "Petra", country: "Jordan", region: "Middle East", cost_index: 2, popularity_score: 4.7 },
  { name: "Sydney", country: "Australia", region: "Oceania", cost_index: 3, popularity_score: 4.6 },
  { name: "Melbourne", country: "Australia", region: "Oceania", cost_index: 3, popularity_score: 4.5 },
  { name: "Auckland", country: "New Zealand", region: "Oceania", cost_index: 3, popularity_score: 4.4 },
  { name: "Queenstown", country: "New Zealand", region: "Oceania", cost_index: 2, popularity_score: 4.7 },
  { name: "Seoul", country: "South Korea", region: "Asia", cost_index: 2, popularity_score: 4.6 },
  { name: "Chiang Mai", country: "Thailand", region: "Asia", cost_index: 1, popularity_score: 4.4 },
];

const activityCatalog: Record<string, { name: string; category: string; description: string; avg_cost: number; duration_minutes: number }[]> = {
  Tokyo: [
    { name: "Visit Senso-ji Temple", category: "sightseeing", description: "Tokyo's oldest temple in Asakusa", avg_cost: 0, duration_minutes: 90 },
    { name: "Sushi at Tsukiji", category: "food", description: "Fresh sushi at the famous market", avg_cost: 35, duration_minutes: 60 },
    { name: "Shibuya Crossing", category: "sightseeing", description: "World's busiest pedestrian crossing", avg_cost: 0, duration_minutes: 30 },
    { name: "TeamLab Borderless", category: "culture", description: "Digital art museum experience", avg_cost: 30, duration_minutes: 120 },
    { name: "Akihabara Shopping", category: "shopping", description: "Electronics and anime merchandise district", avg_cost: 50, duration_minutes: 180 },
  ],
  Bali: [
    { name: "Tanah Lot Temple", category: "sightseeing", description: "Iconic sea temple at sunset", avg_cost: 5, duration_minutes: 90 },
    { name: "Ubud Rice Terraces", category: "sightseeing", description: "Walk through the famous rice fields", avg_cost: 3, duration_minutes: 120 },
    { name: "Nasi Goreng Cooking Class", category: "food", description: "Learn to cook traditional Balinese dishes", avg_cost: 25, duration_minutes: 180 },
    { name: "White Water Rafting", category: "adventure", description: "Rafting on the Ayung River", avg_cost: 35, duration_minutes: 150 },
    { name: "Spa & Massage", category: "culture", description: "Traditional Balinese massage", avg_cost: 20, duration_minutes: 90 },
  ],
  Paris: [
    { name: "Eiffel Tower", category: "sightseeing", description: "Iconic iron lattice tower on the Champ de Mars", avg_cost: 26, duration_minutes: 90 },
    { name: "Louvre Museum", category: "culture", description: "World's largest art museum", avg_cost: 15, duration_minutes: 240 },
    { name: "Seine River Cruise", category: "sightseeing", description: "Scenic boat tour of Paris landmarks", avg_cost: 20, duration_minutes: 60 },
    { name: "Croissant at a Boulangerie", category: "food", description: "Authentic French pastries for breakfast", avg_cost: 8, duration_minutes: 30 },
    { name: "Montmartre Walk", category: "sightseeing", description: "Artistic hilltop neighbourhood with Sacré-Cœur", avg_cost: 0, duration_minutes: 120 },
  ],
  Bangkok: [
    { name: "Grand Palace", category: "sightseeing", description: "The official residence of the Kings of Siam", avg_cost: 15, duration_minutes: 120 },
    { name: "Pad Thai Street Food Tour", category: "food", description: "Night market street food crawl", avg_cost: 15, duration_minutes: 90 },
    { name: "Wat Pho Temple", category: "culture", description: "Home of the reclining Buddha", avg_cost: 5, duration_minutes: 60 },
    { name: "Chatuchak Weekend Market", category: "shopping", description: "One of the world's largest markets", avg_cost: 30, duration_minutes: 180 },
    { name: "Chao Phraya Boat Ride", category: "adventure", description: "River taxi through Bangkok's canals", avg_cost: 8, duration_minutes: 60 },
  ],
  Lisbon: [
    { name: "Belém Tower", category: "sightseeing", description: "16th century fortress on the Tagus River", avg_cost: 12, duration_minutes: 60 },
    { name: "Tram 28 Ride", category: "sightseeing", description: "Historic tram through Alfama district", avg_cost: 3, duration_minutes: 45 },
    { name: "Pastéis de Nata", category: "food", description: "Famous custard tarts at the original bakery", avg_cost: 5, duration_minutes: 20 },
    { name: "Fado Show", category: "culture", description: "Traditional Portuguese music in Alfama", avg_cost: 25, duration_minutes: 120 },
    { name: "Sintra Day Trip", category: "adventure", description: "Fairy-tale palaces in the hills near Lisbon", avg_cost: 20, duration_minutes: 360 },
  ],
};

async function seed() {
  console.log("Starting seed...");

  for (const city of cities) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO cities (name, country, region, cost_index, popularity_score)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE popularity_score = VALUES(popularity_score)`,
      [city.name, city.country, city.region, city.cost_index, city.popularity_score]
    );

    const cityId = result.insertId || 0;
    if (cityId === 0) continue;

    const activities = activityCatalog[city.name];
    if (!activities) continue;

    for (const act of activities) {
      await pool.execute(
        `INSERT INTO activity_catalog (city_id, name, category, description, avg_cost, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cityId, act.name, act.category, act.description, act.avg_cost, act.duration_minutes]
      );
    }

    console.log(`Seeded: ${city.name}`);
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
