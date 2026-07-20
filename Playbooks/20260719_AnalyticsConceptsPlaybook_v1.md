---
project: CompounDX-Code
author: Quantitative Researcher
created: 2026-07-19
updated: 2026-07-19
status: Active
name: Analytics & Nutrition Concepts Playbook
tags: [statistics, mathematics, physics, analytics, nutrition]
dependencies: [src/lib/analytics.ts, src/app/tools/page.tsx, src/lib/nutrition-api.ts]
---
# Playbook: Analytics & Nutrition Concepts Playbook

**Purpose:** Reference list of statistics, mathematics, and physics concepts worth
studying and adopting to make CompounDX-Code's training analytics and nutrition
calculations more rigorous. Consult this before extending `src/lib/analytics.ts`,
`src/app/tools/page.tsx`, or `src/lib/nutrition-api.ts` — check whether a concept below
already applies before inventing a new heuristic.

**Steps:**

1. **Statistics — replace fixed heuristics with trend/baseline models.**
   - Plateau detection (`getExerciseRecommendations`, currently "last 3 sessions same
     weight") → rolling linear regression slope or a trend test (e.g. Mann-Kendall)
     over a longer window, so a planned deload isn't misread as a plateau.
   - Underworked-muscle-group detection (`getMuscleGroupVolume`, currently
     `volume < avg * 0.3`) → z-scores / EWMA against the user's own rolling baseline
     instead of a fixed fraction of the current week's average.
   - PR and 1RM outputs are point estimates → add confidence intervals so the UI can
     show a range (e.g. "225 ± 8 lbs") instead of false precision.

2. **Mathematics — better estimators and growth models.**
   - `estimate1RM` (`src/app/tools/page.tsx`) only implements Epley, which overestimates
     past ~10 reps → study Brzycki/Lombardi/Wathan and consider an ensemble/average.
   - Volume progression (`getVolumeOverTime`) is a raw running sum, but strength gains
     follow a diminishing-returns curve → logarithmic/asymptotic growth models give more
     honest PR projections than linear extrapolation.

3. **Physics — energy and load concepts missing from the nutrition/training modules.**
   - No TDEE/energy-balance calculation exists alongside calorie tracking
     (`src/lib/nutrition-api.ts`) → study Mifflin-St Jeor + activity multiplier as the
     natural next calculation.
   - Volume (weight × reps) is a proxy for training load, not true work → power/work
     (force × distance / time) is the physically correct measure used in velocity-based
     training; only worth adopting if rep tempo or bar speed data is captured.

**Templates/tools:** ResearchOS `PLAYBOOK.md` template; source files listed in
`dependencies` above.

**Responsible parties:** Quantitative Researcher (concept selection, formula choice),
Developer (implementation in `analytics.ts` / `tools/page.tsx` / nutrition module).

**Exit criteria:** Each concept above has been evaluated (adopt / defer / reject) and,
for adopted ones, an implementation is either shipped or tracked in a DECISION.md
referencing this playbook.
