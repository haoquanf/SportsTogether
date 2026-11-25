import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { NewGroupForm } from "./form";

export default async function NewGroupPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/groups" className="text-sm text-slate-600 hover:text-brand-700">← All groups</Link>
      <section className="card mt-3">
        <h1 className="mb-1 text-2xl font-bold">Start a group</h1>
        <p className="mb-6 text-slate-600">You&apos;ll be the group admin, so you can post sessions and approve members.</p>
        <NewGroupForm />
      </section>
    </div>
  );
}
