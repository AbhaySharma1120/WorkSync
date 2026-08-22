import express from "express";

import {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
} from "../controllers/fileController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ========================================
// GET FILES
// ========================================

router.get("/", protect, getFiles);

// ========================================
// UPLOAD
// ========================================

router.post(
  "/upload",
  protect,

  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,

          message: error.message || "File upload failed",
        });
      }

      next();
    });
  },

  uploadFile,
);

// ========================================
// DOWNLOAD
// ========================================

router.get("/:id/download", protect, downloadFile);

// ========================================
// DELETE
// ========================================

router.delete("/:id", protect, deleteFile);

export default router;
