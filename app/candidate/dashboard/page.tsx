// app/candidate/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  FileText,
  KeyRound,
  Award,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function CandidateDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { redirectToSignIn } = useClerk();

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/candidate/records");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load records");
        }

        setData(json);
      } catch (err: any) {
        setError(err.message);
        if (err.message === "Unauthorized") {
          redirectToSignIn();
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="p-8 max-w-xl mx-auto w-full">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Candidate Greeting Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {data?.candidate?.name}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Candidate Number: {data?.candidate?.candidate_id}
            </p>
          </div>

          {/* 1. Statement of Entry Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Statement of Entry
              </h2>
            </div>

            {data?.statementsOfEntry?.length > 0 ? (
              <div className="space-y-2">
                {data.statementsOfEntry.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <span className="text-xs font-mono text-slate-700">
                      {item.file_name}
                    </span>
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Statement of Entry has not been uploaded yet.
              </p>
            )}
          </div>

          {/* 2. Result Credentials Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Result Passwords & Credentials
              </h2>
            </div>

            {data?.resultCredentials?.length > 0 ? (
              <div className="space-y-3">
                {data.resultCredentials.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-semibold text-slate-800">
                        Username: {item.username}
                      </span>
                      <span className="font-mono font-semibold text-amber-700">
                        Password: {item.password}
                      </span>
                    </div>
                    {item.release_details && item.release_details.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        <p className="text-xs font-semibold text-slate-700">
                          Release Schedule:
                        </p>
                        {item.release_details.map((rel: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white p-2 rounded border border-slate-200"
                          >
                            <span className="font-semibold text-indigo-600">
                              {rel.subject}
                            </span>
                            <span className="text-slate-500">{rel.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      item.release_date && (
                        <p className="text-[11px] text-slate-500">
                          Available from: {item.release_date}
                        </p>
                      )
                    )}
                    <div className="pt-2 flex justify-end">
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF Sheet
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Result credentials pending upload.
              </p>
            )}
          </div>

          {/* 3. Statement of Result Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Official Statement of Result
              </h2>
            </div>

            {data?.statementsOfResult?.length > 0 ? (
              <div className="space-y-2">
                {data.statementsOfResult.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <span className="text-xs font-mono text-slate-700">
                      {item.file_name}
                    </span>
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Final statements of result have not been published yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
