// Shared constants used by the web app and (mirrored) by the pose analyzer.

export const SPORTS = [
  { id: "badminton", label: "Badminton", launched: true },
  { id: "basketball", label: "Basketball", launched: false },
] as const;

export type SportId = (typeof SPORTS)[number]["id"];

export const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner", hint: "Learning the basic strokes" },
  { id: "improver", label: "Improver", hint: "Can rally, working on consistency" },
  { id: "intermediate", label: "Intermediate", hint: "Plays regular doubles, knows the rules well" },
  { id: "advanced", label: "Advanced", hint: "Club or league level" },
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number]["id"];

export const BADMINTON_STROKES = [
  { id: "forehand_clear", label: "Forehand clear" },
  { id: "smash", label: "Smash" },
  { id: "drop", label: "Drop shot" },
  { id: "backhand_clear", label: "Backhand clear" },
  { id: "serve", label: "Serve" },
] as const;

export const FREE_ANALYSES_PER_MONTH = 3;
export const PREMIUM_ANALYSES_PER_MONTH = 30;
