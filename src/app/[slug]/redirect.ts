import { httpAction } from "@convex/_generated/server";
import { api } from "@convex/_generated/api";

export const recordAndRedirect = httpAction(async (ctx, req) => {
  // Parse request body
  let slug: string;
  let ip: string;
  let userAgent: string;
  let referrer: string;

  try {
    const body = await req.json();
    slug = body.slug;
    ip = body.ip;
    userAgent = body.userAgent;
    referrer = body.referrer;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!slug) {
    return new Response(
      JSON.stringify({ error: "Missing slug" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Call Convex mutation to record click
    const result = await ctx.runMutation(api.urls.recordClick, {
      slug,
      ip,
      userAgent,
      referrer,
    });

    // Return 302 redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: result.redirectUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("not found")) {
      return new Response(
        JSON.stringify({ error: "URL not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Redirect error:", error);
    return new Response(
      JSON.stringify({ error: message || "Failed to process redirect" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});