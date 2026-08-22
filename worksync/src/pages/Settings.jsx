import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiBell,
  FiBriefcase,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

function Settings() {
  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  // ========================================
  // PROFILE
  // ========================================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    avatar: "",
  });

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    projectUpdates: true,
    deadlineReminder: true,
    chatMessages: true,
    emailNotifications: false,
  });

  // ========================================
  // WORKSPACE PREFERENCES
  // ========================================

  const [preferences, setPreferences] = useState({
    defaultTaskView: "List",
    weekStartsOn: "Monday",
  });

  // ========================================
  // PASSWORD MODAL
  // ========================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ========================================
  // LOAD SETTINGS
  // ========================================

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await api.get("/settings");

      setProfile({
        name: response.data.profile?.name || "",

        email: response.data.profile?.email || "",

        role: response.data.profile?.role || "",

        avatar: response.data.profile?.avatar || "",
      });

      setNotifications({
        taskAssigned: response.data.notifications?.taskAssigned ?? true,

        projectUpdates: response.data.notifications?.projectUpdates ?? true,

        deadlineReminder: response.data.notifications?.deadlineReminder ?? true,

        chatMessages: response.data.notifications?.chatMessages ?? true,

        emailNotifications:
          response.data.notifications?.emailNotifications ?? false,
      });

      setPreferences({
        defaultTaskView: response.data.preferences?.defaultTaskView || "List",

        weekStartsOn: response.data.preferences?.weekStartsOn || "Monday",
      });
    } catch (error) {
      console.error("Settings Error:", error);

      toast.error(error.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ========================================
  // PROFILE CHANGE
  // ========================================

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================
  // NOTIFICATION CHANGE
  // ========================================

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;

    setNotifications((previous) => ({
      ...previous,
      [name]: checked,
    }));
  };

  // ========================================
  // PREFERENCE CHANGE
  // ========================================

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;

    setPreferences((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================
  // SAVE SETTINGS
  // ========================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Name cannot be empty");

      return;
    }

    if (!profile.email.trim()) {
      toast.error("Email cannot be empty");

      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/settings", {
        name: profile.name,

        email: profile.email,

        notifications,

        preferences,
      });

      const updatedProfile = response.data.profile;

      setProfile(updatedProfile);

      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      }

      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }

      // ========================================
      // UPDATE LOCAL STORAGE
      // ========================================

      const storedUser = localStorage.getItem("user");

      const oldUser = storedUser ? JSON.parse(storedUser) : {};

      const newStoredUser = {
        ...oldUser,

        name: updatedProfile.name,

        email: updatedProfile.email,

        role: updatedProfile.role,

        avatar: updatedProfile.avatar || "",
      };

      localStorage.setItem("user", JSON.stringify(newStoredUser));

      // Tell components like Sidebar
      // that profile changed.
      window.dispatchEvent(
        new CustomEvent("worksync:user-updated", {
          detail: newStoredUser,
        }),
      );

      setSaved(true);

      toast.success("Settings saved successfully");

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error("Save Settings Error:", error);

      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // PASSWORD INPUT
  // ========================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================
  // CLOSE PASSWORD MODAL
  // ========================================

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setShowPasswordModal(false);

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowCurrentPassword(false);

    setShowNewPassword(false);

    setShowConfirmPassword(false);
  };

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill all password fields");

      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");

      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");

      return;
    }

    try {
      setChangingPassword(true);

      await api.put("/settings/password", passwordData);

      toast.success("Password changed successfully");

      closePasswordModal();
    } catch (error) {
      console.error("Change Password Error:", error);

      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // ========================================
  // USER INITIALS
  // ========================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#f7f8fc]">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar setIsOpen={setIsOpen} title="Settings" />

          <main className="p-3 sm:p-4 lg:p-5">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm py-20 text-center">
              <p className="text-sm text-gray-400">Loading settings...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex bg-[#f7f8fc]">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar setIsOpen={setIsOpen} title="Settings" />

          <main className="p-3 sm:p-4 lg:p-5">
            {/* PAGE HEADER */}

            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-800">
                Account Settings
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage your profile, preferences and account security
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* =================================
                  PROFILE
              ================================== */}

              <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FiUser size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Profile Information
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        Update your personal information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* AVATAR */}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 shrink-0 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-semibold">
                      {getInitials(profile.name)}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">
                        {profile.name}
                      </h4>

                      <p className="text-xs text-gray-400 mt-1">
                        {profile.role}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-2">
                        Your role is managed by your workspace Project Manager.
                      </p>
                    </div>
                  </div>

                  {/* INPUTS */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NAME */}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>

                      <div className="relative mt-2">
                        <FiUser
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleProfileChange}
                          className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>

                      <div className="relative mt-2">
                        <FiMail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                          className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* ROLE */}

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Role
                      </label>

                      <div className="relative mt-2">
                        <FiBriefcase
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          value={profile.role}
                          disabled
                          className="w-full border border-gray-200 bg-gray-50 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================
                  NOTIFICATIONS
              ================================== */}

              <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FiBell size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Notification Preferences
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        Choose your notification preferences
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <SettingToggle
                    title="Task Assigned"
                    description="Notify me when someone assigns a task to me"
                    name="taskAssigned"
                    checked={notifications.taskAssigned}
                    onChange={handleNotificationChange}
                  />

                  <SettingToggle
                    title="Project Updates"
                    description="Receive notifications when projects are updated"
                    name="projectUpdates"
                    checked={notifications.projectUpdates}
                    onChange={handleNotificationChange}
                  />

                  <SettingToggle
                    title="Deadline Reminders"
                    description="Remind me about upcoming task deadlines"
                    name="deadlineReminder"
                    checked={notifications.deadlineReminder}
                    onChange={handleNotificationChange}
                  />

                  <SettingToggle
                    title="Chat Messages"
                    description="Store your chat notification preference"
                    name="chatMessages"
                    checked={notifications.chatMessages}
                    onChange={handleNotificationChange}
                  />

                  <SettingToggle
                    title="Email Notifications"
                    description="Store your email notification preference"
                    name="emailNotifications"
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                </div>
              </div>

              {/* =================================
                  WORKSPACE PREFERENCES
              ================================== */}

              <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Workspace Preferences
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Customize how WorkSync behaves
                  </p>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TASK VIEW */}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Default Task View
                      </label>

                      <select
                        name="defaultTaskView"
                        value={preferences.defaultTaskView}
                        onChange={handlePreferenceChange}
                        className="w-full mt-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                      >
                        <option value="List">List View</option>

                        <option value="Kanban">Kanban Board</option>
                      </select>
                    </div>

                    {/* WEEK START */}

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Week Starts On
                      </label>

                      <select
                        name="weekStartsOn"
                        value={preferences.weekStartsOn}
                        onChange={handlePreferenceChange}
                        className="w-full mt-2 border border-gray-200 bg-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500"
                      >
                        <option value="Monday">Monday</option>

                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================
                  SECURITY
              ================================== */}

              <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FiLock size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Security
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        Manage your account password
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* =================================
                  SAVE
              ================================== */}

              <div className="flex justify-end pb-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`min-w-36 flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm text-white transition disabled:opacity-50 ${
                    saved ? "bg-green-500" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {saving ? (
                    "Saving..."
                  ) : saved ? (
                    <>
                      <FiCheck />
                      Saved
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* ========================================
          PASSWORD MODAL
      ======================================== */}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Change Password
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Create a new secure password
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {/* CURRENT */}

              <PasswordInput
                label="Current Password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((previous) => !previous)}
              />

              {/* NEW */}

              <PasswordInput
                label="New Password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((previous) => !previous)}
              />

              {/* CONFIRM */}

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((previous) => !previous)}
              />

              <p className="text-xs text-gray-400">
                Password must contain at least 6 characters.
              </p>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ========================================
// SETTING TOGGLE
// ========================================

function SettingToggle({ title, description, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div>
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>

        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>

      <label className="relative inline-flex cursor-pointer items-center shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />

        <div
          className="
            relative
            w-11 h-6
            bg-gray-200
            rounded-full
            peer-checked:bg-purple-600
            transition
            after:content-['']
            after:absolute
            after:top-[2px]
            after:left-[2px]
            after:w-5
            after:h-5
            after:bg-white
            after:rounded-full
            after:transition
            peer-checked:after:translate-x-full
          "
        />
      </label>
    </div>
  );
}

// ========================================
// PASSWORD INPUT
// ========================================

function PasswordInput({ label, name, value, onChange, visible, onToggle }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="relative mt-2">
        <FiLock
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-11 text-sm outline-none focus:border-purple-500"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          {visible ? <FiEyeOff size={17} /> : <FiEye size={17} />}
        </button>
      </div>
    </div>
  );
}

export default Settings;
