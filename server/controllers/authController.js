import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import TeamInvitation from "../models/TeamInvitation.js";
import Notification from "../models/Notification.js";

// ========================================
// CREATE NOTIFICATION SAFELY
// ========================================

const createNotificationSafely = async (data) => {
  try {
    await Notification.create(data);
  } catch (error) {
    /*
      Notification failure should NOT
      stop registration or login.
    */

    console.error("Create Auth Notification Error:", error);
  }
};

// ========================================
// REGISTER USER
// POST /api/auth/register
// ========================================

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,

        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,

        message: "Password must be at least 6 characters",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail = email.trim().toLowerCase();

    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,

        message: "User already exists with this email",
      });
    }

    // ========================================
    // FIND PENDING INVITATION
    // ========================================

    const invitation = await TeamInvitation.findOne({
      email: normalizedEmail,
      status: "Pending",
    });

    // ========================================
    // DEFAULT ROLE
    // ========================================

    /*
      Normal user:
      Project Manager of own workspace.

      Invited user:
      Uses role selected by inviter.
    */

    let assignedRole = "Project Manager";

    if (invitation) {
      assignedRole = invitation.role;
    }

    // ========================================
    // FIND ACTUAL TEAM OWNER
    // ========================================

    let teamOwnerId = null;

    let inviter = null;

    if (invitation) {
      inviter = await User.findById(invitation.invitedBy);

      if (!inviter) {
        return res.status(400).json({
          success: false,

          message: "The team invitation is no longer valid",
        });
      }

      /*
        Important:

        If the inviter is the workspace owner:
        inviter.teamOwner = inviter._id

        If another Project Manager sends
        invitation:
        inviter.teamOwner still points to
        the real workspace owner.

        This prevents accidentally creating
        another workspace.
      */

      teamOwnerId = inviter.teamOwner || inviter._id;
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ========================================
    // CREATE USER
    // ========================================

    const user = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: assignedRole,

      /*
          Invited:
          joins existing workspace.

          Normal:
          temporarily null and gets
          own ID below.
        */

      teamOwner: invitation ? teamOwnerId : null,
    });

    // ========================================
    // NORMAL REGISTRATION
    // ========================================

    if (!invitation) {
      /*
        User becomes owner of
        their own workspace.
      */

      user.teamOwner = user._id;

      await user.save();
    }

    // ========================================
    // ACCEPT INVITATION
    // ========================================

    if (invitation) {
      invitation.status = "Accepted";

      await invitation.save();

      // ========================================
      // WELCOME NOTIFICATION FOR NEW MEMBER
      // ========================================

      await createNotificationSafely({
        recipient: user._id,

        sender: inviter._id,

        title: "Welcome to the Team",

        message: `You joined the WorkSync team as ${user.role}`,

        type: "invitation",

        relatedId: user._id,

        link: "/team",
      });

      // ========================================
      // GET EXISTING TEAM MEMBERS
      // ========================================

      const existingTeamMembers = await User.find({
        $or: [
          {
            teamOwner: teamOwnerId,
          },

          {
            _id: teamOwnerId,
          },
        ],

        /*
            Exclude the newly
            registered user.
          */

        _id: {
          $ne: user._id,
        },
      }).select("_id");

      // ========================================
      // NOTIFY EXISTING TEAM
      // ========================================

      for (const member of existingTeamMembers) {
        await createNotificationSafely({
          recipient: member._id,

          /*
            New member is the person
            who triggered this event.
          */

          sender: user._id,

          title: "New Team Member",

          message: `${user.name} joined the team as ${user.role}`,

          type: "team",

          relatedId: user._id,

          link: "/team",
        });
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message: invitation
        ? "Account created and invitation accepted"
        : "Account created successfully",

      user: {
        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        avatar: user.avatar,

        teamOwner: user.teamOwner,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// LOGIN USER
// POST /api/auth/login
// ========================================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,

        message: "Email and password are required",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail = email.trim().toLowerCase();

    // ========================================
    // FIND USER
    // ========================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,

        message: "Invalid email or password",
      });
    }

    // ========================================
    // CHECK PASSWORD
    // ========================================

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,

        message: "Invalid email or password",
      });
    }

    // ========================================
    // CHECK JWT SECRET
    // ========================================

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    // ========================================
    // CREATE JWT
    // ========================================

    const token = jwt.sign(
      {
        userId: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Login successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        avatar: user.avatar,

        teamOwner: user.teamOwner,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET CURRENT USER
// GET /api/auth/me
// ========================================

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      user: {
        id: req.user._id,

        name: req.user.name,

        email: req.user.email,

        role: req.user.role,

        avatar: req.user.avatar,

        teamOwner: req.user.teamOwner,
      },
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
