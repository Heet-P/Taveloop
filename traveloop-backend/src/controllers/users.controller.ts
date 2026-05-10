import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function syncUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clerkId, name, email, avatarUrl } = req.body as {
      clerkId: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };

    if (!clerkId || !name || !email) {
      res.status(400).json({ success: false, error: "Missing required fields: clerkId, name, email" });
      return;
    }

    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (clerk_id, name, email, avatar_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), avatar_url = VALUES(avatar_url), updated_at = CURRENT_TIMESTAMP`,
      [clerkId, name, email, avatarUrl ?? null]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE clerk_id = ?",
      [clerkId]
    );

    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ success: true, data: req.dbUser });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, bio, language } = req.body as { name?: string; bio?: string; language?: string };
    const userId = req.dbUser!.id;

    await pool.execute(
      "UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), language = COALESCE(?, language) WHERE id = ?",
      [name ?? null, bio ?? null, language ?? null, userId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [userId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pool.execute("DELETE FROM users WHERE id = ?", [req.dbUser!.id]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function getSavedDestinations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.* FROM saved_destinations sd
       JOIN cities c ON c.id = sd.city_id
       WHERE sd.user_id = ?
       ORDER BY sd.created_at DESC`,
      [req.dbUser!.id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function saveDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.cityId));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid cityId" });
      return;
    }

    await pool.execute(
      "INSERT IGNORE INTO saved_destinations (user_id, city_id) VALUES (?, ?)",
      [req.dbUser!.id, cityId]
    );
    res.status(201).json({ success: true, data: { userId: req.dbUser!.id, cityId } });
  } catch (err) {
    next(err);
  }
}

export async function unsaveDestination(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.cityId));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid cityId" });
      return;
    }

    await pool.execute(
      "DELETE FROM saved_destinations WHERE user_id = ? AND city_id = ?",
      [req.dbUser!.id, cityId]
    );
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
