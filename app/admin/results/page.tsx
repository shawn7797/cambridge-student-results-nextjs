// app/admin/results/page.tsx
"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Upload,
  FileX,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

interface UploadResult {
  fileName: string;
  candidateId?: string;
  candidateName?: string;
  username?: string;
  password?: string;
  releaseDate?: string;
  releaseDetails?: { date: string; subject: string }[];
  status: "Success" | "Failed";
  reason?: string;
}

export default function ResultsUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to append new PDF files while filtering out non-PDFs
  const addFiles = (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf"),
    );

    if (pdfFiles.length === 0) {
      setError("Please select valid PDF files.");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
    setUploadResults([]);
    setError(null);
  };

  // Remove individual file from pre-upload list
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

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
      const response = await fetch("/api/admin/results", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          responseText
            ? `Server Error: ${responseText}`
            : `Server returned an empty response (${response.status})`,
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload result files");
      }

      setUploadResults(data.results || []);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="p-6 md:p-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Bulk Upload Result Credentials
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Upload candidate Result Password PDFs. Extracts usernames,
                  passwords, and release dates automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6"
          >
            {/* Drag & Drop Target Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed transition-all rounded-2xl p-8 text-center ${
                isDragging
                  ? "border-amber-600 bg-amber-50/60 scale-[0.99]"
                  : "border-slate-300 hover:border-amber-500 bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="result-files-input"
              />
              <label
                htmlFor="result-files-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div
                  className={`p-4 rounded-full shadow-xs border transition-colors ${
                    isDragging
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white border-slate-200 text-amber-600"
                  }`}
                >
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {isDragging
                      ? "Drop Result PDFs here..."
                      : "Click to browse or drag and drop Result PDFs"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Expected format:{" "}
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      CANDIDATE_ID.pdf
                    </code>{" "}
                    Eg: 0001.pdf
                  </p>
                </div>
              </label>
            </div>

            {/* Selected File List with Individual Delete Buttons */}
            {selectedFiles.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-amber-900">
                    Selected Files ({selectedFiles.length}):
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {selectedFiles.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-amber-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-mono text-slate-800 truncate">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans flex-shrink-0">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing and Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} File${
                  selectedFiles.length === 1 ? "" : "s"
                }`
              )}
            </button>
          </form>

          {/* Results Summary Table */}
          {uploadResults.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Processing Results
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full">
                  Total: {uploadResults.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3.5 px-6">File Name</th>
                      <th className="py-3.5 px-6">Candidate ID</th>
                      <th className="py-3.5 px-6">Username / Pass</th>
                      <th className="py-3.5 px-6">Release Date</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {uploadResults.map((res, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono text-xs text-slate-800">
                          {res.fileName}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-indigo-600">
                          {res.candidateId || "—"}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-700">
                          {res.username} / {res.password}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {res.releaseDetails &&
                          res.releaseDetails.length > 0 ? (
                            <div className="space-y-1.5">
                              {res.releaseDetails.map((rel, i) => (
                                <div
                                  key={i}
                                  className="flex flex-col bg-slate-50 p-1.5 rounded border border-slate-200/60"
                                >
                                  <span className="font-semibold text-indigo-600">
                                    {rel.subject}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {rel.date}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            res.releaseDate || "—"
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {res.status === "Success" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Success
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full"
                              title={res.reason}
                            >
                              <FileX className="w-3.5 h-3.5" />{" "}
                              {res.reason || "Failed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
