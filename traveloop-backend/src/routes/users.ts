import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as usersController from "../controllers/users.controller";

const router = Router();

router.post("/sync", requireAuth, usersController.syncUser);
router.get("/me", requireAuth, attachUser, usersController.getMe);
router.put("/me", requireAuth, attachUser, usersController.updateMe);
router.delete("/me", requireAuth, attachUser, usersController.deleteMe);
router.get("/me/saved-destinations", requireAuth, attachUser, usersController.getSavedDestinations);
router.post("/me/saved-destinations/:cityId", requireAuth, attachUser, usersController.saveDestination);
router.delete("/me/saved-destinations/:cityId", requireAuth, attachUser, usersController.unsaveDestination);

export default router;
