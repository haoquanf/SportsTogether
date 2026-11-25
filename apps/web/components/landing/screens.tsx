// Original illustrations of the app's screens, drawn in SVG so the landing page
// needs no stock photos. Replace with real screenshots once the coach footage is filmed.

type Pt = [number, number];

/** A side-view player at the contact point of an overhead clear. */
const PLAYER: Record<string, Pt> = {
  head: [100, 58], neck: [100, 74], shR: [108, 80], shL: [90, 82], elR: [120, 56], wrR: [126, 30],
  elL: [76, 70], wrL: [66, 52], hipR: [104, 128], hipL: [94, 128], knR: [114, 160], anR: [108, 196],
  knL: [84, 162], anL: [72, 194],
};
const BONES: [string, string][] = [
  ["neck", "shR"], ["neck", "shL"], ["shR", "elR"], ["elR", "wrR"], ["shL", "elL"], ["elL", "wrL"],
  ["shR", "hipR"], ["shL", "hipL"], ["hipR", "hipL"], ["hipR", "knR"], ["knR", "anR"], ["hipL", "knL"], ["knL", "anL"],
];

/** Same pose with a bent elbow, to show what the coach corrects. */
const PLAYER_BENT: Record<string, Pt> = { ...PLAYER, elR: [124, 64], wrR: [118, 40] };

export function Skeleton({ pose = PLAYER, colour = "#4ade80", racket = true, dx = 0, scale = 1 }: {
  pose?: Record<string, Pt>; colour?: string; racket?: boolean; dx?: number; scale?: number;
}) {
  const p = (k: string): Pt => [pose[k][0] * scale + dx, pose[k][1] * scale];
  const [wx, wy] = p("wrR");
  return (
    <g>
      {racket && (
        <g>
          <line x1={wx} y1={wy} x2={wx + 6 * scale} y2={wy - 20 * scale} stroke="#e2e8f0" strokeWidth={2 * scale} />
          <ellipse cx={wx + 9 * scale} cy={wy - 30 * scale} rx={7 * scale} ry={11 * scale} fill="none" stroke="#e2e8f0" strokeWidth={2 * scale} transform={`rotate(15 ${wx + 9 * scale} ${wy - 30 * scale})`} />
        </g>
      )}
      {BONES.map(([a, b]) => (
        <line key={a + b} x1={p(a)[0]} y1={p(a)[1]} x2={p(b)[0]} y2={p(b)[1]} stroke={colour} strokeWidth={3.5 * scale} strokeLinecap="round" />
      ))}
      <circle cx={p("head")[0]} cy={p("head")[1]} r={10 * scale} fill="none" stroke={colour} strokeWidth={3 * scale} />
      {Object.keys(pose).filter((k) => k !== "head").map((k) => (
        <circle key={k} cx={p(k)[0]} cy={p(k)[1]} r={2.8 * scale} fill="white" />
      ))}
    </g>
  );
}

function Shuttle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-30)`}>
      <path d="M0 0 L-6 -14 L6 -14 Z" fill="white" opacity="0.9" />
      <circle cx="0" cy="1" r="3" fill="#fbbf24" />
    </g>
  );
}

export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[260px] rounded-[2.6rem] border border-white/10 bg-slate-950 p-2.5 shadow-2xl shadow-black/50 ${className}`}>
      <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[2.1rem] bg-slate-900">{children}</div>
    </div>
  );
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4ade80" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={size * 0.3} fontWeight="700">{score}</text>
    </svg>
  );
}

const Status = () => (
  <div className="flex justify-between px-6 pt-3 pb-1 text-[10px] font-medium text-slate-400"><span>9:41</span><span>●●● 5G</span></div>
);

export function CoachScreen() {
  return (
    <div className="text-white">
      <Status />
      <div className="px-4 pb-2 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-green-400">AI coach · Forehand clear</p>
      </div>
      <div className="relative mx-3 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800">
        <svg viewBox="0 0 200 210" className="w-full">
          <line x1="0" y1="198" x2="200" y2="198" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
          <Skeleton pose={PLAYER_BENT} />
          <Shuttle x={150} y={18} />
          <path d="M 112 72 A 14 14 0 0 1 122 58" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
          <rect x="128" y="70" width="52" height="18" rx="9" fill="#fbbf24" />
          <text x="154" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">142°</text>
        </svg>
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px]">Contact · 0.42 s</span>
      </div>
      <div className="flex items-center gap-3 px-4 pt-4">
        <ScoreRing score={74} />
        <div>
          <p className="text-sm font-semibold">Technique score</p>
          <p className="text-[11px] text-green-400">▲ 6 since last week</p>
        </div>
      </div>
      <ul className="space-y-2 px-4 pb-5 pt-3 text-[11px] leading-snug text-slate-200">
        <li className="rounded-xl bg-slate-800 p-2.5"><span className="text-amber-300">●</span> Straighten your arm at contact. Your elbow is about 23° more bent than the coach&apos;s.</li>
        <li className="rounded-xl bg-slate-800 p-2.5"><span className="text-amber-300">●</span> Load the racket earlier, behind your head.</li>
        <li className="rounded-xl bg-slate-800 p-2.5"><span className="text-green-400">●</span> Great contact height. Keep it up.</li>
      </ul>
    </div>
  );
}

export function CompareScreen() {
  return (
    <div className="text-white">
      <Status />
      <p className="px-4 pt-4 text-[11px] uppercase tracking-wider text-green-400">Side by side</p>
      <div className="mx-3 mt-2 grid grid-cols-2 gap-1.5">
        {[{ label: "You", pose: PLAYER_BENT, c: "#4ade80" }, { label: "Coach", pose: PLAYER, c: "#60a5fa" }].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-700 to-slate-800">
            <svg viewBox="40 0 120 210" className="w-full"><Skeleton pose={s.pose} colour={s.c} /></svg>
            <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 text-[9px]">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-3 rounded-xl bg-slate-800 p-3">
        <div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>Prep</span><span>Contact</span><span>Finish</span></div>
        <div className="relative h-1.5 rounded-full bg-slate-700"><div className="absolute left-0 top-0 h-1.5 w-[58%] rounded-full bg-green-400" /><div className="absolute left-[58%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-400" /></div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-5 pt-3 text-center">
        {[["Elbow", "142°", "165°"], ["Reach", "151°", "160°"], ["Swing", "0.31 s", "0.25 s"]].map(([k, you, coach]) => (
          <div key={k} className="rounded-xl bg-slate-800 p-2">
            <p className="text-[9px] uppercase text-slate-400">{k}</p>
            <p className="text-sm font-bold text-green-400">{you}</p>
            <p className="text-[9px] text-blue-300">Coach {coach}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressScreen() {
  const pts = [52, 58, 55, 63, 66, 71, 74];
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${10 + i * 30} ${100 - v}`).join(" ");
  return (
    <div className="text-white">
      <Status />
      <p className="px-4 pt-4 text-[11px] uppercase tracking-wider text-green-400">Your progress</p>
      <div className="mx-3 mt-2 rounded-2xl bg-slate-800 p-3">
        <div className="flex items-baseline justify-between"><p className="text-2xl font-bold">74</p><p className="text-[11px] text-green-400">+22 in 6 weeks</p></div>
        <svg viewBox="0 0 200 70" className="mt-1 w-full">
          <path d={`${path} L 190 70 L 10 70 Z`} transform="translate(0 -30)" fill="url(#g)" opacity="0.35" />
          <path d={path} transform="translate(0 -30)" fill="none" stroke="#4ade80" strokeWidth="2.5" />
          <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4ade80" /><stop offset="1" stopColor="#4ade80" stopOpacity="0" /></linearGradient></defs>
        </svg>
      </div>
      <ul className="space-y-1.5 px-3 pb-5 pt-3">
        {[["Forehand clear", 74, "Today"], ["Smash", 68, "Mon"], ["Forehand clear", 71, "Last Thu"], ["Forehand clear", 63, "2 weeks ago"]].map(([s, v, d], i) => (
          <li key={i} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2 text-[11px]">
            <span><span className="block font-medium">{s}</span><span className="text-slate-400">{d}</span></span>
            <span className="rounded-full bg-green-400/15 px-2 py-0.5 font-bold text-green-400">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GroupsScreen() {
  const pins: Pt[] = [[60, 50], [120, 34], [150, 80], [90, 96], [40, 110]];
  return (
    <div className="text-white">
      <Status />
      <p className="px-4 pt-4 text-[11px] uppercase tracking-wider text-green-400">Games near you</p>
      <div className="mx-3 mt-2 overflow-hidden rounded-2xl bg-[#1d2b3a]">
        <svg viewBox="0 0 200 140" className="w-full">
          <path d="M0 90 C 50 70, 80 120, 200 85 L200 140 L0 140Z" fill="#1e3a5f" />
          {[20, 55, 95, 140, 175].map((x) => <line key={x} x1={x} y1="0" x2={x - 15} y2="140" stroke="#334155" strokeWidth="1" />)}
          {[30, 65, 105].map((y) => <line key={y} x1="0" y1={y} x2="200" y2={y + 8} stroke="#334155" strokeWidth="1" />)}
          <circle cx="100" cy="70" r="38" fill="#3b82f6" opacity="0.12" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="100" cy="70" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
          {pins.map(([x, y]) => <path key={`${x}${y}`} transform={`translate(${x - 7} ${y - 18})`} d="M7 0C3 0 0 3 0 7c0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" fill="#4ade80" />)}
        </svg>
      </div>
      <ul className="space-y-1.5 px-3 pb-5 pt-3 text-[11px]">
        {[["Tuesday Night Doubles", "Intermediate · 1.2 mi", "4 spots"], ["Back Bay After Work", "Improver · 2.0 mi", "Waitlist"], ["Brookline Beginners", "Beginner · 3.1 mi", "6 spots"]].map(([n, m, s]) => (
          <li key={n} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
            <span><span className="block font-medium">{n}</span><span className="text-slate-400">{m}</span></span>
            <span className={`rounded-full px-2 py-0.5 font-semibold ${s === "Waitlist" ? "bg-amber-400/15 text-amber-300" : "bg-green-400/15 text-green-400"}`}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LessonScreen() {
  return (
    <div className="text-white">
      <Status />
      <p className="px-4 pt-4 text-[11px] uppercase tracking-wider text-green-400">Lesson 3 of 12</p>
      <div className="relative mx-3 mt-2 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800">
        <svg viewBox="0 0 200 210" className="w-full">
          <Skeleton pose={PLAYER} colour="#60a5fa" />
          <path d="M 150 120 Q 140 80 128 62" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="150" y="134" fontSize="10" fill="#fbbf24" textAnchor="middle">Elbow high</text>
          <path d="M 40 170 Q 60 175 76 186" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="34" y="164" fontSize="10" fill="#fbbf24" textAnchor="middle">Push off</text>
          <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#fbbf24" /></marker></defs>
        </svg>
        <div className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-white/20"><div className="h-1 w-2/5 rounded-full bg-white" /></div>
      </div>
      <div className="px-4 pb-5 pt-3">
        <p className="text-sm font-semibold">The forehand clear</p>
        <ol className="mt-2 space-y-1 text-[11px] text-slate-300">
          <li>1. Turn side-on, racket up early</li>
          <li>2. Elbow high, racket behind your head</li>
          <li>3. Reach up and hit at the highest point</li>
        </ol>
      </div>
    </div>
  );
}
