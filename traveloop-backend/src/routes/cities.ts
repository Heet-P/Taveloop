import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as citiesController from "../controllers/cities.controller";

const router = Router();

router.get("/", requireAuth, citiesController.searchCities);
router.get("/:id", requireAuth, citiesController.getCityById);
router.get("/:id/activities", requireAuth, citiesController.getCityActivities);

export default router;
