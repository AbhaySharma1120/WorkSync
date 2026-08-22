import { useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

function NewProjectModal({ onClose, onCreate }) {
  // Store form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    dueDate: "",
  });

  // Prevent multiple clicks while creating
  const [loading, setLoading] = useState(false);

  // Runs whenever user types/selects something
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Runs when form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Project description is required");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    // Data that backend actually expects
    const projectData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      dueDate: formData.dueDate,
    };

    try {
      setLoading(true);

      // Send project to Projects.jsx
      const success = await onCreate(projectData);

      // Close modal only if backend successfully created project
      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Create New Project
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Project Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter project description"
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Status + Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
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
                <option value="Planning">Planning</option>

                <option value="In Progress">In Progress</option>

                <option value="On Hold">On Hold</option>

                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Due Date */}
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
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;
