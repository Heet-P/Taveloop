import { Request, Response, NextFunction } from "express";
import pool from "../db/connection";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function getBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const [items] = await pool.execute<RowDataPacket[]>(
      "SELECT id, category, description, quantity, unit_cost as unitCost, total, created_at as createdAt FROM budget_items WHERE trip_id = ? ORDER BY category, created_at",
      [tripId]
    );

    const [activities] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id, 'activities' AS category, a.name AS description, 1 AS quantity, a.cost AS unitCost, a.cost AS total, a.created_at AS createdAt
       FROM activities a
       JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ? AND a.cost > 0`,
      [tripId]
    );

    const allItems = [...items, ...activities];

    const summaryMap: Record<string, { category_total: number; item_count: number }> = {};
    let grandTotal = 0;

    for (const item of allItems) {
      const cat = item.category;
      const t = Number(item.total) || 0;
      grandTotal += t;
      if (!summaryMap[cat]) summaryMap[cat] = { category_total: 0, item_count: 0 };
      summaryMap[cat].category_total += t;
      summaryMap[cat].item_count += 1;
    }

    const summary = Object.entries(summaryMap).map(([category, stats]) => ({
      category,
      category_total: stats.category_total,
      item_count: stats.item_count
    }));

    const [dailyCosts] = await pool.execute<RowDataPacket[]>(
      `SELECT s.start_date AS day, SUM(a.cost) AS daily_activity_cost
       FROM activities a
       JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?
       GROUP BY s.start_date
       ORDER BY s.start_date`,
      [tripId]
    );

    res.status(200).json({
      success: true,
      data: {
        items: allItems,
        summary,
        grandTotal,
        dailyCosts,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function addBudgetItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tripId, category, description, quantity, unitCost } = req.body as {
      tripId: number;
      category: string;
      description: string;
      quantity: number;
      unitCost: number;
    };

    if (!tripId || !category || !description || !quantity || unitCost === undefined) {
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

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO budget_items (trip_id, category, description, quantity, unit_cost) VALUES (?, ?, ?, ?, ?)",
      [tripId, category, description, quantity, unitCost]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM budget_items WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateBudgetItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(String(req.params.id));
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: "Invalid item id" });
      return;
    }

    const { category, description, quantity, unitCost } = req.body as {
      category?: string;
      description?: string;
      quantity?: number;
      unitCost?: number;
    };

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT bi.id FROM budget_items bi
       JOIN trips t ON t.id = bi.trip_id
       WHERE bi.id = ? AND t.user_id = ?`,
      [itemId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Budget item not found" });
      return;
    }

    await pool.execute(
      `UPDATE budget_items SET
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        quantity = COALESCE(?, quantity),
        unit_cost = COALESCE(?, unit_cost)
       WHERE id = ?`,
      [category ?? null, description ?? null, quantity ?? null, unitCost ?? null, itemId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM budget_items WHERE id = ?", [itemId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteBudgetItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(String(req.params.id));
    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: "Invalid item id" });
      return;
    }

    const [ownership] = await pool.execute<RowDataPacket[]>(
      `SELECT bi.id FROM budget_items bi
       JOIN trips t ON t.id = bi.trip_id
       WHERE bi.id = ? AND t.user_id = ?`,
      [itemId, req.dbUser!.id]
    );
    if (ownership.length === 0) {
      res.status(404).json({ success: false, error: "Budget item not found" });
      return;
    }

    await pool.execute("DELETE FROM budget_items WHERE id = ?", [itemId]);
    res.status(200).json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
