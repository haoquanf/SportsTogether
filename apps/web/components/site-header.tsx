import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";

export async function SiteHeader() {
  const current = await getCurrentUser();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span aria-hidden>🏸</span> Rally
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          {current ? (
            <>
              <Link href="/home" className="font-medium hover:text-brand-700">Home</Link>
              <Link href="/groups" className="font-medium hover:text-brand-700">Groups</Link>
              <Link href="/profile" className="font-medium hover:text-brand-700">
                {current.profile?.display_name || "My profile"}
              </Link>
              <form action={signOut}>
                <button className="btn-secondary py-1.5">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium hover:text-brand-700">Log in</Link>
              <Link href="/signup" className="btn-primary py-1.5">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
