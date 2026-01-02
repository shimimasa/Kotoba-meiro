
import type { MazeTemplate } from "./types";
import { analyzeTemplate } from "./analyzeTemplate";

export type Point = { x: number; y: number };

const LETTER_KEYS = ["a", "b", "c", "d", "e"] as const;
type LetterKey = (typeof LETTER_KEYS)[number];

export type SpawnedLetter = {
  key: LetterKey;
  index: number;
  letter: string;
  pos: Point;
};

export type SpawnPlan = {
  templateId: string;
  w: number;
  h: number;
  grid: string[];
  start: Point;
  goal: Point;
  letters: SpawnedLetter[];
};

export function planSpawns(template: MazeTemplate): SpawnPlan {
  const analyzed = analyzeTemplate(template);

  const letters = template.letters ?? [];
  if (letters.length === 0) throw new Error(`planSpawns: template.letters is empty in ${template.id}`);

  const slotByKey = new Map<string, Point>();
  for (const s of analyzed.letterSlots) slotByKey.set(s.char, { x: s.x, y: s.y });

  if (letters.length > slotByKey.size) {
    throw new Error(
      `planSpawns: not enough letter slots (need ${letters.length}, found ${slotByKey.size}) in ${template.id}`
    );
  }

  const spawned: SpawnedLetter[] = [];
  for (let i = 0; i < letters.length; i++) {
    const key = LETTER_KEYS[i];
    const pos = slotByKey.get(key);
    if (!pos) throw new Error(`planSpawns: letter slot '${key}' not found in ${template.id}`);
    spawned.push({ key, index: i, letter: letters[i], pos });
  }

  return {
    templateId: template.id,
    w: analyzed.w,
    h: analyzed.h,
    grid: analyzed.grid,
    start: analyzed.start,
    goal: analyzed.goal,
    letters: spawned,
  };
}