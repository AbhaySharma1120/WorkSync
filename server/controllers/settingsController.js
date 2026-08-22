import bcrypt from "bcryptjs";

import User from "../models/User.js";

// ========================================
// DEFAULT SETTINGS
// ========================================

const defaultNotifications = {
  taskAssigned: true,
  projectUpdates: true,
  deadlineReminder: true,
  chatMessages: true,
  emailNotifications: false,
};

const defaultPreferences = {
  defaultTaskView: "List",
  weekStartsOn: "Monday",
};

// ========================================
// GET SETTINGS
// GET /api/settings
// ========================================

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,

      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
      },

      notifications: {
        ...defaultNotifications,
        ...(user.notificationSettings?.toObject
          ? user.notificationSettings.toObject()
          : user.notificationSettings || {}),
      },

      preferences: {
        ...defaultPreferences,
        ...(user.workspacePreferences?.toObject
          ? user.workspacePreferences.toObject()
          : user.workspacePreferences || {}),
      },
    });
  } catch (error) {
    console.error("Get Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};

// ========================================
// UPDATE SETTINGS
// PUT /api/settings
// ========================================

export const updateSettings = async (req, res) => {
  try {
    const { name, email, notifications, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================
    // NAME
    // ========================================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // ========================================
    // EMAIL
    // ========================================

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,

        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "This email is already in use",
        });
      }

      user.email = normalizedEmail;
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================

    if (notifications) {
      user.notificationSettings = {
        taskAssigned:
          notifications.taskAssigned ??
          user.notificationSettings?.taskAssigned ??
          true,

        projectUpdates:
          notifications.projectUpdates ??
          user.notificationSettings?.projectUpdates ??
          true,

        deadlineReminder:
          notifications.deadlineReminder ??
          user.notificationSettings?.deadlineReminder ??
          true,

        chatMessages:
          notifications.chatMessages ??
          user.notificationSettings?.chatMessages ??
          true,

        emailNotifications:
          notifications.emailNotifications ??
          user.notificationSettings?.emailNotifications ??
          false,
      };
    }

    // ========================================
    // WORKSPACE PREFERENCES
    // ========================================

    if (preferences) {
      if (
        preferences.defaultTaskView &&
        !["List", "Kanban"].includes(preferences.defaultTaskView)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid default task view",
        });
      }

      if (
        preferences.weekStartsOn &&
        !["Monday", "Sunday"].includes(preferences.weekStartsOn)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid week start preference",
        });
      }

      user.workspacePreferences = {
        defaultTaskView:
          preferences.defaultTaskView ??
          user.workspacePreferences?.defaultTaskView ??
          "List",

        weekStartsOn:
          preferences.weekStartsOn ??
          user.workspacePreferences?.weekStartsOn ??
          "Monday",
      };
    }

    await user.save();

    res.status(200).json({
      success: true,

      message: "Settings updated successfully",

      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
      },

      notifications: user.notificationSettings,

      preferences: user.workspacePreferences,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

// ========================================
// CHANGE PASSWORD
// PUT /api/settings/password
// ========================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all password fields",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // ========================================
    // GET USER
    // ========================================

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================
    // VERIFY CURRENT PASSWORD
    // ========================================

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ========================================
    // HASH NEW PASSWORD
    // ========================================

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
