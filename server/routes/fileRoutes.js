import express from "express";

import {
  deleteFile,
  downloadFile,
  getFiles,
  uploadFile,
} from "../controllers/fileController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ========================================
// GET FILES
// ========================================

router.get("/", protect, getFiles);

// ========================================
// UPLOAD FILE
// ========================================

router.post("/upload", protect, upload.single("file"), uploadFile);

// ========================================
// DOWNLOAD FILE
// ========================================

router.get("/:id/download", protect, downloadFile);

// ========================================
// DELETE FILE
// ========================================

router.delete("/:id", protect, deleteFile);

export default router;
