// Shared constants used by the web app and (mirrored) by the pose analyzer.

export const SPORTS = [
  { id: "badminton", label: "Badminton", launched: true, icon: "🏸" },
  { id: "ballroom", label: "Ballroom dance", launched: true, icon: "💃" },
  { id: "basketball", label: "Basketball", launched: false, icon: "🏀" },
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

export const HANDEDNESS = [
  { id: "right", label: "Right-handed" },
  { id: "left", label: "Left-handed" },
] as const;

export const PLAY_FORMATS = [
  { id: "doubles", label: "Doubles" },
  { id: "singles", label: "Singles" },
  { id: "mixed", label: "Mixed doubles" },
  { id: "any", label: "Any format" },
] as const;

export const AVAILABILITY = [
  { id: "weekday_mornings", label: "Weekday mornings" },
  { id: "weekday_lunch", label: "Weekday lunchtime" },
  { id: "weekday_evenings", label: "Weekday evenings" },
  { id: "weekend_mornings", label: "Weekend mornings" },
  { id: "weekend_afternoons", label: "Weekend afternoons" },
  { id: "weekend_evenings", label: "Weekend evenings" },
] as const;

export const PROFILE_VISIBILITY = [
  { id: "members", label: "All signed-in members", hint: "Anyone on the app can see your profile" },
  { id: "groups", label: "Only people in my groups", hint: "Others see you as “Member”" },
] as const;
