import { useEffect, useState } from "react";

import {
  FiHome,
  FiFolder,
  FiCheckSquare,
  FiColumns,
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiX,
} from "react-icons/fi";

import { useLocation, useNavigate } from "react-router-dom";

import api from "../../api/axios";

import worksyncLogo from "../../assets/logo.png";

function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ========================================
  // USER
  // ========================================

  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Stored User Parse Error:", error);

      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser());

  // ========================================
  // DEFAULT TASK VIEW
  // ========================================

  const [defaultTaskView, setDefaultTaskView] = useState("List");

  // ========================================
  // INITIALS
  // ========================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ========================================
  // FETCH SETTINGS
  // ========================================

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");

      const preference = response.data?.preferences?.defaultTaskView;

      if (preference) {
        setDefaultTaskView(preference);
      }
    } catch (error) {
      console.error("Sidebar Settings Error:", error);
    }
  };

  // ========================================
  // LOAD SETTINGS
  // ========================================

  useEffect(() => {
    fetchSettings();
  }, []);

  // ========================================
  // UPDATE USER WHEN SETTINGS CHANGE
  // ========================================

  useEffect(() => {
    const handleUserUpdated = () => {
      setUser(getStoredUser());

      fetchSettings();
    };

    const handleStorageChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("worksync:user-updated", handleUserUpdated);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("worksync:user-updated", handleUserUpdated);

      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ========================================
  // MENU ITEMS
  // ========================================

  const menuItems = [
    {
      name: "Dashboard",
      icon: FiHome,
      path: "/dashboard",
    },
    {
      name: "Projects",
      icon: FiFolder,
      path: "/projects",
    },
    {
      name: "Tasks",
      icon: FiCheckSquare,
      path: "/tasks",
    },
    {
      name: "Kanban Board",
      icon: FiColumns,
      path: "/kanban",
    },
    {
      name: "Team",
      icon: FiUsers,
      path: "/team",
    },
    {
      name: "Chat",
      icon: FiMessageCircle,
      path: "/chat",
    },
    {
      name: "Calendar",
      icon: FiCalendar,
      path: "/calendar",
    },
    {
      name: "Files",
      icon: FiFileText,
      path: "/files",
    },
    {
      name: "Reports",
      icon: FiBarChart2,
      path: "/reports",
    },
    {
      name: "Settings",
      icon: FiSettings,
      path: "/settings",
    },
  ];

  // ========================================
  // ACTIVE MENU
  // ========================================

  const isActive = (item) => {
    if (item.name === "Tasks") {
      if (defaultTaskView === "Kanban" && location.pathname === "/kanban") {
        return false;
      }
    }

    return location.pathname === item.path;
  };

  // ========================================
  // NAVIGATION
  // ========================================

  const handleNavigation = async (item) => {
    // ========================================
    // TASKS SPECIAL NAVIGATION
    // ========================================

    if (item.name === "Tasks") {
      try {
        const response = await api.get("/settings");

        const taskView =
          response.data?.preferences?.defaultTaskView || defaultTaskView;

        setDefaultTaskView(taskView);

        if (taskView === "Kanban") {
          navigate("/kanban");
        } else {
          navigate("/tasks");
        }
      } catch (error) {
        console.error("Task View Navigation Error:", error);

        if (defaultTaskView === "Kanban") {
          navigate("/kanban");
        } else {
          navigate("/tasks");
        }
      }

      setIsOpen(false);

      return;
    }

    // ========================================
    // NORMAL NAVIGATION
    // ========================================

    navigate(item.path);

    setIsOpen(false);
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    setIsOpen(false);

    navigate("/login");
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <>
      {/* ========================================
          MOBILE OVERLAY
      ======================================== */}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            lg:hidden
          "
        />
      )}

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside
        className={`
          fixed
          lg:sticky
          top-0
          left-0
          z-50

          w-64
          lg:w-52
          h-screen
          shrink-0

          bg-[#17164f]
          text-white

          flex
          flex-col

          transition-transform
          duration-300

          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ========================================
            LOGO
        ======================================== */}

        <div
          className="
            h-20
            px-4
            flex
            items-center
            justify-between
            border-b
            border-white/5
          "
        >
          <button
            type="button"
            onClick={() => {
              navigate("/dashboard");

              setIsOpen(false);
            }}
            className="
              flex
              items-center
              gap-2.5
              min-w-0
            "
          >
            {/* NEW WORKSYNC LOGO */}

            <img
              src={worksyncLogo}
              alt="WorkSync Logo"
              className="
                w-10
                h-10
                rounded-xl
                object-cover
                shrink-0
                shadow-md
              "
            />

            {/* WORKSYNC TEXT */}

            <span
              className="
                text-lg
                font-bold
                tracking-tight
                text-white
                whitespace-nowrap
              "
            >
              WorkSync
            </span>
          </button>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="
              lg:hidden
              text-gray-300
              hover:text-white
              transition
            "
          >
            <FiX size={22} />
          </button>
        </div>

        {/* ========================================
            MENU
        ======================================== */}

        <nav
          className="
            flex-1
            overflow-y-auto
            px-3
            py-4
            space-y-1
          "
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active = isActive(item);

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigation(item)}
                className={`
                  w-full

                  flex
                  items-center
                  gap-3

                  px-3
                  py-2.5

                  rounded-lg

                  text-sm

                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                        bg-purple-700
                        text-white
                        shadow-sm
                      `
                      : `
                        text-gray-300
                        hover:bg-white/10
                        hover:text-white
                      `
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />

                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ========================================
            PROFILE
        ======================================== */}

        <div
          className="
            px-3
            pb-3
            pt-2
            border-t
            border-white/5
          "
        >
          <div
            className="
              flex
              items-center
              gap-3

              rounded-xl

              bg-white/5

              px-3
              py-3

              mb-2
            "
          >
            {/* AVATAR */}

            <div
              className="
                w-10
                h-10

                rounded-full

                bg-purple-700

                flex
                items-center
                justify-center

                text-sm
                font-semibold

                shrink-0
              "
            >
              {getInitials(user?.name)}
            </div>

            {/* USER INFO */}

            <div className="min-w-0 flex-1">
              <p
                className="
                  text-sm
                  font-medium
                  text-white
                  truncate
                "
              >
                {user?.name || "User"}
              </p>

              <p
                className="
                  text-[11px]
                  text-gray-400
                  truncate
                  mt-0.5
                "
              >
                {user?.role || "Team Member"}
              </p>
            </div>
          </div>

          {/* ========================================
              LOGOUT
          ======================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full

              flex
              items-center
              justify-center
              gap-2

              px-3
              py-2.5

              rounded-lg

              text-sm
              text-gray-300

              hover:bg-red-500/10
              hover:text-red-300

              transition
            "
          >
            <FiLogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
