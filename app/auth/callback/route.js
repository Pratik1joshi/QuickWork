import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('[OAuth Callback] Successfully exchanged code for session, redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('[OAuth Callback] Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
    }
  }

  console.log('[OAuth Callback] No code parameter found, redirecting to login')
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback_error`)
}
