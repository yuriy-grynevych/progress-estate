import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["uk", "en"];
const defaultLocale = "uk";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const authMiddleware = withAuth(
  function onSuccess() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export default function middleware(req: NextRequest) {
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  if (isAdminPage) {
    return (authMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  }

  if (isAuthPage) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/(uk|en)/:path*",
    "/",
  ],
};
