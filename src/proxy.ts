import { NextResponse, type NextRequest } from "next/server";

// Cheap cookie-presence check so signed-out visitors are redirected before any page renders.
// Pages and API routes still verify the session against the database.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("ds_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/account/:path*", "/profiles/:path*", "/onboarding/:path*", "/reports/:path*"],
};
