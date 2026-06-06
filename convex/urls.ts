import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const isValidUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const parseUserAgent = (ua: string) => {
  const isMobile = /Mobile|Android|iPhone/.test(ua);
  const isTablet = /Tablet|iPad/.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "Other";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edge")) browser = "Edge";

  return { device, browser };
};

// ============================================================================
// MUTATIONS - Create/Update/Delete
// ============================================================================

/**
 * MUTATION: Create a shortened URL
 */
export const createShortLink = mutation({
  args: {
    originalUrl: v.string(),
    customSlug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    qrCodeColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (userDoc) {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentUrls = await ctx.db
        .query("urls")
        .withIndex("by_userId", (q) => q.eq("userId", userDoc._id))
        .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
        .collect();

      if (recentUrls.length >= 100) {
        throw new Error("Rate limit exceeded: Maximum 100 links per 24 hours");
      }
    }

    if (!isValidUrl(args.originalUrl)) {
      throw new Error("Invalid URL format");
    }

    if (args.originalUrl) {
      try {
        const domain = new URL(args.originalUrl).hostname;
        const blocked = await ctx.db
          .query("urlBlocklist")
          .withIndex("by_domain", (q) => q.eq("domain", domain))
          .first();
        if (blocked) throw new Error("This domain is blocked");
      } catch (e) {
        if (e instanceof Error && e.message.includes("blocked")) throw e;
      }
    }

    const customSlug = args.customSlug?.toLowerCase().trim();
    if (customSlug && !/^[a-z0-9_-]{3,30}$/.test(customSlug)) {
      throw new Error("Slug must be 3-30 chars (alphanumeric, dash, underscore)");
    }

    let slug = customSlug || nanoid(6);

    const existing = await ctx.db
      .query("urls")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      if (customSlug) throw new Error("Custom slug already taken");
      slug = nanoid(7);
    }

    let userRecord = userDoc;

    if (!userRecord) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        name: identity.name,
        createdAt: Date.now(),
      });
      userRecord = await ctx.db.get(userId);
    }

    const urlId = await ctx.db.insert("urls", {
      userId: userRecord!._id,
      slug,
      originalUrl: args.originalUrl,
      customSlug,
      title: args.title,
      description: args.description,
      qrCodeColor: args.qrCodeColor || "#000000",
      createdAt: Date.now(),
      isActive: true,
      clickCount: 0,
    });

    return {
      id: urlId,
      slug,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://scissor-cyan.vercel.app/"}/${slug}`,
      originalUrl: args.originalUrl,
    };
  },
});

/**
 * MUTATION: Record a click on a short link
 */
export const recordClick = mutation({
  args: {
    slug: v.string(),
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.string(),
  },
  handler: async (ctx, args) => {
    const urlDoc = await ctx.db
      .query("urls")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!urlDoc || !urlDoc.isActive) {
      throw new Error("URL not found or expired");
    }

    if (urlDoc.expiresAt && urlDoc.expiresAt < Date.now()) {
      throw new Error("This link has expired");
    }

    const { device, browser } = parseUserAgent(args.userAgent);

    await ctx.db.insert("clicks", {
      urlId: urlDoc._id,
      timestamp: Date.now(),
      ip: args.ip,
      userAgent: args.userAgent,
      referrer: args.referrer || "direct",
      device: device as "mobile" | "tablet" | "desktop",
      browser,
      country: "Unknown",
    });

    await ctx.db.patch(urlDoc._id, {
      clickCount: urlDoc.clickCount + 1,
    });

    return {
      redirectUrl: urlDoc.originalUrl,
      slug: args.slug,
    };
  },
});

/**
 * MUTATION: Update a URL's metadata
 */
export const updateUrl = mutation({
  args: {
    urlId: v.id("urls"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    qrCodeColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const urlDoc = await ctx.db.get(args.urlId);
    if (!urlDoc) throw new Error("URL not found");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc || urlDoc.userId !== userDoc._id) {
      throw new Error("Unauthorized");
    }

    const update: Record<string, any> = {};
    if (args.title !== undefined) update.title = args.title;
    if (args.description !== undefined) update.description = args.description;
    if (args.qrCodeColor !== undefined) update.qrCodeColor = args.qrCodeColor;

    await ctx.db.patch(args.urlId, update);
  },
});

/**
 * MUTATION: Delete a URL (soft delete)
 */
export const deleteUrl = mutation({
  args: { urlId: v.id("urls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const urlDoc = await ctx.db.get(args.urlId);
    if (!urlDoc) throw new Error("URL not found");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc || urlDoc.userId !== userDoc._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.urlId, { isActive: false });
  },
});

// ============================================================================
// QUERIES - Fetch/Read
// ============================================================================

/**
 * QUERY: Get all URLs for authenticated user
 */
export const getUserUrls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) return [];

    const urls = await ctx.db
      .query("urls")
      .withIndex("by_userId", (q) => q.eq("userId", userDoc._id))
      .collect();

    return urls
      .filter((u) => u.isActive)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit || 100);
  },
});

/**
 * QUERY: Get details for one URL
 */
export const getUrlDetails = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const urlDoc = await ctx.db.get(args.urlId);
    if (!urlDoc) return null;

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc || urlDoc.userId !== userDoc._id) {
      throw new Error("Unauthorized");
    }

    return urlDoc;
  },
});

/**
 * QUERY: Get clicks over time for a URL
 */
export const getClicksTimeSeries = query({
  args: { urlId: v.id("urls"), days: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const urlDoc = await ctx.db.get(args.urlId);
    if (!urlDoc) throw new Error("URL not found");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc || urlDoc.userId !== userDoc._id) {
      throw new Error("Unauthorized");
    }

    const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;
    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_urlId", (q) => q.eq("urlId", args.urlId))
      .collect();

    const byDay: Record<string, number> = {};
    clicks
      .filter((c) => c.timestamp > cutoff)
      .forEach((c) => {
        const date = new Date(c.timestamp).toISOString().split("T")[0];
        byDay[date] = (byDay[date] || 0) + 1;
      });

    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * QUERY: Get device/browser/referrer breakdown
 */
export const getClicksBreakdown = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const urlDoc = await ctx.db.get(args.urlId);
    if (!urlDoc) throw new Error("URL not found");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc || urlDoc.userId !== userDoc._id) {
      throw new Error("Unauthorized");
    }

    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_urlId", (q) => q.eq("urlId", args.urlId))
      .collect();

    const byDevice: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byReferrer: Record<string, number> = {};

    clicks.forEach((c) => {
      byDevice[c.device] = (byDevice[c.device] || 0) + 1;
      byBrowser[c.browser] = (byBrowser[c.browser] || 0) + 1;
      const ref = c.referrer === "direct" ? "Direct" : c.referrer;
      byReferrer[ref] = (byReferrer[ref] || 0) + 1;
    });

    return {
      deviceBreakdown: Object.entries(byDevice)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      browserBreakdown: Object.entries(byBrowser)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      referrerBreakdown: Object.entries(byReferrer)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  },
});

/**
 * QUERY: Get dashboard stats
 */
export const getTotalStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) return null;

    const urls = await ctx.db
      .query("urls")
      .withIndex("by_userId", (q) => q.eq("userId", userDoc._id))
      .collect();

    const activeUrls = urls.filter((u) => u.isActive);
    const totalClicks = activeUrls.reduce((sum, u) => sum + u.clickCount, 0);

    return {
      totalLinks: activeUrls.length,
      totalClicks,
      averageClicks:
        activeUrls.length > 0 ? totalClicks / activeUrls.length : 0,
    };
  },
});

/**
 * QUERY: Get URL by slug (used internally for redirects)
 */
export const getUrlBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("urls")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});
