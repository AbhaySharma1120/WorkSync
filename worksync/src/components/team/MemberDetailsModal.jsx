import { FiMail, FiUser, FiX } from "react-icons/fi";

const MemberDetailsModal = ({ member, onClose }) => {
  if (!member) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Member Details
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              View team member information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <FiX size={21} />
          </button>
        </div>

        {/* MEMBER */}

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-lg font-semibold text-purple-600">
              {getInitials(member.name)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {member.name}
              </h3>

              <p className="mt-1 text-sm font-medium text-purple-600">
                {member.role}
              </p>
            </div>
          </div>

          {/* EMAIL */}

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <FiMail className="text-gray-400" />

              <div>
                <p className="text-xs text-gray-400">Email Address</p>

                <p className="mt-1 text-sm text-gray-700">{member.email}</p>
              </div>
            </div>
          </div>

          {/* TASK STATS */}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xl font-semibold text-gray-800">
                {member.activeTasks || 0}
              </p>

              <p className="mt-1 text-xs text-gray-400">Active Tasks</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xl font-semibold text-gray-800">
                {member.completedTasks || 0}
              </p>

              <p className="mt-1 text-xs text-gray-400">Completed</p>
            </div>
          </div>

          {/* STATUS */}

          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />

            <span className="text-xs text-gray-500">
              Registered WorkSync Member
            </span>
          </div>
        </div>

        {/* BUTTON */}

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsModal;
