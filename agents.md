# Agents Guide (Jules / AI Agent Instructions)

## 0. Purpose
This repository is a small **static-deployable web clicker game** (no backend).
Your job is to implement features incrementally while keeping the project easy to build and deploy.

**Read this file first. Follow it strictly.**

---

## 1. Game Concept (One-page summary)
**Title:** Cat Fur Clicker (고양이 털 키우기)

**Core loop:**
- Player clicks a central “fur ball” to gain **Fur** points.
- Fur can be spent on upgrades:
  - Increase **FPC** (Fur per click)
  - Increase **FPS** (Fur per second / idle production)
  - Optional multipliers & crit chance upgrades for juicy progression
- The game must feel “juicy”:
  - Squish/bounce on click
  - Particle burst (fur fluff)
  - Floating `+gain` text
  - (Optional) subtle screen shake on critical

**Goal:**
- Short MVP that runs fully in the browser and can be statically deployed (GitHub Pages, Cloudflare Pages, etc.).

---

## 2. Hard Requirements (Non-negotiable)
### 2.1 Static-only
- **No server / no backend / no DB.**
- Must run as a static frontend build output (e.g. Vite `dist/`).

### 2.2 Tech constraints
- Target: **Node.js 20 LTS**
- Prefer **TypeScript** unless a strong reason exists.
- Keep dependencies minimal. Avoid heavy UI frameworks unless necessary.

### 2.3 Build must pass
- `npm install`
- `npm run dev`
- `npm run build`
All must succeed.

### 2.4 No paid / copyrighted assets
- Do not download paid assets.
- If assets are needed, use:
  - procedurally generated graphics (Canvas/Phaser Graphics),
  - simple placeholder SVG,
  - or self-made minimal shapes.
- Sound: if needed, use simple WebAudio generation or keep silent but implement toggles.

---

## 3. Data Source Policy (IMPORTANT)
### 3.1 Balance JSON is the source of truth
- **DO NOT hardcode upgrade costs or effects in code.**
- Always load and use the existing balance JSON in this repo.

**Balance file path (must be used):**
- `src/config/balance.demo_10min_v1.json`

If the file path changes, update code to match—do not duplicate balance tables elsewhere.

### 3.2 Upgrade logic mapping rules
Unless the JSON explicitly defines otherwise, use these canonical mappings:
- Upgrade A: `fpc = 1 + levelA * 1`
- Upgrade B: `fps = levelB * 0.2`
- Upgrade C: `globalMult = 1 + levelC * 0.02`  (additive multiplier)
- Upgrade D: `critChance = 0.05 + levelD * 0.005`
- `critMult = 10` (fixed)

Unlock rule:
- Upgrades C and D are locked until `totalFurEarned >= 5000`
- UI should show lock state and the unlock condition.

If JSON contains fields that conflict with the above, **JSON wins**.

---

## 4. Game State Model
Maintain a single source of truth game state:
- `fur: number`
- `totalFurEarned: number`
- `fpc: number`
- `fps: number`
- `globalMult: number`
- `critChance: number`
- `critMult: number`
- `upgradeLevels: { A: number; B: number; C: number; D: number }`
- `lastSavedAt: number` (ms)

**Base defaults:**
- `fur=0`
- `totalFurEarned=0`
- `fpc=1`, `fps=0`
- `globalMult=1`
- `critChance=0.05`
- `critMult=10`
- levels all 0

---

## 5. Persistence Rules (localStorage)
- Use `localStorage` for save/load.
- Save:
  - `fur`, `totalFurEarned`, upgrade levels, `lastSavedAt`
- Autosave with debounce (2–5 seconds).
- Load on startup automatically.
- Provide a “Reset Save” button with confirmation.

Optional (only if requested in task):
- Offline gain:
  - cap offline time: 3600 seconds
  - `offlineGain = fps * offlineSeconds * globalMult`
  - show UI toast once after load

---

## 6. UI / UX Requirements
- Must display:
  - Current Fur (rounded to integer in UI)
  - FPC, FPS
  - globalMult
  - critChance as %
- Shop UI should be auto-generated from JSON:
  - Name, current level, next cost, effect description, buy button
  - Disable buy if insufficient Fur
  - Lock C/D pre-unlock and show condition text

---

## 7. Code Organization Guidelines
Keep code modular and testable:
- `src/state/` : state model, reducers, selectors (or simple store)
- `src/config/` : balance JSON loader and types
- `src/ui/` : UI components (Phaser UI or DOM overlay)
- `src/game/` : Phaser scenes, effects, input
- Avoid giant monolithic files.

---

## 8. PR / Change Quality Bar
When opening a PR:
- Include a short summary of changes.
- Include how to run/build.
- Confirm `npm run build` passes.
- Keep commits tidy and focused.

---

## 9. Agent Workflow Notes
- Prefer incremental steps: scaffold → core loop → shop → save → juice/polish.
- If you must choose between “more features” and “clean stable build”, choose stability.
- Do not introduce large refactors unless necessary.

END.
