import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ========================================
// PROTECT ROUTES
// ========================================

export const protect = async (req, res, next) => {
  try {
    // ========================================
    // GET AUTHORIZATION HEADER
    // ========================================

    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // ========================================
    // GET TOKEN
    // ========================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // ========================================
    // CHECK JWT SECRET
    // ========================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    // ========================================
    // VERIFY TOKEN
    // ========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ========================================
    // FIND USER
    // ========================================

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================
    // SAVE USER IN REQUEST
    // ========================================

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// ========================================
// ROLE AUTHORIZATION
// ========================================

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
};