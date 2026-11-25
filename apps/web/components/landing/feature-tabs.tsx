"use client";

import { useState } from "react";
import { CoachScreen, CompareScreen, GroupsScreen, LessonScreen, PhoneFrame, ProgressScreen } from "./screens";

const TABS = [
  {
    id: "coach", label: "AI coach", title: "A coach in your pocket",
    text: "Film a 10-second clip on your phone. The AI tracks 33 points on your body, finds the moment you hit the shuttle, and tells you in plain words what to fix first.",
    points: ["Works with any phone camera", "Score out of 100 for every clip", "3 to 5 tips, most important first"],
    Screen: CoachScreen,
  },
  {
    id: "compare", label: "Compare with a coach", title: "See exactly what's different",
    text: "Your clip plays next to a real coach doing the same stroke, lined up at the moment of contact, with skeletons drawn on both so the difference is obvious.",
    points: ["Synced at contact, frame by frame", "Joint angles side by side", "Reference clips from local coaches"],
    Screen: CompareScreen,
  },
  {
    id: "progress", label: "Track progress", title: "Watch your game improve",
    text: "Every analysis is saved, so you can see your score climb week by week and which strokes still need work.",
    points: ["Score history per stroke", "Before and after clips", "Premium: unlimited history"],
    Screen: ProgressScreen,
  },
  {
    id: "groups", label: "Find games", title: "Never play alone again",
    text: "Find badminton and ballroom groups near you on a map, filter by sport and level, and RSVP to sessions. If a session is full, join the waitlist and move up automatically when a spot opens.",
    points: ["Sessions tagged by skill level", "Automatic waitlist", "Calendar reminders"],
    Screen: GroupsScreen,
  },
  {
    id: "lessons", label: "Lessons", title: "Short lessons that stick",
    text: "Bite-sized lessons from local coaches, with the key positions drawn on screen. Ballroom lessons show animated footwork for both leader and follower, count by count.",
    points: ["Badminton and ballroom dance", "Animated step diagrams", "Beginner to advanced"],
    Screen: LessonScreen,
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Features" className="flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              t.id === active ? "bg-ink text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-12 grid items-center gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">{tab.title}</h3>
          <p className="mt-4 text-lg text-slate-600">{tab.text}</p>
          <ul className="mt-6 space-y-3">
            {tab.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-sm text-brand-700">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-emerald-950 py-10 md:order-2">
          <PhoneFrame><tab.Screen /></PhoneFrame>
        </div>
      </div>
    </div>
  );
}
