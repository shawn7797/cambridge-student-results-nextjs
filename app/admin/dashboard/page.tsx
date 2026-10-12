"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  FileText,
  KeyRound,
  Award,
  Users,
  ArrowRight,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser();

  const adminName = user?.firstName || user?.username || "Admin";
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <Navbar />

      <main className="p-6 md:p-6">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                <ShieldAlert className="w-3.5 h-3.5" />
                Administrator Access
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, {adminName}
              </h1>
              <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed">
                Manage Cambridge examination statements, process bulk student
                credentials, and oversee candidate portal access with automated
                extraction pipelines.
              </p>
            </div>

            {/* Decorative background blur elements */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-40 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Quick Action / Module Management Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Document Processing Modules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Module 1: Statement of Entry */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Statement of Entry
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Bulk upload student entry PDFs, extract Date of Birth &
                      Candidate IDs, auto-generate temporary passwords, and sync
                      with Clerk accounts.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href="/admin/statement-of-entry"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Open Module{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Module 2: Result Credentials */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Result Passwords
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Bulk upload result credential PDFs, parse candidate
                      usernames and passwords, and store PDF records directly in
                      Vercel Blob and Neon DB.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href="/admin/results"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    Open Module{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Module 3: Statement of Result */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Statement of Result
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Upload final official Cambridge result statements,
                      associate them with candidate profiles, and unlock student
                      downloads.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href="/admin/statement-of-result"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    Open Module{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* System Overview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              System Status & Architecture
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Authentication</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  Clerk Auth & Roles
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Database Engine</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  Neon PostgreSQL
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Document Storage</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  Vercel Blob Public
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">PDF Parser</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  pdf-parse Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
