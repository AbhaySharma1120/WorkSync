import { FiAlertTriangle, FiX } from "react-icons/fi";

const CancelInvitationModal = ({ invitation, onClose, onConfirm, loading }) => {
  if (!invitation) {
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
                Cancel Invitation
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                This action will remove the pending invitation.
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
            Are you sure you want to cancel the invitation for{" "}
            <span className="font-semibold text-gray-800">
              {invitation.name}
            </span>
            ?
          </p>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">
              {invitation.name}
            </p>

            <p className="mt-1 text-xs text-gray-500">{invitation.email}</p>

            <p className="mt-1 text-xs font-medium text-purple-600">
              {invitation.role}
            </p>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            You can send a new invitation to this person later.
          </p>
        </div>

        {/* BUTTONS */}

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Invitation
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Cancel Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelInvitationModal;
