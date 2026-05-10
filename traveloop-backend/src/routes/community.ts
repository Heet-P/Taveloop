import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as communityController from "../controllers/community.controller";

const router = Router();

router.get("/", requireAuth, communityController.getCommunityFeed);
router.post("/like/:tripId", requireAuth, attachUser, communityController.likeTrip);
router.delete("/like/:tripId", requireAuth, attachUser, communityController.unlikeTrip);
router.post("/copy/:tripId", requireAuth, attachUser, communityController.copyPublicTrip);

export default router;
