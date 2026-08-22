import express from "express";

import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Everyone in team can view projects
router.get("/", protect, getProjects);

// Only Project Manager can create project
router.post("/", protect, authorizeRoles("Project Manager"), createProject);

// Only Project Manager can edit project
router.put("/:id", protect, authorizeRoles("Project Manager"), updateProject);

// Only Project Manager can delete project
router.delete(
  "/:id",
  protect,
  authorizeRoles("Project Manager"),
  deleteProject,
);

export default router;
