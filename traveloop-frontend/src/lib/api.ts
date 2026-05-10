import type { Trip, City, Activity, BudgetItem, ChecklistItem, Note, CommunityTrip, BudgetSummary, User } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers, ...rest });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error: ${res.status}`);
  }
  const json = await res.json() as { success: boolean; data: T };
  return json.data;
}

// Users
export const syncUser = (data: { clerkId: string; name: string; email: string; avatarUrl?: string }, token: string) =>
  apiFetch<User>("/api/users/sync", { method: "POST", body: JSON.stringify(data), token });

export const getMe = (token: string) => apiFetch<User>("/api/users/me", { token });
export const updateMe = (data: Partial<Pick<User, "name" | "bio" | "language">>, token: string) =>
  apiFetch<User>("/api/users/me", { method: "PUT", body: JSON.stringify(data), token });
export const deleteMe = (token: string) => apiFetch<null>("/api/users/me", { method: "DELETE", token });
export const getSavedDestinations = (token: string) => apiFetch<City[]>("/api/users/me/saved-destinations", { token });
export const saveDestination = (cityId: string, token: string) =>
  apiFetch<null>(`/api/users/me/saved-destinations/${cityId}`, { method: "POST", token });
export const unsaveDestination = (cityId: string, token: string) =>
  apiFetch<null>(`/api/users/me/saved-destinations/${cityId}`, { method: "DELETE", token });

// Trips
export const getTrips = (params: { status?: string } = {}, token: string) => {
  const qs = params.status ? `?status=${params.status}` : "";
  return apiFetch<Trip[]>(`/api/trips${qs}`, { token });
};
export const createTrip = (data: { name: string; description?: string; startDate: string; endDate: string; coverPhoto?: string }, token: string) =>
  apiFetch<Trip>("/api/trips", { method: "POST", body: JSON.stringify(data), token });
export const getTripById = (id: string, token: string) => apiFetch<Trip>(`/api/trips/${id}`, { token });
export const updateTrip = (id: string, data: Partial<Trip>, token: string) =>
  apiFetch<Trip>(`/api/trips/${id}`, { method: "PUT", body: JSON.stringify(data), token });
export const deleteTrip = (id: string, token: string) => apiFetch<null>(`/api/trips/${id}`, { method: "DELETE", token });
export const publishTrip = (id: string, token: string) => apiFetch<Trip>(`/api/trips/${id}/publish`, { method: "POST", token });
export const getSharedTrip = (token: string) => apiFetch<Trip>(`/api/trips/shared/${token}`);
export const copySharedTrip = (shareToken: string, authToken: string) =>
  apiFetch<Trip>(`/api/trips/shared/${shareToken}/copy`, { method: "POST", token: authToken });

// Stops
export const addStop = (data: { tripId: string; cityId: string; startDate: string; endDate: string }, token: string) =>
  apiFetch<object>("/api/stops", { method: "POST", body: JSON.stringify(data), token });
export const updateStop = (id: string, data: { startDate?: string; endDate?: string }, token: string) =>
  apiFetch<object>(`/api/stops/${id}`, { method: "PUT", body: JSON.stringify(data), token });
export const deleteStop = (id: string, token: string) => apiFetch<null>(`/api/stops/${id}`, { method: "DELETE", token });
export const reorderStops = (data: { tripId: string; order: { stopId: string; newOrder: number }[] }, token: string) =>
  apiFetch<null>("/api/stops/reorder", { method: "PUT", body: JSON.stringify(data), token });

// Activities
export const addActivity = (data: Partial<Activity> & { stopId: string }, token: string) =>
  apiFetch<Activity>("/api/activities", { method: "POST", body: JSON.stringify(data), token });
export const updateActivity = (id: string, data: Partial<Activity>, token: string) =>
  apiFetch<Activity>(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(data), token });
export const deleteActivity = (id: string, token: string) => apiFetch<null>(`/api/activities/${id}`, { method: "DELETE", token });

// Cities
export const searchCities = (params: { search?: string; region?: string; costIndex?: number } = {}, token: string) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
  return apiFetch<City[]>(`/api/cities${qs ? `?${qs}` : ""}`, { token });
};
export const getCityById = (id: string, token: string) => apiFetch<{ city: City; activityCatalog: Activity[] }>(`/api/cities/${id}`, { token });
export const getCityActivities = (id: string, params: { category?: string; minCost?: number; maxCost?: number } = {}, token: string) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
  return apiFetch<Activity[]>(`/api/cities/${id}/activities${qs ? `?${qs}` : ""}`, { token });
};

// Budget
export const getBudget = (tripId: string, token: string) => apiFetch<BudgetSummary>(`/api/budget/trip/${tripId}`, { token });
export const addBudgetItem = (data: Partial<BudgetItem> & { tripId: string }, token: string) =>
  apiFetch<BudgetItem>("/api/budget", { method: "POST", body: JSON.stringify(data), token });
export const updateBudgetItem = (id: string, data: Partial<BudgetItem>, token: string) =>
  apiFetch<BudgetItem>(`/api/budget/${id}`, { method: "PUT", body: JSON.stringify(data), token });
export const deleteBudgetItem = (id: string, token: string) => apiFetch<null>(`/api/budget/${id}`, { method: "DELETE", token });

// Checklist
export const getChecklist = (tripId: string, token: string) => apiFetch<ChecklistItem[]>(`/api/checklist/trip/${tripId}`, { token });
export const addChecklistItem = (data: { tripId: string; name: string; category?: string }, token: string) =>
  apiFetch<ChecklistItem>("/api/checklist", { method: "POST", body: JSON.stringify(data), token });
export const updateChecklistItem = (id: string, data: { name?: string; isPacked?: boolean }, token: string) =>
  apiFetch<ChecklistItem>(`/api/checklist/${id}`, { method: "PUT", body: JSON.stringify(data), token });
export const deleteChecklistItem = (id: string, token: string) => apiFetch<null>(`/api/checklist/${id}`, { method: "DELETE", token });
export const resetChecklist = (tripId: string, token: string) => apiFetch<null>(`/api/checklist/trip/${tripId}/reset`, { method: "DELETE", token });

// Notes
export const getNotes = (tripId: string, token: string, stopId?: string) => {
  const qs = stopId ? `?stopId=${stopId}` : "";
  return apiFetch<Note[]>(`/api/notes/trip/${tripId}${qs}`, { token });
};
export const createNote = (data: { tripId: string; stopId?: string; content: string }, token: string) =>
  apiFetch<Note>("/api/notes", { method: "POST", body: JSON.stringify(data), token });
export const updateNote = (id: string, content: string, token: string) =>
  apiFetch<Note>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify({ content }), token });
export const deleteNote = (id: string, token: string) => apiFetch<null>(`/api/notes/${id}`, { method: "DELETE", token });

// Community
export const getCommunityFeed = (params: { sort?: string; search?: string; offset?: number } = {}, token: string) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
  return apiFetch<CommunityTrip[]>(`/api/community${qs ? `?${qs}` : ""}`, { token });
};
export const likeTrip = (tripId: string, token: string) => apiFetch<null>(`/api/community/like/${tripId}`, { method: "POST", token });
export const unlikeTrip = (tripId: string, token: string) => apiFetch<null>(`/api/community/like/${tripId}`, { method: "DELETE", token });
