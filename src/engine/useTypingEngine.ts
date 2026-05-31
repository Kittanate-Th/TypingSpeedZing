import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildWords } from "../data/words";
import { lessonById } from "../data/lessons";
import { accuracy, cpm, rawWpm, wpm } from "./metrics";
import { ghostIndex, markError, pushSample, raceWon, RACE_TARGET_WPM } from "./sampling";
import type { Lang, ModeId, RunConfig, RunResult, Sample } from "../types";

export interface TypingEngineState {
  text: string;
  index: number;
  charStates: Record<number, "correct" | "wrong">;
  started: boolean;
  finished: boolean;
  elapsed: number;
  samples: Sample[];
  errorsAt: number[];
  heat: Record<string, number>;
  lastCode: string | null;
  liveWpm: number;
  liveRaw: number;
  liveAcc: number;
  liveCpm: number;
  progress: number;
  remaining: number | null;
  ghost: number | null;
  reset: () => void;
  finish: () => void;
}

interface Args {
  mode: ModeId;
  lang: Lang;
  config: RunConfig;
  seed: number;
  onComplete: (result: RunResult) => void;
}

function buildText(mode: ModeId, lang: Lang, config: RunConfig): string {
  if (mode === "lesson") {
    const lesson = lessonById(config.lesson);
    return Array.from({ length: 30 }, () => lesson.words[Math.floor(Math.random() * lesson.words.length)]).join(" ");
  }
  if (mode === "ai") return config.aiText || buildWords(lang, 40);
  if (mode === "race") return buildWords(lang, 25 + config.level * 8);
  if (mode === "words") return buildWords(lang, config.words);
  return buildWords(lang, 70);
}

function labelFor(mode: ModeId, lang: Lang, config: RunConfig): string {
  if (mode === "time") return `${config.time}s`;
  if (mode === "words") return lang === "th" ? `${config.words} คำ` : `${config.words} words`;
  if (mode === "lesson") return lang === "th" ? lessonById(config.lesson).name.th : lessonById(config.lesson).name.en;
  if (mode === "race") return lang === "th" ? `ระดับ ${config.level}` : `Level ${config.level}`;
  return lang === "th" ? "ข้อความเอไอ" : "AI text";
}

export function useTypingEngine({ mode, lang, config, seed, onComplete }: Args): TypingEngineState {
  const initialText = useMemo(() => buildText(mode, lang, config), [mode, lang, config, seed]);
  const [text, setText] = useState(initialText);
  const [index, setIndex] = useState(0);
  const [charStates, setCharStates] = useState<Record<number, "correct" | "wrong">>({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [errorsAt, setErrorsAt] = useState<number[]>([]);
  const [heat, setHeat] = useState<Record<string, number>>({});
  const [lastCode, setLastCode] = useState<string | null>(null);

  const startTime = useRef(0);
  const correctKeys = useRef(0);
  const totalKeys = useRef(0);
  const lastSampleSecond = useRef(-1);
  const finishedRef = useRef(false);

  const reset = useCallback(() => {
    setText(initialText);
    setIndex(0);
    setCharStates({});
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setSamples([]);
    setErrorsAt([]);
    setHeat({});
    setLastCode(null);
    startTime.current = 0;
    correctKeys.current = 0;
    totalKeys.current = 0;
    lastSampleSecond.current = -1;
    finishedRef.current = false;
  }, [initialText]);

  useEffect(() => reset(), [reset]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    const safeElapsed = Math.max(elapsed || 0, 0.001);
    const correct = correctKeys.current;
    const total = totalKeys.current;
    const errors = Math.max(0, total - correct);
    const raceTarget = mode === "race" ? RACE_TARGET_WPM[config.level] : undefined;
    const didWinRace = raceTarget == null ? undefined : raceWon(raceTarget, safeElapsed, text.length);
    const result: RunResult = {
      wpm: wpm(correct, safeElapsed),
      raw: rawWpm(total, safeElapsed),
      cpm: cpm(correct, safeElapsed),
      acc: accuracy(correct, total),
      chars: correct,
      errors,
      time: Math.round(safeElapsed),
      mode,
      lang,
      samples: samples.slice(),
      errorsAt: errorsAt.slice(),
      heat: { ...heat },
      label: labelFor(mode, lang, config),
      raceWon: didWinRace,
      raceTarget,
      at: Date.now(),
    };
    onComplete(result);
  }, [config, elapsed, errorsAt, heat, lang, mode, onComplete, samples, text.length]);

  const timeLimit = mode === "time" ? config.time : null;

  useEffect(() => {
    if (!started || finished) return;
    const id = window.setInterval(() => {
      const nextElapsed = (performance.now() - startTime.current) / 1000;
      setElapsed(nextElapsed);
      const sec = Math.floor(nextElapsed);
      if (sec >= 1 && sec !== lastSampleSecond.current) {
        lastSampleSecond.current = sec;
        setSamples((current) => pushSample(current, sec, correctKeys.current));
      }
      if (timeLimit != null && nextElapsed >= timeLimit) finish();
    }, 100);
    return () => window.clearInterval(id);
  }, [finish, finished, started, timeLimit]);

  useEffect(() => {
    if (mode === "time" && index > text.length - 25) {
      setText((current) => `${current} ${buildWords(lang, 30)}`);
    }
  }, [index, lang, mode, text.length]);

  useEffect(() => {
    if (finished) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Tab") return;
      const target = event.target;
      if (
        target instanceof HTMLButtonElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) return;

      if (event.key === "Backspace") {
        event.preventDefault();
        setIndex((current) => {
          const next = Math.max(0, current - 1);
          setCharStates((states) => {
            const copy = { ...states };
            delete copy[next];
            return copy;
          });
          return next;
        });
        setLastCode("Backspace");
        return;
      }

      const typed = event.key === " " ? " " : event.key;
      if (typed.length !== 1) return;
      if (event.key === " ") event.preventDefault();
      if (!started) {
        startTime.current = performance.now();
        setStarted(true);
      }

      setLastCode(event.code);
      setIndex((current) => {
        const expected = text[current];
        if (expected == null) return current;
        const ok = typed === expected;
        totalKeys.current += 1;
        if (ok) {
          correctKeys.current += 1;
        } else {
          setHeat((currentHeat) => ({ ...currentHeat, [event.code]: (currentHeat[event.code] ?? 0) + 1 }));
          setErrorsAt((currentErrors) => markError(currentErrors, elapsed));
        }
        setCharStates((states) => ({ ...states, [current]: ok ? "correct" : "wrong" }));
        const next = current + 1;
        if (mode !== "time" && next >= text.length) window.setTimeout(finish, 0);
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [elapsed, finish, finished, mode, started, text]);

  const liveWpm = wpm(correctKeys.current, elapsed);
  const liveRaw = rawWpm(totalKeys.current, elapsed);
  const liveAcc = accuracy(correctKeys.current, totalKeys.current);
  const liveCpm = cpm(correctKeys.current, elapsed);
  const progress = mode === "time" && timeLimit ? elapsed / timeLimit : index / Math.max(1, text.length);
  const remaining = timeLimit == null ? null : Math.max(0, timeLimit - elapsed);
  const ghost = mode === "race" ? ghostIndex(RACE_TARGET_WPM[config.level], elapsed, text.length) : null;

  return {
    text,
    index,
    charStates,
    started,
    finished,
    elapsed,
    samples,
    errorsAt,
    heat,
    lastCode,
    liveWpm,
    liveRaw,
    liveAcc,
    liveCpm,
    progress,
    remaining,
    ghost,
    reset,
    finish,
  };
}
