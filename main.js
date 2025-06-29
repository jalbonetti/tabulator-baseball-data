// main.js
import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { TabManager } from './components/tabManager.js';
import { injectStyles } from './styles/tableStyles.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages: DOM ready, initializing modular Tabulator functionality...');

    // Inject styles
    injectStyles();

    // Check if required element exists
    var tableElement = document.getElementById('batter-table');
    if (!tableElement) {
        console.error("Element 'batter-table' not found!");
        return;
    } else {
        console.log("Found batter-table element, proceeding with initialization...");
    }

    // Initialize tab manager and create structure
    const tabManager = new TabManager({});
    tabManager.createTabStructure(tableElement);

    // Initialize tables
    const table1 = new BatterClearancesTable("#batter-table");
    const table2 = new BatterClearancesAltTable("#batter-table-alt");

    table1.initialize();
    table2.initialize();

    // Update tab manager with table instances
    tabManager.tables = {
        table1: table1,
        table2: table2
    };

    console.log('All tables initialized successfully');
});
