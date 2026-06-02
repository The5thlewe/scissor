"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import { Copy, Trash2, Eye, Loader } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

interface UrlItem {
  _id: Id<"urls">;
  slug: string;
  originalUrl: string;
  title?: string;
  clickCount: number;
  createdAt: number;
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const urls = useQuery(api.urls.getUserUrls, {});
  const stats = useQuery(api.urls.getTotalStats, {});
  const deleteUrl = useMutation(api.urls.deleteUrl);
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: Id<"urls">) => {
    if (!confirm("Delete this link?")) return;
    setDeletingId(id);
    try {
      await deleteUrl({ urlId: id });
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete link");
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (urls === undefined || stats === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-slate-600">Loading your links...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your shortened links</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card p-6">
              <p className="text-slate-600 text-sm mb-2">Total Links</p>
              <p className="text-4xl font-bold text-blue-600">
                {stats.totalLinks}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-slate-600 text-sm mb-2">Total Clicks</p>
              <p className="text-4xl font-bold text-green-600">
                {stats.totalClicks}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-slate-600 text-sm mb-2">Avg Clicks/Link</p>
              <p className="text-4xl font-bold text-purple-600">
                {stats.averageClicks.toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Links List */}
        {urls.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-600 mb-6">No links created yet</p>
            <Link href="/">
              <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                Create Your First Link
              </button>
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Short Link</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Original URL</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Clicks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {urls.map((url: UrlItem) => (
                    <tr key={url._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono text-blue-600 font-bold">
                          {url.slug}
                        </code>
                        {url.title && (
                          <p className="text-xs text-slate-500 mt-1">{url.title}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 truncate max-w-xs">
                          {url.originalUrl}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{url.clickCount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {new Date(url.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Copy Button */}
                          <button
                            onClick={() =>
                              handleCopy(
                                `${process.env.NEXT_PUBLIC_APP_URL}/${url.slug}`,
                                url._id
                              )
                            }
                            className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm transition"
                          >
                            <Copy size={14} />
                            {copiedId === url._id ? "Copied!" : "Copy"}
                          </button>

                          {/* Analytics Button */}
                          <Link href={`/analytics/${url._id}`}>
                            <button className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded text-sm transition">
                              <Eye size={14} />
                              Analytics
                            </button>
                          </Link>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(url._id)}
                            disabled={deletingId === url._id}
                            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 disabled:text-gray-500 px-3 py-2 rounded text-sm transition"
                          >
                            {deletingId === url._id ? (
                              <Loader size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            {deletingId === url._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
