// main.js
import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { PitcherClearancesTable } from './tables/pitcherClearancesTable.js';
import { PitcherClearancesAltTable } from './tables/pitcherClearancesAltTable.js';
import { ModBatterStatsTable } from './tables/modBatterStats.js';
import { ModPitcherStatsTable } from './tables/modPitcherStats.js';
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

    // Create pitcher table elements
    var pitcherTableElement = document.createElement('div');
    pitcherTableElement.id = 'pitcher-table';
    
    var pitcherTableAltElement = document.createElement('div');
    pitcherTableAltElement.id = 'pitcher-table-alt';

    // Create mod batter stats table element
    var modBatterStatsElement = document.createElement('div');
    modBatterStatsElement.id = 'mod-batter-stats-table';

    // Create mod pitcher stats table element
    var modPitcherStatsElement = document.createElement('div');
    modPitcherStatsElement.id = 'mod-pitcher-stats-table';

    // Add pitcher tables to the DOM (hidden initially)
    var table3Container = document.createElement('div');
    table3Container.className = 'table-container inactive-table';
    table3Container.id = 'table3-container';
    table3Container.style.cssText = 'width: 100%; display: none;';
    table3Container.appendChild(pitcherTableElement);

    var table4Container = document.createElement('div');
    table4Container.className = 'table-container inactive-table';
    table4Container.id = 'table4-container';
    table4Container.style.cssText = 'width: 100%; display: none;';
    table4Container.appendChild(pitcherTableAltElement);

    // Add mod batter stats table container
    var table5Container = document.createElement('div');
    table5Container.className = 'table-container inactive-table';
    table5Container.id = 'table5-container';
    table5Container.style.cssText = 'width: 100%; display: none;';
    table5Container.appendChild(modBatterStatsElement);

    // Add mod pitcher stats table container
    var table6Container = document.createElement('div');
    table6Container.className = 'table-container inactive-table';
    table6Container.id = 'table6-container';
    table6Container.style.cssText = 'width: 100%; display: none;';
    table6Container.appendChild(modPitcherStatsElement);

    // Add to tables container
    var tablesContainer = document.querySelector('.tables-container');
    if (tablesContainer) {
        tablesContainer.appendChild(table3Container);
        tablesContainer.appendChild(table4Container);
        tablesContainer.appendChild(table5Container);
        tablesContainer.appendChild(table6Container);
    }

    // Initialize all tables
    const table1 = new BatterClearancesTable("#batter-table");
    const table2 = new BatterClearancesAltTable("#batter-table-alt");
    const table3 = new PitcherClearancesTable("#pitcher-table");
    const table4 = new PitcherClearancesAltTable("#pitcher-table-alt");
    const table5 = new ModBatterStatsTable("#mod-batter-stats-table");
    const table6 = new ModPitcherStatsTable("#mod-pitcher-stats-table");

    table1.initialize();
    table2.initialize();
    table3.initialize();
    table4.initialize();
    table5.initialize();
    table6.initialize();

    // Update tab manager with table instances
    tabManager.tables = {
        table1: table1,
        table2: table2,
        table3: table3,
        table4: table4,
        table5: table5,
        table6: table6
    };

    console.log('All tables initialized successfully');
});
