// engine.jsx — the typing run: text rendering, caret, input handling, live stats, sparkline
// Exposes <TypeEngine /> on window.

const { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } = React;

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m > 0 ? `${m}:${String(ss).padStart(2, "0")}` : `${ss}s`;
}

// Live area-sparkline of wpm samples
function Sparkline({ samples, accent, errorsAt }) {
  const w = 100, h = 100;
  if (!samples.length) {
    return <div className="spark-empty">เริ่มพิมพ์เพื่อดูกราฟความเร็ว · start typing to see speed</div>;
  }
  const max = Math.max(40, ...samples.map((s) => s.wpm)) * 1.15;
  const pts = samples.map((s, i) => {
    const x = samples.length === 1 ? 0 : (i / (samples.length - 1)) * w;
    const y = h - (s.wpm / max) * h;
    return [x, y];
  });
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkfill)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {(errorsAt || []).map((i, k) => {
        if (i >= samples.length) return null;
        const x = samples.length === 1 ? 0 : (i / (samples.length - 1)) * w;
        const y = h - (samples[i].wpm / max) * h;
        return <circle key={k} cx={x} cy={y} r="2" fill="#ef4444" vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

function TypeEngine({ mode, lang, config, seed, accent, showKeyboard, showHeatmap, onComplete, onMeta }) {
  // build initial text
  const initialText = useMemo(() => {
    if (mode === "lesson") {
      const les = window.LESSONS.find((l) => l.id === config.lesson) || window.LESSONS[0];
      const arr = []; for (let i = 0; i < 30; i++) arr.push(les.words[Math.floor(Math.random() * les.words.length)]);
      return arr.join(" ");
    }
    if (mode === "ai") return config.aiText || window.buildWords(lang, 40);
    if (mode === "race") return window.buildWords(lang, 25 + config.level * 8);
    if (mode === "words") return window.buildWords(lang, config.words);
    // time
    return window.buildWords(lang, 60);
  }, [mode, lang, config, seed]);

  const [text, setText] = useState(initialText);
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState({}); // index -> 'correct' | 'wrong'
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastCode, setLastCode] = useState(null);
  const [samples, setSamples] = useState([]);
  const [heat, setHeat] = useState({});
  const [errorsAt, setErrorsAt] = useState([]);

  const startTime = useRef(0);
  const correctChars = useRef(0);
  const totalKeys = useRef(0);
  const errorKeys = useRef(0);
  const wordsInner = useRef(null);
  const charsWrap = useRef(null);
  const [caret, setCaret] = useState({ left: 0, top: 0, h: 0, show: false });
  const lastSampleSec = useRef(-1);

  const chars = useMemo(() => text.split(""), [text]);
  const nextChar = chars[index] || "";

  // reset when seed/config changes
  useEffect(() => {
    setText(initialText); setIndex(0); setStates({}); setStarted(false); setFinished(false);
    setElapsed(0); setSamples([]); setHeat({}); setErrorsAt([]); setLastCode(null);
    correctChars.current = 0; totalKeys.current = 0; errorKeys.current = 0; startTime.current = 0; lastSampleSec.current = -1;
  }, [initialText]);

  const liveWpm = useMemo(() => {
    const mins = elapsed / 60;
    if (mins <= 0) return 0;
    return Math.round((correctChars.current / 5) / mins);
  }, [elapsed, index]);

  const liveAcc = useMemo(() => {
    if (totalKeys.current === 0) return 100;
    return Math.round((1 - errorKeys.current / totalKeys.current) * 100);
  }, [index, elapsed]);

  const timeLimit = mode === "time" ? config.time : null;
  const remaining = timeLimit != null ? Math.max(0, timeLimit - elapsed) : null;

  const doFinish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    const mins = Math.max(elapsed, 0.001) / 60;
    const wpm = Math.round((correctChars.current / 5) / mins);
    const raw = Math.round((totalKeys.current / 5) / mins);
    const acc = totalKeys.current ? Math.round((1 - errorKeys.current / totalKeys.current) * 100) : 100;
    onComplete && onComplete({
      wpm: isFinite(wpm) ? wpm : 0, raw: isFinite(raw) ? raw : 0, acc,
      chars: correctChars.current, errors: errorKeys.current, time: Math.round(elapsed),
      mode, lang, samples: samples.slice(), errorsAt: errorsAt.slice(), heat: { ...heat },
      label: configLabel(mode, config, lang), at: Date.now(),
    });
  }, [finished, elapsed, samples, errorsAt, heat, mode, lang, config, onComplete]);

  // timer + sampling
  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => {
      const e = (performance.now() - startTime.current) / 1000;
      setElapsed(e);
      const sec = Math.floor(e);
      if (sec !== lastSampleSec.current && sec >= 1) {
        lastSampleSec.current = sec;
        const mins = e / 60;
        const wpm = Math.round((correctChars.current / 5) / mins);
        setSamples((s) => [...s, { t: sec, wpm: isFinite(wpm) ? wpm : 0 }]);
      }
      if (timeLimit != null && e >= timeLimit) doFinish();
    }, 100);
    return () => clearInterval(id);
  }, [started, finished, timeLimit, doFinish]);

  // expand text in time mode
  useEffect(() => {
    if (mode === "time" && index > chars.length - 25) {
      setText((t) => t + " " + window.buildWords(lang, 30));
    }
  }, [index, mode, chars.length, lang]);

  // keydown handling
  useEffect(() => {
    if (finished) return;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "Tab") return;
      if (k === "Backspace") {
        e.preventDefault();
        setIndex((i) => {
          if (i <= 0) return 0;
          const ni = i - 1;
          setStates((s) => { const n = { ...s }; delete n[ni]; return n; });
          return ni;
        });
        setLastCode("Backspace");
        return;
      }
      let ch = k;
      if (k === " ") { e.preventDefault(); ch = " "; }
      else if (k.length !== 1) return; // ignore arrows, shift, etc.
      // start
      if (!started) { setStarted(true); startTime.current = performance.now(); }
      setLastCode(e.code);
      setIndex((i) => {
        const expected = chars[i];
        if (expected == null) return i;
        const ok = ch === expected;
        totalKeys.current += 1;
        if (ok) { correctChars.current += 1; }
        else {
          errorKeys.current += 1;
          setHeat((h) => ({ ...h, [e.code]: (h[e.code] || 0) + 1 }));
          setErrorsAt((arr) => arr.length && arr[arr.length - 1] === Math.floor(elapsed) ? arr : [...arr, Math.max(0, Math.floor(elapsed))]);
        }
        setStates((s) => ({ ...s, [i]: ok ? "correct" : "wrong" }));
        const ni = i + 1;
        if (mode !== "time" && ni >= chars.length) {
          setTimeout(() => doFinish(), 0);
        }
        return ni;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, finished, chars, mode, elapsed, doFinish]);

  // caret + scroll
  useLayoutEffect(() => {
    const wrap = charsWrap.current;
    if (!wrap) return;
    const el = wrap.querySelector(`[data-i="${index}"]`) || wrap.querySelector(`[data-i="${index - 1}"]`);
    if (!el) { setCaret((c) => ({ ...c, show: false })); return; }
    const atEnd = !wrap.querySelector(`[data-i="${index}"]`);
    const r = el.getBoundingClientRect();
    const pr = wrap.getBoundingClientRect();
    setCaret({ left: (atEnd ? r.right : r.left) - pr.left, top: r.top - pr.top, h: r.height, show: true });
  }, [index, text, lang, showKeyboard]);

  // scroll lines: keep current line near top
  useLayoutEffect(() => {
    const inner = wordsInner.current, wrap = charsWrap.current;
    if (!inner || !wrap) return;
    const el = wrap.querySelector(`[data-i="${index}"]`);
    if (!el) return;
    const lh = el.offsetHeight || 40;
    const top = el.offsetTop;
    const shift = Math.max(0, top - lh); // keep active line as 2nd visible line
    inner.style.transform = `translateY(${-shift}px)`;
  }, [index, text, lang]);

  // report meta upward (live stats)
  useEffect(() => {
    onMeta && onMeta({ wpm: liveWpm, acc: liveAcc, started, finished, index, total: chars.length, remaining, elapsed });
  }, [liveWpm, liveAcc, started, finished, index, chars.length, remaining, elapsed]);

  const progress = mode === "time"
    ? (timeLimit ? (elapsed / timeLimit) : 0)
    : (chars.length ? index / chars.length : 0);

  return (
    <div className="engine">
      <div className="stat-bar">
        <div className="stat">
          <div className="stat-val" style={{ color: accent }}>{mode === "time" ? Math.ceil(remaining) : liveWpm}</div>
          <div className="stat-lbl">{mode === "time" ? "วินาที · left" : "wpm"}</div>
        </div>
        <div className="stat">
          <div className="stat-val">{mode === "time" ? liveWpm : `${liveAcc}%`}</div>
          <div className="stat-lbl">{mode === "time" ? "wpm" : "accuracy"}</div>
        </div>
        <div className="stat stat-grow">
          <Sparkline samples={samples} accent={accent} errorsAt={errorsAt} />
        </div>
        <div className="stat">
          <div className="stat-val">{mode === "time" ? `${liveAcc}%` : (mode === "words" ? `${Math.min(index, chars.length)}/${chars.length}` : fmtTime(elapsed))}</div>
          <div className="stat-lbl">{mode === "time" ? "accuracy" : (mode === "words" ? "words" : "time")}</div>
        </div>
      </div>

      <div className="prog-track"><div className="prog-fill" style={{ width: `${Math.min(100, progress * 100)}%`, background: accent }} /></div>

      <div className={"type-area lang-" + lang} ref={charsWrap} onClick={() => {}}>
        <div className="words-inner" ref={wordsInner}>
          {chars.map((c, i) => {
            const st = states[i];
            let cls = "ch";
            if (st === "correct") cls += " ch-ok";
            else if (st === "wrong") cls += " ch-bad";
            else if (i < index) cls += " ch-ok";
            if (i === index) cls += " ch-cur";
            return <span key={i} data-i={i} className={cls}>{c === " " ? "\u00A0" : c}</span>;
          })}
        </div>
        {caret.show && (
          <span className="caret" style={{ transform: `translate(${caret.left}px, ${caret.top}px)`, height: caret.h, background: accent }} />
        )}
      </div>

      {showKeyboard && (
        <window.Keyboard lang={lang} nextChar={nextChar} lastCode={lastCode} heatmap={heat} showHeatmap={showHeatmap} accent={accent} />
      )}
    </div>
  );
}

function configLabel(mode, config, lang) {
  if (mode === "time") return `${config.time}s`;
  if (mode === "words") return `${config.words} words`;
  if (mode === "lesson") { const l = window.LESSONS.find(x => x.id === config.lesson); return l ? l.name.en : "lesson"; }
  if (mode === "race") return `Level ${config.level}`;
  if (mode === "ai") return "AI text";
  return mode;
}

Object.assign(window, { TypeEngine, fmtTime, configLabel });
