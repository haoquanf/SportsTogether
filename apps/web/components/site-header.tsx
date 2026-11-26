import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/(app)/auth/actions";

export async function SiteHeader() {
  const current = await getCurrentUser();
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={current ? "/home" : "/"} className="flex items-center gap-2 text-lg font-bold text-ink">
          <span aria-hidden>🏸</span> ZeniSports
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          {current ? (
            <>
              <Link href="/home" className="font-medium hover:text-brand-700">Home</Link>
              <Link href="/groups" className="font-medium hover:text-brand-700">Groups</Link>
              <Link href="/lessons" className="font-medium hover:text-brand-700">Lessons</Link>
              <Link href="/profile" className="hidden font-medium hover:text-brand-700 sm:inline">
                {current.profile?.display_name || "My profile"}
              </Link>
              <form action={signOut}>
                <button className="btn-secondary py-1.5">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/lessons" className="font-medium hover:text-brand-700">Lessons</Link>
              <Link href="/login" className="font-medium hover:text-brand-700">Log in</Link>
              <Link href="/signup" className="btn-primary py-1.5">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
