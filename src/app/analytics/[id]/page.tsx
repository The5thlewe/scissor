"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, Loader } from "lucide-react";
import { useState } from "react";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AnalyticsDetailPage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);

  const urlId = params.id as Id<"urls">;

  const urlDetails = useQuery(api.urls.getUrlDetails, { urlId });
  const timeSeries = useQuery(api.urls.getClicksTimeSeries, {
    urlId,
    days: 30,
  });
  const breakdown = useQuery(api.urls.getClicksBreakdown, { urlId });

  if (
    urlDetails === undefined ||
    timeSeries === undefined ||
    breakdown === undefined
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!urlDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-600 mb-6">Link not found</p>
          <Link href="/dashboard">
            <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shortUrl = `${appUrl}/${urlDetails.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard">
          <button className="text-blue-600 hover:text-blue-700 mb-6 font-medium">
            ← Back to Dashboard
          </button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            {urlDetails.title || "Analytics"}
          </h1>
          <p className="text-slate-600 font-mono text-sm">
            {urlDetails.originalUrl}
          </p>
        </div>

        <div className="card p-6 mb-8 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">
            Short URL
          </p>
          <div className="flex items-center gap-3">
            <code className="text-lg font-mono font-bold text-blue-600">
              {shortUrl}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm transition"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <p className="text-slate-600 text-sm mb-2">Total Clicks</p>
            <p className="text-4xl font-bold text-blue-600">
              {urlDetails.clickCount}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-slate-600 text-sm mb-2">Created</p>
            <p className="text-lg font-semibold">
              {new Date(urlDetails.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-slate-600 text-sm mb-2">Slug</p>
            <p className="text-lg font-mono font-bold">{urlDetails.slug}</p>
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Clicks Over Time (30 days)</h2>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded">
              <p className="text-slate-500">No clicks yet</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">By Device</h3>
            {breakdown.deviceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={breakdown.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdown.deviceBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-50 rounded">
                <p className="text-slate-500">No data</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">By Browser</h3>
            {breakdown.browserBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={breakdown.browserBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-50 rounded">
                <p className="text-slate-500">No data</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">By Referrer</h3>
            {breakdown.referrerBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={breakdown.referrerBreakdown.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-50 rounded">
                <p className="text-slate-500">No data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
