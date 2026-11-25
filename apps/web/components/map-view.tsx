"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents, Circle } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

// Leaflet's default pin images don't bundle well, so draw a simple pin instead.
const pin = (colour: string) =>
  L.divIcon({
    className: "",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 38 14 38s14-13.7 14-24.1C28 6.2 21.7 0 14 0z" fill="${colour}"/><circle cx="14" cy="14" r="5.5" fill="white"/></svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  });
const GREEN = pin("#15803d");
const BLUE = pin("#2563eb");

export type MapMarker = LatLng & { id: string; title: string; subtitle?: string; href?: string };

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function MapView({
  center,
  zoom = 12,
  markers = [],
  you,
  radiusKm,
  picked,
  onPick,
  className = "h-80",
}: {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  you?: LatLng | null;
  radiusKm?: number;
  picked?: LatLng | null;
  onPick?: (p: LatLng) => void;
  className?: string;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={false} className={`w-full rounded-2xl ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />
      {you && radiusKm ? <Circle center={[you.lat, you.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.05 }} /> : null}
      {you ? <Marker position={[you.lat, you.lng]} icon={BLUE}><Popup>You are here</Popup></Marker> : null}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={GREEN}>
          <Popup>
            <strong>{m.title}</strong>
            {m.subtitle && <div>{m.subtitle}</div>}
            {m.href && <Link href={m.href}>Open</Link>}
          </Popup>
        </Marker>
      ))}
      {onPick && <ClickToPick onPick={onPick} />}
      {picked && <Marker position={[picked.lat, picked.lng]} icon={GREEN} />}
    </MapContainer>
  );
}
