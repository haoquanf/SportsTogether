import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links that carry a token hash. Unlike /auth/callback, these work
// in any browser, not only the one used to sign up.
// Supabase email template: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.user) {
      if (type === "recovery") return NextResponse.redirect(`${origin}/reset-password`);
      const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).single();
      const fallback = profile && !profile.onboarded ? "/onboarding" : "/profile";
      const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : fallback;
      return NextResponse.redirect(`${origin}${profile && !profile.onboarded ? "/onboarding" : next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
