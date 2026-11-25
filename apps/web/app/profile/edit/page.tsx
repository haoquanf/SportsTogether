import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function EditProfilePage() {
  const { profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/profile" className="text-sm text-slate-600 hover:text-brand-700">← Back to profile</Link>
      <section className="card mt-3">
        <h1 className="mb-4 text-2xl font-bold">Edit profile</h1>
        <ProfileForm profile={profile} submitLabel="Save changes" />
      </section>
    </div>
  );
}
