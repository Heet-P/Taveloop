import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function getCommunityFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sort = "latest", search, limit = "20", offset = "0" } = req.query as Record<string, string>;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.id, t.name, t.start_date, t.end_date, t.cover_photo,
        u.name AS author_name, u.avatar_url,
        COUNT(DISTINCT cl.id) AS like_count,
        COUNT(DISTINCT tc.id) AS copy_count,
        GROUP_CONCAT(DISTINCT c.name ORDER BY s.stop_order SEPARATOR ', ') AS cities
       FROM trips t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN community_likes cl ON cl.trip_id = t.id
       LEFT JOIN trip_copies tc ON tc.original_trip_id = t.id
       LEFT JOIN stops s ON s.trip_id = t.id
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE t.is_public = TRUE
         AND (t.name LIKE CONCAT('%', ?, '%') OR ? IS NULL)
       GROUP BY t.id, u.name, u.avatar_url
       ORDER BY
         CASE WHEN ? = 'liked' THEN COUNT(DISTINCT cl.id)
              WHEN ? = 'copied' THEN COUNT(DISTINCT tc.id)
              ELSE UNIX_TIMESTAMP(t.created_at)
         END DESC
       LIMIT ? OFFSET ?`,
      [
        search ?? "", search ?? null,
        sort, sort,
        parseInt(limit), parseInt(offset),
      ]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function likeTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.tripId));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    await pool.execute<ResultSetHeader>(
      "INSERT IGNORE INTO community_likes (trip_id, user_id) VALUES (?, ?)",
      [tripId, req.dbUser!.id]
    );

    res.status(201).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

export async function unlikeTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.tripId));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    await pool.execute(
      "DELETE FROM community_likes WHERE trip_id = ? AND user_id = ?",
      [tripId, req.dbUser!.id]
    );

    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
