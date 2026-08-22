import express from "express";

import {
  getTeamMembers,
  inviteTeamMember,
  getPendingInvitations,
  cancelInvitation,
  updateMemberRole,
  removeTeamMember,
} from "../controllers/teamController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Everyone can view team members
router.get("/", protect, getTeamMembers);

// Pending invitations
router.get("/invitations", protect, getPendingInvitations);

// Only Project Manager can invite
router.post(
  "/invite",
  protect,
  authorizeRoles("Project Manager"),
  inviteTeamMember,
);

// Only Project Manager can cancel invite
router.delete(
  "/invitations/:id",
  protect,
  authorizeRoles("Project Manager"),
  cancelInvitation,
);

// Change member role
router.put(
  "/members/:id/role",
  protect,
  authorizeRoles("Project Manager"),
  updateMemberRole,
);

// Remove member
router.delete(
  "/members/:id",
  protect,
  authorizeRoles("Project Manager"),
  removeTeamMember,
);

export default router;
