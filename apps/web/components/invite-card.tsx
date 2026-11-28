"use client";

import { useState } from "react";

export function InviteCard() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.origin;
    const text = "I'm using ZeniSports to find games and improve my technique. Join me!";
    try {
      if (navigator.share) {
        await navigator.share({ title: "ZeniSports", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the member closed the share sheet */
    }
  };
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-600 p-7 text-white">
      <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-3xl" aria-hidden>🤝</p>
        <h2 className="mt-3 text-2xl font-bold">Better with friends</h2>
        <p className="mt-2 text-brand-50">Invite your doubles partner, club mates or dance partner. More players nearby means more games at your level.</p>
        <button onClick={share} data-track="Home: Invite friends" className="btn mt-5 bg-white font-semibold text-brand-700 hover:bg-brand-50">
          {copied ? "✓ Link copied" : "Invite friends"}
        </button>
      </div>
    </section>
  );
}
