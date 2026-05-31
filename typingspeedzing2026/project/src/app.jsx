// app.jsx — shell: topbar, mode bar, results, history, theme + tweaks
const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM, useCallback: uC } = React;

const ACCENTS = {
  amber:  { base: "#f59e0b", on: "#1a1206" },
  violet: { base: "#8b7bf0", on: "#0e0a1f" },
  emerald:{ base: "#34d399", on: "#04140d" },
  sky:    { base: "#38bdf8", on: "#04141f" },
};

const MODES = [
  { id: "time",   en: "Time",   th: "จับเวลา",  icon: "◷" },
  { id: "words",  en: "Words",  th: "จำนวนคำ",  icon: "▦" },
  { id: "lesson", en: "Lesson", th: "บทเรียน",   icon: "◎" },
  { id: "race",   en: "Race",   th: "แข่ง",      icon: "⚡" },
  { id: "ai",     en: "AI",     th: "เอไอ",      icon: "✦" },
];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem("tz_history") || "[]"); } catch { return []; }
}
function saveHistory(h) { try { localStorage.setItem("tz_history", JSON.stringify(h.slice(0, 50))); } catch {} }

function StatBig({ val, sub, accent, big }) {
  return (
    <div className="rstat">
      <div className="rstat-val" style={big ? { color: accent } : null}>{val}</div>
      <div className="rstat-sub">{sub}</div>
    </div>
  );
}

function ResultChart({ data, accent }) {
  const w = 600, h = 200, pad = 8;
  const samples = data.samples || [];
  if (samples.length < 2) return <div className="rchart-empty">กราฟจะแสดงเมื่อพิมพ์นานพอ</div>;
  const max = Math.max(40, ...samples.map(s => s.wpm)) * 1.1;
  const X = (i) => pad + (i / (samples.length - 1)) * (w - pad * 2);
  const Y = (v) => h - pad - (v / max) * (h - pad * 2);
  const line = samples.map((s, i) => `${i ? "L" : "M"}${X(i)},${Y(s.wpm)}`).join(" ");
  const area = `${line} L${X(samples.length - 1)},${h - pad} L${X(0)},${h - pad} Z`;
  const grid = [0.25, 0.5, 0.75, 1].map(f => Math.round(max * f));
  return (
    <svg className="rchart" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="rfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" /><stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((g, i) => (
        <g key={i}><line x1={pad} x2={w - pad} y1={Y(g)} y2={Y(g)} className="rgrid" /><text x={pad + 2} y={Y(g) - 3} className="rgridtxt">{g}</text></g>
      ))}
      <path d={area} fill="url(#rfill)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {(data.errorsAt || []).map((i, k) => i < samples.length ? <circle key={k} cx={X(i)} cy={Y(samples[i].wpm)} r="3.5" fill="#ef4444" /> : null)}
    </svg>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = uS("time");
  const [lang, setLang] = uS("en");
  const [config, setConfig] = uS({ time: 30, words: 25, lesson: "home", level: 1, aiText: "" });
  const [seed, setSeed] = uS(1);
  const [view, setView] = uS("test");
  const [result, setResult] = uS(null);
  const [meta, setMeta] = uS({});
  const [history, setHistory] = uS(loadHistory());
  const [aiTopic, setAiTopic] = uS("");
  const [aiLoading, setAiLoading] = uS(false);

  const accent = (ACCENTS[t.accent] || ACCENTS.amber).base;
  const accentOn = (ACCENTS[t.accent] || ACCENTS.amber).on;

  const restart = uC(() => { setView("test"); setResult(null); setSeed(s => s + 1); }, []);
  const next = uC(() => { setView("test"); setResult(null); setConfig(c => ({ ...c })); setSeed(s => s + 1); }, []);

  const onComplete = uC((stats) => {
    setResult(stats); setView("result");
    setHistory(h => { const nh = [stats, ...h]; saveHistory(nh); return nh; });
  }, []);

  const changeMode = (m) => { setMode(m); setView("test"); setResult(null); setSeed(s => s + 1); };
  const changeLang = (l) => { setLang(l); setSeed(s => s + 1); };

  const genAI = async () => {
    setAiLoading(true);
    const txt = await window.aiGenerate(lang, aiTopic);
    setConfig(c => ({ ...c, aiText: txt }));
    setAiLoading(false);
    setMode("ai"); setView("test"); setSeed(s => s + 1);
  };

  uE(() => { if (mode === "ai" && !config.aiText) { genAI(); } }, [mode]);

  const best = uM(() => history.reduce((b, r) => r.wpm > (b?.wpm || 0) ? r : b, null), [history]);

  const rootStyle = {
    "--primary": accent, "--primary-foreground": accentOn,
    "--glow": (t.glow / 100).toFixed(2),
    fontFamily: t.font === "system" ? "system-ui, sans-serif" : "'Geist', system-ui, sans-serif",
  };

  return (
    <div className="root" data-theme={t.dark ? "dark" : "light"} data-dir={t.direction} style={rootStyle}>
      <div className="glow-layer" aria-hidden="true"><div className="glow-orb" style={{ background: accent }} /></div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" style={{ background: accent }}>⌨</span>
          <span className="brand-name">Type<span style={{ color: accent }}>Zing</span></span>
          <span className="brand-tag">AI typing arena</span>
        </div>
        <div className="top-actions">
          <button className={"seg-mini " + (lang === "en" ? "on" : "")} onClick={() => changeLang("en")}>EN</button>
          <button className={"seg-mini " + (lang === "th" ? "on" : "")} onClick={() => changeLang("th")}>ไทย</button>
          <span className="divider-v" />
          <button className="icon-btn" title="theme" onClick={() => setTweak("dark", !t.dark)}>{t.dark ? "☾" : "☀"}</button>
        </div>
      </header>

      <div className="mode-bar">
        <div className="seg">
          {MODES.map(m => (
            <button key={m.id} className={"seg-btn " + (mode === m.id ? "on" : "")} onClick={() => changeMode(m.id)}>
              <span className="seg-icon">{m.icon}</span><span className="seg-txt">{lang === "th" ? m.th : m.en}</span>
            </button>
          ))}
        </div>

        <div className="ctx">
          {mode === "time" && [15, 30, 60].map(s => <button key={s} className={"chip " + (config.time === s ? "on" : "")} onClick={() => { setConfig(c => ({ ...c, time: s })); setSeed(x => x + 1); }}>{s}s</button>)}
          {mode === "words" && [10, 25, 50].map(s => <button key={s} className={"chip " + (config.words === s ? "on" : "")} onClick={() => { setConfig(c => ({ ...c, words: s })); setSeed(x => x + 1); }}>{s}</button>)}
          {mode === "lesson" && window.LESSONS.map(l => <button key={l.id} className={"chip " + (config.lesson === l.id ? "on" : "")} onClick={() => { setConfig(c => ({ ...c, lesson: l.id })); setSeed(x => x + 1); }}>{lang === "th" ? l.name.th : l.name.en}</button>)}
          {mode === "race" && (
            <div className="race-ctl">
              {[1, 2, 3, 4, 5].map(l => <button key={l} className={"chip " + (config.level === l ? "on" : "")} onClick={() => { setConfig(c => ({ ...c, level: l })); setSeed(x => x + 1); }}>Lv{l}</button>)}
            </div>
          )}
          {mode === "ai" && (
            <div className="ai-ctl">
              <input className="ai-input" placeholder={lang === "th" ? "หัวข้อ (เช่น อวกาศ, กาแฟ)" : "topic (e.g. space, coffee)"} value={aiTopic} onChange={e => setAiTopic(e.target.value)} onKeyDown={e => { if (e.key === "Enter") genAI(); }} />
              <button className="gen-btn" onClick={genAI} disabled={aiLoading} style={{ background: accent, color: accentOn }}>{aiLoading ? "✦ กำลังสร้าง…" : "✦ Generate"}</button>
            </div>
          )}
          <span className="divider-v" />
          <button className="icon-btn" title="restart" onClick={restart}>↻</button>
        </div>
      </div>

      <main className="stage">
        {view === "test" && (
          <window.TypeEngine
            key={mode + lang + seed}
            mode={mode} lang={lang} config={config} seed={seed} accent={accent}
            showKeyboard={t.showKeyboard} showHeatmap={t.heatmap}
            onComplete={onComplete} onMeta={setMeta}
          />
        )}

        {view === "result" && result && (
          <div className="result">
            <div className="result-head">
              <div className="result-title">{lang === "th" ? "ผลการพิมพ์" : "Result"} · <span className="result-mode">{result.label}</span></div>
              {best && result.wpm >= best.wpm && <div className="pb-badge" style={{ color: accent, borderColor: accent }}>★ {lang === "th" ? "สถิติใหม่" : "Personal best"}</div>}
            </div>
            <div className="result-grid">
              <div className="result-left">
                <StatBig val={result.wpm} sub="wpm" accent={accent} big />
                <StatBig val={`${result.acc}%`} sub={lang === "th" ? "แม่นยำ" : "accuracy"} />
              </div>
              <div className="result-chart-wrap"><ResultChart data={result} accent={accent} /></div>
            </div>
            <div className="result-row">
              <StatBig val={result.raw} sub="raw" />
              <StatBig val={result.chars} sub={lang === "th" ? "ตัวอักษร" : "chars"} />
              <StatBig val={result.errors} sub={lang === "th" ? "พลาด" : "errors"} />
              <StatBig val={window.fmtTime(result.time)} sub={lang === "th" ? "เวลา" : "time"} />
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={next} style={{ background: accent, color: accentOn }}>{lang === "th" ? "อีกครั้ง" : "Next test"} →</button>
              <button className="btn-ghost" onClick={restart}>↻ {lang === "th" ? "เริ่มใหม่" : "Restart"}</button>
            </div>
          </div>
        )}
      </main>

      <footer className="hist-bar">
        <div className="hist-best">
          <span className="hist-lbl">{lang === "th" ? "สถิติดีที่สุด" : "Best"}</span>
          <span className="hist-val" style={{ color: accent }}>{best ? best.wpm : "—"}</span><span className="hist-unit">wpm</span>
        </div>
        <div className="hist-list">
          {history.length === 0 && <span className="hist-empty">{lang === "th" ? "ยังไม่มีประวัติ — ลองพิมพ์ดูสิ" : "no runs yet — start typing"}</span>}
          {history.slice(0, 8).map((r, i) => (
            <div className="hist-item" key={i}>
              <span className="hi-wpm">{r.wpm}</span>
              <span className="hi-meta">{r.acc}% · {r.label}</span>
            </div>
          ))}
        </div>
      </footer>

      <TweaksPanel>
        <TweakSection label="Design direction" />
        <TweakRadio label="Style" value={t.direction} options={["minimal", "aurora", "terminal"]} onChange={(v) => setTweak("direction", v)} />
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor label="Accent" value={t.accent === "amber" ? "#f59e0b" : t.accent === "violet" ? "#8b7bf0" : t.accent === "emerald" ? "#34d399" : "#38bdf8"}
          options={["#f59e0b", "#8b7bf0", "#34d399", "#38bdf8"]}
          onChange={(hex) => { const m = { "#f59e0b": "amber", "#8b7bf0": "violet", "#34d399": "emerald", "#38bdf8": "sky" }; setTweak("accent", m[hex] || "amber"); }} />
        <TweakSlider label="Glow" value={t.glow} min={0} max={100} unit="%" onChange={(v) => setTweak("glow", v)} />
        <TweakRadio label="Font" value={t.font} options={["geist", "system"]} onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Practice aids" />
        <TweakToggle label="On-screen keyboard" value={t.showKeyboard} onChange={(v) => setTweak("showKeyboard", v)} />
        <TweakToggle label="Error heatmap" value={t.heatmap} onChange={(v) => setTweak("heatmap", v)} />
      </TweaksPanel>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "aurora",
  "dark": true,
  "accent": "amber",
  "glow": 60,
  "font": "geist",
  "showKeyboard": true,
  "heatmap": true
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
