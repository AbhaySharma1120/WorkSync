import { useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

function AddTaskModal({ projects = [], members = [], onClose, onCreate }) {
  // ========================================
  // FORM DATA
  // ========================================

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    assignee: "",
    priority: "Medium",
    status: "Todo",
    dueDate: "",
  });

  const [loading, setLoading] = useState(false);

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ========================================
  // SUBMIT TASK
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!formData.title.trim()) {
      toast.error("Please enter task title");
      return;
    }

    // Validate project
    if (!formData.project) {
      toast.error("Please select a project");
      return;
    }

    try {
      setLoading(true);

      // Data sent to backend
      const taskData = {
        title: formData.title.trim(),

        description: formData.description.trim(),

        project: formData.project,

        assignee: formData.assignee || null,

        priority: formData.priority,

        status: formData.status,

        dueDate: formData.dueDate || null,
      };

      const success = await onCreate(taskData);

      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* =================================
            HEADER
        ================================== */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Add New Task</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* =================================
            FORM
        ================================== */}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* =================================
              TASK TITLE
          ================================== */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Task Title
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* =================================
              DESCRIPTION
          ================================== */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows={3}
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* =================================
              PROJECT
          ================================== */}

          <div>
            <label className="text-sm font-medium text-gray-700">Project</label>

            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 bg-white"
            >
              <option value="">Select project</option>

              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>

            {projects.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                No projects available. Create a project first.
              </p>
            )}
          </div>

          {/* =================================
              ASSIGNEE
          ================================== */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Assignee
            </label>

            <select
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 bg-white"
            >
              <option value="">Unassigned</option>

              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>

            {members.length === 0 && (
              <p className="text-xs text-gray-400 mt-2">
                No team members available.
              </p>
            )}
          </div>

          {/* =================================
              PRIORITY + STATUS
          ================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PRIORITY */}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 bg-white"
              >
                <option value="High">High</option>

                <option value="Medium">Medium</option>

                <option value="Low">Low</option>
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 bg-white"
              >
                <option value="Todo">Todo</option>

                <option value="In Progress">In Progress</option>

                <option value="Review">Review</option>

                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* =================================
              DUE DATE
          ================================== */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Due Date
            </label>

            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* =================================
              BUTTONS
          ================================== */}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || projects.length === 0}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
