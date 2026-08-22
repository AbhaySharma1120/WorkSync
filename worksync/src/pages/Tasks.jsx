import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import AddTaskModal from "../components/tasks/AddTaskModal";
import EditTaskModal from "../components/tasks/EditTaskModal";
import ConfirmModal from "../components/common/ConfirmModal";

import { FiCalendar, FiSearch, FiUser, FiMoreHorizontal } from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

const Tasks = () => {
  // ========================================
  // LOGGED-IN USER
  // ========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // Only Project Manager can delete tasks
  const isProjectManager = currentUser?.role === "Project Manager";

  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("All");

  const [priority, setPriority] = useState("All");

  // Tasks from MongoDB
  const [tasks, setTasks] = useState([]);

  // Shared projects
  const [projects, setProjects] = useState([]);

  // Team members
  const [members, setMembers] = useState([]);

  // Initial loading
  const [loading, setLoading] = useState(true);

  // ========================================
  // ADD TASK
  // ========================================

  const [showModal, setShowModal] = useState(false);

  // ========================================
  // THREE DOT MENU
  // ========================================

  const [openMenuId, setOpenMenuId] = useState(null);

  // ========================================
  // EDIT TASK
  // ========================================

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  // ========================================
  // DELETE TASK
  // ========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // ========================================
  // FETCH TASKS + PROJECTS + MEMBERS
  // ========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [tasksResponse, projectsResponse, teamResponse] =
          await Promise.all([
            api.get("/tasks"),
            api.get("/projects"),
            api.get("/team"),
          ]);

        // Store shared team tasks
        setTasks(tasksResponse.data.tasks || []);

        // Store shared projects
        setProjects(projectsResponse.data.projects || []);

        // Store members of same team
        setMembers(teamResponse.data.members || []);
      } catch (error) {
        console.error("Fetch Tasks Error:", error);

        toast.error(error.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ========================================
  // CREATE TASK
  // ========================================

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);

      // Add newly created task
      // immediately to page
      setTasks((previousTasks) => [response.data.task, ...previousTasks]);

      toast.success(response.data.message || "Task created successfully");

      return true;
    } catch (error) {
      console.error("Create Task Error:", error);

      toast.error(error.response?.data?.message || "Failed to create task");

      return false;
    }
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = (task) => {
    setEditingTask(task);

    setShowEditModal(true);

    // Close three-dot menu
    setOpenMenuId(null);
  };

  // ========================================
  // UPDATE TASK
  // ========================================

  const handleUpdateTask = async (updatedData) => {
    if (!editingTask) {
      return false;
    }

    try {
      const response = await api.put(`/tasks/${editingTask._id}`, updatedData);

      // Replace old task with updated task
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === editingTask._id ? response.data.task : task,
        ),
      );

      toast.success(response.data.message || "Task updated successfully");

      return true;
    } catch (error) {
      console.error("Update Task Error:", error);

      toast.error(error.response?.data?.message || "Failed to update task");

      return false;
    }
  };

  // ========================================
  // THREE DOT MENU
  // ========================================

  const toggleTaskMenu = (taskId) => {
    setOpenMenuId((previousId) => (previousId === taskId ? null : taskId));
  };

  // ========================================
  // OPEN DELETE MODAL
  // ========================================

  const openDeleteModal = (task) => {
    // Extra frontend protection
    if (!isProjectManager) {
      return;
    }

    setSelectedTask(task);

    setShowDeleteModal(true);

    setOpenMenuId(null);
  };

  // ========================================
  // DELETE TASK
  // ========================================

  const handleDeleteTask = async () => {
    if (!selectedTask || !isProjectManager) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await api.delete(`/tasks/${selectedTask._id}`);

      // Remove task from frontend
      setTasks((previousTasks) =>
        previousTasks.filter((task) => task._id !== selectedTask._id),
      );

      toast.success(response.data.message || "Task deleted successfully");

      setShowDeleteModal(false);

      setSelectedTask(null);

      setOpenMenuId(null);
    } catch (error) {
      console.error("Delete Task Error:", error);

      toast.error(error.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ========================================
  // GET PROJECT NAME
  // ========================================

  const getProjectName = (task) => {
    if (task.project && typeof task.project === "object") {
      return task.project.name || "Unknown Project";
    }

    return "Unknown Project";
  };

  // ========================================
  // GET ASSIGNEE NAME
  // ========================================

  const getAssigneeName = (task) => {
    if (task.assignee && typeof task.assignee === "object") {
      return task.assignee.name || "Unassigned";
    }

    return "Unassigned";
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
  // SEARCH + FILTER
  // ========================================

  const filteredTasks = tasks.filter((task) => {
    const projectName = getProjectName(task);

    const searchValue = search.toLowerCase();

    const matchesSearch =
      task.title?.toLowerCase().includes(searchValue) ||
      projectName.toLowerCase().includes(searchValue);

    const matchesStatus = status === "All" || task.status === status;

    const matchesPriority = priority === "All" || task.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusStyle = (taskStatus) => {
    if (taskStatus === "Todo") {
      return "bg-gray-100 text-gray-600";
    }

    if (taskStatus === "In Progress") {
      return "bg-blue-50 text-blue-600";
    }

    if (taskStatus === "Review") {
      return "bg-yellow-50 text-yellow-600";
    }

    return "bg-green-50 text-green-600";
  };

  // ========================================
  // PRIORITY STYLE
  // ========================================

  const getPriorityStyle = (taskPriority) => {
    if (taskPriority === "High") {
      return "bg-red-50 text-red-600";
    }

    if (taskPriority === "Medium") {
      return "bg-yellow-50 text-yellow-600";
    }

    return "bg-green-50 text-green-600";
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* ========================================
          SIDEBAR
      ======================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* ========================================
          RIGHT CONTENT
      ======================================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        {/* ========================================
            TOPBAR

            Everyone can create tasks
        ======================================== */}

        <Topbar
          setIsOpen={setIsOpen}
          title="Tasks"
          actionLabel="Add Task"
          onAction={() => setShowModal(true)}
        />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* ========================================
              PAGE HEADING
          ======================================== */}

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">All Tasks</h2>

            <p className="text-sm text-gray-500 mt-1">
              View and manage your team's tasks
            </p>
          </div>

          {/* ========================================
              SEARCH + FILTER
          ======================================== */}

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              {/* SEARCH */}

              <div className="relative flex-1">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks or projects..."
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                />
              </div>

              {/* STATUS */}

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-purple-500"
              >
                <option value="All">All Status</option>

                <option value="Todo">Todo</option>

                <option value="In Progress">In Progress</option>

                <option value="Review">Review</option>

                <option value="Completed">Completed</option>
              </select>

              {/* PRIORITY */}

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-purple-500"
              >
                <option value="All">All Priority</option>

                <option value="High">High</option>

                <option value="Medium">Medium</option>

                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* ========================================
              LOADING
          ======================================== */}

          {loading && (
            <div className="bg-white border border-gray-100 rounded-xl mt-4 p-10 text-center shadow-sm">
              <p className="text-sm text-gray-500">Loading tasks...</p>
            </div>
          )}

          {/* ========================================
              DESKTOP TABLE
          ======================================== */}

          {!loading && (
            <div className="hidden md:block bg-white border border-gray-100 rounded-xl mt-4 shadow-sm">
              {/* TABLE HEADER */}

              <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 bg-gray-50 border-b border-gray-100 rounded-t-xl">
                <p className="text-xs font-medium text-gray-500">Task</p>

                <p className="text-xs font-medium text-gray-500">Project</p>

                <p className="text-xs font-medium text-gray-500">Assignee</p>

                <p className="text-xs font-medium text-gray-500">Priority</p>

                <p className="text-xs font-medium text-gray-500">Status</p>

                <p className="text-xs font-medium text-gray-500">Due Date</p>

                <div />
              </div>

              {/* TASK ROWS */}

              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr_1fr_40px] gap-4 items-center px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  {/* TASK */}

                  <p className="text-sm font-medium text-gray-800">
                    {task.title}
                  </p>

                  {/* PROJECT */}

                  <p className="text-xs text-gray-500">
                    {getProjectName(task)}
                  </p>

                  {/* ASSIGNEE */}

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <FiUser size={13} />
                    </div>

                    <span className="text-xs text-gray-600 truncate">
                      {getAssigneeName(task)}
                    </span>
                  </div>

                  {/* PRIORITY */}

                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityStyle(
                        task.priority,
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* STATUS */}

                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        task.status,
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* DUE DATE */}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <FiCalendar />

                    <span>{formatDate(task.dueDate)}</span>
                  </div>

                  {/* ========================================
                        THREE DOT MENU

                        Edit = Everyone
                        Delete = Project Manager
                    ======================================== */}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleTaskMenu(task._id)}
                      className="text-gray-400 hover:text-gray-700 p-1"
                    >
                      <FiMoreHorizontal size={18} />
                    </button>

                    {openMenuId === task._id && (
                      <div className="absolute right-0 top-8 z-[100] w-32 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                        {/* EDIT - EVERYONE */}

                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        {/* DELETE - PROJECT MANAGER ONLY */}

                        {isProjectManager && (
                          <button
                            type="button"
                            onClick={() => openDeleteModal(task)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================
              MOBILE TASK CARDS
          ======================================== */}

          {!loading && (
            <div className="md:hidden mt-4 space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                >
                  {/* TOP */}

                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800">
                        {task.title}
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        {getProjectName(task)}
                      </p>
                    </div>

                    {/* ========================================
                          THREE DOT

                          Edit = Everyone
                          Delete = Project Manager
                      ======================================== */}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleTaskMenu(task._id)}
                        className="text-gray-400 p-1"
                      >
                        <FiMoreHorizontal size={18} />
                      </button>

                      {openMenuId === task._id && (
                        <div className="absolute right-0 top-8 z-[100] w-32 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          {/* DELETE */}

                          {isProjectManager && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(task)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRIORITY + STATUS */}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs ${getPriorityStyle(
                        task.priority,
                      )}`}
                    >
                      {task.priority}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs ${getStatusStyle(
                        task.status,
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* FOOTER */}

                  <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between gap-3">
                    {/* ASSIGNEE */}

                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 shrink-0 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <FiUser size={13} />
                      </div>

                      <span className="text-xs text-gray-500 truncate">
                        {getAssigneeName(task)}
                      </span>
                    </div>

                    {/* DATE */}

                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <FiCalendar />

                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================
              NO RESULTS
          ======================================== */}

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl mt-4 p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-700">
                No tasks found
              </h3>

              <p className="text-sm text-gray-400 mt-2">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ========================================
          ADD TASK MODAL

          ALL TEAM MEMBERS
      ======================================== */}

      {showModal && (
        <AddTaskModal
          projects={projects}
          members={members}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* ========================================
          EDIT TASK MODAL

          ALL TEAM MEMBERS
      ======================================== */}

      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          projects={projects}
          members={members}
          onUpdate={handleUpdateTask}
          onClose={() => {
            setShowEditModal(false);

            setEditingTask(null);
          }}
        />
      )}

      {/* ========================================
          DELETE CONFIRMATION

          PROJECT MANAGER ONLY
      ======================================== */}

      {isProjectManager && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Task"
          message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteTask}
          onClose={() => {
            if (deleteLoading) {
              return;
            }

            setShowDeleteModal(false);

            setSelectedTask(null);
          }}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default Tasks;
