import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as checklistController from "../controllers/checklist.controller";

const router = Router();

router.get("/trip/:tripId", requireAuth, attachUser, checklistController.getChecklist);
router.post("/", requireAuth, attachUser, checklistController.addChecklistItem);
router.put("/:id", requireAuth, attachUser, checklistController.updateChecklistItem);
router.delete("/:id", requireAuth, attachUser, checklistController.deleteChecklistItem);
router.delete("/trip/:tripId/reset", requireAuth, attachUser, checklistController.resetChecklist);

export default router;
