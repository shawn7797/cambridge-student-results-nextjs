"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Upload,
  FileX,
  Loader2,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

interface UploadResult {
  pageNumber: number;
  candidateId?: string;
  fileName?: string;
  status: "Success" | "Failed";
  reason?: string;
}

export default function StatementOfResultUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setUploadResults([]);
        setError(null);
      } else {
        setError("Please select a valid PDF file.");
      }
      e.target.value = "";
    }
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setUploadResults([]);
        setError(null);
      } else {
        setError("Please drop a valid PDF file.");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/admin/statement-of-result", {
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
        throw new Error(
          data.error || "Failed to process Statement of Results PDF",
        );
      }

      setUploadResults(data.results);
      setSelectedFile(null);
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
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Upload Statement of Results (Bulk PDF)
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Upload the multi-candidate Cambridge Statement of Results PDF.
                  The system will automatically split each page, extract
                  candidate numbers, save individual PDFs to Vercel Blob, and
                  log records.
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
                  ? "border-emerald-600 bg-emerald-50/60 scale-[0.99]"
                  : "border-slate-300 hover:border-emerald-500 bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="sor-file-input"
              />
              <label
                htmlFor="sor-file-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div
                  className={`p-4 rounded-full shadow-xs border transition-colors ${
                    isDragging
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white border-slate-200 text-emerald-600"
                  }`}
                >
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {isDragging
                      ? "Drop Statement of Results PDF here..."
                      : "Click to browse or drag and drop multi-candidate PDF"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Expected format: Single multi-page Cambridge exam results
                    document
                  </p>
                </div>
              </label>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-800 truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans flex-shrink-0">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
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
              disabled={uploading || !selectedFile}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Splitting PDF and Processing Candidates...
                </>
              ) : (
                "Process and Upload Statement of Results"
              )}
            </button>
          </form>

          {/* Processing Results Summary Table */}
          {uploadResults.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Page Splitting & Upload Results
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full">
                  Total Pages Processed: {uploadResults.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-3.5 px-6">Page #</th>
                      <th className="py-3.5 px-6">Extracted Candidate ID</th>
                      <th className="py-3.5 px-6">Generated File Name</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {uploadResults.map((res, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono text-xs text-slate-700">
                          Page {res.pageNumber}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-emerald-600">
                          {res.candidateId || "—"}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                          {res.fileName || "—"}
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
