"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

// Records every click on a link or button so the owner can see what people use.
// A clear name can be set with data-track="..."; otherwise the visible text is used.
// Only the button name and page path are stored, never who clicked or what they typed.
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-track]");
      if (!el) return;
      const path = window.location.pathname;
      if (path.startsWith("/admin")) return;
      const raw = el.dataset.track || el.getAttribute("aria-label") || el.innerText || el.getAttribute("href") || "";
      const name = raw.replace(/\s+/g, " ").trim().slice(0, 80);
      if (!name) return;
      track("click", { name, path });
      if (!isSupabaseConfigured) return;
      fetch(`${SUPABASE_URL}/rest/v1/click_events`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name, path: path.slice(0, 200) }),
      }).catch(() => {});
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
