"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// #region agent log
if (typeof window !== "undefined") {
  fetch("http://127.0.0.1:7845/ingest/5a1fdf5b-5533-4d86-82c8-996b2cd2db4c", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bede5d",
    },
    body: JSON.stringify({
      sessionId: "bede5d",
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "src/components/ConvexClientProvider.tsx:init",
      message: "Convex client env check",
      data: { hasConvexUrl: Boolean(convexUrl) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

const convex = new ConvexReactClient(convexUrl!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
