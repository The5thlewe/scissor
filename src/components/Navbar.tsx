"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          ✂️ Scissor
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn && (
            <>
              <Link
                href="/dashboard"
                className="text-slate-700 hover:text-blue-600 font-medium transition"
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="text-slate-700 hover:text-blue-600 font-medium transition"
              >
                Analytics
              </Link>
            </>
          )}

          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
