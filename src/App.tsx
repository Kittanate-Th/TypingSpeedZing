import { useCallback, useEffect, useRef, useState } from "react";
import { LESSONS } from "./data/lessons";
import { useTypingEngine } from "./engine/useTypingEngine";
import { Keyboard } from "./components/Keyboard";
import { generatePassage } from "./ai/provider";
import { HistoryProvider, useHistory } from "./store/history";
import { SettingsProvider, useSettings } from "./store/settings";
import { I18nProvider, useT } from "./i18n";
import type { Accent, Direction, Lang, ModeId, RunConfig, RunResult, Settings } from "./types";

const ACCENTS: Record<Accent, { base: string; on: string }> = {
  amber: { base: "#f59e0b", on: "#1a1206" },
  violet: { base: "#8b7bf0", on: "#0e0a1f" },
  emerald: { base: "#34d399", on: "#04140d" },
  sky: { base: "#38bdf8", on: "#04141f" },
};

const MODES: Array<{ id: ModeId; en: string; th: string; icon: string }> = [
  { id: "time", en: "Time", th: "เวลา", icon: "◷" },
  { id: "words", en: "Words", th: "คำ", icon: "▦" },
  { id: "lesson", en: "Lesson", th: "บทเรียน", icon: "◉" },
  { id: "race", en: "Race", th: "แข่ง", icon: "↯" },
  { id: "ai", en: "AI", th: "เอไอ", icon: "✦" },
];

const DEFAULT_CONFIG: RunConfig = {
  time: 30,
  words: 25,
  lesson: "home",
  level: 1,
  aiText: "",
  aiTopic: "",
};

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m > 0 ? `${m}:${String(rest).padStart(2, "0")}` : `${rest}s`;
}

function Sparkline({ samples, accent }: { samples: RunResult["samples"]; accent: string }) {
  if (!samples.length) return <div className="spark-empty">start typing to see speed</div>;
  const width = 100;
  const height = 42;
  const max = Math.max(40, ...samples.map((sample) => sample.wpm)) * 1.15;
  const points = samples.map((sample, index) => {
    const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * width;
    const y = height - (sample.wpm / max) * height;
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={area} fill={accent} opacity="0.16" />
      <path d={line} fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ResultChart({ result, accent }: { result: RunResult; accent: string }) {
  if (result.samples.length < 2) return <div className="rchart-empty">Chart appears after a longer run</div>;
  const width = 600;
  const height = 180;
  const pad = 10;
  const max = Math.max(40, ...result.samples.map((sample) => sample.wpm)) * 1.15;
  const x = (index: number) => pad + (index / (result.samples.length - 1)) * (width - pad * 2);
  const y = (value: number) => height - pad - (value / max) * (height - pad * 2);
  const line = result.samples.map((sample, index) => `${index ? "L" : "M"}${x(index)},${y(sample.wpm)}`).join(" ");
  const area = `${line} L${x(result.samples.length - 1)},${height - pad} L${x(0)},${height - pad} Z`;
  return (
    <svg className="rchart" viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line className="rgrid" key={ratio} x1={pad} x2={width - pad} y1={y(max * ratio)} y2={y(max * ratio)} />
      ))}
      <path d={area} fill={accent} opacity="0.14" />
      <path d={line} fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function TypeStage({
  mode,
  lang,
  config,
  seed,
  accent,
  settings,
  onComplete,
}: {
  mode: ModeId;
  lang: Lang;
  config: RunConfig;
  seed: number;
  accent: string;
  settings: Settings;
  onComplete: (result: RunResult) => void;
}) {
  const wordsInnerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLSpanElement | null>(null);
  const engine = useTypingEngine({ mode, lang, config, seed, onComplete });

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [engine.index]);

  const chars = engine.text.split("");
  const nextChar = chars[engine.index] ?? "";

  return (
    <div className="engine">
      <div className="stat-bar">
        <div className="stat">
          <div className="stat-val" style={{ color: accent }}>
            {mode === "time" ? Math.ceil(engine.remaining ?? 0) : engine.liveWpm}
          </div>
          <div className="stat-lbl">{mode === "time" ? "seconds left" : "wpm"}</div>
        </div>
        <div className="stat">
          <div className="stat-val">{mode === "time" ? engine.liveWpm : `${engine.liveAcc}%`}</div>
          <div className="stat-lbl">{mode === "time" ? "wpm" : "accuracy"}</div>
        </div>
        <div className="stat stat-grow">
          <Sparkline samples={engine.samples} accent={accent} />
        </div>
        <div className="stat">
          <div className="stat-val">{lang === "th" ? engine.liveCpm : engine.liveRaw}</div>
          <div className="stat-lbl">{lang === "th" ? "cpm" : "raw"}</div>
        </div>
      </div>

      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${Math.min(100, engine.progress * 100)}%`, background: accent }} />
      </div>

      <div className={`type-area lang-${lang}`} tabIndex={0} aria-label="Typing text">
        <div className="words-inner" ref={wordsInnerRef}>
          {chars.map((char, index) => {
            const state = engine.charStates[index];
            const classes = [
              "ch",
              state === "correct" ? "ch-ok" : "",
              state === "wrong" ? "ch-bad" : "",
              index === engine.index ? "ch-cur" : "",
              engine.ghost === index ? "ch-ghost" : "",
            ].filter(Boolean).join(" ");
            return (
              <span className={classes} data-i={index} key={`${char}-${index}`} ref={index === engine.index ? activeRef : undefined}>
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
        </div>
      </div>

      {settings.showKeyboard ? (
        <Keyboard
          lang={lang}
          nextChar={nextChar}
          lastCode={engine.lastCode}
          heatmap={engine.heat}
          showHeatmap={settings.heatmap}
        />
      ) : null}
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <SettingsShell />
    </SettingsProvider>
  );
}

function SettingsShell() {
  const { settings } = useSettings();
  return (
    <I18nProvider lang={settings.lang}>
      <HistoryProvider>
        <AppContent />
      </HistoryProvider>
    </I18nProvider>
  );
}

function AppContent() {
  const { settings, updateSettings } = useSettings();
  const { history, addResult, clearHistory, best } = useHistory();
  const t = useT();
  const [mode, setMode] = useState<ModeId>("time");
  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<RunResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const accent = ACCENTS[settings.accent];

  const restart = useCallback(() => {
    setResult(null);
    setSeed((current) => current + 1);
  }, []);

  const onComplete = useCallback((run: RunResult) => {
    setResult(run);
    addResult(run);
  }, [addResult]);

  const patchSettings = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    updateSettings({ [key]: value } as Pick<Settings, K>);
  };

  const chooseMode = (nextMode: ModeId) => {
    setMode(nextMode);
    setResult(null);
    setSeed((current) => current + 1);
  };

  const generateAi = async () => {
    setAiLoading(true);
    try {
      const result = await generatePassage({ lang: settings.lang, topic: config.aiTopic });
      setConfig((current) => ({ ...current, aiText: result.text }));
      setMode("ai");
      setResult(null);
      setSeed((current) => current + 1);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="root"
      data-theme={settings.dark ? "dark" : "light"}
      data-dir={settings.direction}
      style={{
        "--primary": accent.base,
        "--primary-foreground": accent.on,
        "--glow": (settings.glow / 100).toFixed(2),
        fontFamily: settings.font === "system" ? "system-ui, sans-serif" : "'Geist', 'Noto Sans Thai', system-ui, sans-serif",
      } as React.CSSProperties}
    >
      <div className="glow-layer" aria-hidden="true">
        <div className="glow-orb" />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⌨</span>
          <span className="brand-name">Type<span>Zing</span></span>
          <span className="brand-tag">{t("brand.tag")}</span>
        </div>
        <div className="top-actions">
          <button className={`seg-mini ${settings.lang === "en" ? "on" : ""}`} onClick={() => patchSettings("lang", "en")}>EN</button>
          <button className={`seg-mini ${settings.lang === "th" ? "on" : ""}`} onClick={() => patchSettings("lang", "th")}>ไทย</button>
          <span className="divider-v" />
          <button className="icon-btn" onClick={() => patchSettings("dark", !settings.dark)}>{settings.dark ? "☾" : "☼"}</button>
        </div>
      </header>

      <section className="mode-bar" aria-label="Typing mode controls">
        <div className="seg">
          {MODES.map((item) => (
            <button className={`seg-btn ${mode === item.id ? "on" : ""}`} key={item.id} onClick={() => chooseMode(item.id)}>
              <span>{item.icon}</span>
              <span className="seg-txt">{settings.lang === "th" ? item.th : item.en}</span>
            </button>
          ))}
        </div>

        <div className="ctx">
          {mode === "time" ? ([15, 30, 60] as const).map((seconds) => (
            <button className={`chip ${config.time === seconds ? "on" : ""}`} key={seconds} onClick={() => setConfig((c) => ({ ...c, time: seconds }))}>{seconds}s</button>
          )) : null}
          {mode === "words" ? ([10, 25, 50] as const).map((words) => (
            <button className={`chip ${config.words === words ? "on" : ""}`} key={words} onClick={() => setConfig((c) => ({ ...c, words }))}>{words}</button>
          )) : null}
          {mode === "lesson" ? LESSONS.map((lesson) => (
            <button className={`chip ${config.lesson === lesson.id ? "on" : ""}`} key={lesson.id} onClick={() => setConfig((c) => ({ ...c, lesson: lesson.id }))}>
              {settings.lang === "th" ? lesson.name.th : lesson.name.en}
            </button>
          )) : null}
          {mode === "race" ? ([1, 2, 3, 4, 5] as const).map((level) => (
            <button className={`chip ${config.level === level ? "on" : ""}`} key={level} onClick={() => setConfig((c) => ({ ...c, level }))}>Lv{level}</button>
          )) : null}
          {mode === "ai" ? (
            <div className="ai-ctl">
              <input
                className="ai-input"
                placeholder={settings.lang === "th" ? "หัวข้อ" : "topic"}
                value={config.aiTopic}
                onChange={(event) => setConfig((current) => ({ ...current, aiTopic: event.target.value }))}
                onKeyDown={(event) => { if (event.key === "Enter") void generateAi(); }}
              />
              <button className="gen-btn" onClick={() => void generateAi()} disabled={aiLoading}>
                {aiLoading ? "Generating" : "Generate"}
              </button>
            </div>
          ) : null}
          <span className="divider-v" />
          <button className="icon-btn" onClick={restart}>↻</button>
        </div>
      </section>

      <main className="stage">
        {result ? (
          <section className="result" aria-label="Typing result">
            <div className="result-head">
              <div className="result-title">Result · <span>{result.label}</span></div>
              {best && result.wpm >= best.wpm ? <div className="pb-badge">Personal best</div> : null}
            </div>
            <div className="result-grid">
              <div className="result-left">
                <div className="rstat"><div className="rstat-val">{result.wpm}</div><div className="rstat-sub">wpm</div></div>
                <div className="rstat"><div className="rstat-val">{result.acc}%</div><div className="rstat-sub">accuracy</div></div>
              </div>
              <div className="result-chart-wrap"><ResultChart result={result} accent={accent.base} /></div>
            </div>
            <div className="result-row">
              <div className="rstat"><div className="rstat-val">{result.raw}</div><div className="rstat-sub">raw</div></div>
              <div className="rstat"><div className="rstat-val">{result.cpm}</div><div className="rstat-sub">cpm</div></div>
              <div className="rstat"><div className="rstat-val">{result.errors}</div><div className="rstat-sub">errors</div></div>
              <div className="rstat"><div className="rstat-val">{fmtTime(result.time)}</div><div className="rstat-sub">time</div></div>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={restart}>Next test</button>
              <button className="btn-ghost" onClick={clearHistory}>Clear history</button>
            </div>
          </section>
        ) : (
          <TypeStage
            mode={mode}
            lang={settings.lang}
            config={config}
            seed={seed}
            accent={accent.base}
            settings={settings}
            onComplete={onComplete}
          />
        )}
      </main>

      <footer className="hist-bar">
        <div className="hist-best">
          <span className="hist-lbl">Best</span>
          <span className="hist-val">{best ? best.wpm : "—"}</span>
          <span className="hist-unit">wpm</span>
        </div>
        <div className="hist-list">
          {history.length === 0 ? <span className="hist-empty">no runs yet — start typing</span> : null}
          {history.slice(0, 8).map((run) => (
            <div className="hist-item" key={run.at}>
              <span className="hi-wpm">{run.wpm}</span>
              <span className="hi-meta">{run.acc}% · {run.label}</span>
            </div>
          ))}
        </div>
        <div className="settings-strip">
          {(["minimal", "aurora", "terminal"] as Direction[]).map((direction) => (
            <button className={`dot-btn ${settings.direction === direction ? "on" : ""}`} key={direction} onClick={() => patchSettings("direction", direction)} title={direction} />
          ))}
          {(["amber", "violet", "emerald", "sky"] as Accent[]).map((nextAccent) => (
            <button
              className={`swatch ${settings.accent === nextAccent ? "on" : ""}`}
              key={nextAccent}
              onClick={() => patchSettings("accent", nextAccent)}
              style={{ background: ACCENTS[nextAccent].base }}
              title={nextAccent}
            />
          ))}
          <button className={`mini-toggle ${settings.showKeyboard ? "on" : ""}`} onClick={() => patchSettings("showKeyboard", !settings.showKeyboard)}>kbd</button>
          <button className={`mini-toggle ${settings.heatmap ? "on" : ""}`} onClick={() => patchSettings("heatmap", !settings.heatmap)}>heat</button>
        </div>
      </footer>
    </div>
  );
}
