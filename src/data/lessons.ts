// Finger-region drills (ported from the prototype). Names are bilingual.
// See docs/SPEC.md §7.
import type { Lesson } from "../types";

export const LESSONS: Lesson[] = [
  {
    id: "home",
    name: { en: "Home Row", th: "แป้นเหย้า" },
    words: "fff jjj ddd kkk sss lll aaa ;;; fjf dkd sls a;a jfj kdk fdsa jkl; asdf ;lkj fjdk sla; dad sad lad fall jazz alas".split(" "),
  },
  {
    id: "top",
    name: { en: "Top Row", th: "แป้นบน" },
    words: "qqq www eee rrr ttt yyy uuu iii ooo ppp qwer tyui op we rot you put tire wire quiet write your power".split(" "),
  },
  {
    id: "bottom",
    name: { en: "Bottom Row", th: "แป้นล่าง" },
    words: "zzz xxx ccc vvv bbb nnn mmm zxc vbn m, max van can man box mix zone come move number machine".split(" "),
  },
  {
    id: "numbers",
    name: { en: "Numbers", th: "ตัวเลข" },
    words: "123 456 789 012 1024 2048 3.14 42 365 1995 2026 50% 99.9 100 7th 8x9 64kb 256 512".split(" "),
  },
  {
    id: "punct",
    name: { en: "Punctuation", th: "เครื่องหมาย" },
    words: "well, yes. no! why? (ok) [done] {go} a-b c/d e_f g+h \"hi\" 'go' 100% @home #tag".split(" "),
  },
];

export function lessonById(id: string): Lesson {
  return LESSONS.find((l) => l.id === id) ?? LESSONS[0];
}
