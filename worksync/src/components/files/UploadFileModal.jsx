import { useState } from "react";
import { FiUploadCloud, FiX } from "react-icons/fi";

function UploadFileModal({ onClose, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const [project, setProject] = useState("WorkSync");

  // Runs when user selects a file
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  // Convert bytes into KB or MB
  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Detect file type
  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    if (extension === "pdf") {
      return "PDF";
    }

    if (
      extension === "png" ||
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "webp"
    ) {
      return "Image";
    }

    if (extension === "zip" || extension === "rar") {
      return "ZIP";
    }

    return "Document";
  };

  // Runs when form is submitted
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    const newFile = {
      id: Date.now(),

      name: selectedFile.name,

      type: getFileType(selectedFile.name),

      project: project,

      uploadedBy: "Abhay Sharma",

      uploadedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      size: formatFileSize(selectedFile.size),
    };

    onUpload(newFile);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Upload File</h2>

            <p className="mt-1 text-xs text-gray-400">
              Upload a file to your project
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload Area */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Select File
            </label>

            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 hover:border-purple-400 hover:bg-purple-50/30">
              <FiUploadCloud size={35} className="text-purple-500" />

              {!selectedFile ? (
                <>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Click to choose a file
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    PDF, images, documents or ZIP files
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </>
              )}

              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Project */}
          <div>
            <label className="text-sm font-medium text-gray-700">Project</label>

            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            >
              <option value="WorkSync">WorkSync</option>

              <option value="Admin Dashboard">Admin Dashboard</option>

              <option value="E-Commerce Website">E-Commerce Website</option>

              <option value="Mobile Banking App">Mobile Banking App</option>

              <option value="Company Landing Page">Company Landing Page</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white hover:bg-purple-700"
            >
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadFileModal;
