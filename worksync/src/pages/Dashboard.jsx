import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import { FiFolder, FiActivity, FiCheckCircle, FiList } from "react-icons/fi";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import api from "../api/axios";
import toast from "react-hot-toast";

function Dashboard() {
  // ========================================
  // NAVIGATION
  // ========================================

  const navigate = useNavigate();

  // ========================================
  // STATES
  // ========================================

  // Mobile sidebar
  const [isOpen, setIsOpen] = useState(false);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const response = await api.get("/dashboard");

        setDashboardData(response.data);
      } catch (error) {
        console.error("Dashboard Error:", error);

        toast.error(
          error.response?.data?.message || "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ========================================
  // DASHBOARD VALUES
  // ========================================

  const statsData = dashboardData?.stats || {};

  const taskStatusChart = dashboardData?.taskStatusChart || [];

  const recentProjects = dashboardData?.recentProjects || [];

  const recentTasks = dashboardData?.recentTasks || [];

  const teamMembers = dashboardData?.teamMembers || [];

  // ========================================
  // STAT CARDS
  // ========================================

  const stats = [
    {
      title: "Total Projects",

      value: statsData.totalProjects ?? 0,

      description: `${statsData.completedProjects ?? 0} completed`,

      icon: <FiFolder />,
    },

    {
      title: "Active Projects",

      value: statsData.activeProjects ?? 0,

      description: `${statsData.onHoldProjects ?? 0} on hold`,

      icon: <FiActivity />,
    },

    {
      title: "Completed Projects",

      value: statsData.completedProjects ?? 0,

      description: `${statsData.projectCompletionRate ?? 0}% completion rate`,

      icon: <FiCheckCircle />,
    },

    {
      title: "Total Tasks",

      value: statsData.totalTasks ?? 0,

      description: `${statsData.taskCompletionRate ?? 0}% completed`,

      icon: <FiList />,
    },
  ];

  // ========================================
  // TASK CHART COLORS
  // ========================================

  const taskColors = {
    Todo: "#9ca3af",
    "In Progress": "#3b82f6",
    Review: "#fbbf24",
    Completed: "#34d399",
  };

  const taskData = taskStatusChart.map((item) => ({
    ...item,

    color: taskColors[item.name] || "#8b5cf6",
  }));

  // ========================================
  // INITIALS
  // ========================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================================
  // RELATIVE TIME
  // ========================================

  const getRelativeTime = (date) => {
    if (!date) {
      return "";
    }

    const now = new Date();

    const created = new Date(date);

    const difference = now - created;

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(minutes / 60);

    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return formatDate(date);
  };

  // ========================================
  // ACTIVITY ICON STYLE
  // ========================================

  const getActivityStyle = (status) => {
    if (status === "Completed") {
      return "bg-green-100 text-green-500";
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-500";
    }

    if (status === "Review") {
      return "bg-yellow-100 text-yellow-500";
    }

    return "bg-gray-100 text-gray-500";
  };

  // ========================================
  // LOADING PAGE
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc]">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar setIsOpen={setIsOpen} title="Dashboard" />

          <main className="p-3 sm:p-4 lg:p-5">
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
              <p className="text-sm text-gray-500">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* =====================================
          SIDEBAR
      ====================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar setIsOpen={setIsOpen} title="Dashboard" />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =====================================
              STAT CARDS
          ====================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {stat.title}
                    </p>

                    <h2 className="text-2xl font-semibold text-gray-900 mt-2">
                      {stat.value}
                    </h2>
                  </div>

                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg">
                    {stat.icon}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-3">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* =====================================
              TASKS + ACTIVITY
          ====================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            {/* =================================
                TASKS OVERVIEW
            ================================== */}

            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">
                  Tasks Overview
                </h2>

                <span className="text-xs text-gray-400">
                  {statsData.pendingTasks ?? 0} pending
                </span>
              </div>

              {statsData.totalTasks > 0 ? (
                <div className="flex flex-col sm:flex-row items-center mt-4 gap-5">
                  {/* =============================
                      DONUT CHART
                  ============================== */}

                  <div className="w-full sm:w-1/2 h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskData}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={1}
                        >
                          {taskData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* CENTER */}

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-semibold text-gray-800">
                        {statsData.totalTasks}
                      </span>

                      <span className="text-xs text-gray-400">Total Tasks</span>
                    </div>
                  </div>

                  {/* =============================
                      TASK DETAILS
                  ============================== */}

                  <div className="w-full sm:w-1/2 space-y-4">
                    {taskData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          <span className="text-sm text-gray-600">
                            {item.name}
                          </span>
                        </div>

                        <span className="text-sm font-medium text-gray-700">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-sm text-gray-400">No tasks available</p>
                </div>
              )}
            </div>

            {/* =================================
                PROJECT ACTIVITY
            ================================== */}

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-800">
                  Project Activity
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/tasks")}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  View all
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex gap-3 min-w-0">
                        {/* ACTIVITY ICON */}

                        <div
                          className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs ${getActivityStyle(
                            task.status,
                          )}`}
                        >
                          {task.status === "Completed" ? "✓" : "•"}
                        </div>

                        {/* ACTIVITY */}

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {task.title}
                          </p>

                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {task.status}

                            {task.assignee?.name && ` by ${task.assignee.name}`}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                        {getRelativeTime(task.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400">
                      No recent task activity
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =====================================
              PROJECTS + TEAM
          ====================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            {/* =================================
                RECENT PROJECTS
            ================================== */}

            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <div className="flex justify-between items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-800">
                  Recent Projects
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/projects")}
                  className="text-xs text-purple-600 hover:text-purple-700 whitespace-nowrap"
                >
                  View all projects
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div
                      key={project._id}
                      className="flex flex-col sm:grid sm:grid-cols-[1.3fr_1fr_130px] sm:items-center gap-2 sm:gap-4"
                    >
                      {/* =============================
                            NAME
                        ============================== */}

                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {project.name}
                        </p>

                        <p className="text-[11px] text-gray-400 mt-1">
                          {project.totalTasks ?? 0} tasks
                        </p>
                      </div>

                      {/* =============================
                            PROGRESS
                        ============================== */}

                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${project.progress ?? 0}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {project.progress ?? 0}%
                        </span>
                      </div>

                      {/* =============================
                            DUE DATE
                        ============================== */}

                      <p className="text-xs text-gray-400 sm:text-right">
                        {project.dueDate
                          ? `Due: ${formatDate(project.dueDate)}`
                          : "No due date"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400">
                      No projects available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================
                TEAM MEMBERS
            ================================== */}

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-800">
                  Team Members
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/team")}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  View all
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {teamMembers.length > 0 ? (
                  teamMembers.slice(0, 5).map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between gap-3"
                    >
                      {/* MEMBER */}

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 shrink-0 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {getInitials(member.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {member.name}
                          </p>

                          <p className="text-xs text-gray-400 truncate">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      {/* TASK STATUS */}

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-gray-600">
                          {member.activeTasks} active
                        </p>

                        <p className="text-[10px] text-gray-400 mt-1">
                          {member.completedTasks} completed
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400">No team members</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =====================================
              EXTRA SUMMARY
          ====================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* PENDING TASKS */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Pending Tasks</p>

              <p className="text-xl font-semibold text-gray-800 mt-2">
                {statsData.pendingTasks ?? 0}
              </p>
            </div>

            {/* HIGH PRIORITY */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">High Priority Tasks</p>

              <p className="text-xl font-semibold text-gray-800 mt-2">
                {statsData.highPriorityTasks ?? 0}
              </p>
            </div>

            {/* TEAM MEMBERS */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Team Members</p>

              <p className="text-xl font-semibold text-gray-800 mt-2">
                {statsData.totalMembers ?? 0}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
