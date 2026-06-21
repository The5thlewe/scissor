import { readFileSync, existsSync } from "node:fs";

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
