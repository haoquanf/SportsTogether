import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

// Google sign-in, email confirmation and password reset links all land here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Supabase sends errors (for example an expired link) as query parameters.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First-time members go through onboarding before anything else.
      const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).single();
      const dest = profile && !profile.onboarded && next !== "/reset-password" ? "/onboarding" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
    // The link was opened in a different browser or app from the one used to sign up,
    // so this browser can't finish the sign-in. Supabase has already confirmed the
    // email by this point, so the member only needs to log in.
    if (next !== "/reset-password") {
      return NextResponse.redirect(`${origin}/login?notice=confirmed`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
