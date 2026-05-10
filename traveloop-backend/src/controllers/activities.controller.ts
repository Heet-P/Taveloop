import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function addActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stopId, name, category, description, cost, durationMinutes, timeSlot } = req.body as {
      stopId: number;
      name: string;
      category: string;
      description?: string;
      cost?: number;
      durationMinutes?: number;
      timeSlot?: string;
    };

    if (!stopId || !name || !category) {
      res.status(400).json({ success: false, error: "Missing required fields: stopId, name, category" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT s.id FROM stops s
       JOIN trips t ON t.id = s.trip_id
       WHERE s.id = ? AND t.user_id = ?`,
      [stopId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Stop not found" });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO activities (stop_id, name, category, description, cost, duration_minutes, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [stopId, name, category, description ?? null, cost ?? 0, durationMinutes ?? null, timeSlot ?? null]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM activities WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activityId = parseInt(String(req.params.id));
    if (isNaN(activityId)) {
      res.status(400).json({ success: false, error: "Invalid activity id" });
      return;
    }

    const { name, category, description, cost, durationMinutes, timeSlot } = req.body as {
      name?: string;
      category?: string;
      description?: string;
      cost?: number;
      durationMinutes?: number;
      timeSlot?: string;
    };

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id FROM activities a
       JOIN stops s ON s.id = a.stop_id
       JOIN trips t ON t.id = s.trip_id
       WHERE a.id = ? AND t.user_id = ?`,
      [activityId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Activity not found" });
      return;
    }

    await pool.execute(
      `UPDATE activities SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        cost = COALESCE(?, cost),
        duration_minutes = COALESCE(?, duration_minutes),
        time_slot = COALESCE(?, time_slot)
       WHERE id = ?`,
      [name ?? null, category ?? null, description ?? null, cost ?? null, durationMinutes ?? null, timeSlot ?? null, activityId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM activities WHERE id = ?", [activityId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activityId = parseInt(String(req.params.id));
    if (isNaN(activityId)) {
      res.status(400).json({ success: false, error: "Invalid activity id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id FROM activities a
       JOIN stops s ON s.id = a.stop_id
       JOIN trips t ON t.id = s.trip_id
       WHERE a.id = ? AND t.user_id = ?`,
      [activityId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Activity not found" });
      return;
    }

    await pool.execute("DELETE FROM activities WHERE id = ?", [activityId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
