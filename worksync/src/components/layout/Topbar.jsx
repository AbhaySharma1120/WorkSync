import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { FiSearch, FiBell, FiMail, FiPlus, FiMenu } from "react-icons/fi";

import { io } from "socket.io-client";

import api from "../../api/axios";
import toast from "react-hot-toast";

// ========================================
// SOCKET SERVER URL
// ========================================

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function Topbar({
  setIsOpen,
  title = "Dashboard",
  actionLabel = "",
  onAction,
}) {
  const navigate = useNavigate();

  // ========================================
  // SEARCH
  // ========================================

  const [search, setSearch] = useState("");

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationLoading, setNotificationLoading] = useState(true);

  // ========================================
  // CHAT UNREAD COUNT
  // ========================================

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // ========================================
  // SEARCHABLE PAGES
  // ========================================

  const pages = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Projects",
      path: "/projects",
    },
    {
      name: "Tasks",
      path: "/tasks",
    },
    {
      name: "Kanban Board",
      path: "/kanban",
    },
    {
      name: "Team",
      path: "/team",
    },
    {
      name: "Chat",
      path: "/chat",
    },
    {
      name: "Calendar",
      path: "/calendar",
    },
    {
      name: "Files",
      path: "/files",
    },
    {
      name: "Reports",
      path: "/reports",
    },
    {
      name: "Settings",
      path: "/settings",
    },
  ];

  // ========================================
  // FETCH NOTIFICATIONS
  // ========================================

  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) {
        setNotificationLoading(true);
      }

      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);

      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
    } finally {
      if (showLoader) {
        setNotificationLoading(false);
      }
    }
  };

  // ========================================
  // FETCH CHAT UNREAD COUNT
  // ========================================

  const fetchChatUnreadCount = async () => {
    try {
      const response = await api.get("/chat/conversations");

      const conversations = response.data.conversations || [];

      /*
          Every conversation contains its
          own unreadCount.

          Example:

          Abhay -> 2
          Rahul -> 1
          Mohit -> 0

          Total badge = 3
        */

      const totalUnread = conversations.reduce(
        (total, conversation) => total + Number(conversation.unreadCount || 0),
        0,
      );

      setUnreadChatCount(totalUnread);
    } catch (error) {
      console.error("Fetch Chat Unread Count Error:", error);
    }
  };

  // ========================================
  // LOAD NOTIFICATIONS
  // ========================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ========================================
  // LOAD CHAT UNREAD COUNT
  // ========================================

  useEffect(() => {
    fetchChatUnreadCount();
  }, []);

  // ========================================
  // REAL-TIME CHAT BADGE
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },

      transports: ["websocket", "polling"],

      autoConnect: false,
    });

    // ========================================
    // NEW CHAT MESSAGE
    // ========================================

    socket.on("newMessage", () => {
      /*
          Wait a small amount because if
          Chat.jsx is currently open it may
          immediately mark the message read.
        */

      setTimeout(() => {
        fetchChatUnreadCount();
      }, 400);
    });

    // ========================================
    // SOCKET RECONNECTED
    // ========================================

    socket.on("connect", () => {
      /*
          Refresh badge after reconnecting
          in case messages arrived while
          connection was unavailable.
        */

      fetchChatUnreadCount();
    });

    socket.on("connect_error", (error) => {
      console.error("Topbar Chat Socket Error:", error.message);
    });

    socket.connect();

    return () => {
      socket.off("newMessage");

      socket.off("connect");

      socket.off("connect_error");

      socket.disconnect();
    };
  }, []);

  // ========================================
  // CHAT UNREAD EVENT FROM CHAT.JSX
  // ========================================

  useEffect(() => {
    /*
      Chat.jsx can tell Topbar immediately
      whenever its unread counts change.

      This lets the badge decrease instantly
      when a conversation is opened/read.
    */

    const handleUnreadChange = (event) => {
      const count = event.detail?.count;

      if (typeof count === "number") {
        setUnreadChatCount(Math.max(count, 0));

        return;
      }

      fetchChatUnreadCount();
    };

    // ========================================
    // REFRESH WHEN WINDOW GAINS FOCUS
    // ========================================

    const handleWindowFocus = () => {
      fetchChatUnreadCount();
    };

    window.addEventListener("worksync:chat-unread-changed", handleUnreadChange);

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener(
        "worksync:chat-unread-changed",
        handleUnreadChange,
      );

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // ========================================
  // OPEN NOTIFICATION DROPDOWN
  // ========================================

  const handleNotificationToggle = () => {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    /*
        Refresh notifications whenever
        user opens the bell.
      */

    if (nextState) {
      fetchNotifications(false);
    }
  };

  // ========================================
  // MARK ALL NOTIFICATIONS AS READ
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
        error.response?.data?.message || "Failed to mark notifications as read",
      );
    }
  };

  // ========================================
  // CLICK ONE NOTIFICATION
  // ========================================

  const handleNotificationClick = async (notification) => {
    try {
      // Mark only unread notification
      if (!notification.isRead) {
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
      }

      setShowNotifications(false);

      // Navigate to related page
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Open Notification Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to open notification",
      );
    }
  };

  // ========================================
  // OPEN CHAT
  // ========================================

  const handleChatClick = () => {
    setShowNotifications(false);

    navigate("/chat");

    /*
        Do NOT automatically set badge
        to zero here.

        A user may have unread messages
        from multiple conversations.

        Chat.jsx will tell Topbar which
        messages have actually been read.
      */
  };

  // ========================================
  // FORMAT NOTIFICATION TIME
  // ========================================

  const getRelativeTime = (date) => {
    if (!date) {
      return "";
    }

    const now = new Date();

    const createdAt = new Date(date);

    const difference = now - createdAt;

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(minutes / 60);

    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ========================================
  // SEARCH FILTER
  // ========================================

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ========================================
  // SEARCH SUBMIT
  // ========================================

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) {
      return;
    }

    const matchedPage = pages.find((page) =>
      page.name.toLowerCase().includes(search.toLowerCase()),
    );

    if (matchedPage) {
      navigate(matchedPage.path);

      setSearch("");
    }
  };

  // ========================================
  // SEARCH SUGGESTION
  // ========================================

  const handleSuggestionClick = (path) => {
    navigate(path);

    setSearch("");
  };

  return (
    <header className="relative bg-white border-b border-gray-200 px-4 sm:px-6">
      {/* =========================
          MAIN TOPBAR
      ========================== */}

      <div className="h-16 flex items-center justify-between">
        {/* =========================
            LEFT SIDE
        ========================== */}

        <div className="flex items-center gap-3">
          {/* MOBILE HAMBURGER */}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="lg:hidden text-gray-700 hover:text-purple-600"
          >
            <FiMenu size={22} />
          </button>

          {/* PAGE TITLE */}

          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* =========================
            RIGHT SIDE
        ========================== */}

        <div className="flex items-center gap-3">
          {/* =========================
              DESKTOP SEARCH
          ========================== */}

          <div className="relative hidden md:block">
            <form onSubmit={handleSearch} className="relative w-56 xl:w-64">
              <FiSearch
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
                className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
              />
            </form>

            {/* SEARCH SUGGESTIONS */}

            {search.trim() && (
              <div className="absolute top-11 left-0 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-[70] overflow-hidden">
                {filteredPages.length > 0 ? (
                  filteredPages.map((page) => (
                    <button
                      type="button"
                      key={page.path}
                      onClick={() => handleSuggestionClick(page.path)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      {page.name}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-400">
                    No page found
                  </p>
                )}
              </div>
            )}
          </div>

          {/* =========================
              REAL NOTIFICATIONS
          ========================== */}

          <div className="relative">
            {/* BELL */}

            <button
              type="button"
              onClick={handleNotificationToggle}
              className="relative text-gray-600 hover:text-purple-600"
            >
              <FiBell size={19} />

              {/* UNREAD NOTIFICATION BADGE */}

              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] px-1 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* =========================
                NOTIFICATION DROPDOWN
            ========================== */}

            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 max-w-[90vw] bg-white border border-gray-100 rounded-xl shadow-xl z-[80] overflow-hidden">
                {/* =========================
                    HEADER
                ========================== */}

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Notifications
                    </h3>

                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {unreadCount} unread
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs text-purple-600 hover:text-purple-700 whitespace-nowrap"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* =========================
                    LOADING
                ========================== */}

                {notificationLoading && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-gray-400">
                      Loading notifications...
                    </p>
                  </div>
                )}

                {/* =========================
                    EMPTY STATE
                ========================== */}

                {!notificationLoading && notifications.length === 0 && (
                  <div className="py-10 px-4 text-center">
                    <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                      <FiBell size={18} />
                    </div>

                    <p className="text-sm font-medium text-gray-600 mt-3">
                      No notifications
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      You're all caught up.
                    </p>
                  </div>
                )}

                {/* =========================
                    NOTIFICATION LIST
                ========================== */}

                {!notificationLoading && notifications.length > 0 && (
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.slice(0, 6).map((notification) => (
                      <button
                        type="button"
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 transition ${
                          notification.isRead
                            ? "bg-white hover:bg-gray-50"
                            : "bg-purple-50/50 hover:bg-purple-50"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* UNREAD DOT */}

                          <div className="w-2 shrink-0 pt-1.5">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-purple-600 rounded-full" />
                            )}
                          </div>

                          {/* CONTENT */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm truncate ${
                                  notification.isRead
                                    ? "font-medium text-gray-600"
                                    : "font-semibold text-gray-800"
                                }`}
                              >
                                {notification.title}
                              </p>

                              <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 mt-1 leading-5">
                              {notification.message}
                            </p>

                            {/* SENDER */}

                            {notification.sender?.name && (
                              <p className="text-[10px] text-gray-400 mt-1.5">
                                From{" "}
                                <span className="text-gray-500 font-medium">
                                  {notification.sender.name}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* =========================
                    VIEW ALL
                ========================== */}

                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);

                    navigate("/notifications");
                  }}
                  className="w-full py-3 border-t border-gray-100 text-xs font-medium text-purple-600 hover:bg-purple-50"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* =========================
              REAL CHAT UNREAD BADGE
          ========================== */}

          <button
            type="button"
            onClick={handleChatClick}
            title={
              unreadChatCount > 0
                ? `${unreadChatCount} unread message${
                    unreadChatCount === 1 ? "" : "s"
                  }`
                : "Chat"
            }
            className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-purple-600"
          >
            <FiMail size={19} />

            {/* UNREAD CHAT BADGE */}

            {unreadChatCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] px-1 bg-purple-600 text-white rounded-full flex items-center justify-center text-[9px] font-medium">
                {unreadChatCount > 99 ? "99+" : unreadChatCount}
              </span>
            )}
          </button>

          {/* =========================
              PAGE ACTION BUTTON
          ========================== */}

          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              title={actionLabel}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-2.5 sm:px-3 py-2 rounded-lg text-sm transition"
            >
              <FiPlus />

              <span className="hidden md:inline">{actionLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================
          MOBILE SEARCH
      ========================== */}

      <div className="pb-3 md:hidden">
        <div className="relative">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anything..."
              className="w-full border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
            />
          </form>

          {/* MOBILE SEARCH SUGGESTIONS */}

          {search.trim() && (
            <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg z-[70] overflow-hidden">
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <button
                    type="button"
                    key={page.path}
                    onClick={() => handleSuggestionClick(page.path)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                  >
                    {page.name}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">No page found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
