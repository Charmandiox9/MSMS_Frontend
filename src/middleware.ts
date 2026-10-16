import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.includes("/auth/callback")) {
    const route = req.nextUrl.searchParams.get("route") || "/dashboard";
    // The entry page validates the session and asks multi-role users which view to open.
    const target =
      route.startsWith("/dashboard/") || route === "/no-access" ? route : "/";
    const url = req.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(es|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
