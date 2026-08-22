import { useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const InviteMemberModal = ({ onClose, onInvite }) => {
  // ========================================
  // FORM DATA
  // ========================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Frontend Developer",
  });

  const [loading, setLoading] = useState(false);

  // ========================================
  // HANDLE CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ========================================
  // SUBMIT INVITATION
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name
    if (!formData.name.trim()) {
      toast.error("Please enter member name");
      return;
    }

    // Validate email
    if (!formData.email.trim()) {
      toast.error("Please enter member email");
      return;
    }

    try {
      setLoading(true);

      const invitationData = {
        name: formData.name.trim(),

        email: formData.email.trim().toLowerCase(),

        role: formData.role,
      };

      const success = await onInvite(invitationData);

      if (success) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      {/* Modal */}

      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* =================================
            HEADER
        ================================== */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Invite Team Member
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Send an invitation to join your WorkSync team
            </p>
          </div>

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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* FULL NAME */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter member name"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="member@gmail.com"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* ROLE */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Team Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            >
              <option value="Project Manager">Project Manager</option>

              <option value="Frontend Developer">Frontend Developer</option>

              <option value="Backend Developer">Backend Developer</option>

              <option value="UI/UX Designer">UI/UX Designer</option>

              <option value="QA Engineer">QA Engineer</option>
            </select>
          </div>

          {/* INFO */}

          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm leading-6 text-purple-700">
              The invitation will be stored with Pending status. Email sending
              can be added later.
            </p>
          </div>

          {/* =================================
              BUTTONS
          ================================== */}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Inviting..." : "Invite Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
