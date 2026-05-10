import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth";
import * as notesController from "../controllers/notes.controller";

const router = Router();

router.get("/trip/:tripId", requireAuth, attachUser, notesController.getNotes);
router.post("/", requireAuth, attachUser, notesController.createNote);
router.put("/:id", requireAuth, attachUser, notesController.updateNote);
router.delete("/:id", requireAuth, attachUser, notesController.deleteNote);

export default router;
