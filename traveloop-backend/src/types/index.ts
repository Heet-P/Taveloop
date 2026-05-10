export interface DbUser {
  id: number;
  clerk_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  language: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface DbTrip {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  cover_photo: string | null;
  start_date: string;
  end_date: string;
  status: "upcoming" | "ongoing" | "completed";
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStop {
  id: number;
  trip_id: number;
  city_id: number;
  stop_order: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface DbCity {
  id: number;
  name: string;
  country: string;
  region: "Asia" | "Europe" | "Americas" | "Africa" | "Oceania" | "Middle East";
  cost_index: 1 | 2 | 3;
  popularity_score: number;
  image_url: string | null;
  created_at: string;
}

export interface DbActivity {
  id: number;
  stop_id: number;
  name: string;
  category: "sightseeing" | "food" | "adventure" | "shopping" | "culture";
  description: string | null;
  cost: number;
  duration_minutes: number | null;
  time_slot: string | null;
  created_at: string;
}

export interface DbBudgetItem {
  id: number;
  trip_id: number;
  category: "transport" | "accommodation" | "activities" | "meals" | "misc";
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
  created_at: string;
}

export interface DbChecklistItem {
  id: number;
  trip_id: number;
  name: string;
  category: "clothing" | "documents" | "electronics" | "toiletries" | "other";
  is_packed: boolean;
  created_at: string;
}

export interface DbNote {
  id: number;
  trip_id: number;
  stop_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
}

declare global {
  namespace Express {
    interface Request {
      dbUser?: DbUser;
      auth?: { userId: string };
    }
  }
}
