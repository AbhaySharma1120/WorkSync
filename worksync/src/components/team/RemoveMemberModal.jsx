import { FiAlertTriangle, FiX } from "react-icons/fi";

const RemoveMemberModal = ({ member, onClose, onConfirm, loading }) => {
  if (!member) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiAlertTriangle size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Remove Team Member
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Remove this member from your workspace
              </p>
            </div>
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

        {/* BODY */}

        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-gray-600">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-gray-800">{member.name}</span>{" "}
            from this WorkSync team?
          </p>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">{member.name}</p>

            <p className="mt-1 text-xs text-gray-500">{member.email}</p>

            <p className="mt-1 text-xs font-medium text-purple-600">
              {member.role}
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-red-500">
            The account will not be deleted, but the user will no longer belong
            to this team.
          </p>
        </div>

        {/* BUTTONS */}

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Member
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove Member"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
