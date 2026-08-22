import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import NewProjectModal from "../components/projects/NewProjectModal";
import ConfirmModal from "../components/common/ConfirmModal";
import EditProjectModal from "../components/projects/EditProjectsModal";

import toast from "react-hot-toast";
import api from "../api/axios";

import {
  FiCalendar,
  FiMoreHorizontal,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

function Projects() {
  // =========================================
  // LOGGED-IN USER
  // =========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // Only Project Manager can
  // create, edit and delete projects
  const isProjectManager = currentUser?.role === "Project Manager";

  // =========================================
  // STATES
  // =========================================

  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("All");

  // New Project modal
  const [showModal, setShowModal] = useState(false);

  // Real projects
  const [projects, setProjects] = useState([]);

  // Real tasks
  const [tasks, setTasks] = useState([]);

  // Real team members
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  // =========================================
  // THREE-DOT MENU
  // =========================================

  const [openMenuId, setOpenMenuId] = useState(null);

  // =========================================
  // DELETE PROJECT
  // =========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // =========================================
  // EDIT PROJECT
  // =========================================

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingProject, setEditingProject] = useState(null);

  // =========================================
  // FETCH PROJECTS + TASKS + TEAM
  // =========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [projectsResponse, tasksResponse, teamResponse] =
          await Promise.all([
            api.get("/projects"),
            api.get("/tasks"),
            api.get("/team"),
          ]);

        setProjects(projectsResponse.data.projects || []);

        setTasks(tasksResponse.data.tasks || []);

        setMembers(teamResponse.data.members || []);
      } catch (error) {
        console.error("Fetch Projects Error:", error);

        toast.error(
          error.response?.data?.message || "Failed to load project data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================================
  // CREATE PROJECT
  // =========================================

  const handleCreateProject = async (projectData) => {
    if (!isProjectManager) {
      toast.error("Only Project Managers can create projects");

      return false;
    }

    try {
      const response = await api.post("/projects", projectData);

      setProjects((previousProjects) => [
        response.data.project,
        ...previousProjects,
      ]);

      toast.success(response.data.message || "Project created successfully");

      return true;
    } catch (error) {
      console.error("Create Project Error:", error);

      toast.error(error.response?.data?.message || "Failed to create project");

      return false;
    }
  };

  // =========================================
  // UPDATE PROJECT
  // =========================================

  const handleUpdateProject = async (updatedData) => {
    if (!editingProject || !isProjectManager) {
      return false;
    }

    try {
      const response = await api.put(
        `/projects/${editingProject._id}`,
        updatedData,
      );

      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project._id === editingProject._id ? response.data.project : project,
        ),
      );

      toast.success(response.data.message || "Project updated successfully");

      setEditingProject(null);

      return true;
    } catch (error) {
      console.error("Update Project Error:", error);

      toast.error(error.response?.data?.message || "Failed to update project");

      return false;
    }
  };

  // =========================================
  // DELETE PROJECT
  // =========================================

  const handleDeleteProject = async () => {
    if (!selectedProject || !isProjectManager) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await api.delete(`/projects/${selectedProject._id}`);

      setProjects((previousProjects) =>
        previousProjects.filter(
          (project) => project._id !== selectedProject._id,
        ),
      );

      /*
        Remove deleted project's tasks from
        frontend state as well.

        If your backend later deletes project
        tasks automatically, this still keeps
        the UI correct immediately.
      */
      setTasks((previousTasks) =>
        previousTasks.filter((task) => {
          const projectId =
            typeof task.project === "object" ? task.project?._id : task.project;

          return projectId !== selectedProject._id;
        }),
      );

      toast.success(response.data.message || "Project deleted successfully");

      setShowDeleteModal(false);
      setSelectedProject(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Delete Project Error:", error);

      toast.error(error.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  // =========================================
  // SEARCH + STATUS FILTER
  // =========================================

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = (project.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = status === "All" || project.status === status;

    return matchesSearch && matchesStatus;
  });

  // =========================================
  // OPEN DELETE MODAL
  // =========================================

  const openDeleteModal = (project) => {
    if (!isProjectManager) {
      return;
    }

    setSelectedProject(project);

    setShowDeleteModal(true);

    setOpenMenuId(null);
  };

  // =========================================
  // OPEN EDIT MODAL
  // =========================================

  const openEditModal = (project) => {
    if (!isProjectManager) {
      return;
    }

    setEditingProject(project);

    setShowEditModal(true);

    setOpenMenuId(null);
  };

  // =========================================
  // GET PROJECT TASKS
  // =========================================

  const getProjectTasks = (projectId) => {
    return tasks.filter((task) => {
      const taskProjectId =
        typeof task.project === "object" ? task.project?._id : task.project;

      return taskProjectId === projectId;
    });
  };

  // =========================================
  // PROJECT PROGRESS
  // =========================================

  const getProjectProgress = (projectId) => {
    const projectTasks = getProjectTasks(projectId);

    if (projectTasks.length === 0) {
      return 0;
    }

    const completedTasks = projectTasks.filter(
      (task) => task.status === "Completed",
    ).length;

    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  // =========================================
  // PROJECT MEMBERS
  // =========================================

  const getProjectMembers = (projectId) => {
    const projectTasks = getProjectTasks(projectId);

    // Store unique assignee IDs
    const memberIds = new Set();

    projectTasks.forEach((task) => {
      if (!task.assignee) {
        return;
      }

      const assigneeId =
        typeof task.assignee === "object" ? task.assignee?._id : task.assignee;

      if (assigneeId) {
        memberIds.add(assigneeId);
      }
    });

    return members.filter((member) => memberIds.has(member._id));
  };

  // =========================================
  // MEMBER INITIALS
  // =========================================

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

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* =========================
          SIDEBAR
      ========================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =========================
          RIGHT SIDE
      ========================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        {/* =========================
            TOPBAR
        ========================== */}

        <Topbar
          setIsOpen={setIsOpen}
          title="Projects"
          actionLabel={isProjectManager ? "New Project" : ""}
          onAction={isProjectManager ? () => setShowModal(true) : undefined}
        />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =========================
              PAGE HEADER
          ========================== */}

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              All Projects
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your team projects
            </p>
          </div>

          {/* =========================
              SEARCH + FILTER
          ========================== */}

          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* SEARCH */}

              <div className="relative flex-1">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                />
              </div>

              {/* STATUS FILTER */}

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 bg-white"
              >
                <option value="All">All Status</option>

                <option value="Planning">Planning</option>

                <option value="In Progress">In Progress</option>

                <option value="Completed">Completed</option>

                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* =========================
              LOADING
          ========================== */}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center shadow-sm">
              <p className="text-gray-500">Loading projects...</p>
            </div>
          )}

          {/* =========================
              PROJECT CARDS
          ========================== */}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                // =================================
                // REAL PROJECT DATA
                // =================================

                const projectTasks = getProjectTasks(project._id);

                const totalTasks = projectTasks.length;

                const completedTasks = projectTasks.filter(
                  (task) => task.status === "Completed",
                ).length;

                const progress = getProjectProgress(project._id);

                const projectMembers = getProjectMembers(project._id);

                return (
                  <div
                    key={project._id}
                    className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    {/* =========================
                          CARD HEADER
                      ========================== */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {project.name}
                        </h3>

                        {/* STATUS */}

                        <span
                          className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                            project.status === "In Progress"
                              ? "bg-blue-50 text-blue-600"
                              : project.status === "Completed"
                                ? "bg-green-50 text-green-600"
                                : project.status === "Planning"
                                  ? "bg-purple-50 text-purple-600"
                                  : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      {/* =========================
                            PROJECT MANAGER MENU
                        ========================== */}

                      {isProjectManager && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === project._id ? null : project._id,
                              )
                            }
                            className="text-gray-400 hover:text-gray-700 p-1"
                          >
                            <FiMoreHorizontal size={20} />
                          </button>

                          {openMenuId === project._id && (
                            <div className="absolute right-0 top-7 z-20 w-40 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(project)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit Project
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteModal(project)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete Project
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* =========================
                          DESCRIPTION
                      ========================== */}

                    <p className="text-sm text-gray-500 mt-4 leading-6 min-h-[48px]">
                      {project.description || "No description"}
                    </p>

                    {/* =========================
                          CREATED BY
                      ========================== */}

                    {project.createdBy?.name && (
                      <p className="mt-3 text-xs text-gray-400">
                        Created by{" "}
                        <span className="font-medium text-gray-600">
                          {project.createdBy.name}
                        </span>
                      </p>
                    )}

                    {/* =========================
                          REAL PROGRESS
                      ========================== */}

                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Progress</span>

                        <span className="text-xs font-medium text-gray-700">
                          {progress}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* =========================
                          REAL TASK STATS
                      ========================== */}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Total Tasks</p>

                        <p className="mt-1 text-lg font-semibold text-gray-800">
                          {totalTasks}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Completed</p>

                        <p className="mt-1 text-lg font-semibold text-gray-800">
                          {completedTasks}
                        </p>
                      </div>
                    </div>

                    {/* DIVIDER */}

                    <div className="border-t border-gray-100 my-4" />

                    {/* =========================
                          CARD FOOTER
                      ========================== */}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* =========================
                            REAL PROJECT MEMBERS
                        ========================== */}

                      <div className="flex items-center min-w-0">
                        {projectMembers.length > 0 ? (
                          <>
                            {projectMembers.slice(0, 4).map((member, index) => (
                              <div
                                key={member._id}
                                title={member.name}
                                className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 border-2 border-white flex items-center justify-center text-[10px] font-semibold -ml-2 first:ml-0"
                                style={{
                                  zIndex: projectMembers.length - index,
                                }}
                              >
                                {getInitials(member.name)}
                              </div>
                            ))}

                            {projectMembers.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 border-2 border-white flex items-center justify-center text-[10px] font-semibold -ml-2">
                                +{projectMembers.length - 4}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No members assigned
                          </span>
                        )}

                        <div className="ml-2 text-gray-400">
                          <FiUsers size={15} />
                        </div>
                      </div>

                      {/* =========================
                            DUE DATE
                        ========================== */}

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                        <FiCalendar />

                        <span>{formatDate(project.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================
              NO PROJECT FOUND
          ========================== */}

          {!loading && filteredProjects.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center mt-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">
                No projects found
              </h3>

              <p className="text-sm text-gray-400 mt-2">
                Try changing your search or status filter.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* =========================
          NEW PROJECT MODAL
      ========================== */}

      {showModal && isProjectManager && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {/* =========================
          DELETE PROJECT MODAL
      ========================== */}

      {isProjectManager && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Project"
          message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteProject}
          onClose={() => {
            if (deleteLoading) {
              return;
            }

            setShowDeleteModal(false);

            setSelectedProject(null);
          }}
          loading={deleteLoading}
        />
      )}

      {/* =========================
          EDIT PROJECT MODAL
      ========================== */}

      {showEditModal && editingProject && isProjectManager && (
        <EditProjectModal
          project={editingProject}
          onClose={() => {
            setShowEditModal(false);

            setEditingProject(null);
          }}
          onUpdate={handleUpdateProject}
        />
      )}
    </div>
  );
}

export default Projects;
