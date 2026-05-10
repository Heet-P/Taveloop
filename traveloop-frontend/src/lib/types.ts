export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  language: string;
  role: "user" | "admin";
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "ongoing" | "completed";
  stops: Stop[];
  isPublic: boolean;
  shareToken?: string;
}

export interface Stop {
  id: string;
  tripId: string;
  cityId: string;
  city: City;
  order: number;
  startDate: string;
  endDate: string;
  activities: Activity[];
}

export interface City {
  id: string;
  name: string;
  country: string;
  region: "Asia" | "Europe" | "Americas" | "Africa" | "Oceania" | "Middle East";
  costIndex: 1 | 2 | 3;
  popularityScore: number;
  imageUrl?: string;
}

export interface Activity {
  id: string;
  stopId: string;
  name: string;
  category: "sightseeing" | "food" | "adventure" | "shopping" | "culture";
  description?: string;
  cost: number;
  durationMinutes: number;
  timeSlot?: string;
}

export interface BudgetItem {
  id: string;
  tripId: string;
  category: "transport" | "accommodation" | "activities" | "meals" | "misc";
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
  name: string;
  category: "clothing" | "documents" | "electronics" | "toiletries" | "other";
  isPacked: boolean;
}

export interface Note {
  id: string;
  tripId: string;
  stopId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityTrip {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  cover_photo?: string;
  author_name: string;
  avatar_url?: string;
  like_count: number;
  copy_count: number;
  cities: string;
}

export interface BudgetSummary {
  items: BudgetItem[];
  summary: { category: string; category_total: number; item_count: number }[];
  grandTotal: number;
  dailyCosts: { day: string; daily_activity_cost: number }[];
}

export type TripStatus = "upcoming" | "ongoing" | "completed";
export type ActivityCategory = "sightseeing" | "food" | "adventure" | "shopping" | "culture";
export type BudgetCategory = "transport" | "accommodation" | "activities" | "meals" | "misc";
export type ChecklistCategory = "clothing" | "documents" | "electronics" | "toiletries" | "other";
