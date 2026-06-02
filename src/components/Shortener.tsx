"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function Shortener() {
  const { isSignedIn } = useAuth();
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [qrColor, setQrColor] = useState("#000000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const createShortLink = useMutation(api.urls.createShortLink);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    if (!isSignedIn) {
      setError("Please sign in to create links");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await createShortLink({
        originalUrl: url,
        customSlug: customSlug || undefined,
        qrCodeColor: qrColor,
      });
      setResult(response);
      setUrl("");
      setCustomSlug("");
    } catch (err: any) {
      setError(err.message || "Failed to create short link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Long URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label">Custom Slug (optional)</label>
          <input
            type="text"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="my-link"
            pattern="^[a-z0-9_-]*$"
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">3-30 chars, alphanumeric with dash/underscore</p>
        </div>

        <div>
          <label className="label">QR Code Color</label>
          <input
            type="color"
            value={qrColor}
            onChange={(e) => setQrColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Short Link"}
        </button>
      </form>

      {result && (
        <div className="mt-6 card p-6 bg-green-50 border-green-200">
          <h3 className="font-bold text-green-900 mb-4">Link Created!</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Short URL:</p>
              <Link
                href={`/${result.slug}`}
                target="_blank"
                className="text-blue-600 hover:underline font-mono break-all"
              >
                {result.shortUrl}
              </Link>
            </div>
            <div>
              <p className="text-sm text-slate-600">Original URL:</p>
              <p className="text-slate-900 font-mono text-sm break-all">{result.originalUrl}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.shortUrl);
                alert("Copied to clipboard!");
              }}
              className="btn-secondary w-full"
            >
              Copy Short URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
