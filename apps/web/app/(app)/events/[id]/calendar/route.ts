import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEvent } from "@/lib/groups";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// Calendar file with a reminder 2 hours before the session.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) return NextResponse.redirect(new URL("/login", request.url));
  const data = await getEvent(id, current.user.id);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const { event, group } = data;
  const url = new URL(`/events/${id}`, request.url).toString();
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rally//Badminton//EN", "BEGIN:VEVENT",
    `UID:${event.id}@rally`, `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.starts_at)}`, `DTEND:${stamp(event.ends_at)}`,
    `SUMMARY:${esc(`${event.title} (${group.name})`)}`,
    `LOCATION:${esc([event.venue_name, event.venue_address].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(`${event.notes}\n\n${url}`)}`, `URL:${url}`,
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${esc(event.title)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="rally-session.ics"` },
  });
}
