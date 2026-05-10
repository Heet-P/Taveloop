import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function getCommunityFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sort = "latest", search, limit = "20", offset = "0" } = req.query as Record<string, string>;

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    const nameCondition = search ? "AND t.name LIKE CONCAT('%', ?, '%')" : "";
    const queryParams: (string | number)[] = [];
    if (search) queryParams.push(search);
    queryParams.push(sort, sort);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.id, t.name, t.description, t.start_date, t.end_date, t.cover_photo,
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
         ${nameCondition}
       GROUP BY t.id, u.name, u.avatar_url
       ORDER BY
         CASE WHEN ? = 'liked' THEN COUNT(DISTINCT cl.id)
              WHEN ? = 'copied' THEN COUNT(DISTINCT tc.id)
              ELSE UNIX_TIMESTAMP(t.created_at)
         END DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      queryParams
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

export async function copyPublicTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tripId = parseInt(String(req.params.tripId));
    if (isNaN(tripId)) {
      res.status(400).json({ success: false, error: "Invalid trip id" });
      return;
    }

    const [tripRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM trips WHERE id = ? AND is_public = TRUE",
      [tripId]
    );
    if (tripRows.length === 0) {
      res.status(404).json({ success: false, error: "Public trip not found" });
      return;
    }

    const original = tripRows[0];
    const userId = req.dbUser!.id;

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
      res.status(201).json({ success: true, data: { id: String(r.id), userId: String(r.user_id), name: r.name, description: r.description ?? undefined, coverPhoto: r.cover_photo ?? undefined, startDate: r.start_date, endDate: r.end_date, status: r.status, isPublic: Boolean(r.is_public), shareToken: r.share_token ?? undefined, stops: [] } });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
