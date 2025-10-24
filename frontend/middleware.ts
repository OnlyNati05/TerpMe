import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Create user "uid"
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get("uid")?.value) {
    res.cookies.set("uid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return res;
  }
}

// Run on everything except static assets
export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)"],
};
