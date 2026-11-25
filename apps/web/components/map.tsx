"use client";

import dynamic from "next/dynamic";

// Leaflet needs the browser's window, so load the map only on the client.
export const Map = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-slate-200" />,
});
