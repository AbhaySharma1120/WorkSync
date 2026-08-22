import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

const ChangeRoleModal = ({ member, onClose, onConfirm, loading }) => {
  const [role, setRole] = useState("");

  useEffect(() => {
    if (member) {
      setRole(member.role);
    }
  }, [member]);

  if (!member) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onConfirm(role);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Change Member Role
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Update {member.name}'s team role
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            <FiX size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* MEMBER */}

            <div className="mb-5 rounded-xl bg-purple-50 p-4">
              <p className="text-sm font-semibold text-gray-800">
                {member.name}
              </p>

              <p className="mt-1 text-xs text-gray-500">{member.email}</p>
            </div>

            {/* ROLE */}

            <label className="text-sm font-medium text-gray-700">
              Team Role
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            >
              <option value="Project Manager">Project Manager</option>

              <option value="Frontend Developer">Frontend Developer</option>

              <option value="Backend Developer">Backend Developer</option>

              <option value="UI/UX Designer">UI/UX Designer</option>

              <option value="QA Engineer">QA Engineer</option>
            </select>
          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
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
              disabled={loading || role === member.role}
              className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
