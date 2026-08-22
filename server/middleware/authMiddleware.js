import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    //Get Authorization header
    const authHeader = req.headers.authorization;

    // Check whether token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find logged-in user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

// ========================================
// ROLE AUTHORIZATION
// ========================================

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // protect middleware should run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Check whether logged-in user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
