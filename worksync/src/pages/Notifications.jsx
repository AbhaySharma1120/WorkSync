import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiBell,
  FiCheckCircle,
  FiActivity,
  FiUsers,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

function Notifications() {
  // ========================================
  // NAVIGATION
  // ========================================

  const navigate = useNavigate();

  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState(null);

  // ========================================
  // FETCH NOTIFICATIONS
  // ========================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);

      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Fetch Notifications Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load notifications",
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD NOTIFICATIONS
  // ========================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ========================================
  // MARK ONE AS READ
  // ========================================

  const markAsRead = async (notification) => {
    if (notification.isRead) {
      return true;
    }

    try {
      await api.put(`/notifications/${notification._id}/read`);

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );

      setUnreadCount((previousCount) => Math.max(previousCount - 1, 0));

      return true;
    } catch (error) {
      console.error("Mark Notification Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to mark notification as read",
      );

      return false;
    }
  };

  // ========================================
  // MARK ALL AS READ
  // ========================================

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await api.put("/notifications/read-all");

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark All Notifications Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to mark all notifications as read",
      );
    }
  };

  // ========================================
  // OPEN NOTIFICATION
  // ========================================

  const handleNotificationClick = async (notification) => {
    const success = await markAsRead(notification);

    if (!success) {
      return;
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  // ========================================
  // DELETE NOTIFICATION
  // ========================================

  const handleDeleteNotification = async (e, notificationId) => {
    /*
        Prevent card click.
        Otherwise clicking Delete would
        also navigate to /tasks etc.
      */
    e.stopPropagation();

    try {
      setDeletingId(notificationId);

      const notification = notifications.find(
        (item) => item._id === notificationId,
      );

      await api.delete(`/notifications/${notificationId}`);

      setNotifications((previousNotifications) =>
        previousNotifications.filter((item) => item._id !== notificationId),
      );

      /*
          If deleted notification was unread,
          decrease unread count.
        */
      if (notification && !notification.isRead) {
        setUnreadCount((previousCount) => Math.max(previousCount - 1, 0));
      }

      toast.success("Notification deleted");
    } catch (error) {
      console.error("Delete Notification Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete notification",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // MARK READ BUTTON
  // ========================================

  const handleMarkOneRead = async (e, notification) => {
    e.stopPropagation();

    const success = await markAsRead(notification);

    if (success) {
      toast.success("Notification marked as read");
    }
  };

  // ========================================
  // GET NOTIFICATION ICON
  // ========================================

  const getIcon = (type) => {
    if (type === "task") {
      return <FiCheckCircle />;
    }

    if (type === "project") {
      return <FiActivity />;
    }

    if (type === "team" || type === "invitation") {
      return <FiUsers />;
    }

    return <FiBell />;
  };

  // ========================================
  // GET ICON STYLE
  // ========================================

  const getIconStyle = (type) => {
    if (type === "task") {
      return "bg-blue-50 text-blue-600";
    }

    if (type === "project") {
      return "bg-purple-50 text-purple-600";
    }

    if (type === "team" || type === "invitation") {
      return "bg-green-50 text-green-600";
    }

    return "bg-gray-100 text-gray-600";
  };

  // ========================================
  // RELATIVE TIME
  // ========================================

  const getRelativeTime = (date) => {
    if (!date) {
      return "";
    }

    const now = new Date();

    const created = new Date(date);

    const difference = now - created;

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(minutes / 60);

    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days < 7) {
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    return created.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* =====================================
          SIDEBAR
      ====================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar setIsOpen={setIsOpen} title="Notifications" />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =====================================
              PAGE HEADER
          ====================================== */}

          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                All Notifications
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                View your latest WorkSync activity
              </p>
            </div>

            {/* MARK ALL */}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition"
              >
                <FiCheck />
                Mark all as read
              </button>
            )}
          </div>

          {/* =====================================
              SUMMARY
          ====================================== */}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {/* TOTAL */}

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-400">Total</p>

                <p className="text-xl font-semibold text-gray-800 mt-1">
                  {notifications.length}
                </p>
              </div>

              {/* UNREAD */}

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-400">Unread</p>

                <p className="text-xl font-semibold text-purple-600 mt-1">
                  {unreadCount}
                </p>
              </div>

              {/* READ */}

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-400">Read</p>

                <p className="text-xl font-semibold text-gray-800 mt-1">
                  {notifications.length - unreadCount}
                </p>
              </div>
            </div>
          )}

          {/* =====================================
              LOADING
          ====================================== */}

          {loading && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
              <p className="text-sm text-gray-400">Loading notifications...</p>
            </div>
          )}

          {/* =====================================
              EMPTY STATE
          ====================================== */}

          {!loading && notifications.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiBell size={21} />
              </div>

              <h3 className="text-base font-semibold text-gray-700 mt-4">
                No notifications
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                You're all caught up.
              </p>
            </div>
          )}

          {/* =====================================
              NOTIFICATION LIST
          ====================================== */}

          {!loading && notifications.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group flex gap-3 sm:gap-4 p-4 sm:p-5 border-b border-gray-100 last:border-b-0 cursor-pointer transition ${
                    notification.isRead
                      ? "bg-white hover:bg-gray-50"
                      : "bg-purple-50/40 hover:bg-purple-50/70"
                  }`}
                >
                  {/* =========================
                          ICON
                      ========================== */}

                  <div
                    className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${getIconStyle(
                      notification.type,
                    )}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  {/* =========================
                          CONTENT
                      ========================== */}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* TITLE */}

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                          )}

                          <h3
                            className={`text-sm ${
                              notification.isRead
                                ? "font-medium text-gray-700"
                                : "font-semibold text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h3>
                        </div>

                        {/* MESSAGE */}

                        <p className="text-sm text-gray-500 mt-1 leading-6">
                          {notification.message}
                        </p>

                        {/* SENDER */}

                        {notification.sender?.name && (
                          <p className="text-xs text-gray-400 mt-2">
                            From{" "}
                            <span className="font-medium text-gray-500">
                              {notification.sender.name}
                            </span>
                          </p>
                        )}

                        {/* TIME */}

                        <p className="text-xs text-gray-400 mt-2">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* =========================
                              ACTIONS
                          ========================== */}

                      <div className="flex items-center gap-1 shrink-0">
                        {/* MARK READ */}

                        {!notification.isRead && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(e) => handleMarkOneRead(e, notification)}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 flex items-center justify-center transition"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}

                        {/* DELETE */}

                        <button
                          type="button"
                          title="Delete notification"
                          disabled={deletingId === notification._id}
                          onClick={(e) =>
                            handleDeleteNotification(e, notification._id)
                          }
                          className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition disabled:opacity-50"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Notifications;
