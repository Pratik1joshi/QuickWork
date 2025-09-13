import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    },
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login, except for public routes
    if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check if authenticated user needs onboarding
    if (user && !request.nextUrl.pathname.startsWith("/auth")) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single()

        // If user doesn't have phone number and isn't on onboarding page, redirect to onboarding
        if (!profile?.phone && request.nextUrl.pathname !== "/auth/onboarding") {
          const url = request.nextUrl.clone()
          url.pathname = "/auth/onboarding"
          return NextResponse.redirect(url)
        }
      } catch (profileError) {
        console.error("Profile check error:", profileError)
        // If profile doesn't exist, redirect to onboarding
        if (request.nextUrl.pathname !== "/auth/onboarding") {
          const url = request.nextUrl.clone()
          url.pathname = "/auth/onboarding"
          return NextResponse.redirect(url)
        }
      }
    }
  } catch (error) {
    console.error("Auth error in middleware:", error)
    // If there's an auth error, redirect to login
    if (!request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
