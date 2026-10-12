"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";

export default function StatementOfEntryPage() {
  const { user, isLoaded } = useUser();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Remove a single file from the selection array by index
  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove),
    );
  };

  // Handle file input selection via click
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf",
      );
      setSelectedFiles((prev) => [...prev, ...fileArray]);
      setUploadResults(null);
      setError(null);
    }
  };

  // Prevent browser default behavior when dragging over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle dropped files securely
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "application/pdf",
      );

      if (droppedFiles.length === 0) {
        setError("Please drop valid PDF files.");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
      setUploadResults(null);
      setError(null);
    }
  };

  // Submit files to the API route
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload files");
      }

      setUploadResults(data.results);
      setSelectedFiles([]); // Clear selected files on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  const adminName = user?.firstName || user?.username || "Admin";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome, {adminName}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Bulk upload candidate Statement of Entry PDFs. Filenames must
              follow the format:{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono text-xs">
                CANDIDATE_ID_NAME.pdf
              </code>{" "}
              Eg: 0001_JOHN_DOE.pdf
            </p>
          </div>
        </div>

        {/* Bulk Upload Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Bulk Upload PDFs
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Dropzone Box with Drag-and-Drop Handlers */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-gray-50/50 ${
                isDragging
                  ? "border-blue-600 bg-blue-50/30 scale-[1.01]"
                  : "border-gray-300 hover:border-blue-500"
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                id="file-upload"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-3 shadow-sm">
                  <FileText className="h-8 w-8" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Click to select PDF files or drag & drop them here
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports multiple PDF files simultaneously
                </span>
              </label>
            </div>

            {/* Selected Files Preview List with Individual Delete */}
            {selectedFiles.length > 0 && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-900">
                    Selected Files Ready for Upload ({selectedFiles.length}):
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-blue-800 font-mono">
                  {selectedFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-white/80 px-3 py-2 rounded-lg border border-blue-100 shadow-xs hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium text-gray-800">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 flex-shrink-0 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Extracting, Storing & Provisioning Accounts...
                </>
              ) : (
                <>
                  <Upload className="-ml-1 mr-2 h-5 w-5" />
                  Process & Upload {selectedFiles.length} File
                  {selectedFiles.length === 1 ? "" : "s"}
                </>
              )}
            </button>
          </form>

          {/* Upload Results & Extraction Breakdown */}
          {uploadResults && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Uploaded ({uploadResults.length} file
                {uploadResults.length > 1 && "s"})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadResults.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-sm flex items-center justify-between ${
                      res.status === "Success"
                        ? "bg-green-50 border-green-200 text-green-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-4">
                      {res.status === "Success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs font-semibold truncate">
                        {res.fileName}
                      </span>
                    </div>
                    <div className="text-xs font-medium flex-shrink-0">
                      {res.status === "Success" ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                          Candidate ID: {res.candidateId} ✓
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md">
                          {res.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
