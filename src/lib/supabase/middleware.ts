import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  const pathname = request.nextUrl.pathname;
  const publicPatterns = [
    /^\/$/,
    /^\/login/,
    /^\/signup/,
    /^\/callback/,
    /^\/api\/.*/,
    /^\/_next\/.*/,
    /^\/favicon\.ico$/,
    /^\/manifest\.json$/,
    /^\/sw\.js$/,
    /^\/robots\.txt$/,
    /^\/sitemap\.xml$/,
    /^\/offline\.html$/,
    /^\/icons\/.*/,
    /^\/privacy/,
    /^\/terms/,
    /^\/about/,
    /^\/contact/,
    /^\/companies/,
    /^\/intel\/companies/,
    /^\/intel\/vessels/,
    /^\/intel\/agencies/,
    /^\/community\/forums/,
    /^\/community\/seafarers/,
  ];
  const isPublicRoute = publicPatterns.some((pattern) => pattern.test(pathname));
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/callback");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Server-side admin route protection
  if (user && pathname.startsWith("/admin")) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
