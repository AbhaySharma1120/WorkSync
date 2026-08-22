import { useEffect, useState } from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";

function AddEventModal({
  onClose,
  onSubmit,
  onDelete,
  event = null,
  saving = false,
  deleting = false,
}) {
  const isEditing = Boolean(event);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDateForInput = (date) => {
    if (!date) return "";

    const value = new Date(date);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    if (!date) return "";

    const value = new Date(date);
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    type: "Meeting",
    location: "",
    allDay: false,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!event) return;

    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: formatDateForInput(event.startDate),
      time: event.allDay ? "" : formatTimeForInput(event.startDate),
      endDate: event.endDate ? formatDateForInput(event.endDate) : "",
      endTime:
        event.endDate && !event.allDay ? formatTimeForInput(event.endDate) : "",
      type: event.type || "Meeting",
      location: event.location || "",
      allDay: Boolean(event.allDay),
    });
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setError("");

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.date) {
      setError("Event date is required");
      return;
    }

    if (!formData.allDay && !formData.time) {
      setError("Event time is required");
      return;
    }

    let startDate;

    if (formData.allDay) {
      startDate = new Date(`${formData.date}T00:00:00`);
    } else {
      startDate = new Date(`${formData.date}T${formData.time}:00`);
    }

    if (Number.isNaN(startDate.getTime())) {
      setError("Invalid start date");
      return;
    }

    let endDate = null;

    if (formData.endDate) {
      if (formData.allDay) {
        endDate = new Date(`${formData.endDate}T23:59:59`);
      } else {
        const finalEndTime = formData.endTime || formData.time;
        endDate = new Date(`${formData.endDate}T${finalEndTime}:00`);
      }

      if (Number.isNaN(endDate.getTime())) {
        setError("Invalid end date");
        return;
      }

      if (endDate < startDate) {
        setError("End date cannot be before start date");
        return;
      }
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      allDay: formData.allDay,
      type: formData.type,
      location: formData.location.trim(),
    };

    onSubmit(payload);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    await onDelete();
    setShowDeleteConfirm(false);
  };

  if (!event && isEditing) return null;

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
        <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white flex items-center justify-between border-b border-gray-100 px-6 py-4 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? "Edit Event" : "Add New Event"}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {isEditing
                  ? "Update your calendar event details"
                  : "Add a meeting, deadline or reminder"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Event Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
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
                rows={3}
                placeholder="Add event details..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
              />
            </div>

            {/* All day */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
                className="h-4 w-4 accent-purple-600"
              />

              <div>
                <p className="text-sm font-medium text-gray-700">
                  All-day event
                </p>
                <p className="text-xs text-gray-400">
                  Event does not require a specific time
                </p>
              </div>
            </label>

            {/* Date + Time */}
            <div
              className={`grid grid-cols-1 ${
                formData.allDay ? "" : "sm:grid-cols-2"
              } gap-4`}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>

              {!formData.allDay && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Time
                  </label>

                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* End Date + End Time */}
            <div
              className={`grid grid-cols-1 ${
                formData.allDay ? "" : "sm:grid-cols-2"
              } gap-4`}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">
                  End Date
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.date || undefined}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>

              {!formData.allDay && formData.endDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Event Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-500"
              >
                <option value="Meeting">Meeting</option>
                <option value="Deadline">Deadline</option>
                <option value="Reminder">Reminder</option>
                <option value="Event">Event</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Location
              </label>

              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Google Meet / Meeting Room / Online"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div>
                {isEditing && onDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={saving || deleting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <FiTrash2 />
                    Delete
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving || deleting}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Add Event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* CUSTOM DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertTriangle size={24} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete Event
                </h3>

                <p className="mt-2 text-sm text-gray-500 leading-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-700">
                    "{event?.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <FiTrash2 />
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddEventModal;
