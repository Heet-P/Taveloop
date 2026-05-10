import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as stopsController from "../controllers/stops.controller";

const router = Router();

router.post("/", requireAuth, attachUser, stopsController.addStop);
router.put("/reorder", requireAuth, attachUser, stopsController.reorderStops);
router.put("/:id", requireAuth, attachUser, stopsController.updateStop);
router.delete("/:id", requireAuth, attachUser, stopsController.deleteStop);

export default router;
