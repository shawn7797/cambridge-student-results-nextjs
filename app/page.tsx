// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");

  // Automatically route users based on their role/identity once logged in
  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role;

      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.username) {
        // Automatically send students straight to their result page
        router.replace(`/candidate/dashboard`);
      }
    }
  }, [isLoaded, user, router]);

  // Show a tiny loader while checking user session to prevent flickering
  if (!isLoaded || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateId.trim()) {
      router.push(`/results/${candidateId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Section & Search Bar for unauthenticated visitors */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Instant Result Verification</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight max-w-3xl mx-auto">
            Check Your Academic Results{" "}
            <span className="text-blue-600">Fast & Secure</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Enter your unique Candidate ID below to instantly view, verify, and
            download your official grade report PDF.
          </p>

          <div className="mt-10 max-w-md mx-auto">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  placeholder="Enter Candidate ID (e.g., 0001)"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm text-sm cursor-pointer"
              >
                Search
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
