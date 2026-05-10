import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as tripsController from "../controllers/trips.controller";

const router = Router();

router.get("/shared/:token", tripsController.getSharedTrip);
router.post("/shared/:token/copy", requireAuth, attachUser, tripsController.copySharedTrip);

router.get("/", requireAuth, attachUser, tripsController.getTrips);
router.post("/", requireAuth, attachUser, tripsController.createTrip);
router.get("/:id", requireAuth, attachUser, tripsController.getTripById);
router.put("/:id", requireAuth, attachUser, tripsController.updateTrip);
router.delete("/:id", requireAuth, attachUser, tripsController.deleteTrip);
router.post("/:id/publish", requireAuth, attachUser, tripsController.publishTrip);
router.post("/curated/:cityId", requireAuth, attachUser, tripsController.createCuratedTrip);

export default router;
