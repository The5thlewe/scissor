import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const startTime = performance.now();
  const params = await props.params;
  const { slug } = params;
  const convexSiteUrl =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site");

  // #region agent log
  fetch("http://127.0.0.1:7845/ingest/5a1fdf5b-5533-4d86-82c8-996b2cd2db4c", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bede5d",
    },
    body: JSON.stringify({
      sessionId: "bede5d",
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "src/app/[slug]/route.ts:env-check",
      message: "Redirect env resolution",
      data: {
        hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_CONVEX_SITE_URL),
        hasCloudUrl: Boolean(process.env.NEXT_PUBLIC_CONVEX_URL),
        resolvedSiteUrl: Boolean(convexSiteUrl),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // Skip static files
  if (/\.(ico|png|jpg|svg|gif|webp|txt|xml|json)$/.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!convexSiteUrl) {
    console.error(
      "[REDIRECT] Configuration error: NEXT_PUBLIC_CONVEX_SITE_URL not set"
    );
    return NextResponse.json(
      { error: "Configuration error" },
      { status: 500 }
    );
  }

  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "direct";

    const fetchStartTime = performance.now();

    // Call Convex HTTP action to record click
    const response = await fetch(`${convexSiteUrl}/recordAndRedirect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug,
        ip,
        userAgent,
        referrer,
      }),
    });

    const fetchTime = performance.now() - fetchStartTime;

    // Handle redirect response (HTTP action returns 302)
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get("location");
      if (location) {
        const totalTime = performance.now() - startTime;
        console.log(
          `[REDIRECT] slug=${slug} status=302 fetchTime=${fetchTime.toFixed(2)}ms totalTime=${totalTime.toFixed(2)}ms ip=${ip}`
        );
        return NextResponse.redirect(location, { status: 302 });
      }
    }

    // Handle JSON response
    if (response.status === 404) {
      const totalTime = performance.now() - startTime;
      console.log(
        `[REDIRECT] slug=${slug} status=404 totalTime=${totalTime.toFixed(2)}ms`
      );
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!response.ok) {
      const totalTime = performance.now() - startTime;
      console.warn(
        `[REDIRECT] slug=${slug} status=${response.status} fetchTime=${fetchTime.toFixed(2)}ms totalTime=${totalTime.toFixed(2)}ms`
      );
      return NextResponse.json(
        { error: "Redirect failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data.redirectUrl) {
      const totalTime = performance.now() - startTime;
      console.log(
        `[REDIRECT] slug=${slug} status=404 totalTime=${totalTime.toFixed(2)}ms`
      );
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const totalTime = performance.now() - startTime;
    console.log(
      `[REDIRECT] slug=${slug} status=302 fetchTime=${fetchTime.toFixed(2)}ms totalTime=${totalTime.toFixed(2)}ms ip=${ip}`
    );
    return NextResponse.redirect(data.redirectUrl, { status: 302 });
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error(
      `[REDIRECT] slug=${slug} error=${error instanceof Error ? error.message : String(error)} totalTime=${totalTime.toFixed(2)}ms`
    );
    return NextResponse.json(
      { error: "Redirect failed" },
      { status: 500 }
    );
  }
}