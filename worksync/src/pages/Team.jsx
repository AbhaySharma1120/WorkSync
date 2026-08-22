import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import InviteMemberModal from "../components/team/InviteMemberModal";
import CancelInvitationModal from "../components/team/CancelInvitationModal";

import MemberDetailsModal from "../components/team/MemberDetailsModal";
import ChangeRoleModal from "../components/team/ChangeRoleModal";
import RemoveMemberModal from "../components/team/RemoveMemberModal";

import {
  FiEye,
  FiMail,
  FiMoreHorizontal,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

function Team() {
  // ========================================
  // LOGGED-IN USER
  // ========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const isProjectManager = currentUser?.role === "Project Manager";

  // ========================================
  // BASIC STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("All");

  const [loading, setLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState([]);

  const [pendingInvitations, setPendingInvitations] = useState([]);

  // ========================================
  // INVITE MODAL
  // ========================================

  const [showModal, setShowModal] = useState(false);

  // ========================================
  // MEMBER MENU
  // ========================================

  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);

  const [selectedMember, setSelectedMember] = useState(null);

  // ========================================
  // MEMBER DETAILS MODAL
  // ========================================

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ========================================
  // CHANGE ROLE MODAL
  // ========================================

  const [showRoleModal, setShowRoleModal] = useState(false);

  const [roleLoading, setRoleLoading] = useState(false);

  // ========================================
  // REMOVE MEMBER MODAL
  // ========================================

  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [removeLoading, setRemoveLoading] = useState(false);

  // ========================================
  // CANCEL INVITATION
  // ========================================

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedInvitation, setSelectedInvitation] = useState(null);

  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  // ========================================
  // FETCH TEAM DATA
  // ========================================

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      const [teamResponse, tasksResponse, invitationsResponse] =
        await Promise.all([
          api.get("/team"),
          api.get("/tasks"),
          api.get("/team/invitations"),
        ]);

      const members = teamResponse.data.members || [];

      const tasks = tasksResponse.data.tasks || [];

      const invitations = invitationsResponse.data.invitations || [];

      // Add task statistics
      const membersWithStats = members.map((member) => {
        const memberTasks = tasks.filter(
          (task) => task.assignee?._id === member._id,
        );

        const activeTasks = memberTasks.filter(
          (task) => task.status !== "Completed",
        ).length;

        const completedTasks = memberTasks.filter(
          (task) => task.status === "Completed",
        ).length;

        return {
          ...member,
          activeTasks,
          completedTasks,
        };
      });

      setTeamMembers(membersWithStats);

      setPendingInvitations(invitations);
    } catch (error) {
      console.error("Fetch Team Error:", error);

      toast.error(error.response?.data?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // ========================================
  // FILTER MEMBERS
  // ========================================

  const filteredMembers = teamMembers.filter((member) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      member.name?.toLowerCase().includes(searchValue) ||
      member.email?.toLowerCase().includes(searchValue);

    const matchesRole = role === "All" || member.role === role;

    return matchesSearch && matchesRole;
  });

  // ========================================
  // STATISTICS
  // ========================================

  const activeMembers = teamMembers.filter(
    (member) => member.activeTasks > 0,
  ).length;

  const totalRoles = new Set(teamMembers.map((member) => member.role)).size;

  const stats = [
    {
      title: "Total Members",
      value: teamMembers.length,
      icon: <FiUsers />,
    },

    {
      title: "Active Members",
      value: activeMembers,
      icon: <FiUserCheck />,
    },

    {
      title: "Team Roles",
      value: totalRoles,
      icon: <FiUserPlus />,
    },

    {
      title: "Pending Invites",
      value: pendingInvitations.length,
      icon: <FiMail />,
    },
  ];

  // ========================================
  // INITIALS
  // ========================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ========================================
  // DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================================
  // TOGGLE MEMBER MENU
  // ========================================

  const toggleMemberMenu = (memberId) => {
    setOpenMemberMenuId((previousId) =>
      previousId === memberId ? null : memberId,
    );
  };

  // ========================================
  // VIEW DETAILS
  // ========================================

  const openDetailsModal = (member) => {
    setSelectedMember(member);

    setShowDetailsModal(true);

    setOpenMemberMenuId(null);
  };

  // ========================================
  // OPEN CHANGE ROLE
  // ========================================

  const openRoleModal = (member) => {
    if (!isProjectManager) {
      return;
    }

    setSelectedMember(member);

    setShowRoleModal(true);

    setOpenMemberMenuId(null);
  };

  // ========================================
  // CHANGE ROLE API
  // ========================================

  const handleChangeRole = async (newRole) => {
    if (!selectedMember || !isProjectManager) {
      return;
    }

    try {
      setRoleLoading(true);

      const response = await api.put(
        `/team/members/${selectedMember._id}/role`,
        {
          role: newRole,
        },
      );

      // Update role in frontend
      // while keeping task stats
      setTeamMembers((previousMembers) =>
        previousMembers.map((member) =>
          member._id === selectedMember._id
            ? {
                ...member,
                ...response.data.member,
              }
            : member,
        ),
      );

      toast.success(
        response.data.message || "Member role updated successfully",
      );

      setShowRoleModal(false);

      setSelectedMember(null);
    } catch (error) {
      console.error("Change Role Error:", error);

      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setRoleLoading(false);
    }
  };

  // ========================================
  // OPEN REMOVE MEMBER
  // ========================================

  const openRemoveModal = (member) => {
    if (!isProjectManager) {
      return;
    }

    setSelectedMember(member);

    setShowRemoveModal(true);

    setOpenMemberMenuId(null);
  };

  // ========================================
  // REMOVE MEMBER API
  // ========================================

  const handleRemoveMember = async () => {
    if (!selectedMember || !isProjectManager) {
      return;
    }

    try {
      setRemoveLoading(true);

      const response = await api.delete(`/team/members/${selectedMember._id}`);

      // Remove member from UI
      setTeamMembers((previousMembers) =>
        previousMembers.filter((member) => member._id !== selectedMember._id),
      );

      toast.success(response.data.message || "Member removed successfully");

      setShowRemoveModal(false);

      setSelectedMember(null);
    } catch (error) {
      console.error("Remove Member Error:", error);

      toast.error(error.response?.data?.message || "Failed to remove member");
    } finally {
      setRemoveLoading(false);
    }
  };

  // ========================================
  // INVITE MEMBER
  // ========================================

  const handleInviteMember = async (invitationData) => {
    if (!isProjectManager) {
      return false;
    }

    try {
      const response = await api.post("/team/invite", invitationData);

      setPendingInvitations((previousInvitations) => [
        response.data.invitation,
        ...previousInvitations,
      ]);

      toast.success(response.data.message || "Invitation created successfully");

      return true;
    } catch (error) {
      console.error("Invite Member Error:", error);

      toast.error(error.response?.data?.message || "Failed to invite member");

      return false;
    }
  };

  // ========================================
  // OPEN CANCEL INVITATION
  // ========================================

  const handleCancelInvitation = (invitation) => {
    setSelectedInvitation(invitation);

    setShowCancelModal(true);
  };

  // ========================================
  // CANCEL INVITATION API
  // ========================================

  const confirmCancelInvitation = async () => {
    if (!selectedInvitation) {
      return;
    }

    try {
      setCancelLoadingId(selectedInvitation._id);

      const response = await api.delete(
        `/team/invitations/${selectedInvitation._id}`,
      );

      setPendingInvitations((previousInvitations) =>
        previousInvitations.filter(
          (invitation) => invitation._id !== selectedInvitation._id,
        ),
      );

      toast.success(
        response.data.message || "Invitation cancelled successfully",
      );

      setShowCancelModal(false);

      setSelectedInvitation(null);
    } catch (error) {
      console.error("Cancel Invitation Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to cancel invitation",
      );
    } finally {
      setCancelLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* SIDEBAR */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* CONTENT */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar
          setIsOpen={setIsOpen}
          title="Team"
          actionLabel={isProjectManager ? "Invite Member" : ""}
          onAction={isProjectManager ? () => setShowModal(true) : undefined}
        />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* HEADING */}

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Team Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your team and view member performance
            </p>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>

                    <h3 className="mt-2 text-2xl font-semibold text-gray-800">
                      {stat.value}
                    </h3>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-600">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH */}

          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members by name or email..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-500"
              >
                <option value="All">All Roles</option>

                <option value="Project Manager">Project Manager</option>

                <option value="Frontend Developer">Frontend Developer</option>

                <option value="Backend Developer">Backend Developer</option>

                <option value="UI/UX Designer">UI/UX Designer</option>

                <option value="QA Engineer">QA Engineer</option>
              </select>
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-white p-10 text-center">
              <p className="text-sm text-gray-500">Loading team data...</p>
            </div>
          )}

          {/* REGISTERED MEMBERS */}

          {!loading && (
            <>
              <div className="mb-3 mt-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Registered Members
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Members with active WorkSync accounts
                  </p>
                </div>

                <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs text-purple-600">
                  {teamMembers.length} Members
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md"
                  >
                    {/* CARD HEADER */}

                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-600">
                          {getInitials(member.name)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-800">
                            {member.name}
                          </h3>

                          <p className="mt-1 truncate text-xs text-purple-600">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      {/* THREE DOT MENU */}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => toggleMemberMenu(member._id)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                        >
                          <FiMoreHorizontal size={19} />
                        </button>

                        {openMemberMenuId === member._id && (
                          <div className="absolute right-0 top-8 z-[100] w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() => openDetailsModal(member)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <FiEye />
                              View Details
                            </button>

                            {/* MANAGER OPTIONS */}

                            {isProjectManager &&
                              member._id !== currentUser?._id && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openRoleModal(member)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                                  >
                                    <FiEdit2 />
                                    Change Role
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openRemoveModal(member)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <FiTrash2 />
                                    Remove Member
                                  </button>
                                </>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div className="mt-5 flex items-center gap-2 text-gray-500">
                      <FiMail size={15} />

                      <span className="truncate text-xs">{member.email}</span>
                    </div>

                    <div className="my-4 border-t border-gray-100" />

                    {/* TASKS */}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-lg font-semibold text-gray-800">
                          {member.activeTasks}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Active Tasks
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-lg font-semibold text-gray-800">
                          {member.completedTasks}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">Completed</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />

                      <span className="text-xs text-gray-500">
                        Registered Member
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PENDING */}

          {!loading && isProjectManager && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Pending Invitations
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Invitations waiting to be accepted
                  </p>
                </div>

                <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs text-yellow-600">
                  {pendingInvitations.length} Pending
                </span>
              </div>

              {pendingInvitations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 font-semibold text-yellow-600">
                          {getInitials(invitation.name)}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {invitation.name}
                          </h3>

                          <p className="mt-1 text-xs text-purple-600">
                            {invitation.role}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2 text-gray-500">
                        <FiMail size={15} />

                        <span className="truncate text-xs">
                          {invitation.email}
                        </span>
                      </div>

                      <div className="my-4 border-t border-gray-100" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />

                          <span className="text-xs font-medium text-yellow-600">
                            {invitation.status}
                          </span>
                        </div>

                        <span className="text-xs text-gray-400">
                          {formatDate(invitation.createdAt)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(invitation)}
                        className="mt-4 w-full rounded-lg border border-red-100 bg-red-50 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Cancel Invitation
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm text-gray-400">
                    No pending invitations
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* INVITE */}

      {showModal && isProjectManager && (
        <InviteMemberModal
          onClose={() => setShowModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {/* DETAILS */}

      {showDetailsModal && selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={() => {
            setShowDetailsModal(false);

            setSelectedMember(null);
          }}
        />
      )}

      {/* CHANGE ROLE */}

      {showRoleModal && selectedMember && isProjectManager && (
        <ChangeRoleModal
          member={selectedMember}
          loading={roleLoading}
          onConfirm={handleChangeRole}
          onClose={() => {
            if (roleLoading) {
              return;
            }

            setShowRoleModal(false);

            setSelectedMember(null);
          }}
        />
      )}

      {/* REMOVE MEMBER */}

      {showRemoveModal && selectedMember && isProjectManager && (
        <RemoveMemberModal
          member={selectedMember}
          loading={removeLoading}
          onConfirm={handleRemoveMember}
          onClose={() => {
            if (removeLoading) {
              return;
            }

            setShowRemoveModal(false);

            setSelectedMember(null);
          }}
        />
      )}

      {/* CANCEL INVITATION */}

      {showCancelModal && selectedInvitation && isProjectManager && (
        <CancelInvitationModal
          invitation={selectedInvitation}
          loading={cancelLoadingId === selectedInvitation._id}
          onConfirm={confirmCancelInvitation}
          onClose={() => {
            if (cancelLoadingId) {
              return;
            }

            setShowCancelModal(false);

            setSelectedInvitation(null);
          }}
        />
      )}
    </div>
  );
}

export default Team;
