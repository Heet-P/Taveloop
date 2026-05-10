import { Request, Response, NextFunction } from "express";

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const user = req.dbUser;
  if (!user || user.role !== "admin") {
    res.status(403).json({ success: false, error: "Forbidden — admin only" });
    return;
  }
  next();
}
