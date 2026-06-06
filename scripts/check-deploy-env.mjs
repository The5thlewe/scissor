import { appendFileSync, readFileSync, existsSync } from "node:fs";

for (const envFile of [".env.local", ".env.production.local", ".env"]) {
  if (!existsSync(envFile)) continue;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const required = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

const recommended = [
  "NEXT_PUBLIC_CONVEX_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "CLERK_JWT_ISSUER_DOMAIN",
];

const missing = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

const logEntry = {
  sessionId: "bede5d",
  runId: process.env.VERCEL ? "vercel-build" : "local-build",
  hypothesisId: "H1",
  location: "scripts/check-deploy-env.mjs",
  message: "Deploy env validation",
  data: {
    missingRequired: missing,
    missingRecommended,
    vercelEnv: Boolean(process.env.VERCEL),
  },
  timestamp: Date.now(),
};

try {
  appendFileSync("debug-bede5d.log", `${JSON.stringify(logEntry)}\n`);
} catch {
  // debug log file may not exist in CI
}

if (missing.length > 0 && process.env.VERCEL) {
  console.error(
    `Missing required environment variables for deployment: ${missing.join(", ")}`
  );
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(
    `Recommended environment variables not set: ${missingRecommended.join(", ")}`
  );
}
