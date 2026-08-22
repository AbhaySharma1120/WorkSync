import Project from "../models/Projects.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// ========================================
// GET DASHBOARD DATA
// ========================================

export const getDashboardData = async (req, res) => {
  try {
    // Same teamOwner for every member
    // belonging to the same workspace
    const teamOwnerId = req.user.teamOwner || req.user._id;

    // ========================================
    // GET TEAM PROJECTS
    // ========================================

    const projects = await Project.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        // Support old projects
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

    const projectIds = projects.map((project) => project._id);

    // ========================================
    // GET TEAM TASKS
    // ========================================

    const tasks = await Task.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        // Support old tasks
        {
          project: {
            $in: projectIds,
          },
          teamOwner: null,
        },
      ],
    })
      .populate("project", "name status")
      .populate("assignee", "name email role avatar")
      .populate("createdBy", "name email role avatar")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // GET TEAM MEMBERS
    // ========================================

    const members = await User.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },

        {
          _id: teamOwnerId,
        },
      ],
    })
      .select("name email role avatar")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // PROJECT STATISTICS
    // ========================================

    const totalProjects = projects.length;

    const activeProjects = projects.filter(
      (project) =>
        project.status === "Planning" || project.status === "In Progress",
    ).length;

    const completedProjects = projects.filter(
      (project) => project.status === "Completed",
    ).length;

    const onHoldProjects = projects.filter(
      (project) => project.status === "On Hold",
    ).length;

    // ========================================
    // TASK STATISTICS
    // ========================================

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.status === "Completed",
    ).length;

    const pendingTasks = tasks.filter(
      (task) => task.status !== "Completed",
    ).length;

    const highPriorityTasks = tasks.filter(
      (task) => task.priority === "High",
    ).length;

    // ========================================
    // TASK STATUS CHART
    // ========================================

    const taskStatusChart = [
      {
        name: "Todo",
        value: tasks.filter((task) => task.status === "Todo").length,
      },

      {
        name: "In Progress",
        value: tasks.filter((task) => task.status === "In Progress").length,
      },

      {
        name: "Review",
        value: tasks.filter((task) => task.status === "Review").length,
      },

      {
        name: "Completed",
        value: completedTasks,
      },
    ];

    // ========================================
    // PROJECT STATUS CHART
    // ========================================

    const projectStatusChart = [
      {
        name: "Planning",
        value: projects.filter((project) => project.status === "Planning")
          .length,
      },

      {
        name: "In Progress",
        value: projects.filter((project) => project.status === "In Progress")
          .length,
      },

      {
        name: "Completed",
        value: completedProjects,
      },

      {
        name: "On Hold",
        value: onHoldProjects,
      },
    ];

    // ========================================
    // RECENT PROJECTS
    // ========================================

    const recentProjects = projects.slice(0, 5).map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.project?._id?.toString() === project._id.toString(),
      );

      const completedProjectTasks = projectTasks.filter(
        (task) => task.status === "Completed",
      ).length;

      const progress =
        projectTasks.length > 0
          ? Math.round((completedProjectTasks / projectTasks.length) * 100)
          : 0;

      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        createdBy: project.createdBy,

        totalTasks: projectTasks.length,

        completedTasks: completedProjectTasks,

        progress,
      };
    });

    // ========================================
    // RECENT TASKS
    // ========================================

    const recentTasks = tasks.slice(0, 5);

    // ========================================
    // TEAM MEMBER TASK STATS
    // ========================================

    const teamMembers = members.map((member) => {
      const memberTasks = tasks.filter(
        (task) => task.assignee?._id?.toString() === member._id.toString(),
      );

      const activeTasks = memberTasks.filter(
        (task) => task.status !== "Completed",
      ).length;

      const completed = memberTasks.filter(
        (task) => task.status === "Completed",
      ).length;

      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,

        activeTasks,
        completedTasks: completed,
      };
    });

    // ========================================
    // COMPLETION PERCENTAGE
    // ========================================

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const projectCompletionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    // ========================================
    // RESPONSE
    // ========================================

    res.status(200).json({
      success: true,

      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,

        totalTasks,
        completedTasks,
        pendingTasks,
        highPriorityTasks,

        totalMembers: members.length,

        taskCompletionRate,
        projectCompletionRate,
      },

      taskStatusChart,
      projectStatusChart,

      recentProjects,
      recentTasks,

      teamMembers,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};
