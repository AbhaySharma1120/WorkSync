import Event from "../models/Event.js";

// ========================================
// GET TEAM OWNER ID
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// GET ALL CALENDAR EVENTS
// GET /api/calendar
// ========================================

export const getEvents = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const events = await Event.find({
      teamOwner: teamOwnerId,
    })
      .populate("createdBy", "name email role avatar")
      .sort({
        startDate: 1,
      });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Get Calendar Events Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load calendar events",
    });
  }
};

// ========================================
// CREATE EVENT
// POST /api/calendar
// ========================================

export const createEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, allDay, type, location } =
      req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event title is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Event start date is required",
      });
    }

    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    let parsedEndDate = null;

    if (endDate) {
      parsedEndDate = new Date(endDate);

      if (Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }

      if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({
          success: false,
          message: "End date cannot be before start date",
        });
      }
    }

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // CREATE EVENT
    // ========================================

    const event = await Event.create({
      title: title.trim(),

      description: description?.trim() || "",

      startDate: parsedStartDate,

      endDate: parsedEndDate,

      allDay: Boolean(allDay),

      type: type || "Event",

      location: location?.trim() || "",

      createdBy: req.user._id,

      teamOwner: teamOwnerId,
    });

    await event.populate("createdBy", "name email role avatar");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create Calendar Event Error:", error);

    // Mongoose enum validation
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
};

// ========================================
// UPDATE EVENT
// PUT /api/calendar/:id
// ========================================

export const updateEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, allDay, type, location } =
      req.body;

    const teamOwnerId = getTeamOwnerId(req.user);

    const event = await Event.findOne({
      _id: req.params.id,
      teamOwner: teamOwnerId,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    // ========================================
    // PERMISSION
    // ========================================

    const isCreator = event.createdBy.toString() === req.user._id.toString();

    const isProjectManager = req.user.role === "Project Manager";

    if (!isCreator && !isProjectManager) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this event",
      });
    }

    // ========================================
    // TITLE
    // ========================================

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Event title cannot be empty",
        });
      }

      event.title = title.trim();
    }

    // ========================================
    // DESCRIPTION
    // ========================================

    if (description !== undefined) {
      event.description = description.trim();
    }

    // ========================================
    // START DATE
    // ========================================

    if (startDate !== undefined) {
      const parsedStart = new Date(startDate);

      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      event.startDate = parsedStart;
    }

    // ========================================
    // END DATE
    // ========================================

    if (endDate !== undefined) {
      if (!endDate) {
        event.endDate = null;
      } else {
        const parsedEnd = new Date(endDate);

        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        event.endDate = parsedEnd;
      }
    }

    // ========================================
    // CHECK DATE ORDER
    // ========================================

    if (event.endDate && event.endDate < event.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // ========================================
    // OTHER FIELDS
    // ========================================

    if (allDay !== undefined) {
      event.allDay = Boolean(allDay);
    }

    if (type !== undefined) {
      event.type = type;
    }

    if (location !== undefined) {
      event.location = location.trim();
    }

    // ========================================
    // SAVE
    // ========================================

    await event.save();

    await event.populate("createdBy", "name email role avatar");

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update Calendar Event Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
};

// ========================================
// DELETE EVENT
// DELETE /api/calendar/:id
// ========================================

export const deleteEvent = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    const event = await Event.findOne({
      _id: req.params.id,
      teamOwner: teamOwnerId,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    // ========================================
    // PERMISSION
    // ========================================

    const isCreator = event.createdBy.toString() === req.user._id.toString();

    const isProjectManager = req.user.role === "Project Manager";

    if (!isCreator && !isProjectManager) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this event",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete Calendar Event Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};
