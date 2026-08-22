import fs from "fs";
import path from "path";

import File from "../models/File.js";

// ========================================
// TEAM OWNER
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// GET ALL FILES
// GET /api/files
// ========================================

export const getFiles = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const files = await File.find({
      teamOwner: teamOwnerId,
    })
      .populate("uploadedBy", "name email role avatar")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("Get Files Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load files",
    });
  }
};

// ========================================
// UPLOAD FILE
// POST /api/files/upload
// ========================================

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file",
      });
    }

    const teamOwnerId = getTeamOwnerId(req.user);

    const file = await File.create({
      originalName: req.file.originalname,

      storedName: req.file.filename,

      mimeType: req.file.mimetype,

      size: req.file.size,

      path: req.file.path,

      uploadedBy: req.user._id,

      teamOwner: teamOwnerId,
    });

    await file.populate("uploadedBy", "name email role avatar");

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    console.error("Upload File Error:", error);

    /*
        If MongoDB save fails,
        remove the physical file.
      */

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
};

// ========================================
// DOWNLOAD FILE
// GET /api/files/:id/download
// ========================================

export const downloadFile = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const file = await File.findOne({
      _id: req.params.id,

      teamOwner: teamOwnerId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Stored file could not be found",
      });
    }

    res.download(filePath, file.originalName, (error) => {
      if (error && !res.headersSent) {
        console.error("Download File Error:", error);

        res.status(500).json({
          success: false,

          message: "Failed to download file",
        });
      }
    });
  } catch (error) {
    console.error("Download File Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to download file",
      });
    }
  }
};

// ========================================
// DELETE FILE
// DELETE /api/files/:id
// ========================================

export const deleteFile = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const file = await File.findOne({
      _id: req.params.id,

      teamOwner: teamOwnerId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // ========================================
    // PERMISSION
    // ========================================

    const isUploader = file.uploadedBy.toString() === req.user._id.toString();

    const isProjectManager = req.user.role === "Project Manager";

    if (!isUploader && !isProjectManager) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this file",
      });
    }

    // ========================================
    // DELETE PHYSICAL FILE
    // ========================================

    const filePath = path.resolve(file.path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // ========================================
    // DELETE MONGODB RECORD
    // ========================================

    await file.deleteOne();

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete File Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
};
