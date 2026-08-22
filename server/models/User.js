import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: [
        "Project Manager",
        "Frontend Developer",
        "Backend Developer",
        "UI/UX Designer",
        "QA Engineer",
      ],
      default: "Project Manager",
    },

    avatar: {
      type: String,
      default: "",
    },

    // Which WorkSync team this user belongs to
    teamOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ========================================
    // NOTIFICATION SETTINGS
    // ========================================

    notificationSettings: {
      taskAssigned: {
        type: Boolean,
        default: true,
      },

      projectUpdates: {
        type: Boolean,
        default: true,
      },

      deadlineReminder: {
        type: Boolean,
        default: true,
      },

      chatMessages: {
        type: Boolean,
        default: true,
      },

      emailNotifications: {
        type: Boolean,
        default: false,
      },
    },

    // ========================================
    // WORKSPACE PREFERENCES
    // ========================================

    workspacePreferences: {
      defaultTaskView: {
        type: String,
        enum: ["List", "Kanban"],
        default: "List",
      },

      weekStartsOn: {
        type: String,
        enum: ["Monday", "Sunday"],
        default: "Monday",
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
