import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function addStop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tripId, cityId, startDate, endDate } = req.body as {
      tripId: number;
      cityId: number;
      startDate: string;
      endDate: string;
    };

    if (!tripId || !cityId || !startDate || !endDate) {
      res.status(400).json({ success: false, error: "Missing required fields" });
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

    const [maxOrder] = await pool.execute<RowDataPacket[]>(
      "SELECT COALESCE(MAX(stop_order), -1) AS max_order FROM stops WHERE trip_id = ?",
      [tripId]
    );
    const nextOrder = (maxOrder[0].max_order as number) + 1;

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO stops (trip_id, city_id, stop_order, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
      [tripId, cityId, nextOrder, startDate, endDate]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*, c.name AS city_name, c.country, c.region, c.cost_index
       FROM stops s JOIN cities c ON c.id = s.city_id
       WHERE s.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateStop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stopId = parseInt(String(req.params.id));
    if (isNaN(stopId)) {
      res.status(400).json({ success: false, error: "Invalid stop id" });
      return;
    }

    const { startDate, endDate } = req.body as { startDate?: string; endDate?: string };

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

    await pool.execute(
      "UPDATE stops SET start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date) WHERE id = ?",
      [startDate ?? null, endDate ?? null, stopId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM stops WHERE id = ?", [stopId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteStop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stopId = parseInt(String(req.params.id));
    if (isNaN(stopId)) {
      res.status(400).json({ success: false, error: "Invalid stop id" });
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

    await pool.execute("DELETE FROM stops WHERE id = ?", [stopId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function reorderStops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tripId, order } = req.body as {
      tripId: number;
      order: { stopId: number; newOrder: number }[];
    };

    if (!tripId || !Array.isArray(order)) {
      res.status(400).json({ success: false, error: "Missing tripId or order array" });
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

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { stopId, newOrder } of order) {
        await connection.execute(
          "UPDATE stops SET stop_order = ? WHERE id = ? AND trip_id = ?",
          [newOrder, stopId, tripId]
        );
      }
      await connection.commit();
      connection.release();
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
