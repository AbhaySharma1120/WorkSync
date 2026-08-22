import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User who should receive this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User who caused the notification
    // Example: Project Manager assigned a task
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    /*
      Possible notification categories:

      task
      project
      team
      invitation
      system
    */
    type: {
      type: String,
      enum: ["task", "project", "team", "invitation", "system"],
      default: "system",
    },

    // Optional related object ID
    // Can be Task ID, Project ID, etc.
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Used by frontend for navigation
    // Example:
    // "/tasks"
    // "/projects"
    // "/team"
    link: {
      type: String,
      default: "",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
