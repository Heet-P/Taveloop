import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket } from "mysql2";

export async function searchCities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search = "", region, costIndex, limit = "20", offset = "0" } = req.query as Record<string, string>;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM cities
       WHERE name LIKE CONCAT('%', ?, '%')
         AND (region = ? OR ? IS NULL)
         AND (cost_index = ? OR ? IS NULL)
       ORDER BY popularity_score DESC
       LIMIT ? OFFSET ?`,
      [
        search,
        region ?? null, region ?? null,
        costIndex ? parseInt(costIndex) : null, costIndex ?? null,
        parseInt(limit),
        parseInt(offset),
      ]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getCityById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.id));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city id" });
      return;
    }

    const [cities] = await pool.execute<RowDataPacket[]>("SELECT * FROM cities WHERE id = ?", [cityId]);
    if (cities.length === 0) {
      res.status(404).json({ success: false, error: "City not found" });
      return;
    }

    const [catalog] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM activity_catalog WHERE city_id = ?",
      [cityId]
    );

    res.status(200).json({ success: true, data: { city: cities[0], activityCatalog: catalog } });
  } catch (err) {
    next(err);
  }
}

export async function getCityActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cityId = parseInt(String(req.params.id));
    if (isNaN(cityId)) {
      res.status(400).json({ success: false, error: "Invalid city id" });
      return;
    }

    const { category, minCost, maxCost } = req.query as Record<string, string>;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activity_catalog
       WHERE city_id = ?
         AND (category = ? OR ? IS NULL)
         AND (avg_cost >= ? OR ? IS NULL)
         AND (avg_cost <= ? OR ? IS NULL)`,
      [
        cityId,
        category ?? null, category ?? null,
        minCost ? parseFloat(minCost) : null, minCost ?? null,
        maxCost ? parseFloat(maxCost) : null, maxCost ?? null,
      ]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}
