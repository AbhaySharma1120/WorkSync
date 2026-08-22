import express from "express";

import {
  getSettings,
  updateSettings,
  changePassword,
} from "../controllers/settingsController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========================================
// SETTINGS
// ========================================

router.route("/").get(protect, getSettings).put(protect, updateSettings);

// ========================================
// CHANGE PASSWORD
// ========================================

router.put("/password", protect, changePassword);

export default router;
