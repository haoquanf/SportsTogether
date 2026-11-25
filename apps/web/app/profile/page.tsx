import { redirect } from "next/navigation";
import { SKILL_LEVELS, SPORTS } from "@sportsapp/shared";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { deleteAccount } from "./actions";

const NOTICES: Record<string, string> = { profile: "Profile saved.", password: "Password updated." };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated, error } = await searchParams;
  const level = SKILL_LEVELS.find((l) => l.id === profile.skill_level)?.label;
  const sports = profile.sports.map((id) => SPORTS.find((s) => s.id === id)?.label ?? id).join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {updated && NOTICES[updated] && <p role="status" className="rounded-lg bg-brand-50 p-3 text-brand-700">{NOTICES[updated]}</p>}
      <section className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.display_name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-slate-600">{sports} · {level} · {profile.city}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Edit profile</h2>
        <ProfileForm profile={profile} submitLabel="Save changes" />
      </section>

      <section className="card border-red-200">
        <h2 className="text-lg font-semibold text-red-700">Delete account</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">This removes your profile and all your videos for good. Type DELETE to confirm.</p>
        {error === "confirm" && <p role="alert" className="mb-2 text-sm text-red-600">Please type DELETE exactly.</p>}
        <form action={deleteAccount} className="flex gap-2">
          <input name="confirm" aria-label="Type DELETE to confirm" className="input max-w-40" autoComplete="off" />
          <button className="btn border border-red-300 text-red-700 hover:bg-red-50">Delete my account</button>
        </form>
      </section>
    </div>
  );
}
