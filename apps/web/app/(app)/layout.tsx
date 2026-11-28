import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 border-t border-slate-200 px-4 py-6 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} ZeniSports</p>
        <p className="flex gap-5">
          <Link href="/privacy" className="hover:text-brand-700">Privacy policy</Link>
          <Link href="/terms" className="hover:text-brand-700">Terms of service</Link>
        </p>
      </footer>
    </>
  );
}
