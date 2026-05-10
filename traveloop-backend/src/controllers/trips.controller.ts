import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { randomUUID } from "crypto";

function computeTripStatus(startDateStr: string, endDateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  if (end < today) return "completed";
  if (start > today) return "upcoming";
  return "ongoing";
}

function buildNestedTrip(rows: RowDataPacket[]) {
  if (rows.length === 0) return null;
  const trip = {
    id: String(rows[0].id),
    userId: String(rows[0].user_id),
    name: rows[0].name as string,
    description: (rows[0].description ?? undefined) as string | undefined,
    coverPhoto: (rows[0].cover_photo ?? undefined) as string | undefined,
    startDate: rows[0].start_date as string,
    endDate: rows[0].end_date as string,
    status: computeTripStatus(rows[0].start_date as string, rows[0].end_date as string),
    isPublic: Boolean(rows[0].is_public),
    shareToken: (rows[0].share_token ?? undefined) as string | undefined,
    stops: [] as Record<string, unknown>[],
  };

  const stopMap = new Map<number, Record<string, unknown>>();

  for (const row of rows) {
    if (!row.stop_id) continue;
    if (!stopMap.has(row.stop_id)) {
      stopMap.set(row.stop_id, {
        id: String(row.stop_id),
        order: row.stop_order as number,
        startDate: row.stop_start as string,
        endDate: row.stop_end as string,
        city: {
          id: String(row.city_id),
          name: row.city_name as string,
          country: row.country as string,
          region: row.region as string,
          costIndex: row.cost_index as number,
        },
        activities: [],
      });
    }

    if (row.activity_id) {
      const stop = stopMap.get(row.stop_id)!;
      (stop.activities as unknown[]).push({
        id: String(row.activity_id),
        stopId: String(row.stop_id),
        name: row.activity_name as string,
        category: row.category as string,
        cost: row.cost as number,
        durationMinutes: row.duration_minutes as number,
        timeSlot: (row.time_slot ?? undefined) as string | undefined,
      });
    }
  }

  trip.stops = Array.from(stopMap.values());
  return trip;
}

export async function getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;
    const userId = req.dbUser!.id;

    let sql = "SELECT * FROM trips WHERE user_id = ?";
    const params: (string | number)[] = [userId];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    const normalized = rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      name: r.name as string,
      description: (r.description ?? undefined) as string | undefined,
      coverPhoto: (r.cover_photo ?? undefined) as string | undefined,
      startDate: r.start_date as string,
      endDate: r.end_date as string,
      status: computeTripStatus(r.start_date as string, r.end_date as string),
      isPublic: Boolean(r.is_public),
      shareToken: (r.share_token ?? undefined) as string | undefined,
      stops: [],
    }));
    res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    next(err);
  }
}

export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, coverPhoto, startDate, endDate } = req.body as {
      name: string;
      description?: string;
      coverPhoto?: string;
      startDate: string;
      endDate: string;
    };

    if (!name || !startDate || !endDate) {
      res.status(400).json({ success: false, error: "Missing required fields: name, startDate, endDate" });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO trips (user_id, name, description, cover_photo, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)",
      [req.dbUser!.id, name, description ?? null, coverPhoto ?? null, startDate, endDate]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM trips WHERE id = ?", [result.insertId]);
    const r = rows[0];
    res.status(201).json({ success: true, data: { id: String(r.id), userId: String(r.user_id), name: r.name, description: r.description ?? undefined, coverPhoto: r.cover_photo ?? undefined, startDate: r.start_date, endDate: r.end_date, status: computeTripStatus(r.start_date, r.end_date), isPublic: Boolean(r.is_public), shareToken: r.share_token ?? undefined, stops: [] } });
  } catch (err) {
    next(err);
  }
}

export async function getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.id));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.*,
        s.id AS stop_id, s.stop_order, s.start_date AS stop_start, s.end_date AS stop_end,
        c.id AS city_id, c.name AS city_name, c.country, c.region, c.cost_index,
        a.id AS activity_id, a.name AS activity_name, a.category, a.cost, a.duration_minutes, a.time_slot
       FROM trips t
       LEFT JOIN stops s ON s.trip_id = t.id
       LEFT JOIN cities c ON c.id = s.city_id
       LEFT JOIN activities a ON a.stop_id = s.id
       WHERE t.id = ? AND t.user_id = ?
       ORDER BY s.stop_order, a.time_slot`,
      [tripId, req.dbUser!.id]
    );

    const trip = buildNestedTrip(rows);
    if (!trip) {
      res.status(404).json({ success: false, error: "Trip not found" });
      return;
    }

    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.id));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    const { name, description, coverPhoto, startDate, endDate, status } = req.body as {
      name?: string;
      description?: string;
      coverPhoto?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    const [ownership] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM trips WHERE id = ? AND user_id = ?",
      [tripId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Trip not found" });
      return;
    }

    await pool.execute(
      `UPDATE trips SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        cover_photo = COALESCE(?, cover_photo),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [name ?? null, description ?? null, coverPhoto ?? null, startDate ?? null, endDate ?? null, status ?? null, tripId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM trips WHERE id = ?", [tripId]);
    const r = rows[0];
    res.status(200).json({ success: true, data: { id: String(r.id), userId: String(r.user_id), name: r.name, description: r.description ?? undefined, coverPhoto: r.cover_photo ?? undefined, startDate: r.start_date, endDate: r.end_date, status: computeTripStatus(r.start_date, r.end_date), isPublic: Boolean(r.is_public), shareToken: r.share_token ?? undefined, stops: [] } });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.id));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM trips WHERE id = ? AND user_id = ?",
      [tripId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Trip not found" });
      return;
    }

    await pool.execute("DELETE FROM trips WHERE id = ?", [tripId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function createCuratedTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  const conn = await pool.getConnection();
  try {
    const cityId = parseInt(String(req.params.cityId));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city ID" });
      return;
    }

    const [cities] = await conn.execute<RowDataPacket[]>("SELECT * FROM cities WHERE id = ?", [cityId]);
    if (!cities.length) {
      res.status(404).json({ success: false, error: "City not found" });
      return;
    }
    const city = cities[0];

    const start = new Date();
    start.setDate(start.getDate() + 30);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);

    await conn.beginTransaction();

    const [tripRes] = await conn.execute<ResultSetHeader>(
      "INSERT INTO trips (user_id, name, start_date, end_date, is_public) VALUES (?, ?, ?, ?, ?)",
      [req.dbUser!.id, `Curated: ${city.name} Getaway`, start.toISOString().split("T")[0], end.toISOString().split("T")[0], false]
    );
    const tripId = tripRes.insertId;

    const [stopRes] = await conn.execute<ResultSetHeader>(
      "INSERT INTO stops (trip_id, city_id, start_date, end_date, stop_order) VALUES (?, ?, ?, ?, ?)",
      [tripId, cityId, start.toISOString().split("T")[0], end.toISOString().split("T")[0], 0]
    );
    const stopId = stopRes.insertId;

    const acts = [
      { name: `Explore Downtown ${city.name}`, category: "sightseeing", cost: 0, duration: 180 },
      { name: "Local Food & Culture Tour", category: "food", cost: 45, duration: 120 },
      { name: "Hidden Gems Guided Walk", category: "culture", cost: 25, duration: 150 }
    ];
    for (const act of acts) {
      await conn.execute(
        "INSERT INTO activities (stop_id, name, category, cost, duration_minutes) VALUES (?, ?, ?, ?, ?)",
        [stopId, act.name, act.category, act.cost, act.duration]
      );
    }

    const cl = [
      { name: "Passport & ID", category: "documents" },
      { name: "Camera / Power Bank", category: "electronics" },
      { name: "Comfortable Walking Shoes", category: "clothing" },
      { name: "Universal Adapter", category: "electronics" }
    ];
    for (const item of cl) {
      await conn.execute(
        "INSERT INTO checklist_items (trip_id, name, category) VALUES (?, ?, ?)",
        [tripId, item.name, item.category]
      );
    }

    await conn.execute(
      "INSERT INTO budget_items (trip_id, category, description, quantity, unit_cost) VALUES (?, ?, ?, ?, ?)",
      [tripId, "accommodation", "Central Hotel / Airbnb (5 Nights)", 5, 110]
    );
    await conn.execute(
      "INSERT INTO budget_items (trip_id, category, description, quantity, unit_cost) VALUES (?, ?, ?, ?, ?)",
      [tripId, "transport", "Roundtrip Flights", 1, 350]
    );

    await conn.execute(
      "INSERT INTO notes (trip_id, content) VALUES (?, ?)",
      [tripId, `Welcome to ${city.name}!\n\nThis curated trip comes fully loaded with a starter itinerary, an estimated budget outline, and an essential packing list to kickstart your journey. Happy travels!`]
    );

    await conn.commit();
    res.status(201).json({ success: true, data: { id: tripId } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

export async function publishTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.id));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      "SELECT id, is_public FROM trips WHERE id = ? AND user_id = ?",
      [tripId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Trip not found" });
      return;
    }

    const isPublic = !ownership[0].is_public;
    const shareToken = isPublic ? randomUUID() : null;

    await pool.execute(
      "UPDATE trips SET is_public = ?, share_token = ? WHERE id = ?",
      [isPublic, shareToken, tripId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM trips WHERE id = ?", [tripId]);
    const r = rows[0];
    res.status(200).json({ success: true, data: { id: String(r.id), userId: String(r.user_id), name: r.name, description: r.description ?? undefined, coverPhoto: r.cover_photo ?? undefined, startDate: r.start_date, endDate: r.end_date, status: computeTripStatus(r.start_date, r.end_date), isPublic: Boolean(r.is_public), shareToken: r.share_token ?? undefined, stops: [] } });
  } catch (err) {
    next(err);
  }
}

export async function getSharedTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.*,
        s.id AS stop_id, s.stop_order, s.start_date AS stop_start, s.end_date AS stop_end,
        c.id AS city_id, c.name AS city_name, c.country, c.region, c.cost_index,
        a.id AS activity_id, a.name AS activity_name, a.category, a.cost, a.duration_minutes, a.time_slot
       FROM trips t
       LEFT JOIN stops s ON s.trip_id = t.id
       LEFT JOIN cities c ON c.id = s.city_id
       LEFT JOIN activities a ON a.stop_id = s.id
       WHERE t.share_token = ? AND t.is_public = TRUE
       ORDER BY s.stop_order, a.time_slot`,
      [token]
    );

    const trip = buildNestedTrip(rows);
    if (!trip) {
      res.status(404).json({ success: false, error: "Shared trip not found" });
      return;
    }

    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function copySharedTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const userId = req.dbUser!.id;

    const [tripRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM trips WHERE share_token = ? AND is_public = TRUE",
      [token]
    );
    if (tripRows.length === 0) {
      res.status(404).json({ success: false, error: "Shared trip not found" });
      return;
    }

    const original = tripRows[0];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [newTripResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO trips (user_id, name, description, cover_photo, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, 'upcoming')",
        [userId, `${original.name} (Copy)`, original.description, original.cover_photo, original.start_date, original.end_date]
      );
      const newTripId = newTripResult.insertId;

      const [stops] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM stops WHERE trip_id = ? ORDER BY stop_order",
        [original.id]
      );

      for (const stop of stops) {
        const [newStopResult] = await connection.execute<ResultSetHeader>(
          "INSERT INTO stops (trip_id, city_id, stop_order, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
          [newTripId, stop.city_id, stop.stop_order, stop.start_date, stop.end_date]
        );
        const newStopId = newStopResult.insertId;

        const [activities] = await connection.execute<RowDataPacket[]>(
          "SELECT * FROM activities WHERE stop_id = ?",
          [stop.id]
        );

        for (const activity of activities) {
          await connection.execute(
            "INSERT INTO activities (stop_id, name, category, description, cost, duration_minutes, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [newStopId, activity.name, activity.category, activity.description, activity.cost, activity.duration_minutes, activity.time_slot]
          );
        }
      }

      await connection.execute(
        "INSERT INTO trip_copies (original_trip_id, copied_by_user_id, new_trip_id) VALUES (?, ?, ?)",
        [original.id, userId, newTripId]
      );

      await connection.commit();
      connection.release();

      const [newTrip] = await pool.execute<RowDataPacket[]>("SELECT * FROM trips WHERE id = ?", [newTripId]);
      const r = newTrip[0];
      res.status(201).json({ success: true, data: { id: String(r.id), userId: String(r.user_id), name: r.name, description: r.description ?? undefined, coverPhoto: r.cover_photo ?? undefined, startDate: r.start_date, endDate: r.end_date, status: computeTripStatus(r.start_date, r.end_date), isPublic: Boolean(r.is_public), shareToken: r.share_token ?? undefined, stops: [] } });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
