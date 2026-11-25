import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getGroup, listComments } from "@/lib/groups";
import { formatEventTime } from "@/lib/time";
import { skillLabel, skillRange, fitsLevel } from "@/lib/skill";
import { Avatar, Badge } from "@/components/avatar";
import { ActionButton } from "@/components/action-button";
import { Comments } from "@/components/comments";
import { Map } from "@/components/map";
import { answerRequest, joinGroup, leaveGroup } from "../actions";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const data = await getGroup(id, user.id);
  if (!data) notFound();
  const { group, members, pending, myRole, myStatus, events } = data;
  const isMember = myStatus === "active";
  const isAdmin = isMember && myRole === "admin";
  const comments = await listComments({ groupId: id });

  return (
    <div className="space-y-6">
      <Link href="/groups" className="text-sm text-slate-600 hover:text-brand-700">← All groups</Link>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-slate-600">{group.area ? `${group.area}, ` : ""}{group.city}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="green">Badminton</Badge>
              <Badge>{skillLabel(group.skill_level)}</Badge>
              <Badge>{members.length} member{members.length === 1 ? "" : "s"}</Badge>
              {group.visibility === "approval" && <Badge tone="amber">Approval needed to join</Badge>}
              {isAdmin && <Badge tone="blue">You&apos;re an admin</Badge>}
            </div>
          </div>
          <div>
            {!myStatus && (
              <ActionButton
                action={joinGroup.bind(null, id)}
                label={group.visibility === "public" ? "Join group" : "Ask to join"}
              />
            )}
            {myStatus === "pending" && <Badge tone="amber">Request sent, waiting for an admin</Badge>}
            {isMember && !isAdmin && <ActionButton action={leaveGroup.bind(null, id)} label="Leave group" className="btn-secondary" />}
          </div>
        </div>
        {group.description && <p className="mt-4 whitespace-pre-wrap text-slate-700">{group.description}</p>}
      </section>

      {isAdmin && pending.length > 0 && (
        <section className="card border-amber-200">
          <h2 className="mb-3 text-lg font-semibold">Join requests</h2>
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.user_id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Avatar name={p.profiles?.display_name ?? "?"} url={p.profiles?.avatar_url} />
                  {p.profiles?.display_name} <span className="text-sm text-slate-500">· {skillLabel(p.profiles?.skill_level)}</span>
                </span>
                <span className="flex gap-2">
                  <ActionButton action={answerRequest.bind(null, id, p.user_id, true)} label="Approve" className="btn-primary py-1.5" />
                  <ActionButton action={answerRequest.bind(null, id, p.user_id, false)} label="Decline" className="btn-secondary py-1.5" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming sessions</h2>
          {isAdmin && <Link href={`/groups/${id}/events/new`} className="btn-primary py-1.5">Post a session</Link>}
        </div>
        {events.length === 0 ? (
          <p className="card text-slate-600">No sessions scheduled yet.{isAdmin ? " Post the first one." : ""}</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const full = e.going >= e.capacity;
              const fits = profile ? fitsLevel(profile.skill_level, e.min_skill, e.max_skill) : true;
              return (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="card flex flex-wrap items-center justify-between gap-3 transition hover:border-brand-500">
                    <div>
                      <p className="text-sm font-medium text-brand-700">{formatEventTime(e.starts_at, e.ends_at, e.timezone)}</p>
                      <h3 className="text-lg font-semibold">{e.title}</h3>
                      <p className="text-sm text-slate-600">{e.venue_name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone={fits ? "green" : "slate"}>{skillRange(e.min_skill, e.max_skill)}{fits ? " · your level" : ""}</Badge>
                        <Badge tone={full ? "amber" : "slate"}>
                          {e.going}/{e.capacity} going{e.waitlist ? ` · ${e.waitlist} waiting` : ""}
                        </Badge>
                      </div>
                    </div>
                    {e.mine && <Badge tone={e.mine === "going" ? "green" : "amber"}>{e.mine === "going" ? "You're going" : "You're on the waitlist"}</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Members</h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2">
                <Avatar name={m.profiles?.display_name ?? "?"} url={m.profiles?.avatar_url} />
                <span>{m.profiles?.display_name || "Member"}</span>
                <span className="text-sm text-slate-500">· {skillLabel(m.profiles?.skill_level)}</span>
                {m.role === "admin" && <Badge tone="blue">Admin</Badge>}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Where they play</h2>
          <Map center={group} zoom={14} markers={[{ id: group.id, lat: group.lat, lng: group.lng, title: group.name }]} className="h-60" />
        </section>
      </div>

      <Comments comments={comments} groupId={id} userId={user.id} canPost={isMember} isAdmin={isAdmin} path={`/groups/${id}`} />
    </div>
  );
}
