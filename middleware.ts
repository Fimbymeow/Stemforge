import { type NextRequest } from "next/server";
import { refreshAuthSession } from "@/lib/auth/session-middleware";

export function middleware(request: NextRequest) {
  return refreshAuthSession(request);
}

export const config = {
  matcher: ["/account/:path*", "/auth/:path*"],
};
