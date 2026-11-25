// Original drawing of a couple in closed waltz hold.
export function Couple({ className = "" }: { className?: string }) {
  const lead = "#4ade80";
  const follow = "#f9a8d4";
  const line = (x1: number, y1: number, x2: number, y2: number, c: string) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="5" strokeLinecap="round" />
  );
  return (
    <svg viewBox="0 0 220 240" className={className} role="img" aria-label="A couple in closed waltz hold">
      {/* leader */}
      <circle cx="90" cy="42" r="14" fill="none" stroke={lead} strokeWidth="4" />
      {line(92, 58, 96, 130, lead)}
      {line(94, 74, 62, 70, lead)}{line(62, 70, 58, 42, lead)}
      {line(94, 74, 122, 92, lead)}
      {line(96, 130, 84, 180, lead)}{line(84, 180, 78, 226, lead)}
      {line(96, 130, 108, 178, lead)}{line(108, 178, 112, 224, lead)}
      {/* follower */}
      <circle cx="140" cy="38" r="13" fill="none" stroke={follow} strokeWidth="4" />
      {line(137, 52, 128, 128, follow)}
      {line(134, 70, 104, 76, follow)}
      {line(134, 70, 158, 50, follow)}{line(158, 50, 176, 26, follow)}
      <path d="M128 120 Q 150 170 168 226 L 98 226 Q 112 170 128 120 Z" fill={follow} opacity="0.25" />
      {line(128, 128, 136, 178, follow)}{line(136, 178, 146, 224, follow)}
      {line(128, 128, 120, 178, follow)}{line(120, 178, 116, 224, follow)}
      {/* joined hands */}
      <circle cx="58" cy="40" r="4" fill="white" />
      <line x1="10" y1="230" x2="210" y2="230" stroke="#334155" strokeDasharray="4 5" />
    </svg>
  );
}
