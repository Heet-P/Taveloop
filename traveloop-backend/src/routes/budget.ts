import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as budgetController from "../controllers/budget.controller";

const router = Router();

router.get("/trip/:tripId", requireAuth, attachUser, budgetController.getBudget);
router.post("/", requireAuth, attachUser, budgetController.addBudgetItem);
router.put("/:id", requireAuth, attachUser, budgetController.updateBudgetItem);
router.delete("/:id", requireAuth, attachUser, budgetController.deleteBudgetItem);

export default router;
