"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";

const navLinks = [
  { name: "Home", href: "/admin/dashboard" },
  { name: "Statement of Entry", href: "/admin/statement-of-entry" },
  { name: "Results Upload", href: "/admin/results" },
  { name: "Statement of Result", href: "/admin/statement-of-result" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Check if the current user has admin role in Clerk publicMetadata
  const isAdmin = isLoaded && user?.publicMetadata?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            Cambridge ResultFlow
          </span>
        </Link>

        {/* Centered Route Links - Rendered ONLY for Admins */}
        {isAdmin ? (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80 absolute left-1/2 -translate-x-1/2 z-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-slate-950 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <div /> // Spacer to preserve justify-between layout when admin links are hidden
        )}

        {/* Right side: Auth buttons aligned to the far right */}
        <div className="flex items-center gap-3 shrink-0">
          <Show when="signed-out">
            <SignInButton />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
