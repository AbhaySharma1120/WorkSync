import express from "express";

import { getDashboardData } from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All logged-in team members
// can see dashboard
router.get("/", protect, getDashboardData);

export default router;
