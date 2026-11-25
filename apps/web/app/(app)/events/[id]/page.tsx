import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEvent, listComments } from "@/lib/groups";
import { formatEventTime } from "@/lib/time";
import { fitsLevel, skillLabel, skillRange } from "@/lib/skill";
import { Avatar, Badge } from "@/components/avatar";
import { ActionButton } from "@/components/action-button";
import { Comments } from "@/components/comments";
import { Map } from "@/components/map";
import { cancelRsvp, joinGroup, rsvp } from "@/app/(app)/groups/actions";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const data = await getEvent(id, user.id);
  if (!data) notFound();
  const { event, group, going, waitlist, mine, myRole, myStatus } = data;
  const isMember = myStatus === "active";
  const spotsLeft = Math.max(0, event.capacity - going.length);
  const { started } = data;
  const fits = profile ? fitsLevel(profile.skill_level, event.min_skill, event.max_skill) : true;
  const comments = await listComments({ groupId: group.id, eventId: id });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;

  return (
    <div className="space-y-6">
      <Link href={`/groups/${group.id}`} className="text-sm text-slate-600 hover:text-brand-700">← {group.name}</Link>

      <section className="card">
        <p className="font-medium text-brand-700">{formatEventTime(event.starts_at, event.ends_at, event.timezone)}</p>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-slate-600">
          {event.venue_name}{event.venue_address ? ` · ${event.venue_address}` : ""} ·{" "}
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">Directions</a>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={fits ? "green" : "amber"}>{skillRange(event.min_skill, event.max_skill)}</Badge>
          <Badge tone={spotsLeft ? "slate" : "amber"}>
            {spotsLeft ? `${spotsLeft} of ${event.capacity} spots left` : `Full · ${waitlist.length} on waitlist`}
          </Badge>
        </div>
        {!fits && !mine && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This session is aimed at {skillRange(event.min_skill, event.max_skill).toLowerCase()} players. You can still join if the host is happy with it.
          </p>
        )}
        {event.notes && <p className="mt-4 whitespace-pre-wrap text-slate-700">{event.notes}</p>}

        <div className="mt-5 flex flex-wrap items-start gap-3">
          {started ? (
            <Badge>This session has started</Badge>
          ) : !isMember ? (
            myStatus === "pending" ? (
              <Badge tone="amber">Your request to join the group is waiting for an admin</Badge>
            ) : (
              <ActionButton action={joinGroup.bind(null, group.id)} label={group.visibility === "public" ? "Join the group to RSVP" : "Ask to join the group"} />
            )
          ) : mine ? (
            <>
              <Badge tone={mine === "going" ? "green" : "amber"}>
                {mine === "going" ? "✓ You're going" : `You're #${waitlist.findIndex((w) => w.user_id === user.id) + 1} on the waitlist`}
              </Badge>
              <ActionButton action={cancelRsvp.bind(null, id)} label={mine === "going" ? "Can't make it" : "Leave waitlist"} className="btn-secondary py-1.5" />
            </>
          ) : (
            <ActionButton action={rsvp.bind(null, id)} label={spotsLeft ? "I'm going" : "Join the waitlist"} />
          )}
          {!started && (
            <a href={`/events/${id}/calendar`} className="btn-secondary py-1.5">📅 Add to calendar</a>
          )}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Going ({going.length}/{event.capacity})</h2>
          {going.length === 0 ? <p className="text-sm text-slate-500">Be the first!</p> : (
            <ul className="space-y-2">
              {going.map((r) => (
                <li key={r.user_id} className="flex items-center gap-2">
                  <Avatar name={r.profiles?.display_name ?? "?"} url={r.profiles?.avatar_url} />
                  <Link href={`/members/${r.user_id}`} className="hover:text-brand-700">{r.profiles?.display_name || "Member"}</Link> <span className="text-sm text-slate-500">· {skillLabel(r.profiles?.skill_level)}</span>
                </li>
              ))}
            </ul>
          )}
          {waitlist.length > 0 && (
            <>
              <h3 className="mt-5 mb-2 font-semibold">Waitlist ({waitlist.length})</h3>
              <ol className="list-inside list-decimal space-y-1 text-slate-700">
                {waitlist.map((r) => <li key={r.user_id}>{r.profiles?.display_name || "Member"}</li>)}
              </ol>
            </>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3 text-lg font-semibold">Venue</h2>
          <Map center={event} zoom={15} markers={[{ id: event.id, lat: event.lat, lng: event.lng, title: event.venue_name }]} className="h-60" />
        </section>
      </div>

      <Comments
        comments={comments}
        groupId={group.id}
        eventId={id}
        userId={user.id}
        canPost={isMember}
        isAdmin={isMember && myRole === "admin"}
        path={`/events/${id}`}
      />
    </div>
  );
}
