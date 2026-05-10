import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import { adminOnly } from "../middleware/adminOnly";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, attachUser, adminOnly);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.get("/trips", adminController.getAdminTrips);
router.get("/charts/trips-per-day", adminController.getTripsPerDay);
router.get("/charts/top-cities", adminController.getTopCities);
router.get("/charts/activity-categories", adminController.getActivityCategories);

export default router;
