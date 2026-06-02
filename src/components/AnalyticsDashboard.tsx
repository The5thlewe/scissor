"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "./LoadingSpinner";

interface AnalyticsDashboardProps {
  urlId: Id<"urls">;
}

export default function AnalyticsDashboard({ urlId }: AnalyticsDashboardProps) {
  const stats = useQuery(api.urls.getTotalStats);
  const timeSeries = useQuery(api.urls.getClicksTimeSeries, { urlId, days: 30 });
  const breakdown = useQuery(api.urls.getClicksBreakdown, { urlId });

  if (stats === undefined || timeSeries === undefined || breakdown === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <p className="text-sm text-slate-600">Total Clicks</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalClicks}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600">Total Links</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalLinks}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600">Avg Clicks per Link</p>
            <p className="text-3xl font-bold text-slate-900">
              {stats.averageClicks.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {timeSeries && timeSeries.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {breakdown && (
        <>
          {breakdown.deviceBreakdown && breakdown.deviceBreakdown.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4">Devices</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown.deviceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {breakdown.browserBreakdown && breakdown.browserBreakdown.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4">Browsers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown.browserBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {breakdown.referrerBreakdown && breakdown.referrerBreakdown.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4">Referrers</h3>
              <div className="space-y-2">
                {breakdown.referrerBreakdown.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
