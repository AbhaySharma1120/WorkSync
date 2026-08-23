import { Readable } from "stream";

import File from "../models/File.js";

import cloudinary from "../config/cloudinary.js";

// ========================================
// CLOUDINARY UPLOAD HELPER
// ========================================

const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "worksync/files",

        resource_type: "auto",

        use_filename: true,

        unique_filename: true,

        filename_override: originalName,
      },

      (error, result) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

// ========================================
// GET TEAM OWNER
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// GET FILES
// ========================================

export const getFiles = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const files = await File.find({
      teamOwner: teamOwnerId,
    })
      .populate("uploadedBy", "name email role")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,

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
// ========================================

export const uploadFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file is empty",
      });
    }

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // UPLOAD TO CLOUDINARY
    // ========================================

    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,

      req.file.originalname,
    );

    // ========================================
    // SAVE DATABASE RECORD
    // ========================================

    const file = await File.create({
      name: req.file.originalname,

      originalName: req.file.originalname,

      mimeType: req.file.mimetype,

      size: req.file.size,

      url: cloudinaryResult.secure_url,

      publicId: cloudinaryResult.public_id,

      resourceType: cloudinaryResult.resource_type || "raw",

      uploadedBy: req.user._id,

      teamOwner: teamOwnerId,
    });

    const populatedFile = await File.findById(file._id).populate(
      "uploadedBy",
      "name email role",
    );

    res.status(201).json({
      success: true,

      message: "File uploaded successfully",

      file: populatedFile,
    });
  } catch (error) {
    console.error("Upload File Error:", error);

    res.status(500).json({
      success: false,

      message: error.message || "Failed to upload file",
    });
  }
};

// ========================================
// DOWNLOAD FILE
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

    // ========================================
    // DOWNLOAD FROM CLOUDINARY
    // ========================================

    const response = await fetch(file.url);

    if (!response.ok) {
      return res.status(502).json({
        success: false,

        message: "Unable to download file from storage",
      });
    }

    // ========================================
    // HEADERS
    // ========================================

    res.setHeader(
      "Content-Type",

      file.mimeType || "application/octet-stream",
    );

    res.setHeader(
      "Content-Disposition",

      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );

    // ========================================
    // STREAM CLOUDINARY FILE
    // ========================================

    if (!response.body) {
      return res.status(502).json({
        success: false,

        message: "File stream unavailable",
      });
    }

    const nodeStream = Readable.fromWeb(response.body);

    nodeStream.pipe(res);
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

    const uploaderId = file.uploadedBy?.toString();

    const currentUserId = req.user._id.toString();

    const isManager = req.user.role === "Project Manager";

    const isUploader = uploaderId === currentUserId;

    if (!isManager && !isUploader) {
      return res.status(403).json({
        success: false,

        message: "You are not allowed to delete this file",
      });
    }

    // ========================================
    // DELETE FROM CLOUDINARY
    // ========================================

    if (file.publicId) {
      await cloudinary.uploader.destroy(
        file.publicId,

        {
          resource_type: file.resourceType || "raw",

          invalidate: true,
        },
      );
    }

    // ========================================
    // DELETE DATABASE RECORD
    // ========================================

    await File.findByIdAndDelete(file._id);

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
