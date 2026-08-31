import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route yang bisa diakses tanpa login
const PUBLIC_ROUTES = ["/", "/login", "/register"];

// Mapping role → dashboard default
const ROLE_DASHBOARD: Record<string, string> = {
  PATIENT: "/patient",
  PHARMACIST: "/pharmacist",
  ADMIN: "/admin",
};

// Mapping role → route prefix yang diizinkan
const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  PATIENT: ["/patient", "/api"],
  PHARMACIST: ["/pharmacist", "/api"],
  ADMIN: ["/admin", "/api"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Cek apakah ada cookie session Supabase
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  // Optimasi 0ms untuk user yang belum login (tanpa cookie auth)
  if (!hasAuthCookie) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (PUBLIC_ROUTES.includes(pathname)) {
      return response;
    }
    // Protected route tapi tanpa cookie -> langsung redirect ke login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Buat Supabase client untuk memverifikasi session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes — jika sudah login, redirect ke dashboard role
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (user) {
      const userRole =
        (user.user_metadata?.role as string) ||
        (
          await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()
        ).data?.role ||
        "PATIENT";

      const dashboard = ROLE_DASHBOARD[userRole] ?? "/patient";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return response;
  }

  // Protected routes — jika token invalid / expired
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // API routes diizinkan untuk semua authenticated user
  if (pathname.startsWith("/api")) {
    return response;
  }

  // Ambil role dari user_metadata (cepat) atau fallback ke tabel users
  let role = (user.user_metadata?.role as string) || "";
  if (!role) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "PATIENT";
  }

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] ?? ["/patient"];

  // Cek apakah route diizinkan untuk role ini
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed) {
    const dashboard = ROLE_DASHBOARD[role] ?? "/patient";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match semua route kecuali static files dan API internal Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
