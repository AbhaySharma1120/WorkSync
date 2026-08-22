import Project from "../models/Projects.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// ========================================
// GET CURRENT USER'S TEAM OWNER
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// CHECK NOTIFICATION PREFERENCE
// ========================================

const shouldReceiveNotification = async (recipientId, preferenceKey) => {
  try {
    if (!preferenceKey) {
      return true;
    }

    const user = await User.findById(recipientId).select(
      `notificationSettings.${preferenceKey}`,
    );

    if (!user) {
      return false;
    }

    const preference = user.notificationSettings?.[preferenceKey];

    /*
      false means user explicitly
      disabled the notification.

      undefined means use default ON.
    */

    return preference !== false;
  } catch (error) {
    console.error("Check Project Notification Preference Error:", error);

    return true;
  }
};

// ========================================
// CREATE NOTIFICATION SAFELY
// ========================================

const createNotificationSafely = async (data, preferenceKey = null) => {
  try {
    const allowed = await shouldReceiveNotification(
      data.recipient,
      preferenceKey,
    );

    if (!allowed) {
      return;
    }

    await Notification.create(data);
  } catch (error) {
    /*
      Notification failure should not
      stop project operations.
    */

    console.error("Create Project Notification Error:", error);
  }
};

// ========================================
// NOTIFY ALL TEAM MEMBERS
// ========================================

const notifyTeamMembers = async ({
  teamOwnerId,
  senderId,
  title,
  message,
  relatedId = null,
}) => {
  try {
    // ========================================
    // FIND TEAM MEMBERS
    // ========================================

    const members = await User.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        // Workspace owner
        {
          _id: teamOwnerId,
        },
      ],
    }).select("_id");

    // ========================================
    // SEND TO EVERYONE EXCEPT ACTION USER
    // ========================================

    for (const member of members) {
      if (member._id.toString() === senderId.toString()) {
        continue;
      }

      /*
        projectUpdates controls:

        - new project
        - project updated
        - project status changed
        - project completed
        - project deleted
      */

      await createNotificationSafely(
        {
          recipient: member._id,

          sender: senderId,

          title,

          message,

          type: "project",

          relatedId,

          link: "/projects",
        },

        "projectUpdates",
      );
    }
  } catch (error) {
    console.error("Notify Team Members Error:", error);
  }
};

// ========================================
// CREATE PROJECT
// POST /api/projects
// ========================================

export const createProject = async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,

        message: "Project name is required",
      });
    }

    // ========================================
    // TEAM
    // ========================================

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // CREATE PROJECT
    // ========================================

    const project = await Project.create({
      name: name.trim(),

      description: description?.trim() || "",

      status: status || "Planning",

      dueDate: dueDate || null,

      // Actual creator
      createdBy: req.user._id,

      // Workspace/team owner
      teamOwner: teamOwnerId,
    });

    // ========================================
    // POPULATE CREATOR
    // ========================================

    const populatedProject = await Project.findById(project._id).populate(
      "createdBy",
      "name email role avatar",
    );

    // ========================================
    // NEW PROJECT NOTIFICATION
    // ========================================

    await notifyTeamMembers({
      teamOwnerId,

      senderId: req.user._id,

      title: "New Project Created",

      message: `${req.user.name} created the project "${project.name}"`,

      relatedId: project._id,
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message: "Project created successfully",

      project: populatedProject,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET TEAM PROJECTS
// GET /api/projects
// ========================================

export const getProjects = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    /*
      New projects:
      teamOwner = workspace owner

      Legacy projects:
      createdBy = workspace owner
      and teamOwner is null
    */

    const projects = await Project.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        {
          createdBy: teamOwnerId,

          teamOwner: null,
        },
      ],
    })
      .populate("createdBy", "name email role avatar")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // MIGRATE LEGACY PROJECTS
    // ========================================

    await Project.updateMany(
      {
        createdBy: teamOwnerId,

        teamOwner: null,
      },

      {
        $set: {
          teamOwner: teamOwnerId,
        },
      },
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      count: projects.length,

      projects,
    });
  } catch (error) {
    console.error("Get Projects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// UPDATE PROJECT
// PUT /api/projects/:id
// ========================================

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // FIND PROJECT
    // ========================================

    const project = await Project.findOne({
      _id: id,

      $or: [
        {
          teamOwner: teamOwnerId,
        },

        // Legacy project
        {
          createdBy: teamOwnerId,

          teamOwner: null,
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,

        message: "Project not found",
      });
    }

    // ========================================
    // OLD VALUES
    // ========================================

    const oldName = project.name;

    const oldDescription = project.description;

    const oldStatus = project.status;

    const oldDueDate = project.dueDate ? project.dueDate.toISOString() : null;

    // ========================================
    // REQUEST
    // ========================================

    const { name, description, status, dueDate } = req.body || {};

    // ========================================
    // NAME
    // ========================================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,

          message: "Project name cannot be empty",
        });
      }

      project.name = name.trim();
    }

    // ========================================
    // DESCRIPTION
    // ========================================

    if (description !== undefined) {
      project.description = description?.trim() || "";
    }

    // ========================================
    // STATUS
    // ========================================

    if (status !== undefined) {
      project.status = status;
    }

    // ========================================
    // DUE DATE
    // ========================================

    if (dueDate !== undefined) {
      project.dueDate = dueDate || null;
    }

    // ========================================
    // FIX LEGACY PROJECT
    // ========================================

    if (!project.teamOwner) {
      project.teamOwner = teamOwnerId;
    }

    // ========================================
    // DETECT CHANGES
    // ========================================

    const newDueDate = project.dueDate
      ? new Date(project.dueDate).toISOString()
      : null;

    const nameChanged = oldName !== project.name;

    const descriptionChanged = oldDescription !== project.description;

    const statusChanged = oldStatus !== project.status;

    const dueDateChanged = oldDueDate !== newDueDate;

    const projectChanged =
      nameChanged || descriptionChanged || statusChanged || dueDateChanged;

    // ========================================
    // SAVE
    // ========================================

    await project.save();

    await project.populate("createdBy", "name email role avatar");

    // ========================================
    // PROJECT UPDATE NOTIFICATION
    // ========================================

    if (projectChanged) {
      let notificationTitle = "Project Updated";

      let notificationMessage = `${req.user.name} updated "${project.name}"`;

      // ========================================
      // SPECIAL STATUS MESSAGE
      // ========================================

      if (statusChanged) {
        notificationTitle =
          project.status === "Completed"
            ? "Project Completed"
            : "Project Status Updated";

        notificationMessage =
          project.status === "Completed"
            ? `${req.user.name} marked "${project.name}" as completed`
            : `${req.user.name} changed "${project.name}" from ${oldStatus} to ${project.status}`;
      }

      // ========================================
      // NOTIFY TEAM
      // ========================================

      await notifyTeamMembers({
        teamOwnerId,

        senderId: req.user._id,

        title: notificationTitle,

        message: notificationMessage,

        relatedId: project._id,
      });
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Project updated successfully",

      project,
    });
  } catch (error) {
    console.error("Update Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// DELETE PROJECT
// DELETE /api/projects/:id
// ========================================

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // FIND PROJECT
    // ========================================

    const project = await Project.findOne({
      _id: id,

      $or: [
        {
          teamOwner: teamOwnerId,
        },

        // Legacy project
        {
          createdBy: teamOwnerId,

          teamOwner: null,
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,

        message: "Project not found",
      });
    }

    // Save name before deletion
    const projectName = project.name;

    // ========================================
    // DELETE PROJECT
    // ========================================

    await project.deleteOne();

    // ========================================
    // PROJECT DELETED NOTIFICATION
    // ========================================

    await notifyTeamMembers({
      teamOwnerId,

      senderId: req.user._id,

      title: "Project Deleted",

      message: `${req.user.name} deleted the project "${projectName}"`,

      /*
        No relatedId because
        project no longer exists.
      */

      relatedId: null,
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
