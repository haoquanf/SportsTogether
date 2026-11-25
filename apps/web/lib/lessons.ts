// Lesson content. Step descriptions are written by us; figure names and the
// Bronze-level rules for ballroom are summarised from the NDCA "Approved Figures,
// Elements & Restrictions" (Appendix 1, revised January 2023).

export const NDCA_SOURCE = {
  title: "NDCA Approved Figures, Elements & Restrictions (Appendix 1, January 2023)",
  url: "https://www.ndca.org/pdf/2023%20January%20-%205%20-%20NDCA%20APPROVED%20JAN%202023.pdf",
};

/** A foot position on the floor diagram. x right, y down, in centimetres-ish units; forward for the leader is up (negative y). */
export type Foot = { foot: "L" | "R"; x: number; y: number; weight?: boolean };

export type Step = {
  count: string;
  leader: string;
  follower: string;
  /** Where the foot that moves on this count lands (leader's foot; the follower uses the other foot on the same spot). */
  move: Foot;
};

export type Figure = {
  id: string;
  name: string;
  ndcaName: string;
  summary: string;
  start: { L: [number, number]; R: [number, number] };
  steps: Step[];
  tips: string[];
};

export type Lesson = {
  slug: string;
  sport: string;
  title: string;
  level: string;
  minutes: number;
  summary: string;
  intro: string[];
  atAGlance: [string, string][];
  hold: string[];
  figures: Figure[];
  rules: string[];
  syllabus: { name: string; inLesson?: boolean }[];
  practice: string[];
};

const START = { L: [-10, 0] as [number, number], R: [10, 0] as [number, number] };

export const LESSONS: Lesson[] = [
  {
    slug: "ballroom-waltz-bronze-basics",
    sport: "ballroom",
    title: "Waltz basics: the box, the change step and the balance",
    level: "Bronze · Newcomer",
    minutes: 12,
    summary: "Your first three American Smooth Waltz figures, step by step for leaders and followers.",
    intro: [
      "The Waltz is a smooth, flowing dance in 3/4 time: three beats to every bar of music, with the strongest beat on 1. Almost everything a beginner dances fits into a pattern of three steps: step, side, close.",
      "This demo lesson teaches the three figures most new dancers learn first. Each one is on the NDCA Bronze American Smooth Waltz syllabus, so you can dance them in a Bronze closed-syllabus competition.",
    ],
    atAGlance: [
      ["Style", "American Smooth"],
      ["Music", "3/4 time, counted 1-2-3"],
      ["Basic timing", "One step per beat (NDCA: “123 unless noted”)"],
      ["Rise and fall", "Lower at the end of 3, step down on 1, rise through 2 and 3"],
      ["Feet", "Partners dance on opposite feet: leader starts left, follower starts right"],
    ],
    hold: [
      "Start in Closed Position, facing your partner and slightly offset so each of you is a little to the other's left.",
      "Leader: right hand on the follower's left shoulder blade, left hand holding the follower's right hand at about eye height.",
      "Follower: left hand resting on the leader's right upper arm, right hand in the leader's left hand.",
      "Keep the frame: elbows up, shoulders down, and move as one unit from the centre of your body.",
    ],
    figures: [
      {
        id: "left-box",
        name: "Left box (reverse turn)",
        ndcaName: "Left Closed Box/Reverse Turn",
        summary: "Six steps, two bars of music, tracing a square on the floor. Once it feels easy, the leader can turn it gradually to the left.",
        start: START,
        steps: [
          { count: "1", leader: "Left foot forward.", follower: "Right foot back.", move: { foot: "L", x: -10, y: -60 } },
          { count: "2", leader: "Right foot to the side, slightly forward.", follower: "Left foot to the side, slightly back.", move: { foot: "R", x: 50, y: -60 } },
          { count: "3", leader: "Close left foot to right foot, change weight.", follower: "Close right foot to left foot, change weight.", move: { foot: "L", x: 30, y: -60 } },
          { count: "1", leader: "Right foot back.", follower: "Left foot forward.", move: { foot: "R", x: 50, y: 0 } },
          { count: "2", leader: "Left foot to the side, slightly back.", follower: "Right foot to the side, slightly forward.", move: { foot: "L", x: -10, y: 0 } },
          { count: "3", leader: "Close right foot to left foot, change weight.", follower: "Close left foot to right foot, change weight.", move: { foot: "R", x: 10, y: 0 } },
        ],
        tips: [
          "Step forward heel first and back toe first.",
          "The side step on 2 is the biggest step; the close on 3 is small and soft.",
          "Feet must close on 3. NDCA Bronze rules require feet to close.",
        ],
      },
      {
        id: "change-step",
        name: "Progressive change step forward",
        ndcaName: "Progressive Change Step Forward or Backward",
        summary: "Step, side, close, then again on the other foot, travelling forward. This is how you move around the room between boxes.",
        start: START,
        steps: [
          { count: "1", leader: "Left foot forward.", follower: "Right foot back.", move: { foot: "L", x: -10, y: -60 } },
          { count: "2", leader: "Right foot forward and to the side.", follower: "Left foot back and to the side.", move: { foot: "R", x: 40, y: -100 } },
          { count: "3", leader: "Close left foot to right foot.", follower: "Close right foot to left foot.", move: { foot: "L", x: 20, y: -100 } },
          { count: "1", leader: "Right foot forward.", follower: "Left foot back.", move: { foot: "R", x: 40, y: -160 } },
          { count: "2", leader: "Left foot forward and to the side.", follower: "Right foot back and to the side.", move: { foot: "L", x: -10, y: -200 } },
          { count: "3", leader: "Close right foot to left foot.", follower: "Close left foot to right foot.", move: { foot: "R", x: 10, y: -200 } },
        ],
        tips: [
          "Travel counter-clockwise around the room (the line of dance).",
          "Keep each forward step the same length so your partner can follow.",
          "Followers: let the leader's frame tell you when to step back; don't anticipate.",
        ],
      },
      {
        id: "balance",
        name: "Forward and back balance (hesitation)",
        ndcaName: "Balance Steps, Hesitations",
        summary: "One step, then hold for two beats. Useful for pausing, waiting for space on the floor, or matching a phrase in the music.",
        start: START,
        steps: [
          { count: "1", leader: "Left foot forward, full weight.", follower: "Right foot back, full weight.", move: { foot: "L", x: -10, y: -60, weight: true } },
          { count: "2", leader: "Bring right foot beside left, no weight.", follower: "Bring left foot beside right, no weight.", move: { foot: "R", x: 10, y: -60, weight: false } },
          { count: "3", leader: "Hold. Rise slightly, then lower.", follower: "Hold. Rise slightly, then lower.", move: { foot: "R", x: 10, y: -60, weight: false } },
          { count: "1", leader: "Right foot back, full weight.", follower: "Left foot forward, full weight.", move: { foot: "R", x: 10, y: 0, weight: true } },
          { count: "2", leader: "Bring left foot beside right, no weight.", follower: "Bring right foot beside left, no weight.", move: { foot: "L", x: -10, y: 0, weight: false } },
          { count: "3", leader: "Hold.", follower: "Hold.", move: { foot: "L", x: -10, y: 0, weight: false } },
        ],
        tips: [
          "NDCA timing for balances is 1(23): one step, and the next two beats are held.",
          "Because you don't change weight on 2, you start the next figure on the same foot you just moved.",
        ],
      },
    ],
    rules: [
      "Keep a hold with your partner throughout. Bronze Waltz has no fallaway movements.",
      "Start in a traditional closed hold; you may not separate or change hold until bar 5.",
      "Partners stay on opposite feet.",
      "Feet close on the third step of box and change-step figures.",
      "Timing is 1-2-3 unless the figure says otherwise (balances are 1(23)).",
    ],
    syllabus: [
      { name: "Left Closed Box/Reverse Turn", inLesson: true },
      { name: "Right Closed Box/Natural Turn" },
      { name: "Progressive Change Step Forward or Backward", inLesson: true },
      { name: "Closed Finish" },
      { name: "Balance Steps, Hesitations", inLesson: true },
      { name: "Fifth Position Breaks, Open Break, Back Break" },
      { name: "Follower's Underarm Turn to the Right" },
      { name: "Simple and Progressive Twinkles" },
      { name: "Cross Body Lead" },
      { name: "Forward Twist to Left from Promenade" },
      { name: "Natural Spin Turn" },
      { name: "Closed Impetus" },
      { name: "Progressive Chassé to Right" },
      { name: "Promenade Chassé" },
      { name: "Grapevine or Zigzag" },
      { name: "Open Break and Back Spot Turn" },
      { name: "Waterfall" },
    ],
    practice: [
      "Practise each figure alone first, counting out loud: “1, 2, 3, 1, 2, 3”.",
      "Then dance two left boxes, a change step and a balance, and repeat. That's a full 8-bar phrase.",
      "Put on any slow waltz and dance the box on the spot until the count feels automatic.",
      "When you're ready, film a 15-second clip from the side and compare it with the coach (coming soon).",
    ],
  },
];

export const BADMINTON_COMING = [
  { title: "The forehand clear", level: "Beginner" },
  { title: "The overhead smash", level: "Improver" },
  { title: "Footwork to the back court", level: "Beginner" },
  { title: "The low serve in doubles", level: "Beginner" },
];

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug) ?? null;
