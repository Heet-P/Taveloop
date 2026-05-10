import { Request, Response, NextFunction, RequestHandler } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import pool from "../db/connection";
import { RowDataPacket } from "mysql2";
import { DbUser } from "../types";

export const requireAuth = ClerkExpressRequireAuth() as unknown as RequestHandler;

export async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clerkId = (req as Request & { auth?: { userId: string } }).auth?.userId;
    if (!clerkId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE clerk_id = ?",
      [clerkId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: "User not found — call /api/users/sync first" });
      return;
    }

    req.dbUser = rows[0] as DbUser;
    next();
  } catch (err) {
    next(err);
  }
}
