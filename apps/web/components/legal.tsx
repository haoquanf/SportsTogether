import Link from "next/link";

export const LEGAL_UPDATED = "November 28, 2026";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function Contact() {
  return CONTACT ? (
    <a href={`mailto:${CONTACT}`} className="font-medium text-brand-700 hover:underline">{CONTACT}</a>
  ) : (
    <span>our support email address</span>
  );
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-8 space-y-6 leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
      <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        See also: <Link href="/privacy" className="text-brand-700 hover:underline">Privacy policy</Link> · <Link href="/terms" className="text-brand-700 hover:underline">Terms of service</Link>
      </p>
    </article>
  );
}
