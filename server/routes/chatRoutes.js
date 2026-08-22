import express from "express";

import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} from "../controllers/chatController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get team member conversation list
router.get("/conversations", protect, getConversations);

// Get messages with one member
router.get("/messages/:userId", protect, getMessages);

// Send message to member
router.post("/messages/:userId", protect, sendMessage);

// Mark conversation as read
router.put("/messages/:userId/read", protect, markConversationRead);

export default router;
