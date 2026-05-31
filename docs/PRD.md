# PRD — Product Requirements

> **Charter:** *user-facing only*. Personas, user stories, feature list, acceptance
> criteria, success metrics. **No technology, no code** — that lives in [SPEC](./SPEC.md).
> The *why* is in [BASE](./BASE.md). Source of truth:
> [design doc](./superpowers/specs/2026-05-31-typezing-design.md).

## 1. Target users (personas)

| Persona | Who | Primary need |
|---------|-----|--------------|
| **Nut, the Thai learner** | Thai student/office worker who never learned Kedmanee touch-typing | Learn Thai typing with on-screen guidance and honest speed feedback |
| **Mai, the speed chaser** | Already types ~60 WPM EN, wants to push higher | Repeatable tests, trends over time, personal bests |
| **Arthit, the bilingual pro** | Switches TH/EN all day at work | One tool that handles both languages correctly |
| **The recruiter** | Visits the owner's GitHub | A polished, working demo that signals engineering skill |

## 2. User stories & acceptance criteria

Format: *As a [persona], I want [goal] so that [benefit].* Each has testable acceptance criteria (AC).

### Core typing
- **US-1** As any user, I want to start typing immediately without setup.
  - AC: Landing on the page shows a ready test; the first keystroke starts the timer.
  - AC: No login, modal, or cookie wall blocks the start.
- **US-2** As any user, I want live feedback while typing.
  - AC: WPM, accuracy, and progress update continuously during a run.
  - AC: A live sparkline shows my speed trend within the run.
- **US-3** As any user, I want to fix mistakes.
  - AC: Backspace moves the caret back and clears the corrected character's state.
  - AC: Wrong characters are visibly marked (color + underline) distinct from untyped text.

### Modes
- **US-4** As a speed chaser, I want a **timed** test (15/30/60s) so I can benchmark.
  - AC: Selecting a duration restarts the test; text auto-extends so I never run out before time.
- **US-5** As a learner, I want a **word-count** test (10/25/50) so runs are bounded.
  - AC: The run ends exactly when the target word count is completed.
- **US-6** As a Thai/EN learner, I want **lessons** by keyboard region (home/top/bottom/numbers/punctuation).
  - AC: Each lesson draws only from its region's character set.
- **US-7** As a competitor, I want a **race** against an opponent at a chosen level.
  - AC: A visible pace-marker advances at the level's target speed; I see whether I'm ahead or behind.
  - AC: The run reports whether I beat the pace (win/lose), not just my WPM.
- **US-8** As a curious user, I want a **generated** practice passage on a topic I choose.
  - AC: Entering a topic and generating produces a fresh passage in the current language.
  - AC: Generation works fully offline (no key, no network); it never fails or blocks the run.

### Language
- **US-9** As a bilingual user, I want to switch **EN ↔ ไทย** instantly.
  - AC: Toggling language re-renders UI labels and the practice text in that language.
  - AC: Thai shows a **CPM** figure and clearly labels its headline speed number.
  - AC: The on-screen keyboard shows Thai (Kedmanee) legends in Thai mode.

### Results & history
- **US-10** As any user, I want a clear result after each run.
  - AC: Result shows WPM, accuracy, raw WPM, characters, errors, time, and a WPM-over-time chart.
  - AC: A "Personal best" badge appears when the run beats my prior best.
- **US-11** As a returning user, I want my history to persist.
  - AC: Best score and recent runs remain after closing/reopening the browser (same device/browser).
  - AC: History never leaves my device.

### Practice aids & appearance
- **US-12** As a learner, I want an **on-screen keyboard** that highlights the next key.
  - AC: The next expected key is highlighted; the last pressed key flashes.
  - AC: An optional **error heatmap** colors keys I miss most.
- **US-13** As any user, I want to **customize the look** (style, dark mode, accent, glow, font).
  - AC: Changes apply instantly and persist across sessions.
  - AC: Reduced-motion preference disables non-essential animation/glow.

## 3. Feature list (v1)

A single canonical list. Other docs link here rather than repeating it.

1. Five practice modes: Time, Words, Lesson, Race (pace-ghost), AI (offline generator).
2. Bilingual EN/TH with live switching and Thai-correct speed display.
3. Live HUD: WPM, accuracy, raw WPM, progress bar, sparkline.
4. Post-run results with WPM-over-time chart and personal-best detection.
5. On-screen keyboard: next-key highlight, active flash, error heatmap, EN + Thai legends.
6. Local history (best + last 50 runs).
7. Appearance settings: 3 directions, 4 accents, light/dark, glow, font; reduced-motion aware.
8. AI mode: offline passage generator (topic-aware), no key or network; interface ready for a real LLM later.

## 4. Out of scope for v1

Accounts, cloud sync, leaderboards, multiplayer, native apps, ads/analytics. (See [BASE](./BASE.md#non-goals-scope-boundaries).)

## 5. Success metrics

Since there is no backend/analytics, metrics are **qualitative + self-measured**:

| Metric | Target |
|--------|--------|
| Time-to-first-keystroke | < 2s from page load (no setup friction) |
| Thai correctness | Keymap + WPM/CPM verified by automated tests (see [SPEC](./SPEC.md)) |
| Visual parity | All 3 directions match the prototype in light + dark |
| Reliability | AI text is local, so practice never depends on the network |
| Portfolio signal | Clean build, green tests, readable code, live demo link in README |

## 6. UX copy principles

- Bilingual labels everywhere a user reads text; never leave English-only strings in Thai mode.
- Errors are quiet and non-blocking ("AI unavailable — using local text").
- Numbers are honest: don't call a fake metric "WPM"; label Thai speed clearly.
