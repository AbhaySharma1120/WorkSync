import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiCalendar,
  FiMoreHorizontal,
  FiUser,
  FiPlus,
  FiFlag,
  FiClock,
} from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

function KanbanBoard() {
  // ========================================
  // STATES
  // ========================================

  // Mobile sidebar
  const [isOpen, setIsOpen] = useState(false);

  // Tasks from MongoDB
  const [tasks, setTasks] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Currently dragged task ID
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Stores which column menu is open
  const [openColumnMenu, setOpenColumnMenu] = useState(null);

  /*
    Stores sorting mode separately
    for every Kanban column.

    Example:
    {
      Todo: "priority",
      "In Progress": "dueDate"
    }
  */
  const [columnSorts, setColumnSorts] = useState({});

  const navigate = useNavigate();

  // ========================================
  // KANBAN COLUMNS
  // ========================================

  const columns = ["Todo", "In Progress", "Review", "Completed"];

  // ========================================
  // FETCH TASKS
  // ========================================

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);

        const response = await api.get("/tasks");

        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error("Fetch Kanban Tasks Error:", error);

        toast.error(error.response?.data?.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // ========================================
  // DRAG START
  // ========================================

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  // ========================================
  // DROP TASK
  // ========================================

  const handleDrop = async (newStatus) => {
    if (!draggedTaskId) {
      return;
    }

    // Find dragged task
    const draggedTask = tasks.find((task) => task._id === draggedTaskId);

    if (!draggedTask) {
      setDraggedTaskId(null);
      return;
    }

    // Task already in same column
    if (draggedTask.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Remember old status
    // in case API fails
    const oldStatus = draggedTask.status;

    // ========================================
    // OPTIMISTIC UI UPDATE
    // ========================================

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task._id === draggedTaskId
          ? {
              ...task,
              status: newStatus,
            }
          : task,
      ),
    );

    try {
      // ========================================
      // UPDATE MONGODB
      // ========================================

      const response = await api.put(`/tasks/${draggedTaskId}`, {
        status: newStatus,
      });

      // Replace optimistic task
      // with backend response
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === draggedTaskId ? response.data.task : task,
        ),
      );

      toast.success(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error("Update Kanban Task Error:", error);

      // ========================================
      // ROLLBACK
      // ========================================

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === draggedTaskId
            ? {
                ...task,
                status: oldStatus,
              }
            : task,
        ),
      );

      toast.error(error.response?.data?.message || "Failed to update task");
    } finally {
      setDraggedTaskId(null);
    }
  };

  // ========================================
  // ALLOW DROP
  // ========================================

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // ========================================
  // TOGGLE COLUMN MENU
  // ========================================

  const toggleColumnMenu = (column) => {
    setOpenColumnMenu((previousColumn) =>
      previousColumn === column ? null : column,
    );
  };

  // ========================================
  // ADD TASK FROM COLUMN MENU
  // ========================================

  const handleAddTask = (column) => {
    setOpenColumnMenu(null);

    /*
      For now we open Tasks page.

      Later we can make AddTaskModal open
      directly from Kanban and automatically
      set status based on this column.
    */

    navigate("/tasks");

    toast(`Add a task for ${column}`);
  };

  // ========================================
  // SORT COLUMN
  // ========================================

  const handleColumnSort = (column, sortType) => {
    setColumnSorts((previousSorts) => ({
      ...previousSorts,
      [column]: sortType,
    }));

    setOpenColumnMenu(null);
  };

  // ========================================
  // GET SORTED COLUMN TASKS
  // ========================================

  const getColumnTasks = (column) => {
    const columnTasks = tasks.filter((task) => task.status === column);

    const sortType = columnSorts[column];

    // No sorting selected
    if (!sortType) {
      return columnTasks;
    }

    // Copy array before sorting
    const sortedTasks = [...columnTasks];

    // ========================================
    // SORT BY PRIORITY
    // High → Medium → Low
    // ========================================

    if (sortType === "priority") {
      const priorityOrder = {
        High: 3,
        Medium: 2,
        Low: 1,
      };

      return sortedTasks.sort(
        (a, b) =>
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0),
      );
    }

    // ========================================
    // SORT BY DUE DATE
    // Nearest date first
    // No date goes to bottom
    // ========================================

    if (sortType === "dueDate") {
      return sortedTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) {
          return 0;
        }

        if (!a.dueDate) {
          return 1;
        }

        if (!b.dueDate) {
          return -1;
        }

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return sortedTasks;
  };

  // ========================================
  // PROJECT NAME
  // ========================================

  const getProjectName = (task) => {
    if (task.project && typeof task.project === "object") {
      return task.project.name || "Unknown Project";
    }

    return "Unknown Project";
  };

  // ========================================
  // ASSIGNEE NAME
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
      return "No date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ========================================
  // PRIORITY STYLE
  // ========================================

  const getPriorityStyle = (priority) => {
    if (priority === "High") {
      return "bg-red-50 text-red-600";
    }

    if (priority === "Medium") {
      return "bg-yellow-50 text-yellow-600";
    }

    return "bg-green-50 text-green-600";
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* =====================================
          SIDEBAR
      ====================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =====================================
          RIGHT CONTENT
      ====================================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar
          setIsOpen={setIsOpen}
          title="Kanban Board"
          actionLabel="Add Task"
          onAction={() => navigate("/tasks")}
        />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =====================================
              PAGE HEADING
          ====================================== */}

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Project Tasks
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Drag and drop tasks to update their status
            </p>
          </div>

          {/* =====================================
              LOADING
          ====================================== */}

          {loading && (
            <div className="bg-white border border-gray-100 rounded-xl p-10 shadow-sm text-center">
              <p className="text-sm text-gray-500">Loading Kanban tasks...</p>
            </div>
          )}

          {/* =====================================
              KANBAN BOARD
          ====================================== */}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {columns.map((column) => {
                // Get tasks for current
                // column with selected sorting
                const columnTasks = getColumnTasks(column);

                return (
                  <div
                    key={column}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(column)}
                    className="bg-gray-100 rounded-xl p-3 min-h-[350px]"
                  >
                    {/* =====================
                          COLUMN HEADER
                      ====================== */}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">
                          {column}
                        </h3>

                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-gray-500">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* =====================
                            THREE DOT MENU
                        ====================== */}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => toggleColumnMenu(column)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition"
                        >
                          <FiMoreHorizontal size={18} />
                        </button>

                        {/* DROPDOWN */}

                        {openColumnMenu === column && (
                          <div className="absolute right-0 top-9 z-[200] w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                            {/* ADD TASK */}

                            <button
                              type="button"
                              onClick={() => handleAddTask(column)}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <FiPlus size={15} />
                              Add Task
                            </button>

                            {/* SORT PRIORITY */}

                            <button
                              type="button"
                              onClick={() =>
                                handleColumnSort(column, "priority")
                              }
                              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                                columnSorts[column] === "priority"
                                  ? "text-purple-600 bg-purple-50"
                                  : "text-gray-600"
                              }`}
                            >
                              <FiFlag size={15} />
                              Sort by Priority
                            </button>

                            {/* SORT DUE DATE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleColumnSort(column, "dueDate")
                              }
                              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                                columnSorts[column] === "dueDate"
                                  ? "text-purple-600 bg-purple-50"
                                  : "text-gray-600"
                              }`}
                            >
                              <FiClock size={15} />
                              Sort by Due Date
                            </button>

                            {/* DEFAULT ORDER */}

                            {columnSorts[column] && (
                              <>
                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => handleColumnSort(column, null)}
                                  className="w-full px-4 py-2.5 text-left text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                >
                                  Reset sorting
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* =====================
                          SORT INDICATOR
                      ====================== */}

                    {columnSorts[column] && (
                      <div className="mb-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-[11px] text-gray-400">
                          Sorted by
                        </span>

                        <span className="text-[11px] font-medium text-purple-600">
                          {columnSorts[column] === "priority"
                            ? "Priority"
                            : "Due Date"}
                        </span>
                      </div>
                    )}

                    {/* =====================
                          TASK CARDS
                      ====================== */}

                    <div className="space-y-3">
                      {columnTasks.map((task) => (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={() => handleDragStart(task._id)}
                          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition"
                        >
                          {/* PROJECT */}

                          <p className="text-[11px] text-purple-600 font-medium">
                            {getProjectName(task)}
                          </p>

                          {/* TASK TITLE */}

                          <h4 className="text-sm font-semibold text-gray-800 mt-2">
                            {task.title}
                          </h4>

                          {/* PRIORITY */}

                          <div className="mt-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${getPriorityStyle(
                                task.priority,
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* DIVIDER */}

                          <div className="border-t border-gray-100 my-4" />

                          {/* =================
                                  CARD FOOTER
                              ================== */}

                          <div className="flex items-center justify-between gap-2">
                            {/* ASSIGNEE */}

                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <FiUser size={13} />
                              </div>

                              <span className="text-xs text-gray-500 truncate">
                                {getAssigneeName(task)}
                              </span>
                            </div>

                            {/* DUE DATE */}

                            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                              <FiCalendar size={13} />

                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* =====================
                            EMPTY COLUMN
                        ====================== */}

                      {columnTasks.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                          <p className="text-xs text-gray-400">
                            Drop tasks here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default KanbanBoard;
