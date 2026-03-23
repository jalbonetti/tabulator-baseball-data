# Baseball Props Tables - Overhauled

Modular Tabulator-based data tables for displaying baseball prop odds and betting information.  
**Rebuilt to match the NBA basketball-props repository architecture.**

## Phase 1 (Current): Odds Tables

Three active tabs pulling from new Supabase tables:

| Tab | Supabase Table | Description |
|-----|---------------|-------------|
| Batter Odds | `BaseballBatterPropOdds` | Individual batter prop odds across books |
| Pitcher Odds | `BaseballPitcherPropOdds` | Individual pitcher prop odds across books |
| Game Odds | `BaseballGameOdds` | Game-level prop odds across books |

## Phase 2 (Planned): Additional Tables

- Batter Clearances (rebuilt from alt view)
- Pitcher Clearances (rebuilt from alt view)  
- Matchups (overhauled)
- DraftKings DFS (new)
- FanDuel DFS (new)

## Directory Structure

```
baseball-props/
├── main.js                      # Entry point (3 tabs for Phase 1)
├── README.md                    # This file
├── shared/
│   ├── config.js                # API config, team abbreviations, breakpoints
│   └── utils.js                 # Shared utility functions
├── components/
│   ├── customMultiSelect.js     # Multi-select dropdown filter (opens ABOVE)
│   ├── minMaxFilter.js          # Min/Max range filter for numeric columns
│   ├── bankrollInput.js         # Bankroll input for Kelly % → $ conversion
│   └── tabManager.js            # Tab switching with lazy initialization
├── tables/
│   ├── baseTable.js             # Base table class (caching, state, AJAX)
│   ├── batterOdds.js            # Batter prop odds table
│   ├── pitcherOdds.js           # Pitcher prop odds table
│   └── gameOdds.js              # Game odds table
└── styles/
    └── tableStyles.js           # All CSS (Webflow-compatible dual injection)
```

## Setup

### HTML

```html
<div id="batter-table"></div>
```

### Include Tabulator

```html
<link href="https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator.min.css" rel="stylesheet">
<script src="https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min.js"></script>
```

### Include Scripts

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/baseball-props@main/main.js"></script>
```

## Features (Matching NBA Version)

### Column Layout
- `widthGrow: 0` + `minWidth` on all columns (auto-fit to content)
- `layout: "fitData"` — table width = sum of column widths
- Desktop: dynamic width calculation with scrollbar reservation
- Mobile: frozen Name/Matchup column with horizontal scroll

### Filters
- **Text search**: Name column (free-text input)
- **Multi-select dropdown**: Team, Prop, Label, Book, Matchup (opens ABOVE table)
- **Min/Max range**: All odds columns, Line column
- **Bankroll input**: Bet Size column converts Kelly % to $ amounts

### Formatting
- Odds: +/- prefix (+150, -110)
- EV %: Decimal → percentage (0.052 → 5.2%)
- Kelly %: Decimal → percentage or $ amount with bankroll
- Line: Always 1 decimal place (5.0, 0.5)
- Link: Red "Bet" hyperlink

### Responsive Design
- Mobile (≤768px): 10px font, frozen first column, touch scroll
- Tablet (769-1024px): 11px font, frozen first column
- Desktop (>1024px): 12px font, fit-to-content width

## Column Clusters (Equalized Widths)
- **Odds cluster**: Book Odds, Median Odds, Best Odds → same width
- **EV/Kelly cluster**: EV %, Bet Size → same width

## Supabase Column Names

### Batter Prop Odds
`Batter Matchup`, `Batter Team`, `Batter Name`, `Batter Prop Type`, `Batter Over/Under`, `Batter Prop Line`, `Batter Book`, `Batter Prop Odds`, `Batter Median Odds`, `Batter Best Odds`, `Batter Best Odds Books`, `EV %`, `Quarter Kelly %`, `Link`

### Pitcher Prop Odds
`Pitcher Matchup`, `Pitcher Team`, `Pitcher Name`, `Pitcher Prop Type`, `Pitcher Over/Under`, `Pitcher Prop Line`, `Pitcher Book`, `Pitcher Prop Odds`, `Pitcher Median Odds`, `Pitcher Best Odds`, `Pitcher Best Odds Books`, `EV %`, `Quarter Kelly %`, `Link`

### Game Odds
`Game Matchup`, `Game Prop Type`, `Game Label`, `Game Line`, `Game Book`, `Game Odds`, `Game Median Odds`, `Game Best Odds`, `Game Best Odds Books`, `EV %`, `Quarter Kelly %`, `Link`

### Hidden Columns (in Supabase but not displayed)
`True Odds Source`, `True Implied Prob`, `True Odds`, `Kelly %`

## Debugging

```javascript
window.tableDebug.getTables()        // All table instances
window.tableDebug.getGlobalState()   // Expanded row state
window.tableDebug.clearGlobalState() // Clear state
window.tableDebug.getTabManager()    // Tab manager instance
```

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | ≤768px | Frozen column, 10px font, touch scroll |
| Tablet | 769-1024px | Frozen column, 11px font |
| Desktop | >1024px | Fit-to-content, 12px font, vertical scrollbar |
