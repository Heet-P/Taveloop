import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket } from "mysql2";

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [[{ total_users }]] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS total_users FROM users");
    const [[{ total_trips }]] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS total_trips FROM trips");
    const [[{ active_trips }]] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS active_trips FROM trips WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const [topCity] = await pool.execute<RowDataPacket[]>(
      `SELECT c.name, COUNT(s.id) AS stop_count
       FROM stops s JOIN cities c ON c.id = s.city_id
       GROUP BY c.id ORDER BY stop_count DESC LIMIT 1`
    );

    res.status(200).json({
      success: true,
      data: {
        totalUsers: total_users,
        totalTrips: total_trips,
        activeThisWeek: active_trips,
        topCity: topCity[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = "20", offset = "0", search = "" } = req.query as Record<string, string>;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(t.id) AS trip_count
       FROM users u
       LEFT JOIN trips t ON t.user_id = u.id
       WHERE u.name LIKE CONCAT('%', ?, '%') OR u.email LIKE CONCAT('%', ?, '%')
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [search, search, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getAdminTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = "20", offset = "0" } = req.query as Record<string, string>;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.id, t.name, t.status, t.created_at, u.name AS creator_name, u.email AS creator_email,
              COUNT(DISTINCT s.id) AS city_count
       FROM trips t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN stops s ON s.trip_id = t.id
       GROUP BY t.id, u.name, u.email
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getTripsPerDay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM trips
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getTopCities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.name, c.country, COUNT(s.id) AS stop_count
       FROM stops s JOIN cities c ON c.id = s.city_id
       GROUP BY c.id ORDER BY stop_count DESC LIMIT 10`
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getActivityCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT category, COUNT(*) AS count FROM activities GROUP BY category"
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}
