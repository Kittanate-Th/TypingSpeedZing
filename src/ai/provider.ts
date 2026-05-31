import { buildWords, pickQuote } from "../data/words";
import type { Lang } from "../types";

export interface GenerateOptions {
  lang: Lang;
  topic?: string;
}

export interface GenerateResult {
  text: string;
  source: "local";
}

function topicWeight(topic: string | undefined): number {
  if (!topic) return 0;
  let total = 0;
  for (const char of topic.trim()) total += char.codePointAt(0) ?? 0;
  return total;
}

function localPassage(lang: Lang, topic: string | undefined): string {
  const weight = topicWeight(topic);
  if (weight % 5 === 0) return pickQuote(lang);
  return buildWords(lang, 36 + (weight % 9));
}

export async function generatePassage(options: GenerateOptions): Promise<GenerateResult> {
  try {
    const text = localPassage(options.lang, options.topic).trim();
    return { text: text || buildWords(options.lang, 40), source: "local" };
  } catch {
    const text = options.lang === "th" ? "ฝึก พิมพ์ แม่นยำ จังหวะ สมาธิ" : "practice steady rhythm focus accuracy";
    return { text, source: "local" };
  }
}
