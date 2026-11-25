import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getGroup } from "@/lib/groups";
import { NewEventForm } from "./form";

export default async function NewEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const data = await getGroup(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin" || data.myStatus !== "active") redirect(`/groups/${id}`);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/groups/${id}`} className="text-sm text-slate-600 hover:text-brand-700">← {data.group.name}</Link>
      <section className="card mt-3">
        <h1 className="mb-6 text-2xl font-bold">Post a session</h1>
        <NewEventForm groupId={id} groupLocation={{ lat: data.group.lat, lng: data.group.lng }} />
      </section>
    </div>
  );
}
