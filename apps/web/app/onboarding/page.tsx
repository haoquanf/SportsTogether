import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile?.onboarded) redirect("/profile");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-bold">Tell us how you play</h1>
        <p className="mt-1 mb-6 text-slate-600">We use this to suggest groups and sessions at your level.</p>
        <ProfileForm profile={profile} submitLabel="Finish sign-up" />
      </div>
    </div>
  );
}
