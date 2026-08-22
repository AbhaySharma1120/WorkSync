import { useEffect, useRef, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiArchive,
  FiDownload,
  FiFile,
  FiFileText,
  FiImage,
  FiMoreHorizontal,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";

import api from "../api/axios";
import toast from "react-hot-toast";

function Files() {
  // ========================================
  // CURRENT USER
  // ========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const currentUserId = currentUser?.id || currentUser?._id;

  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("All");

  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);

  // ========================================
  // UPLOAD
  // ========================================

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedUploadFile, setSelectedUploadFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  // ========================================
  // FILE MENU
  // ========================================

  const [openMenuId, setOpenMenuId] = useState(null);

  // ========================================
  // DELETE
  // ========================================

  const [fileToDelete, setFileToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  // ========================================
  // DOWNLOAD
  // ========================================

  const [downloadingId, setDownloadingId] = useState(null);

  // ========================================
  // FILE INPUT REF
  // ========================================

  const fileInputRef = useRef(null);

  // ========================================
  // GET FILES
  // ========================================

  const fetchFiles = async () => {
    try {
      setLoading(true);

      const response = await api.get("/files");

      setFiles(response.data.files || []);
    } catch (error) {
      console.error("Get Files Error:", error);

      toast.error(error.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD FILES
  // ========================================

  useEffect(() => {
    fetchFiles();
  }, []);

  // ========================================
  // DETECT FILE TYPE
  // ========================================

  const getFileType = (file) => {
    const mimeType = file?.mimeType || "";

    const name = file?.originalName || "";

    const extension = name.split(".").pop()?.toLowerCase();

    if (mimeType === "application/pdf" || extension === "pdf") {
      return "PDF";
    }

    if (
      mimeType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp"].includes(extension)
    ) {
      return "Image";
    }

    if (mimeType.includes("zip") || extension === "zip") {
      return "ZIP";
    }

    if (["doc", "docx", "txt"].includes(extension)) {
      return "Document";
    }

    if (["xls", "xlsx"].includes(extension)) {
      return "Spreadsheet";
    }

    if (["ppt", "pptx"].includes(extension)) {
      return "Presentation";
    }

    return "File";
  };

  // ========================================
  // FILE ICON
  // ========================================

  const getFileIcon = (file) => {
    const type = getFileType(file);

    if (type === "PDF") {
      return <FiFileText />;
    }

    if (type === "Image") {
      return <FiImage />;
    }

    if (type === "ZIP") {
      return <FiArchive />;
    }

    return <FiFile />;
  };

  // ========================================
  // FILE ICON STYLE
  // ========================================

  const getFileStyle = (file) => {
    const type = getFileType(file);

    if (type === "PDF") {
      return "bg-red-50 text-red-500";
    }

    if (type === "Image") {
      return "bg-blue-50 text-blue-500";
    }

    if (type === "ZIP") {
      return "bg-yellow-50 text-yellow-600";
    }

    if (type === "Spreadsheet") {
      return "bg-green-50 text-green-600";
    }

    if (type === "Presentation") {
      return "bg-orange-50 text-orange-600";
    }

    return "bg-purple-50 text-purple-600";
  };

  // ========================================
  // FORMAT FILE SIZE
  // ========================================

  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) {
      return "-";
    }

    if (bytes === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];

    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================================
  // UPLOADER NAME
  // ========================================

  const getUploaderName = (file) => {
    if (typeof file.uploadedBy === "object") {
      return file.uploadedBy?.name || "Unknown";
    }

    return "Unknown";
  };

  // ========================================
  // CAN DELETE FILE
  // ========================================

  const canDeleteFile = (file) => {
    if (currentUser?.role === "Project Manager") {
      return true;
    }

    const uploaderId =
      typeof file.uploadedBy === "object"
        ? file.uploadedBy?._id
        : file.uploadedBy;

    if (!uploaderId || !currentUserId) {
      return false;
    }

    return uploaderId.toString() === currentUserId.toString();
  };

  // ========================================
  // FILTER FILES
  // ========================================

  const filteredFiles = files.filter((file) => {
    const searchValue = search.trim().toLowerCase();

    const fileName = file.originalName?.toLowerCase() || "";

    const uploader = getUploaderName(file).toLowerCase();

    const fileType = getFileType(file);

    const matchesSearch =
      fileName.includes(searchValue) ||
      uploader.includes(searchValue) ||
      fileType.toLowerCase().includes(searchValue);

    const matchesType = typeFilter === "All" || fileType === typeFilter;

    return matchesSearch && matchesType;
  });

  // ========================================
  // FILE STATISTICS
  // ========================================

  const documentCount = files.filter((file) => {
    const type = getFileType(file);

    return ["PDF", "Document", "Spreadsheet", "Presentation"].includes(type);
  }).length;

  const imageCount = files.filter(
    (file) => getFileType(file) === "Image",
  ).length;

  // ========================================
  // OPEN UPLOAD MODAL
  // ========================================

  const handleOpenUpload = () => {
    setSelectedUploadFile(null);

    setShowUploadModal(true);

    setOpenMenuId(null);
  };

  // ========================================
  // CLOSE UPLOAD MODAL
  // ========================================

  const handleCloseUpload = () => {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);

    setSelectedUploadFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // SELECT FILE
  // ========================================

  const handleFileSelection = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // 10 MB
    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      toast.error("Maximum file size is 10 MB");

      e.target.value = "";

      return;
    }

    setSelectedUploadFile(file);
  };

  // ========================================
  // UPLOAD FILE
  // ========================================

  const handleUploadFile = async (e) => {
    e.preventDefault();

    if (!selectedUploadFile) {
      toast.error("Please select a file");

      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      /*
          This MUST be "file"
          because backend uses:

          upload.single("file")
        */

      formData.append("file", selectedUploadFile);

      const response = await api.post("/files/upload", formData);

      const uploadedFile = response.data.file;

      setFiles((previousFiles) => [uploadedFile, ...previousFiles]);

      toast.success("File uploaded successfully");

      handleCloseUpload();
    } catch (error) {
      console.error("Upload File Error:", error);

      toast.error(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // ========================================
  // DOWNLOAD FILE
  // ========================================

  const handleDownload = async (file) => {
    try {
      setDownloadingId(file._id);

      setOpenMenuId(null);

      const response = await api.get(`/files/${file._id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: file.mimeType || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download = file.originalName || "download";

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error) {
      console.error("Download File Error:", error);

      toast.error(error.response?.data?.message || "Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  // ========================================
  // OPEN DELETE CONFIRMATION
  // ========================================

  const handleDeleteClick = (file) => {
    setOpenMenuId(null);

    setFileToDelete(file);
  };

  // ========================================
  // DELETE FILE
  // ========================================

  const handleConfirmDelete = async () => {
    if (!fileToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/files/${fileToDelete._id}`);

      setFiles((previousFiles) =>
        previousFiles.filter((file) => file._id !== fileToDelete._id),
      );

      toast.success("File deleted successfully");

      setFileToDelete(null);
    } catch (error) {
      console.error("Delete File Error:", error);

      toast.error(error.response?.data?.message || "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex bg-[#f7f8fc]">
        {/* =====================================
            SIDEBAR
        ====================================== */}

        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        {/* =====================================
            RIGHT SIDE
        ====================================== */}

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar
            setIsOpen={setIsOpen}
            title="Files"
            actionLabel="Upload File"
            onAction={handleOpenUpload}
          />

          <main className="p-3 sm:p-4 lg:p-5">
            {/* =================================
                HEADING
            ================================== */}

            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-800">
                Team Files
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Upload, download and manage files shared with your WorkSync team
              </p>
            </div>

            {/* =================================
                FILE STATISTICS
            ================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* TOTAL */}

              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Files</p>

                <h3 className="text-2xl font-semibold text-gray-800 mt-2">
                  {files.length}
                </h3>
              </div>

              {/* DOCUMENTS */}

              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Documents</p>

                <h3 className="text-2xl font-semibold text-gray-800 mt-2">
                  {documentCount}
                </h3>
              </div>

              {/* IMAGES */}

              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Images</p>

                <h3 className="text-2xl font-semibold text-gray-800 mt-2">
                  {imageCount}
                </h3>
              </div>
            </div>

            {/* =================================
                SEARCH + TYPE FILTER
            ================================== */}

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mt-4">
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
                    placeholder="Search by file name, type or uploader..."
                    className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500"
                  />
                </div>

                {/* TYPE FILTER */}

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-purple-500"
                >
                  <option value="All">All File Types</option>

                  <option value="PDF">PDF</option>

                  <option value="Document">Documents</option>

                  <option value="Image">Images</option>

                  <option value="Spreadsheet">Spreadsheets</option>

                  <option value="Presentation">Presentations</option>

                  <option value="ZIP">ZIP Files</option>

                  <option value="File">Other Files</option>
                </select>
              </div>
            </div>

            {/* =================================
                LOADING
            ================================== */}

            {loading && (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center mt-4 shadow-sm">
                <p className="text-sm text-gray-400">Loading files...</p>
              </div>
            )}

            {/* =================================
                DESKTOP TABLE
            ================================== */}

            {!loading && (
              <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm mt-4 overflow-visible">
                {/* TABLE HEADER */}

                <div className="grid grid-cols-[2fr_1fr_1.3fr_1fr_90px_50px] gap-4 bg-gray-50 px-5 py-4 border-b border-gray-100 rounded-t-xl">
                  <p className="text-xs font-medium text-gray-500">File Name</p>

                  <p className="text-xs font-medium text-gray-500">Type</p>

                  <p className="text-xs font-medium text-gray-500">
                    Uploaded By
                  </p>

                  <p className="text-xs font-medium text-gray-500">Date</p>

                  <p className="text-xs font-medium text-gray-500">Size</p>

                  <div />
                </div>

                {/* FILE ROWS */}

                {filteredFiles.map((file) => (
                  <div
                    key={file._id}
                    className="grid grid-cols-[2fr_1fr_1.3fr_1fr_90px_50px] gap-4 items-center px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    {/* FILE */}

                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-lg ${getFileStyle(
                          file,
                        )}`}
                      >
                        {getFileIcon(file)}
                      </div>

                      <div className="min-w-0">
                        <p
                          title={file.originalName}
                          className="text-sm font-medium text-gray-800 truncate"
                        >
                          {file.originalName}
                        </p>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {file.mimeType}
                        </p>
                      </div>
                    </div>

                    {/* TYPE */}

                    <p className="text-xs text-gray-600">{getFileType(file)}</p>

                    {/* UPLOADED BY */}

                    <p className="text-xs text-gray-600 truncate">
                      {getUploaderName(file)}
                    </p>

                    {/* DATE */}

                    <p className="text-xs text-gray-400">
                      {formatDate(file.createdAt)}
                    </p>

                    {/* SIZE */}

                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>

                    {/* MENU */}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((previousId) =>
                            previousId === file._id ? null : file._id,
                          )
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <FiMoreHorizontal size={18} />
                      </button>

                      {/* DROPDOWN */}

                      {openMenuId === file._id && (
                        <div className="absolute right-0 top-9 z-40 w-40 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                          {/* DOWNLOAD */}

                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            disabled={downloadingId === file._id}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <FiDownload />

                            {downloadingId === file._id
                              ? "Downloading..."
                              : "Download"}
                          </button>

                          {/* DELETE */}

                          {canDeleteFile(file) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(file)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-red-600 hover:bg-red-50 border-t border-gray-50"
                            >
                              <FiTrash2 />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* EMPTY TABLE */}

                {filteredFiles.length === 0 && (
                  <div className="p-10 text-center">
                    <FiFile size={30} className="mx-auto text-gray-300" />

                    <h3 className="text-base font-semibold text-gray-700 mt-3">
                      No files found
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      Try changing the search or filter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* =================================
                MOBILE FILE CARDS
            ================================== */}

            {!loading && (
              <div className="md:hidden space-y-3 mt-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file._id}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-lg ${getFileStyle(
                            file,
                          )}`}
                        >
                          {getFileIcon(file)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-800 truncate">
                            {file.originalName}
                          </h3>

                          <p className="text-xs text-purple-600 mt-1">
                            {getFileType(file)}
                          </p>
                        </div>
                      </div>

                      {/* MOBILE MENU */}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((previousId) =>
                              previousId === file._id ? null : file._id,
                            )
                          }
                          className="text-gray-400"
                        >
                          <FiMoreHorizontal size={18} />
                        </button>

                        {openMenuId === file._id && (
                          <div className="absolute right-0 top-7 z-40 w-40 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              <FiDownload />
                              Download
                            </button>

                            {canDeleteFile(file) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(file)}
                                className="w-full flex items-center gap-2 px-4 py-3 text-xs text-red-600 border-t border-gray-50 hover:bg-red-50"
                              >
                                <FiTrash2 />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INFORMATION */}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-[10px] text-gray-400">Uploaded By</p>

                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {getUploaderName(file)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400">File Size</p>

                        <p className="text-xs text-gray-600 mt-1">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400">Type</p>

                        <p className="text-xs text-gray-600 mt-1">
                          {getFileType(file)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400">Uploaded</p>

                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* DOWNLOAD */}

                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file._id}
                      className="w-full mt-4 border border-gray-200 rounded-lg py-2.5 flex items-center justify-center gap-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiDownload />

                      {downloadingId === file._id
                        ? "Downloading..."
                        : "Download"}
                    </button>
                  </div>
                ))}

                {/* EMPTY */}

                {filteredFiles.length === 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
                    <FiFile size={30} className="mx-auto text-gray-300" />

                    <h3 className="text-lg font-semibold text-gray-700 mt-3">
                      No files found
                    </h3>

                    <p className="text-sm text-gray-400 mt-2">
                      Upload a file or change your search.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================
          UPLOAD FILE MODAL
      ======================================== */}

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Upload File
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  Share a file with your WorkSync team
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseUpload}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-700"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleUploadFile} className="p-6">
              {/* DROP AREA */}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                  <FiUploadCloud size={22} />
                </div>

                {selectedUploadFile ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 mt-4 break-all">
                      {selectedUploadFile.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatFileSize(selectedUploadFile.size)}
                    </p>

                    <p className="text-xs text-purple-600 mt-3">
                      Click to choose another file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mt-4">
                      Select a file to upload
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      PDF, Word, Excel, PowerPoint, images, ZIP
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Maximum size: 10 MB
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelection}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.zip"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseUpload}
                  disabled={uploading}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading || !selectedUploadFile}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiUploadCloud />

                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================
          DELETE CONFIRMATION
      ======================================== */}

      {fileToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <FiAlertTriangle size={24} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete File
                </h3>

                <p className="text-sm text-gray-500 leading-6 mt-2">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-700 break-all">
                    "{fileToDelete.originalName}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
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

export default Files;
