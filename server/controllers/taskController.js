import Task from "../models/Task.js";
import Project from "../models/Projects.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// ========================================
// GET TEAM OWNER ID
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// FIND PROJECT INSIDE CURRENT TEAM
// ========================================

const findTeamProject = async (projectId, teamOwnerId) => {
  if (!projectId) {
    return null;
  }

  return await Project.findOne({
    _id: projectId,

    $or: [
      // New projects
      {
        teamOwner: teamOwnerId,
      },

      // Legacy projects
      {
        createdBy: teamOwnerId,
        teamOwner: null,
      },
    ],
  });
};

// ========================================
// FIND MEMBER INSIDE CURRENT TEAM
// ========================================

const findTeamMember = async (userId, teamOwnerId) => {
  if (!userId) {
    return null;
  }

  return await User.findOne({
    _id: userId,

    $or: [
      // Normal team member
      {
        teamOwner: teamOwnerId,
      },

      // Workspace owner
      {
        _id: teamOwnerId,
      },
    ],
  });
};

// ========================================
// CHECK NOTIFICATION PREFERENCE
// ========================================

const shouldReceiveNotification = async (recipientId, preferenceKey) => {
  try {
    // If no preference is connected to
    // this notification, allow it.
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
      undefined means the user has not
      explicitly disabled the setting.

      false means the user turned it OFF.
    */

    return preference !== false;
  } catch (error) {
    console.error("Check Task Notification Preference Error:", error);

    /*
      A settings lookup problem should
      not break task operations.
    */

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
      stop task creation or update.
    */

    console.error("Create Notification Error:", error);
  }
};

// ========================================
// CREATE TASK
// POST /api/tasks
// ========================================

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, priority, status, dueDate } =
      req.body || {};

    // ========================================
    // VALIDATE TITLE
    // ========================================

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // ========================================
    // VALIDATE PROJECT
    // ========================================

    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    // ========================================
    // CURRENT TEAM
    // ========================================

    const teamOwnerId = getTeamOwnerId(req.user);

    const projectId = typeof project === "object" ? project._id : project;

    // ========================================
    // VERIFY PROJECT
    // ========================================

    const teamProject = await findTeamProject(projectId, teamOwnerId);

    if (!teamProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found in your team",
      });
    }

    // ========================================
    // VERIFY ASSIGNEE
    // ========================================

    let assigneeId = null;

    if (assignee) {
      assigneeId = typeof assignee === "object" ? assignee._id : assignee;

      const teamMember = await findTeamMember(assigneeId, teamOwnerId);

      if (!teamMember) {
        return res.status(400).json({
          success: false,
          message: "Assignee is not a member of your team",
        });
      }

      assigneeId = teamMember._id;
    }

    // ========================================
    // CREATE TASK
    // ========================================

    const task = await Task.create({
      title: title.trim(),

      description: description?.trim() || "",

      project: teamProject._id,

      assignee: assigneeId || null,

      priority: priority || "Medium",

      status: status || "Todo",

      dueDate: dueDate || null,

      createdBy: req.user._id,

      teamOwner: teamOwnerId,
    });

    // ========================================
    // POPULATE TASK
    // ========================================

    await task.populate([
      {
        path: "project",
        select: "name description status dueDate",
      },

      {
        path: "assignee",
        select: "name email role avatar",
      },

      {
        path: "createdBy",
        select: "name email role avatar",
      },
    ]);

    // ========================================
    // TASK ASSIGNMENT NOTIFICATION
    // ========================================

    if (task.assignee) {
      const assignedUserId = task.assignee._id.toString();

      // Do not notify self
      if (assignedUserId !== req.user._id.toString()) {
        await createNotificationSafely(
          {
            recipient: task.assignee._id,

            sender: req.user._id,

            title: "New Task Assigned",

            message: `${req.user.name} assigned you the task "${task.title}"`,

            type: "task",

            relatedId: task._id,

            link: "/tasks",
          },

          // Settings preference
          "taskAssigned",
        );
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message: "Task created successfully",

      task,
    });
  } catch (error) {
    console.error("Create Task Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to create task",
    });
  }
};

// ========================================
// GET ALL TEAM TASKS
// GET /api/tasks
// ========================================

export const getTasks = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // GET TEAM PROJECTS
    // ========================================

    const teamProjects = await Project.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        {
          createdBy: teamOwnerId,

          teamOwner: null,
        },
      ],
    }).select("_id");

    const projectIds = teamProjects.map((project) => project._id);

    // ========================================
    // GET TEAM TASKS
    // ========================================

    const tasks = await Task.find({
      $or: [
        // New tasks
        {
          teamOwner: teamOwnerId,
        },

        // Legacy tasks
        {
          teamOwner: null,

          project: {
            $in: projectIds,
          },
        },
      ],
    })
      .populate("project", "name description status dueDate")
      .populate("assignee", "name email role avatar")
      .populate("createdBy", "name email role avatar")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // MIGRATE LEGACY TASKS
    // ========================================

    if (projectIds.length > 0) {
      await Task.updateMany(
        {
          teamOwner: null,

          project: {
            $in: projectIds,
          },
        },

        {
          $set: {
            teamOwner: teamOwnerId,
          },
        },
      );
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load tasks",
    });
  }
};

// ========================================
// UPDATE TASK
// PUT /api/tasks/:id
// ========================================

export const updateTask = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // FIND TASK
    // ========================================

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // ========================================
    // VERIFY TEAM ACCESS
    // ========================================

    let taskBelongsToTeam = false;

    // New task
    if (task.teamOwner) {
      taskBelongsToTeam = task.teamOwner.toString() === teamOwnerId.toString();
    }

    // Legacy task
    if (!task.teamOwner) {
      const teamProject = await findTeamProject(task.project, teamOwnerId);

      if (teamProject) {
        taskBelongsToTeam = true;

        // Migrate legacy task
        task.teamOwner = teamOwnerId;
      }
    }

    if (!taskBelongsToTeam) {
      return res.status(403).json({
        success: false,

        message: "You do not have access to this task",
      });
    }

    // ========================================
    // STORE OLD VALUES
    // ========================================

    const previousAssigneeId = task.assignee ? task.assignee.toString() : null;

    const previousStatus = task.status;

    // ========================================
    // REQUEST DATA
    // ========================================

    const { title, description, project, assignee, priority, status, dueDate } =
      req.body || {};

    // ========================================
    // PROVIDED FIELDS
    // ========================================

    const assigneeWasProvided = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "assignee",
    );

    const statusWasProvided = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "status",
    );

    // ========================================
    // TITLE
    // ========================================

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,

          message: "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    // ========================================
    // DESCRIPTION
    // ========================================

    if (description !== undefined) {
      task.description = description?.trim() || "";
    }

    // ========================================
    // PROJECT
    // ========================================

    if (project !== undefined) {
      const projectId = typeof project === "object" ? project._id : project;

      const teamProject = await findTeamProject(projectId, teamOwnerId);

      if (!teamProject) {
        return res.status(400).json({
          success: false,

          message: "Project does not belong to your team",
        });
      }

      task.project = teamProject._id;
    }

    // ========================================
    // ASSIGNEE
    // ========================================

    if (assigneeWasProvided) {
      // Unassign
      if (assignee === null || assignee === "") {
        task.assignee = null;
      } else {
        const assigneeId =
          typeof assignee === "object" ? assignee._id : assignee;

        const teamMember = await findTeamMember(assigneeId, teamOwnerId);

        if (!teamMember) {
          return res.status(400).json({
            success: false,

            message: "Assignee is not a member of your team",
          });
        }

        task.assignee = teamMember._id;
      }
    }

    // ========================================
    // PRIORITY
    // ========================================

    if (priority !== undefined) {
      task.priority = priority;
    }

    // ========================================
    // STATUS
    // ========================================

    if (status !== undefined) {
      task.status = status;
    }

    // ========================================
    // DUE DATE
    // ========================================

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    // ========================================
    // SAVE
    // ========================================

    await task.save();

    // ========================================
    // POPULATE UPDATED TASK
    // ========================================

    await task.populate([
      {
        path: "project",
        select: "name description status dueDate",
      },

      {
        path: "assignee",
        select: "name email role avatar",
      },

      {
        path: "createdBy",
        select: "name email role avatar",
      },
    ]);

    // ========================================
    // NEW ASSIGNEE ID
    // ========================================

    const newAssigneeId = task.assignee?._id
      ? task.assignee._id.toString()
      : null;

    // ========================================
    // REASSIGNMENT NOTIFICATION
    // ========================================

    if (
      assigneeWasProvided &&
      newAssigneeId &&
      newAssigneeId !== previousAssigneeId &&
      newAssigneeId !== req.user._id.toString()
    ) {
      await createNotificationSafely(
        {
          recipient: task.assignee._id,

          sender: req.user._id,

          title: "Task Assigned to You",

          message: `${req.user.name} assigned you the task "${task.title}"`,

          type: "task",

          relatedId: task._id,

          link: "/tasks",
        },

        "taskAssigned",
      );
    }

    // ========================================
    // TASK STATUS CHANGE NOTIFICATION
    // ========================================

    if (statusWasProvided && task.status !== previousStatus) {
      /*
        Possible recipients:

        - Task creator
        - Task assignee
      */

      const recipients = new Set();

      // Task creator
      if (task.createdBy?._id) {
        recipients.add(task.createdBy._id.toString());
      }

      // Task assignee
      if (task.assignee?._id) {
        recipients.add(task.assignee._id.toString());
      }

      // Do not notify action user
      recipients.delete(req.user._id.toString());

      /*
        If task was reassigned in same request,
        avoid sending both assignment and
        status-change notifications to new user.
      */

      if (
        assigneeWasProvided &&
        newAssigneeId &&
        newAssigneeId !== previousAssigneeId
      ) {
        recipients.delete(newAssigneeId);
      }

      // ========================================
      // NOTIFICATION TEXT
      // ========================================

      const notificationTitle =
        task.status === "Completed" ? "Task Completed" : "Task Status Updated";

      const notificationMessage =
        task.status === "Completed"
          ? `${req.user.name} completed "${task.title}"`
          : `${req.user.name} moved "${task.title}" from ${previousStatus} to ${task.status}`;

      // ========================================
      // SEND STATUS NOTIFICATIONS
      // ========================================

      for (const recipientId of recipients) {
        /*
          No preferenceKey is passed here.

          "taskAssigned" only controls
          assignment notifications,
          not status notifications.
        */

        await createNotificationSafely({
          recipient: recipientId,

          sender: req.user._id,

          title: notificationTitle,

          message: notificationMessage,

          type: "task",

          relatedId: task._id,

          link: "/tasks",
        });
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Task updated successfully",

      task,
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to update task",
    });
  }
};

// ========================================
// DELETE TASK
// DELETE /api/tasks/:id
// ========================================

export const deleteTask = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // FIND TASK
    // ========================================

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // ========================================
    // VERIFY TEAM ACCESS
    // ========================================

    let taskBelongsToTeam = false;

    if (task.teamOwner) {
      taskBelongsToTeam = task.teamOwner.toString() === teamOwnerId.toString();
    }

    if (!task.teamOwner) {
      const teamProject = await findTeamProject(task.project, teamOwnerId);

      if (teamProject) {
        taskBelongsToTeam = true;
      }
    }

    if (!taskBelongsToTeam) {
      return res.status(403).json({
        success: false,

        message: "You do not have permission to delete this task",
      });
    }

    // ========================================
    // DELETE
    // ========================================

    await task.deleteOne();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete task",
    });
  }
};
