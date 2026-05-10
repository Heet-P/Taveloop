import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import userRoutes from "./routes/users";
import tripRoutes from "./routes/trips";
import stopRoutes from "./routes/stops";
import activityRoutes from "./routes/activities";
import cityRoutes from "./routes/cities";
import budgetRoutes from "./routes/budget";
import checklistRoutes from "./routes/checklist";
import noteRoutes from "./routes/notes";
import communityRoutes from "./routes/community";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.use(
  (
    err: Error & { status?: number; statusCode?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status ?? err.statusCode;
    if (status === 401 || err.message?.toLowerCase().includes("unauthenticated")) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    console.error(err.stack);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Traveloop backend running on port ${PORT}`));

export default app;
