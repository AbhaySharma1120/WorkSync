import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import api from "../api/axios";
import toast from "react-hot-toast";

function Reports() {
  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [period, setPeriod] = useState("This Month");

  const [projects, setProjects] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  // ========================================
  // FETCH REPORT DATA
  // ========================================

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [projectResponse, taskResponse, teamResponse] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/team"),
      ]);

      // ========================================
      // PROJECTS
      // ========================================

      const projectData = Array.isArray(projectResponse.data?.projects)
        ? projectResponse.data.projects
        : Array.isArray(projectResponse.data)
          ? projectResponse.data
          : [];

      // ========================================
      // TASKS
      // ========================================

      const taskData = Array.isArray(taskResponse.data?.tasks)
        ? taskResponse.data.tasks
        : Array.isArray(taskResponse.data)
          ? taskResponse.data
          : [];

      // ========================================
      // TEAM MEMBERS
      // ========================================

      const memberData = Array.isArray(teamResponse.data?.members)
        ? teamResponse.data.members
        : Array.isArray(teamResponse.data?.teamMembers)
          ? teamResponse.data.teamMembers
          : Array.isArray(teamResponse.data)
            ? teamResponse.data
            : [];

      setProjects(projectData);

      setTasks(taskData);

      setMembers(memberData);
    } catch (error) {
      console.error("Reports Data Error:", error);

      toast.error(error.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD REPORT DATA
  // ========================================

  useEffect(() => {
    fetchReportData();
  }, []);

  // ========================================
  // PERIOD START DATE
  // ========================================

  const getPeriodStartDate = () => {
    const now = new Date();

    const start = new Date(now);

    if (period === "This Week") {
      /*
          Monday = beginning
          of the week.
        */

      const day = start.getDay();

      const difference = day === 0 ? -6 : 1 - day;

      start.setDate(start.getDate() + difference);

      start.setHours(0, 0, 0, 0);

      return start;
    }

    if (period === "This Month") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (period === "Last 3 Months") {
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    }

    if (period === "This Year") {
      return new Date(now.getFullYear(), 0, 1);
    }

    return new Date(0);
  };

  // ========================================
  // FILTER BY PERIOD
  // ========================================

  const periodStartDate = useMemo(() => getPeriodStartDate(), [period]);

  const periodProjects = useMemo(() => {
    return projects.filter((project) => {
      if (!project.createdAt) {
        return true;
      }

      return new Date(project.createdAt) >= periodStartDate;
    });
  }, [projects, periodStartDate]);

  const periodTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.createdAt) {
        return true;
      }

      return new Date(task.createdAt) >= periodStartDate;
    });
  }, [tasks, periodStartDate]);

  // ========================================
  // COMPLETED PROJECTS
  // ========================================

  const completedProjects = periodProjects.filter(
    (project) => project.status === "Completed",
  ).length;

  // ========================================
  // TOP STATISTICS
  // ========================================

  const stats = [
    {
      title: "Total Projects",

      value: periodProjects.length,

      detail: "Created in selected period",

      icon: <FiFolder />,
    },

    {
      title: "Completed Projects",

      value: completedProjects,

      detail: "Completed project status",

      icon: <FiCheckCircle />,
    },

    {
      title: "Total Tasks",

      value: periodTasks.length,

      detail: "Created in selected period",

      icon: <FiClock />,
    },

    {
      title: "Team Members",

      value: members.length,

      detail: "Current workspace members",

      icon: <FiUsers />,
    },
  ];

  // ========================================
  // PROJECT PROGRESS
  // ========================================

  const projectProgress = useMemo(() => {
    return periodProjects
      .map((project) => {
        const projectId = project._id?.toString();

        const projectTasks = tasks.filter((task) => {
          const taskProject = task.project;

          const taskProjectId =
            typeof taskProject === "object" ? taskProject?._id : taskProject;

          return taskProjectId?.toString() === projectId;
        });

        const completedTasks = projectTasks.filter(
          (task) => task.status === "Completed",
        ).length;

        let progress = 0;

        if (projectTasks.length > 0) {
          progress = Math.round((completedTasks / projectTasks.length) * 100);
        }

        /*
            If project itself is
            completed but has no tasks,
            display 100%.
          */

        if (project.status === "Completed" && projectTasks.length === 0) {
          progress = 100;
        }

        const fullName = project.name || "Untitled";

        const shortName =
          fullName.length > 14 ? `${fullName.slice(0, 14)}...` : fullName;

        return {
          id: project._id,

          name: shortName,

          fullName,

          progress,

          totalTasks: projectTasks.length,

          completedTasks,
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [periodProjects, tasks]);

  // ========================================
  // TASK STATUS
  // ========================================

  const taskStatus = useMemo(() => {
    const statuses = [
      {
        name: "Completed",
        status: "Completed",
        color: "#22c55e",
      },

      {
        name: "In Progress",
        status: "In Progress",
        color: "#3b82f6",
      },

      {
        name: "Todo",
        status: "Todo",
        color: "#f59e0b",
      },

      {
        name: "Review",
        status: "Review",
        color: "#8b5cf6",
      },
    ];

    return statuses.map((statusItem) => ({
      name: statusItem.name,

      color: statusItem.color,

      value: periodTasks.filter((task) => task.status === statusItem.status)
        .length,
    }));
  }, [periodTasks]);

  // ========================================
  // TOTAL TASKS FOR PIE CHART
  // ========================================

  const totalTasks = taskStatus.reduce((total, task) => total + task.value, 0);

  // ========================================
  // TEAM PRODUCTIVITY
  // ========================================

  const teamProductivity = useMemo(() => {
    return members
      .map((member) => {
        const memberId = member._id?.toString();

        const memberTasks = periodTasks.filter((task) => {
          if (!task.assignee) {
            return false;
          }

          const assigneeId =
            typeof task.assignee === "object"
              ? task.assignee?._id
              : task.assignee;

          return assigneeId?.toString() === memberId;
        });

        const completed = memberTasks.filter(
          (task) => task.status === "Completed",
        ).length;

        const active = memberTasks.filter(
          (task) => task.status !== "Completed",
        ).length;

        const total = completed + active;

        const productivity =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: member._id,

          name: member.name || "Unknown",

          role: member.role || "Team Member",

          completed,

          active,

          total,

          productivity,
        };
      })
      .sort(
        (a, b) => b.productivity - a.productivity || b.completed - a.completed,
      );
  }, [members, periodTasks]);

  // ========================================
  // HIGH PRIORITY TASKS
  // ========================================

  const highPriorityTasks = periodTasks.filter(
    (task) => task.priority === "High" && task.status !== "Completed",
  ).length;

  // ========================================
  // TASK COMPLETION RATE
  // ========================================

  const completedTaskCount = periodTasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const taskCompletionRate =
    periodTasks.length > 0
      ? Math.round((completedTaskCount / periodTasks.length) * 100)
      : 0;

  // ========================================
  // CUSTOM BAR TOOLTIP
  // ========================================

  const ProjectTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-700">{data.fullName}</p>

        <p className="text-xs text-purple-600 mt-1">
          Progress: {data.progress}%
        </p>

        <p className="text-[10px] text-gray-400 mt-1">
          {data.completedTasks} of {data.totalTasks} tasks completed
        </p>
      </div>
    );
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc]">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar setIsOpen={setIsOpen} title="Reports" />

          <main className="p-3 sm:p-4 lg:p-5">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm py-20 text-center">
              <p className="text-sm text-gray-400">Loading reports...</p>
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
        <Topbar setIsOpen={setIsOpen} title="Reports" />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =================================
              PAGE HEADER
          ================================== */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Analytics & Reports
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Track real project, task and team performance
              </p>
            </div>

            {/* REPORT PERIOD */}

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            >
              <option value="This Week">This Week</option>

              <option value="This Month">This Month</option>

              <option value="Last 3 Months">Last 3 Months</option>

              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* =================================
              STAT CARDS
          ================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>

                    <h3 className="text-2xl font-semibold text-gray-800 mt-2">
                      {stat.value}
                    </h3>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                    {stat.icon}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <FiTrendingUp />

                  <span>{stat.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* =================================
              EXTRA SUMMARY
          ================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* COMPLETION RATE */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Task Completion Rate</p>

              <div className="flex items-end justify-between mt-2">
                <p className="text-xl font-semibold text-gray-800">
                  {taskCompletionRate}%
                </p>

                <p className="text-xs text-gray-400">
                  {completedTaskCount}/{periodTasks.length} tasks
                </p>
              </div>

              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{
                    width: `${taskCompletionRate}%`,
                  }}
                />
              </div>
            </div>

            {/* HIGH PRIORITY */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Open High Priority Tasks</p>

              <p className="text-xl font-semibold text-gray-800 mt-2">
                {highPriorityTasks}
              </p>

              <p className="text-xs text-gray-400 mt-3">
                High priority tasks still requiring action
              </p>
            </div>

            {/* PROJECT COMPLETION */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Project Completion</p>

              <p className="text-xl font-semibold text-gray-800 mt-2">
                {periodProjects.length > 0
                  ? Math.round(
                      (completedProjects / periodProjects.length) * 100,
                    )
                  : 0}
                %
              </p>

              <p className="text-xs text-gray-400 mt-3">
                {completedProjects} of {periodProjects.length} selected projects
              </p>
            </div>
          </div>

          {/* =================================
              CHARTS
          ================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            {/* =================================
                PROJECT PROGRESS
            ================================== */}

            <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Project Progress
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Completion percentage based on completed tasks
                  </p>
                </div>

                <span className="text-xs text-gray-400 shrink-0">{period}</span>
              </div>

              {projectProgress.length > 0 ? (
                <div className="h-72 mt-5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectProgress}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 10,
                        }}
                        interval={0}
                      />

                      <YAxis
                        domain={[0, 100]}
                        tick={{
                          fontSize: 11,
                        }}
                      />

                      <Tooltip content={<ProjectTooltip />} />

                      <Bar
                        dataKey="progress"
                        fill="#7c3aed"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center">
                  <FiFolder size={28} className="text-gray-300" />

                  <p className="text-sm text-gray-500 mt-3">
                    No projects found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    No projects were created during {period.toLowerCase()}.
                  </p>
                </div>
              )}
            </div>

            {/* =================================
                TASK STATUS
            ================================== */}

            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800">
                Task Status
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Task distribution for {period.toLowerCase()}
              </p>

              {totalTasks > 0 ? (
                <>
                  <div className="h-52 relative mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatus}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {taskStatus.map((task) => (
                            <Cell key={task.name} fill={task.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* CENTER */}

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-semibold text-gray-800">
                        {totalTasks}
                      </span>

                      <span className="text-xs text-gray-400">Tasks</span>
                    </div>
                  </div>

                  {/* STATUS LABELS */}

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {taskStatus.map((task) => (
                      <div key={task.name} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: task.color,
                          }}
                        />

                        <div>
                          <p className="text-xs text-gray-500">{task.name}</p>

                          <p className="text-xs font-semibold text-gray-700">
                            {task.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <FiClock size={28} className="text-gray-300" />

                  <p className="text-sm text-gray-500 mt-3">No tasks found</p>

                  <p className="text-xs text-gray-400 mt-1">
                    No tasks were created in this period.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =================================
              TEAM PRODUCTIVITY
          ================================== */}

          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Team Productivity
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Assigned task performance by team member
                </p>
              </div>

              <span className="text-xs text-gray-400">{period}</span>
            </div>

            {/* =================================
                DESKTOP TABLE
            ================================== */}

            <div className="hidden md:block mt-5">
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">Member</p>

                <p className="text-xs text-gray-400">Role</p>

                <p className="text-xs text-gray-400">Completed</p>

                <p className="text-xs text-gray-400">Active</p>

                <p className="text-xs text-gray-400">Productivity</p>
              </div>

              {teamProductivity.map((member) => (
                <div
                  key={member.id || member.name}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 items-center py-4 border-b border-gray-100 last:border-b-0"
                >
                  {/* MEMBER */}

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {member.name}
                    </p>

                    <p className="text-[10px] text-gray-400 mt-1">
                      {member.total} assigned{" "}
                      {member.total === 1 ? "task" : "tasks"}
                    </p>
                  </div>

                  {/* ROLE */}

                  <p className="text-xs text-gray-500 truncate">
                    {member.role}
                  </p>

                  {/* COMPLETED */}

                  <p className="text-sm text-gray-600">{member.completed}</p>

                  {/* ACTIVE */}

                  <p className="text-sm text-gray-600">{member.active}</p>

                  {/* PRODUCTIVITY */}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full">
                      <div
                        className="h-1.5 bg-purple-600 rounded-full"
                        style={{
                          width: `${member.productivity}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-gray-500 w-9 text-right">
                      {member.productivity}%
                    </span>
                  </div>
                </div>
              ))}

              {teamProductivity.length === 0 && (
                <div className="py-10 text-center">
                  <FiUsers size={28} className="mx-auto text-gray-300" />

                  <p className="text-sm text-gray-500 mt-3">No team members</p>
                </div>
              )}
            </div>

            {/* =================================
                MOBILE CARDS
            ================================== */}

            <div className="md:hidden mt-4 space-y-3">
              {teamProductivity.map((member) => (
                <div
                  key={member.id || member.name}
                  className="border border-gray-100 rounded-lg p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {member.name}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {member.role}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-purple-600">
                      {member.productivity}%
                    </span>
                  </div>

                  {/* COUNTS */}

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-gray-700">
                        {member.completed}
                      </p>

                      <p className="text-[10px] text-gray-400">Completed</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-gray-700">
                        {member.active}
                      </p>

                      <p className="text-[10px] text-gray-400">Active</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-gray-700">
                        {member.total}
                      </p>

                      <p className="text-[10px] text-gray-400">Assigned</p>
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{
                        width: `${member.productivity}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {teamProductivity.length === 0 && (
                <div className="py-10 text-center">
                  <FiUsers size={28} className="mx-auto text-gray-300" />

                  <p className="text-sm text-gray-500 mt-3">No team members</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Reports;
