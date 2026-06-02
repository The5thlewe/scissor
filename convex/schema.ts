import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========================================================================
  // USERS TABLE - Mirrors Clerk for custom data
  // ========================================================================
  users: defineTable({
    clerkId: v.string(),                    // Unique Clerk ID
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),      // Fast user lookup

  // ========================================================================
  // URLS TABLE - Main shortened URLs
  // ========================================================================
  urls: defineTable({
    userId: v.id("users"),                  // Who created this
    slug: v.string(),                       // 6-char slug (e.g., "abc123")
    originalUrl: v.string(),                // Full original URL
    customSlug: v.optional(v.string()),     // User-provided slug
    title: v.optional(v.string()),          // Friendly name
    description: v.optional(v.string()),    // Notes
    qrCodeColor: v.string(),                // Hex color for QR
    createdAt: v.number(),                  // When created
    expiresAt: v.optional(v.number()),      // Optional expiry time
    isActive: v.boolean(),                  // Soft delete flag
    clickCount: v.number(),                 // Cached count (updated by clicks)
  })
    .index("by_slug", ["slug"])             // Fast redirect lookup
    .index("by_userId", ["userId"])         // List user's links
    .index("by_createdAt", ["userId", "createdAt"]),  // Timeline queries

  // ========================================================================
  // CLICKS TABLE - Analytics data
  // ========================================================================
  clicks: defineTable({
    urlId: v.id("urls"),                    // Which link was clicked
    timestamp: v.number(),                  // When
    ip: v.string(),                         // Client IP
    userAgent: v.string(),                  // Browser info
    referrer: v.string(),                   // Where from (or "direct")
    country: v.optional(v.string()),        // GeoIP result
    device: v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop")
    ),
    browser: v.string(),                    // Chrome, Safari, Firefox, etc.
  })
    .index("by_urlId", ["urlId"])           // Get clicks for one URL
    .index("by_timestamp", ["urlId", "timestamp"]),  // Time-series queries

  // ========================================================================
  // BLOCKLIST TABLE - Phishing/malware domains
  // ========================================================================
  urlBlocklist: defineTable({
    domain: v.string(),                     // e.g., "phishing-site.com"
    reason: v.string(),                     // "phishing", "malware", "spam"
    addedAt: v.number(),                    // When added
  }).index("by_domain", ["domain"]),        // Fast lookup during creation
});
