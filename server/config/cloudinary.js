import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// ========================================
// LOAD ENVIRONMENT VARIABLES
// ========================================

dotenv.config();

// ========================================
// CLOUDINARY CONFIGURATION
// ========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ========================================
// CHECK CONFIG
// ========================================

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("Cloudinary environment variables are missing");
}

export default cloudinary;
