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

  // Buat Supabase client untuk middleware (cookie-based session)
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

  // Public routes — bisa diakses siapa saja
  if (PUBLIC_ROUTES.includes(pathname)) {
    // Jika sudah login, redirect ke dashboard sesuai role
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

  // Protected routes — harus login
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
