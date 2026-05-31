# BASE — Project Foundation

> **Charter:** the *why*. Vision, scope boundaries, glossary, and the decision log.
> Stable and short. For user requirements see [PRD](./PRD.md); for engineering see
> [SPEC](./SPEC.md); for the task checklist see [PLAN](./PLAN.md). Source of truth:
> [design doc](./superpowers/specs/2026-05-31-typezing-design.md).

## Vision

A typing-speed trainer that is **genuinely good in Thai**, not just translated. TypeZing
treats Thai (Kedmanee) as a first-class language alongside English: correct keyboard map,
correct speed math, and a UI that reads naturally in both. It is free, private
(everything stays in your browser), and pleasant enough to use daily.

## Mission for this repository

Serve as a **portfolio-grade** project on the owner's GitHub profile that demonstrates:

- Clean, layered front-end architecture (headless logic core + thin UI).
- Internationalization done properly (typed dictionaries, no inline string ternaries).
- Honest features — nothing faked for demo effect.
- Testable core logic with real unit tests.
- Accessibility and motion-sensitivity awareness.

## Goals

1. Practice typing in **EN and TH** across five modes.
2. Give immediate, trustworthy feedback (live WPM/accuracy, post-run analytics).
3. Teach Thai touch-typing via on-screen keyboard + finger-row lessons.
4. Practice text in an **AI mode** generated locally (offline) — with a clean seam to add a real LLM later.
5. Run entirely client-side; deploy to GitHub Pages for free.

## Non-goals (scope boundaries)

- No accounts, login, or cloud sync. Personal best is **local only**.
- No backend or serverless proxy — AI text is generated locally, so the app stays static.
- No multiplayer, leaderboards, or social features.
- No native mobile app (responsive web only).
- No ads, paid tiers, or third-party analytics.

> These boundaries are deliberate. Proposals that cross them require updating the
> [design doc](./superpowers/specs/2026-05-31-typezing-design.md) first.

## Guiding principles

- **Honest over flashy.** If a feature can't be real, it isn't shipped (see Race ghost).
- **Core logic is pure.** The typing engine has no DOM dependency and is unit-tested.
- **Localize meaning, not just strings.** Thai gets correct math and layout, not a `/5` hack.
- **Fail soft.** AI text is generated locally, so practice never depends on the network.
- **Respect the user.** Nothing leaves the browser; motion can be reduced; nothing is logged.

## Glossary

| Term | Meaning |
|------|---------|
| **WPM** | Words per minute = `(correct_chars / 5) / minutes`. The `/5` is the standard cross-language convention. |
| **CPM** | Characters per minute = `correct_chars / minutes`. Surfaced for Thai, where word-spacing makes WPM misleading. |
| **Raw WPM** | Same as WPM but counts *all* typed chars (including errors). |
| **Accuracy** | `correct_keystrokes / total_keystrokes` (see [SPEC](./SPEC.md#accuracy) for the backspace rule). |
| **Kedmanee** | The standard Thai keyboard layout mapped onto physical QWERTY keys. |
| **Direction** | A visual style preset: `minimal`, `aurora`, or `terminal`. |
| **Accent** | The primary color: amber, violet, emerald, or sky. |
| **Pace-ghost** | A second progress marker in Race mode advancing at a target WPM; the opponent. |
| **AI mode (v1)** | Generates practice passages locally (offline); the interface is ready to plug in a real LLM later. |
| **Direction/Mode/Lesson** | See [PRD](./PRD.md) for user-facing definitions. |

## Decision log

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | 2026-05-31 | Stack = Vite + React + TypeScript | Matches prototype; TS for portfolio signal; fast static build |
| D2 | 2026-05-31 | AI mode = local offline generator | Free, static, private; no key; interface ready for a real LLM later |
| D3 | 2026-05-31 | Docs first, then build after review | Owner chose a plan-first gate; review docs before implementation |
| D4 | 2026-05-31 | Deploy via GitHub Pages Actions | Free, fits a profile repo; Vercel remains drop-in |
| D5 | 2026-05-31 | Race = real pace-ghost | Prototype's "race" was fake; honesty principle |
| D6 | 2026-05-31 | Drop tweaks-panel; add Settings | Tweaks panel was design-tool scaffolding |
| D7 | 2026-05-31 | Thai shows CPM + labeled WPM | Thai has no word spaces; `/5` alone misleads |

## Provenance

The visual design originated as an HTML/React prototype exported from Claude Design
(`typingspeedzing2026/`, kept in-repo as reference). This project re-implements that design
as production code per its README's instruction to "recreate pixel-perfectly in whatever
technology fits."
