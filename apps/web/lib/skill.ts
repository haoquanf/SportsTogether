import { SKILL_LEVELS, type SkillLevel } from "@sportsapp/shared";

const order = SKILL_LEVELS.map((l) => l.id) as string[];
export const skillLabel = (s: string | null | undefined) => SKILL_LEVELS.find((l) => l.id === s)?.label ?? "All levels";

export function skillRange(min: string | null, max: string | null) {
  if (!min && !max) return "All levels";
  if (min && max && min === max) return skillLabel(min);
  if (min && max) return `${skillLabel(min)} to ${skillLabel(max)}`;
  return min ? `${skillLabel(min)} and up` : `Up to ${skillLabel(max)}`;
}

export function fitsLevel(level: SkillLevel | string, min: string | null, max: string | null) {
  const i = order.indexOf(level);
  if (i < 0) return true;
  return (!min || i >= order.indexOf(min)) && (!max || i <= order.indexOf(max));
}
