# PLAN — Implementation Plan

> **Charter:** *execution*. Milestones, ordered task checklist, and how to verify each.
> This is the only doc that **expires** (it tracks progress). Requirements: [PRD](./PRD.md);
> design/contracts: [SPEC](./SPEC.md); rationale: [BASE](./BASE.md). Source of truth:
> [design doc](./superpowers/specs/2026-05-31-typezing-design.md).

## Definition of done (the end gate)

1. All four docs written, consistent, non-overlapping. ✅
2. `npm run build` clean (tsc strict + vite). 
3. `npm test` green (4 suites in [SPEC §12](./SPEC.md#12-test-plan-vitest)).
4. App runs in `npm run dev`; all 5 modes + EN/TH + settings work.
5. Visual parity with prototype across 3 directions, light + dark.
6. GitHub Pages workflow present; repo init + first commit.

## Milestones

### M0 — Docs ✅
- [x] Design doc (source of truth)
- [x] BASE · PRD · SPEC · PLAN

### M1 — Scaffold
- [ ] `package.json` (react, react-dom; dev: vite, typescript, @vitejs/plugin-react, vitest, jsdom, @testing-library/*)
- [ ] `tsconfig.json` + `tsconfig.node.json` (strict)
- [ ] `vite.config.ts` (react plugin, vitest config, Pages `base`)
- [ ] `index.html` (root div, font preconnect/links)
- [ ] `.gitignore`, `.github/workflows/deploy.yml`
- **Verify:** `npm install` succeeds; `npm run dev` serves a blank app.

### M2 — Foundations (types, styles, i18n, data)
- [ ] `src/types.ts` (all shapes from [SPEC §3](./SPEC.md#3-core-data-shapes-srctypests))
- [ ] `src/styles/tokens.css` + `app.css` (port prototype CSS; add reduced-motion block)
- [ ] `src/i18n/{en,th,index}.ts` (shared key set, `useT`)
- [ ] `src/data/{words,lessons,thaiKeymap}.ts` (clean the keymap junk)
- **Verify:** `thaiKeymap.test.ts` green; tsc passes for these modules.

### M3 — Engine (pure core)
- [ ] `src/engine/metrics.ts` (wpm/rawWpm/cpm/accuracy)
- [ ] `src/engine/sampling.ts` (sample push, error mark, ghostIndex)
- [ ] `src/engine/useTypingEngine.ts` (headless state machine + keydown)
- **Verify:** `metrics.test.ts` + `sampling.test.ts` green.

### M4 — AI text source
- [ ] `src/ai/provider.ts` (local passage generator; async seam for a future LLM)
- **Verify:** `ai.test.ts` green (non-empty EN & TH; never rejects).

### M5 — State stores
- [ ] `src/store/settings.tsx` (localStorage, defaults match prototype: aurora/dark/amber/glow 60)
- [ ] `src/store/history.tsx` (localStorage, cap 50, best selector)
- **Verify:** settings persist across reload; history append works.

### M6 — UI components
- [ ] TopBar, ModeBar, ContextBar (mode params + AI topic input)
- [ ] TypeArea + Caret (char rendering, scroll, caret transform)
- [ ] Keyboard (next-key highlight, active flash, heatmap, EN/TH legends)
- [ ] StatBar + Sparkline (live HUD)
- [ ] Result + ResultChart + History (post-run + footer)
- [ ] SettingsPanel (appearance + practice aids) + Toast
- [ ] icons.tsx
- **Verify:** each mode renders; EN/TH toggle re-localizes; settings apply live.

### M7 — Wire-up (`App.tsx`, `main.tsx`)
- [ ] Compose providers (Settings, History, I18n), mode/lang/seed flow, result view, toast.
- [ ] Race shows ghost target + win/lose; AI mode auto-generates on entry with fallback.
- **Verify:** full happy path EN + TH for all 5 modes by reading rendered output / dev run.

### M8 — Quality gate
- [ ] `npm run build` clean
- [ ] `npm test` all green
- [ ] README polished (features, screenshots ref, live-demo placeholder, AI offline note, dev commands)
- [ ] `git init`, initial commit
- **Verify:** the Definition of done checklist above, all boxes.

## Task ordering rationale

Pure code first (types → data → metrics → engine → ai) so tests pass before any UI exists;
UI last so it composes already-verified pieces. AI and stores are independent of the engine
and can be built in parallel with it. The keymap fix is front-loaded in M2 because the
keyboard component (M6) depends on it.

## Verification commands

```bash
npm install
npm test              # vitest, 4 suites
npm run build         # tsc -b && vite build  → dist/
npm run dev           # local server for manual check
```

## Risk checkpoints (from design doc §9)

- After M4: confirm AI generator returns non-empty local text for EN and TH (test covers it).
- After M6 Keyboard: confirm Thai legends + next-key highlight use the cleaned keymap.
- After M7: confirm reduced-motion disables glow/blink (manual or CSS review).
