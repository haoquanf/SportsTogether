import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sign-in, email confirmation and password reset links all land here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/profile";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/profile";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First-time members go through onboarding before anything else.
      const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).single();
      const dest = profile && !profile.onboarded && next !== "/reset-password" ? "/onboarding" : next;
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
