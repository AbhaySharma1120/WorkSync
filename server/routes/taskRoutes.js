import express from "express";

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Everyone can view tasks
router.get("/", protect, getTasks);

// Team members can create tasks
router.post("/", protect, createTask);

// Team members can edit task/status
router.put("/:id", protect, updateTask);

// Only Project Manager can delete task
router.delete("/:id", protect, authorizeRoles("Project Manager"), deleteTask);

export default router;
