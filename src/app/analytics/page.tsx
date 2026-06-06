"use client";

import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-slate-600 mb-6">
          Select a link from your dashboard to view analytics.
        </p>
        <Link href="/dashboard">
          <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
            Go to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
