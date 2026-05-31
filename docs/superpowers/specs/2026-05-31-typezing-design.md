# TypeZing — Design Doc (Source of Truth)

> **Status:** Approved (decisions confirmed 2026-05-31) · **Owner:** Kittanate Thanee
> This is the *source of truth*. The four working docs — [BASE](../../BASE.md),
> [PRD](../../PRD.md), [SPEC](../../SPEC.md), [PLAN](../../PLAN.md) — are **derived** from
> this file. When they disagree, this doc wins until it is itself updated.

## 1. One-paragraph pitch

**TypeZing** is a bilingual (ไทย / English) typing-speed trainer for the web — a
Monkeytype-class practice arena that also teaches Thai Kedmanee touch-typing. It runs
fully client-side (static hosting, free), tracks personal bests locally, and offers an
optional **offline AI mode** that builds practice passages from the bundled banks (no key,
no network), with a clean seam to add a real LLM later.
It is built to live on the owner's GitHub profile as a portfolio-grade project.

## 2. Why this exists (problem)

- English typing trainers are everywhere; **good Thai trainers that respect the Kedmanee
  layout and Thai's spaceless word structure are rare.**
- Existing tools either ignore Thai or bolt it on with wrong WPM math.
- A portfolio project should demonstrate: clean architecture, i18n done properly,
  testable core logic, honest features (no fake "AI race"), and accessibility awareness.

## 3. Confirmed decisions (the forks we already resolved)

| # | Decision | Choice | Consequence |
|---|----------|--------|-------------|
| D1 | Tech stack | **Vite + React 18 + TypeScript** | Matches prototype, shows TS, trivial static deploy |
| D2 | AI mode | **Local, offline generator** (no key, no backend) | Stays 100% static & private; clean seam to add a real LLM later |
| D3 | Scope of first run | **Docs first → your review → then implementation** | One approval gate after docs; verification gate at the end |
| D4 | Hosting | **GitHub Pages via Actions** (static) | `vite build` → `gh-pages`; Vercel also works unchanged |
| D5 | Race mode | **Real pace-ghost** at target WPM per level | Replaces prototype's fake "more words" |
| D6 | Tweaks panel | **Dropped**, replaced by real Settings panel | `tweaks-panel.jsx` was design-tool scaffolding, not a feature |

## 4. What we are NOT building (scope boundaries)

- ❌ Accounts, login, cloud sync, leaderboards, multiplayer. (Personal best is local only.)
- ❌ A backend / serverless proxy. AI text is generated locally in v1, so the app stays static. (A real LLM can be added later behind the same interface.)
- ❌ Mobile-app packaging. Responsive web only.
- ❌ Monetization, ads, analytics SDKs.

## 5. Honest corrections over the prototype

The handoff prototype (`typingspeedzing2026/`) is a visual mock. We recreate its **look**
pixel-faithfully but fix these substance issues (do **not** transcribe them):

1. **Race had no opponent** — it just generated `25 + level*8` words. → Implement a real
   pace-ghost (a second progress marker advancing at the level's target WPM; finishing
   first = win). Per-level WPM table lives in [SPEC](../../SPEC.md#race).
2. **`TH_TO_PHYSICAL` junk** — `"ุ":"KeyKeyDummy"` and a duplicated `ฤ` legend. → Clean,
   verified Kedmanee → physical-key map with a unit test.
3. **Thai WPM = chars/5** is an English convention (Thai has no inter-word spaces). →
   Keep WPM (chars/5) for cross-language comparability **but** also compute and surface
   **CPM** (chars/min) and clearly label the headline number in Thai.
4. **`window.claude.complete`** only exists in Claude's design sandbox. → Replaced by a
   local passage generator (`ai/provider.ts`) built from the bundled word/quote banks — no
   network, no key. A documented seam allows swapping in a real LLM later.

## 6. High-level architecture

Headless, testable core; thin React shell.

```
UI (React components)  ──►  useTypingEngine (headless logic)  ──►  pure math (wpm/sampling)
        │                            │
        ▼                            ▼
   SettingsContext            data/* (word banks, lessons, thai keymap)
   HistoryContext                    │
        │                            ▼
   localStorage                ai/provider.ts (local passage generator)
```

- **Engine is a hook with no JSX** so its WPM/accuracy/sampling logic is unit-tested in isolation.
- **Settings & History** are React contexts persisted to `localStorage` (replacing the
  prototype's tweaks scaffolding).
- **AI generator** is a single function `generatePassage(opts)` that *always* returns usable
  local text. Its signature is async so a real LLM can be slotted behind it later without UI changes.

Full module map, data shapes, and formulas: [SPEC](../../SPEC.md).

## 7. Feature set (v1)

Carried from the prototype, corrected and made real:

- **Modes:** Time (15/30/60s) · Words (10/25/50) · Lesson (home/top/bottom/numbers/punct) ·
  Race (Lv1–5, pace-ghost) · AI (topic → passage, offline generator).
- **Languages:** EN + TH, switchable live; Thai uses Kedmanee layout + Noto Sans Thai.
- **Live HUD:** WPM, accuracy, raw WPM, progress, sparkline.
- **Results:** big WPM/accuracy, WPM-over-time chart, raw/chars/errors/time, personal-best badge.
- **On-screen keyboard:** next-key highlight, active-key flash, error heatmap; EN + Thai legends.
- **History:** last 50 runs + best, in `localStorage`.
- **Appearance:** 3 directions (minimal/aurora/terminal), 4 accents, light/dark, glow, font —
  all in a real **Settings** panel; `prefers-reduced-motion` respected.

## 8. Success criteria (definition of done for this build)

1. All four working docs written, internally consistent, non-overlapping.
2. App runs (`npm run dev`), type-checks (`tsc`), and **`npm run build` is clean**.
3. **Vitest green** for: WPM/CPM math, accuracy, time-sampling, Thai→physical keymap, AI generator.
4. Visual parity with the prototype's three directions in light + dark.
5. Deployable to GitHub Pages via the included Actions workflow.

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| AI text variety is limited (local v1) | Curated quotes + randomized passages; real-LLM seam documented for later |
| Pace-ghost scope creep | Time-boxed: one marker + win/lose, no avatars/animation theatrics |
| Doc drift across 4 files | Sharp non-overlapping charters (below); cross-link, never copy |
| Thai correctness doubted by reviewers | Explicit CPM/WPM formula + keymap test |

## 10. The four docs — non-overlapping charters

- **[BASE.md](../../BASE.md)** — the *why*: vision, scope boundaries, glossary, decision log. Short, stable.
- **[PRD.md](../../PRD.md)** — *user-facing*: personas, user stories, feature list, acceptance criteria, metrics. No code.
- **[SPEC.md](../../SPEC.md)** — *engineer-facing*: architecture, data shapes, WPM/CPM formulas, i18n keys, AI adapter contract, a11y. No marketing.
- **[PLAN.md](../../PLAN.md)** — *execution*: milestones, ordered task checklist, per-task verification. The only doc that "expires".

If a feature list starts appearing in three files, stop and cross-link instead.
