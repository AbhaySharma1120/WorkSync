import express from "express";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/calendarController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========================================
// GET ALL EVENTS
// POST NEW EVENT
// ========================================

router.route("/").get(protect, getEvents).post(protect, createEvent);

// ========================================
// UPDATE / DELETE EVENT
// ========================================

router.route("/:id").put(protect, updateEvent).delete(protect, deleteEvent);

export default router;
