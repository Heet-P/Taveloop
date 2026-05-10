import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";

function buildNestedTrip(rows: RowDataPacket[]) {
  if (rows.length === 0) return null;
  const trip = {
    id: rows[0].id,
    user_id: rows[0].user_id,
    name: rows[0].name,
    description: rows[0].description,
    cover_photo: rows[0].cover_photo,
    start_date: rows[0].start_date,
    end_date: rows[0].end_date,
    status: rows[0].status,
    is_public: rows[0].is_public,
    share_token: rows[0].share_token,
    stops: [] as Record<string, unknown>[],
  };

  const stopMap = new Map<number, Record<string, unknown>>();

  for (const row of rows) {
    if (!row.stop_id) continue;
    if (!stopMap.has(row.stop_id)) {
      stopMap.set(row.stop_id, {
        id: row.stop_id,
        stop_order: row.stop_order,
        start_date: row.stop_start,
        end_date: row.stop_end,
        city: {
          id: row.city_id,
          name: row.city_name,
          country: row.country,
          region: row.region,
          cost_index: row.cost_index,
        },
        activities: [],
      });
    }

    if (row.activity_id) {
      const stop = stopMap.get(row.stop_id)!;
      (stop.activities as unknown[]).push({
        id: row.activity_id,
        name: row.activity_name,
        category: row.category,
        cost: row.cost,
        duration_minutes: row.duration_minutes,
        time_slot: row.time_slot,
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

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    res.status(200).json({ success: true, data: rows });
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
    res.status(201).json({ success: true, data: rows[0] });
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
    res.status(200).json({ success: true, data: rows[0] });
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
    res.status(200).json({ success: true, data: rows[0] });
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
      res.status(201).json({ success: true, data: newTrip[0] });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
