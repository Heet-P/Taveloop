import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as activitiesController from "../controllers/activities.controller";

const router = Router();

router.post("/", requireAuth, attachUser, activitiesController.addActivity);
router.put("/:id", requireAuth, attachUser, activitiesController.updateActivity);
router.delete("/:id", requireAuth, attachUser, activitiesController.deleteActivity);

export default router;
