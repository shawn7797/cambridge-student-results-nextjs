"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  ShieldCheck,
  Zap,
  FileText,
  Lock,
  ArrowRight,
  UploadCloud,
  UserCheck,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Automatically route users based on their role/identity once logged in
  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role;

      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.username || role === "candidate") {
        router.replace(`/candidate/dashboard`);
      }
    }
  }, [isLoaded, user, router]);

  // Show a tiny loader while checking user session to prevent flickering
  if (!isLoaded || user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Zap className="h-4 w-4" />
            <span>Cambridge Exam Management Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Check Your Academic Results{" "}
            <span className="text-blue-600">Fast & Secure</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A centralized platform for Cambridge International candidates and
            administrators. Log in securely to view and download your statements
            of entry, exam schedules, and official statements of results.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton mode="modal">
              <button className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-base cursor-pointer">
                <span>Login to Access Results</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </SignInButton>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-3xl shadow-sm border border-slate-100 my-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How It Works for Candidates
            </h2>
            <p className="mt-2 text-slate-600 max-w-l mx-auto">
              Getting your official examination documents is quick, transparent,
              and completely secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-text text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UploadCloud className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                Step 01
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Administrator Upload
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your school’s exam officer securely uploads and processes
                official examination documents into the system.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UserCheck className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                Step 02
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Secure Authentication
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Log in to your dedicated student account using your candidate
                credentials to establish a secure session.
              </p>

              {/* Formatted Credential Example Box */}
              <div className="w-full bg-slate-100 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 text-left space-y-1.5">
                <p className="font-semibold text-slate-800 text-center mb-1">
                  Example Format:
                </p>
                <p className="text-slate-500 text-[11px] text-center mb-2">
                  Candidate ID:{" "}
                  <span className="font-mono text-slate-700">0001</span> | DOB:{" "}
                  <span className="font-mono text-slate-700">1 Jan 2000</span>
                </p>
                <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-200">
                  <span className="text-slate-500 font-medium">Username:</span>
                  <code className="font-mono font-semibold text-blue-600">
                    0001
                  </code>
                </div>
                <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-200">
                  <span className="text-slate-500 font-medium">Password:</span>
                  <code className="font-mono font-semibold text-blue-600">
                    000101012000
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-text text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Download className="h-7 w-7" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                Step 03
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Instant Access & Downloads
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gain immediate access to your verified statements of entry and
                individual statements of results.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Designed for Speed, Security & Simplicity
            </h2>
            <p className="mt-2 text-slate-600">
              Streamlining examination workflows from bulk document uploads to
              individual student portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Secure Role-Based Access
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Protected candidate authentication ensures that students
                securely access only their own verified credentials and
                documents.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Automated Statements & Results
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instant delivery of official Statement of Results and Statements
                of Entry, backed by automated PDF splitting and secure cloud
                storage.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Eliminating Manual Errors
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Empowers Exam Officers with fault-tolerant background batch
                processing, saving valuable time and removing manual
                distribution overhead.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styling matching the blue theme */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        ::-webkit-scrollbar-thumb {
          background: #2563eb;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
