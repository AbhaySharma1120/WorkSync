import mongoose from "mongoose";

const teamInvitationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
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
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const TeamInvitation = mongoose.model("TeamInvitation", teamInvitationSchema);

export default TeamInvitation;
