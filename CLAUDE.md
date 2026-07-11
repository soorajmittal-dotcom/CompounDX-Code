# PartyPlanner — Project Context

## What This Is
A React 19 + Vite 8 single-page party menu planning app. Users pick a party type, add guests with dietary preferences, choose cuisines, build a menu, and get a scaled shopping list, prep timeline, and cost breakdown.

**Live URL:** https://soorajmittal-dotcom.github.io/CompounDX-Code/  
**Dev branch:** `claude/party-menu-planner-v1g8c9`  
**Deploy:** `npm run deploy` → pushes `dist/` to `gh-pages` branch

## Tech Stack
- React 19, Vite 8, plain CSS (no UI framework)
- `useReducer` state via `PlannerContext` — auto-persisted to `localStorage`
- Supabase (`@supabase/supabase-js`) — device-ID pattern, no auth
  - URL: `https://wedcbyxokedmsksjqwpq.supabase.co`
  - Key: `sb_publishable_VmjIMAwXspkble7Cl0gjuQ_gKR1PZFk`
- GitHub Pages via `vite.config.js` `base: '/CompounDX-Code/'`

## App Flow (9 steps)
```
0 Party Type → 1 Guests → 2 Courses → 3 Cuisine → 4 Menu → 5 Drinks → 6 Presentation → 7 Materials → 8 Summary
```
All steps clickable in nav; "Skip to Summary →" available from step 2+.

## Key Files
| File | Purpose |
|------|---------|
| `src/context/PlannerContext.jsx` | Global state, reducer, `DIETARY_TAGS`, auto-persist |
| `src/App.jsx` | Step router, `STEP_COMPONENTS[9]` array |
| `src/App.css` | All styles (dark/light theme via CSS vars) |
| `src/data/recipes.js` | ~20 recipes with ingredients + steps |
| `src/data/decorations.js` | 27 `PARTY_TYPES`, 8 decoration themes, 6 serving styles |
| `src/utils/calculations.js` | Budget, prep time, difficulty, guest counts |
| `src/utils/timeline.js` | Prep timeline + equipment contention detection |
| `src/utils/storage.js` | Save/load plans (Supabase + localStorage fallback) |
| `src/utils/share.js` | URL-encoded share link |
| `src/utils/cheersDb.js` | Community upvotes (Supabase `recipe_cheers` table) |
| `src/utils/supabase.js` | Supabase client |
| `src/components/ProgressBar.jsx` | Sticky nav, skip button, budget display |
| `src/components/GuestManager.jsx` | Per-guest diet/alcohol/appetite/restrictions |
| `src/components/StepCourseCounts.jsx` | Course counts, food source, budget, tolerance |
| `src/components/StepMenu.jsx` | Menu selection with conflict detection |
| `src/components/StepRawMaterials.jsx` | Shopping list by aisle/A-Z/dish + cutlery |
| `src/components/StepSummary.jsx` | Full plan, timeline, export, save, share |
| `src/components/Dashboard.jsx` | Community trending dishes |

## State Shape (PlannerContext)
```js
{
  step: 0,
  partyType: null,           // { name, icon, cuisines[], decorTheme }
  guestList: [],             // [{ id, name, diet:'veg'|'nonveg', alcohol:bool, appetite:0.5|1|2, rsvp:'confirmed'|'maybe'|'declined', restrictions:[] }]
  courseCounts: {},          // { vegAppetizers, nonVegAppetizers, vegMains, nonVegMains, desserts, drinks }
  foodSource: null,          // 'self' | 'order' | 'mix'
  budget: 0,
  currency: 'INR',           // 'INR' | 'USD'
  leftoverTolerance: 1.15,
  selectedCuisines: {},      // { appetizers:[], mains:[], desserts:[] }
  selectedMenu: {},          // { appetizers:[], mains:[], desserts:[] }
  selectedDrinks: [],
  presentations: {},         // { [dishName]: presentationIdea }
  cookingSkill: 'intermediate',
  prepTime: 180,
}
```

## Dietary Tags (7 types)
`jain | vegan | glutenFree | nutFree | halal | noPork | noBeef`  
Each has `excludes` (ingredient keywords) or `excludeItems` arrays. Used in `StepMenu` to detect conflicts by scanning `RECIPES[item.name].ingredients`.

## INR/USD
`costMultiplier = currency === 'INR' ? 83 : 1`. All costs stored in USD, displayed multiplied.

## Supabase Tables Needed (NOT YET CREATED)
```sql
-- known_guests
CREATE TABLE known_guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  name text NOT NULL,
  diet text DEFAULT 'nonveg',
  alcohol boolean DEFAULT true,
  restrictions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(device_id, name)
);
ALTER TABLE known_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Device owns guests" ON known_guests USING (true) WITH CHECK (true);

-- recipe_cheers
CREATE TABLE recipe_cheers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  recipe_name text NOT NULL,
  category text DEFAULT 'other',
  created_at timestamptz DEFAULT now(),
  UNIQUE(device_id, recipe_name)
);
ALTER TABLE recipe_cheers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cheers" ON recipe_cheers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cheers" ON recipe_cheers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own cheers" ON recipe_cheers FOR DELETE USING (true);
CREATE OR REPLACE FUNCTION get_top_recipes(result_limit int DEFAULT 20)
RETURNS TABLE(recipe_name text, category text, cheers bigint) AS $$
  SELECT recipe_name, category, count(*) as cheers
  FROM recipe_cheers GROUP BY recipe_name, category
  ORDER BY cheers DESC LIMIT result_limit;
$$ LANGUAGE sql STABLE;
```

## Dev Commands
```bash
npm run dev        # dev server on :5173
npm run build      # production build
npm run deploy     # build + push to gh-pages
```

## Known Gaps / Planned Next
- Supabase tables above not yet created → guest memory + dashboard non-functional
- Recipes: only ~20 across all cuisines; need 50-80 for menu step to feel full
- Mobile polish pass needed (card grids, progress bar, touch targets)
- PDF export (currently txt only)
- Guest RSVP via share link (Share button generates URL but guests can't respond)
