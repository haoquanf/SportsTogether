import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listGroups } from "@/lib/groups";
import { GroupFinder } from "./group-finder";

export default async function GroupsPage() {
  const { profile } = await requireUser();
  const groups = await listGroups();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-slate-600">Find people near you to play and dance with.</p>
        </div>
        <Link href="/groups/new" className="btn-primary">Start a group</Link>
      </div>
      <GroupFinder groups={groups} mySkill={profile?.skill_level ?? null} />
    </div>
  );
}
