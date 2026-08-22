import multer from "multer";
import path from "path";
import fs from "fs";

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ========================================
// STORAGE
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
  },
});

// ========================================
// ALLOWED FILE TYPES
// ========================================

const allowedMimeTypes = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",

  "image/jpeg",

  "image/png",

  "image/webp",

  "application/zip",

  "application/x-zip-compressed",
];

// ========================================
// FILE FILTER
// ========================================

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("This file type is not supported"), false);
  }
};

// ========================================
// MULTER
// ========================================

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter,
});

export default upload;
