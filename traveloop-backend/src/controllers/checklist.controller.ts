import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function getChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.tripId));
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

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM checklist_items WHERE trip_id = ? ORDER BY category, created_at",
      [tripId]
    );

    const normalized = rows.map((r) => ({
      id: String(r.id),
      tripId: String(r.trip_id),
      name: String(r.name),
      category: String(r.category),
      isPacked: Boolean(r.is_packed),
    }));

    res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    next(err);
  }
}

export async function addChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tripId, name, category } = req.body as { tripId: number; name: string; category?: string };

    if (!tripId || !name) {
      res.status(400).json({ success: false, error: "Missing required fields: tripId, name" });
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

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO checklist_items (trip_id, name, category) VALUES (?, ?, ?)",
      [tripId, name, category ?? "other"]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM checklist_items WHERE id = ?", [result.insertId]);
    const r = rows[0];
    res.status(201).json({ 
      success: true, 
      data: {
        id: String(r.id),
        tripId: String(r.trip_id),
        name: String(r.name),
        category: String(r.category),
        isPacked: Boolean(r.is_packed),
      } 
    });
  } catch (err) {
    next(err);
  }
}

export async function updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(String(req.params.id));
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: "Invalid item id" });
      return;
    }

    const { name, isPacked } = req.body as { name?: string; isPacked?: boolean };

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT ci.id FROM checklist_items ci
       JOIN trips t ON t.id = ci.trip_id
       WHERE ci.id = ? AND t.user_id = ?`,
      [itemId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Checklist item not found" });
      return;
    }

    await pool.execute(
      "UPDATE checklist_items SET name = COALESCE(?, name), is_packed = COALESCE(?, is_packed) WHERE id = ?",
      [name ?? null, isPacked !== undefined ? isPacked : null, itemId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM checklist_items WHERE id = ?", [itemId]);
    const r = rows[0];
    res.status(200).json({ 
      success: true, 
      data: {
        id: String(r.id),
        tripId: String(r.trip_id),
        name: String(r.name),
        category: String(r.category),
        isPacked: Boolean(r.is_packed),
      } 
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(String(req.params.id));
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: "Invalid item id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT ci.id FROM checklist_items ci
       JOIN trips t ON t.id = ci.trip_id
       WHERE ci.id = ? AND t.user_id = ?`,
      [itemId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Checklist item not found" });
      return;
    }

    await pool.execute("DELETE FROM checklist_items WHERE id = ?", [itemId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function resetChecklist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.tripId));
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

    await pool.execute("UPDATE checklist_items SET is_packed = FALSE WHERE trip_id = ?", [tripId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
