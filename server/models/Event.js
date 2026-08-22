import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // Main event date/time
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    allDay: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,

      enum: ["Meeting", "Deadline", "Reminder", "Event"],

      default: "Event",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Keeps calendar events isolated by team/workspace
    teamOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Helpful for calendar date queries
eventSchema.index({
  teamOwner: 1,
  startDate: 1,
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
