import Link from "next/link";
import { requireUser, PROFILE_COLUMNS, type Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupsForUser } from "@/lib/groups";
import { DetailList, GroupsList, ProfileHeader, gameRows, memberSince } from "@/components/profile-sections";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const supabase = await createClient();
  // Privacy rules in the database hide profiles that are limited to shared groups.
  const { data: profile } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle<Profile>();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl card text-center">
        <h1 className="text-xl font-semibold">This profile is private</h1>
        <p className="mt-2 text-slate-600">This member only shares their profile with people in their groups.</p>
        <Link href="/groups" className="btn-secondary mt-4">Back to groups</Link>
      </div>
    );
  }
  const groups = (await groupsForUser(id)).filter((g) => g.status === "active");
  const isMe = id === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isMe && (
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          This is how other members see your profile. <Link href="/profile" className="font-medium underline">Back to my profile</Link>
        </p>
      )}
      <ProfileHeader profile={profile} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Game</h2>
          <DetailList rows={[...gameRows(profile), ["Member since", memberSince(profile.created_at)]]} />
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Groups</h2>
          <GroupsList groups={groups} emptyText="Not in any groups yet." />
        </section>
      </div>
    </div>
  );
}
