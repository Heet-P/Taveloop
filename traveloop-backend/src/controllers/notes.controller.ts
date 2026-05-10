import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const { stopId } = req.query as { stopId?: string };
    let sql = "SELECT * FROM notes WHERE trip_id = ?";
    const params: (number | null)[] = [tripId];

    if (stopId) {
      sql += " AND stop_id = ?";
      params.push(parseInt(stopId));
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tripId, stopId, content } = req.body as { tripId: number; stopId?: number; content: string };

    if (!tripId || !content) {
      res.status(400).json({ success: false, error: "Missing required fields: tripId, content" });
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
      "INSERT INTO notes (trip_id, stop_id, content) VALUES (?, ?, ?)",
      [tripId, stopId ?? null, content]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM notes WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const noteId = parseInt(String(req.params.id));
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, error: "Invalid note id" });
      return;
    }

    const { content } = req.body as { content: string };
    if (!content) {
      res.status(400).json({ success: false, error: "Missing content" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT n.id FROM notes n
       JOIN trips t ON t.id = n.trip_id
       WHERE n.id = ? AND t.user_id = ?`,
      [noteId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Note not found" });
      return;
    }

    await pool.execute("UPDATE notes SET content = ? WHERE id = ?", [content, noteId]);
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM notes WHERE id = ?", [noteId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const noteId = parseInt(String(req.params.id));
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, error: "Invalid note id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT n.id FROM notes n
       JOIN trips t ON t.id = n.trip_id
       WHERE n.id = ? AND t.user_id = ?`,
      [noteId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Note not found" });
      return;
    }

    await pool.execute("DELETE FROM notes WHERE id = ?", [noteId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
