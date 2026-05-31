# SPEC — Technical Specification

> **Charter:** *engineer-facing only*. Architecture, data shapes, formulas, i18n keys,
> AI adapter contract, accessibility. **No marketing** — that lives in [PRD](./PRD.md).
> The *why* is in [BASE](./BASE.md); the task checklist is in [PLAN](./PLAN.md).
> Source of truth: [design doc](./superpowers/specs/2026-05-31-typezing-design.md).

## 1. Stack & tooling

- **Build:** Vite 5, React 18, TypeScript 5 (strict).
- **Tests:** Vitest + jsdom (`@testing-library/react` for the few component tests).
- **Styling:** plain CSS with custom properties (oklch tokens); no CSS framework.
- **Fonts:** Geist, Geist Mono, Noto Sans Thai (Google Fonts, preconnected).
- **State:** React Context + `useReducer`/hooks. No external state lib.
- **Hosting:** GitHub Pages via Actions (`vite build` → `dist/`). Static; works on Vercel/Netlify too.
- **Deps kept minimal:** runtime = `react`, `react-dom` only. Everything else is devDeps.

## 2. Directory layout

```
.
├── index.html
├── package.json · tsconfig.json · tsconfig.node.json · vite.config.ts
├── .github/workflows/deploy.yml        # Pages CI
├── docs/                               # BASE/PRD/SPEC/PLAN + design doc
├── typingspeedzing2026/                # original design bundle (reference, not built)
└── src/
    ├── main.tsx                        # React root
    ├── App.tsx                         # shell: topbar, mode bar, stage, history, settings
    ├── types.ts                        # shared TS types (single source for data shapes)
    ├── styles/
    │   ├── tokens.css                  # :root + [data-theme] + [data-dir] tokens (oklch)
    │   └── app.css                     # component styles ported from prototype
    ├── i18n/
    │   ├── en.ts · th.ts               # typed dictionaries (same key set)
    │   └── index.ts                    # I18nProvider + useT()
    ├── data/
    │   ├── words.ts                    # EN_WORDS, TH_WORDS, EN_QUOTES, TH_QUOTES
    │   ├── lessons.ts                  # LESSONS (region drills, EN/TH names)
    │   └── thaiKeymap.ts               # cleaned Kedmanee → physical-key map
    ├── engine/
    │   ├── metrics.ts                  # pure: wpm, rawWpm, cpm, accuracy
    │   ├── sampling.ts                 # pure: per-second sample accumulation, ghost position
    │   └── useTypingEngine.ts          # headless run state machine (no JSX)
    ├── ai/
    │   └── provider.ts                 # local passage generator (async LLM seam)
    ├── store/
    │   ├── settings.tsx                # SettingsProvider (localStorage) + useSettings()
    │   └── history.tsx                 # HistoryProvider (localStorage) + useHistory()
    └── components/
        ├── TopBar.tsx · ModeBar.tsx · ContextBar.tsx
        ├── TypeArea.tsx · Caret.tsx · Keyboard.tsx
        ├── StatBar.tsx · Sparkline.tsx
        ├── Result.tsx · ResultChart.tsx · History.tsx
        ├── SettingsPanel.tsx · Toast.tsx
        └── icons.tsx
```

## 3. Core data shapes (`src/types.ts`)

```ts
export type Lang = 'en' | 'th';
export type ModeId = 'time' | 'words' | 'lesson' | 'race' | 'ai';
export type Direction = 'minimal' | 'aurora' | 'terminal';
export type Accent = 'amber' | 'violet' | 'emerald' | 'sky';

export interface RunConfig {
  time: 15 | 30 | 60;
  words: 10 | 25 | 50;
  lesson: string;          // lesson id
  level: 1 | 2 | 3 | 4 | 5;
  aiText: string;          // last generated/used AI passage
  aiTopic: string;
}

export interface Sample { t: number; wpm: number; }   // t = seconds since start

export interface RunResult {
  wpm: number; raw: number; cpm: number; acc: number;
  chars: number; errors: number; time: number;        // time in seconds
  mode: ModeId; lang: Lang;
  samples: Sample[]; errorsAt: number[];               // seconds where an error happened
  heat: Record<string, number>;                        // physical code -> error count
  label: string;                                       // e.g. "30s", "25 words", "Level 3"
  raceWon?: boolean;                                    // race mode only
  at: number;                                           // Date.now()
}

export interface Settings {
  lang: Lang;
  direction: Direction;
  dark: boolean;
  accent: Accent;
  glow: number;            // 0..100
  font: 'geist' | 'system';
  showKeyboard: boolean;
  heatmap: boolean;
}
```

Persistence keys: `tz_settings` (Settings), `tz_history` (RunResult[], capped 50). All JSON;
all reads wrapped in try/catch returning defaults.

## 4. Metrics (`src/engine/metrics.ts`) — exact formulas

Counters maintained by the engine during a run:

- `totalKeystrokes` — character-producing key presses (excludes Backspace, modifiers, navigation).
- `correctKeystrokes` — subset of the above that matched the expected character.
- `errors = totalKeystrokes − correctKeystrokes`.

Pure functions (all take explicit args; no globals → trivially testable):

```
wpm(correctChars, seconds)  = round( (correctChars / 5) / (seconds/60) )
rawWpm(totalChars, seconds) = round( (totalChars  / 5) / (seconds/60) )
cpm(correctChars, seconds)  = round( correctChars / (seconds/60) )
accuracy(correct, total)    = total === 0 ? 100 : round( correct / total * 100 )
```

Guards: `seconds <= 0` → return 0 (avoid Infinity/NaN). All results clamped to finite ints.

<a id="accuracy"></a>**Backspace rule (decided, D-acc):**
Backspace **does not** create or remove a keystroke from the counters. It only moves the
caret back and clears the visual state of the reverted character so it can be retyped. The
retype *does* count as a new keystroke. Net effect: accuracy reflects **every attempt**,
so corrections cannot inflate it back to 100%. This matches competitive-typing convention
and is covered by a unit test.

<a id="thai"></a>**Thai display rule (D7):** Internally Thai uses the same `wpm` formula
(`/5`) for cross-language comparability, but the UI surfaces **CPM** as the honest figure
and labels the headline number (e.g. shows `cpm` with a `≈wpm` subtitle in Thai mode).
English shows WPM headline. Both store all fields in `RunResult`.

## 5. Typing engine (`src/engine/useTypingEngine.ts`)

A headless hook returning render-ready state + the keydown handler. Responsibilities:

- Build initial text from `mode/lang/config/seed` (see text sources below).
- Track `index`, per-char `states` (`correct|wrong`), counters, `elapsed`, `samples`, `heat`, `errorsAt`.
- Start the clock on first character; sample WPM once per whole second.
- **Time mode:** auto-append words when within 25 chars of the end; finish at `elapsed >= time`.
- **Words/Lesson/AI/Race:** finish when `index >= text.length`.
- **Race:** also compute ghost position each tick (see §Race); set `raceWon` at finish.
- On finish, assemble a `RunResult` via the pure metric fns and call `onComplete`.

Text sources:
- `time` → `buildWords(lang, 60)` then auto-extend.
- `words` → `buildWords(lang, config.words)`.
- `lesson` → 30 words sampled from the selected lesson's set.
- `race` → `buildWords(lang, 25 + level*8)`.
- `ai` → `config.aiText` if present else `buildWords(lang, 40)`.

Keydown handling: ignore when `ctrl/alt/meta` held; `Tab` ignored; `Backspace` per rule above;
single-character keys compared to expected; everything else ignored.

<a id="race"></a>### Race pace-ghost (D5)

Per-level **target WPM** (the number the ghost types at):

| Level | 1 | 2 | 3 | 4 | 5 |
|-------|---|---|---|---|---|
| Target WPM | 20 | 35 | 50 | 65 | 80 |

Ghost mechanics (kept deliberately small):

```
ghostCharsPerSecond = targetWPM * 5 / 60
ghostIndex(elapsed) = min(textLength, floor(ghostCharsPerSecond * elapsed))
raceWon = (userIndex reaches textLength) AND (userFinishTime <= ghostFinishTime)
        equivalently: user reaches end before ghostIndex does
```

UI: a second marker on the progress track + a small "you vs ghost" delta. No avatars, no
extra animation. The ghost's target is shown to the user before the run.

## 6. Sampling (`src/engine/sampling.ts`)

Pure helpers, unit-tested:
- `pushSample(samples, second, correctChars)` → appends `{t, wpm}` once per new second.
- `markError(errorsAt, second)` → appends second if not already the last entry.
- `ghostIndex(targetWpm, elapsed, textLength)` → see formula above.

## 7. Data (`src/data/*`)

- `words.ts` — ported EN/TH word banks and quote banks from the prototype (content unchanged;
  these are practice corpora). `buildWords(lang, n)` and `pickQuote(lang)` live here.
- `lessons.ts` — five region drills (home/top/bottom/numbers/punct) with `{en, th}` names.
- `thaiKeymap.ts` — **cleaned** Kedmanee → physical `KeyboardEvent.code` map. Fixes from the
  prototype: remove `"ุ":"KeyKeyDummy"`, de-duplicate the `ฤ` legend, verify every entry maps
  to a real key on the rendered keyboard. Exposes `physicalForChar(ch, lang)` used by the
  on-screen keyboard's next-key highlight. Covered by a unit test asserting bijective sanity
  (no value is `undefined`/`KeyKeyDummy`; round-trip of sampled chars hits real codes).

## 8. AI text source (`src/ai/provider.ts`) — local, offline (v1)

```ts
interface GenerateOptions { lang: Lang; topic?: string; }
interface GenerateResult { text: string; source: 'local'; }

async function generatePassage(o: GenerateOptions): Promise<GenerateResult>;
```

Behavior (v1):
- Builds a practice passage **entirely from the bundled banks** — no network, no API key.
- Strategy: with a non-trivial probability use `pickQuote(lang)`; otherwise assemble ~40
  words via `buildWords(lang, n)`. The `topic` is accepted for UX continuity; v1 does not
  call an LLM, so it does not alter wording — the UI labels this honestly.
- Always resolves to non-empty text; it cannot fail or block a run.

**Extension seam (documented, not built):** the async signature exists so a real provider
can be slotted in later (a serverless route, or a user-supplied key) behind the exact same
`generatePassage` interface — adding a `source: 'ai' | 'local'` discriminator and falling
back to the local path on any error. v1 ships the local path only, keeping the app fully
static, free, and private.

## 9. i18n (`src/i18n/*`)

Typed dictionary; `en.ts` and `th.ts` share the **same key set** (a TS type enforces it).
`useT()` returns `t(key)` for the current language. Key groups:

- `brand.tag`, `lang.en`, `lang.th`
- `mode.time|words|lesson|race|ai`
- `ctx.restart`, `ai.topicPlaceholder`, `ai.generate`, `ai.generating`
- `stat.wpm|cpm|acc|raw|left|words|time|chars|errors`
- `result.title|best|pb|next|restart`
- `hist.best|empty`
- `set.title|direction|appearance|dark|accent|glow|font|aids|keyboard|heatmap`
- `race.target|you|ghost|won|lost`
- `ai.offlineNote`

No inline `lang === 'th' ? a : b` ternaries in components — all user text goes through `t()`.

## 10. Styling

Port the prototype's CSS verbatim where possible into `tokens.css` + `app.css`:
- `:root` base tokens; `[data-theme="light"|"dark"]` color sets (oklch); `[data-dir=...]`
  overrides for minimal/aurora/terminal (glow orb, grid, glass, radii).
- Accent applied via `--primary`/`--primary-foreground` set from `Settings.accent`.
- Glow strength via `--glow` (0..1) from `Settings.glow/100`.

<a id="a11y"></a>**Accessibility & motion:**
- `@media (prefers-reduced-motion: reduce)` → disable caret blink, glow animation, and
  non-essential transitions; keep state changes instant.
- Icon-only buttons get `aria-label`; language/theme toggles use `aria-pressed`.
- Light theme verified for text contrast on `--muted-fg`/`--dim` against `--bg`.
- The typing surface is operable entirely by keyboard (it is the input); focus is managed so
  the global keydown listener is active on the test view.

## 11. Build & deploy

- `npm run dev` (Vite), `npm run build` (`tsc -b` + `vite build`), `npm run preview`, `npm test` (vitest).
- `vite.config.ts` sets `base` for project Pages (`/<repo>/`) via an env/flag so local dev stays `/`.
- `.github/workflows/deploy.yml`: on push to `main` → build → upload `dist` → deploy to Pages.

## 12. Test plan (Vitest)

| Test file | Asserts |
|-----------|---------|
| `metrics.test.ts` | wpm/rawWpm/cpm/accuracy values + zero-time guard + backspace-doesn't-restore-accuracy |
| `sampling.test.ts` | one sample per second; errorsAt dedupe; ghostIndex per-level math |
| `thaiKeymap.test.ts` | no junk values; every TH word-bank char maps to a real key code |
| `ai.test.ts` | generatePassage returns non-empty EN & TH text; never rejects; respects lang |

Green tests + clean `npm run build` = the build's definition of done (see [PLAN](./PLAN.md)).
