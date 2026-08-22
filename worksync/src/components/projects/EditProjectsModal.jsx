import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

function EditProjectModal({ project, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    dueDate: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "Planning",
        dueDate: project.dueDate ? project.dueDate.split("T")[0] : "",
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setLoading(true);

      const success = await onUpdate({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Edit Project</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700"
          >
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Project Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full mt-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <option value="Completed">Completed</option>

                <option value="On Hold">On Hold</option>
              </select>
            </div>

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
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectModal;
