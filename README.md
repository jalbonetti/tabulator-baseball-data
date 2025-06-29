# Modular Tabulator Tables - Repository Structure

## Overview
This project has been refactored from a single monolithic script into a modular, maintainable structure with separated concerns for each table implementation.

## Directory Structure

```
your-website-repo/
├── index.html
├── main.js
├── shared/
│   ├── config.js
│   └── utils.js
├── components/
│   ├── customMultiSelect.js
│   └── tabManager.js
├── tables/
│   ├── baseTable.js
│   ├── batterClearancesTable.js
│   └── batterClearancesAltTable.js
└── styles/
    └── tableStyles.js
```

## Module Descriptions

### Main Application (`main.js`)
- Entry point for the application
- Initializes both tables and tab manager
- Injects styles into the page
- Sets up DOM structure

### Shared Modules

#### `shared/config.js`
- API configuration (base URL, headers)
- Team name mappings
- Other shared constants

#### `shared/utils.js`
- Utility functions used across tables:
  - `getOpponentTeam()` - Extracts opponent team from matchup string
  - `getSwitchHitterVersus()` - Determines handedness matchup
  - `formatPercentage()` - Formats decimal to percentage
  - `formatClearancePercentage()` - Formats clearance percentage

### Components

#### `components/customMultiSelect.js`
- Custom multi-select dropdown component for column filtering
- Handles all dropdown logic and filter application
- Reusable across all table columns

#### `components/tabManager.js`
- Manages tab switching between tables
- Creates tab UI structure
- Handles table visibility and redraw on tab switch

### Table Modules

#### `tables/baseTable.js`
- Abstract base class for all tables
- Provides common functionality:
  - API configuration
  - Row expansion/collapse
  - Name and team formatters
  - Subtable creation
  - Common event handlers

#### `tables/batterClearancesTable.js`
- Extends BaseTable
- Implements Table 1 (Batter Prop Clearances)
- Defines specific columns and data structure
- Creates detailed subtables with seasonal/split data

#### `tables/batterClearancesAltTable.js`
- Extends BaseTable
- Implements Table 2 (Alternative View)
- Different column structure with time/location splits
- Progressive loading enabled
- Simplified subtable view

### Styles

#### `styles/tableStyles.js`
- All CSS styles for tables and components
- Injected dynamically into the page
- Includes responsive design and hover states

## Adding New Tables

To add a new table, follow this template:

1. Create a new file in `tables/` directory:

```javascript
// tables/newTable.js
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class NewTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'YourAPIEndpoint');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            initialSort: [
                // Your sort configuration
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
    }

    getColumns() {
        return [
            // Your column definitions
        ];
    }

    createSubtable2(container, data) {
        // Your subtable implementation
    }
}
```

2. Update `main.js` to import and initialize:

```javascript
import { NewTable } from './tables/newTable.js';

// In DOMContentLoaded:
const newTable = new NewTable("#new-table-element");
newTable.initialize();
```

3. Add a new tab button in `tabManager.js` if needed.

## API Integration

All tables use the Supabase REST API with configuration stored in `shared/config.js`. To update API credentials or endpoints:

1. Edit `shared/config.js`
2. Update the `API_CONFIG` object
3. Add new endpoints as needed

## Customization

### Adding New Filters
1. Create new filter component in `components/`
2. Import in your table module
3. Use in column definition's `headerFilter` property

### Modifying Styles
1. Edit `styles/tableStyles.js`
2. Add new CSS rules
3. Styles are automatically injected on page load

### Adding New Utility Functions
1. Add to `shared/utils.js`
2. Export the function
3. Import where needed

## Benefits of This Structure

1. **Maintainability**: Each table is self-contained
2. **Reusability**: Shared components and utilities
3. **Scalability**: Easy to add new tables
4. **Testing**: Each module can be tested independently
5. **Performance**: Only load what's needed
6. **Version Control**: Better diff tracking

## Migration Notes

When migrating from the monolithic script:

1. The original functionality is preserved
2. No changes to the HTML structure required
3. API calls remain the same
4. All features (filtering, sorting, expansion) work identically

## Future Enhancements

Consider these improvements:

1. **TypeScript**: Add type definitions
2. **Build Process**: Use webpack/rollup for bundling
3. **Testing**: Add Jest tests for utilities
4. **State Management**: Add centralized state for filters
5. **Lazy Loading**: Load tables on demand
6. **Caching**: Cache API responses

## Dependencies

- Tabulator.js (loaded from CDN in HTML)
- No other external dependencies

## Browser Support

- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (latest versions)

## Contributing

When adding new features:

1. Follow the existing module pattern
2. Keep functions small and focused
3. Add comments for complex logic
4. Update this README with new modules
