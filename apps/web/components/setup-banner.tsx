import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SetupBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Preview mode: sign-in is switched off until the Supabase keys are added.
    </div>
  );
}
