// main.js - UPDATED VERSION WITH FIXED TAB MANAGEMENT
import { MatchupsTable } from './tables/combinedMatchupsTable.js';
import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { PitcherClearancesTable } from './tables/pitcherClearancesTable.js';
import { PitcherClearancesAltTable } from './tables/pitcherClearancesAltTable.js';
import { ModBatterStatsTable } from './tables/modBatterStats.js';
import { ModPitcherStatsTable } from './tables/modPitcherStats.js';
import { BatterPropsTable } from './tables/batterProps.js';
import { PitcherPropsTable } from './tables/pitcherProps.js';
import { GamePropsTable } from './tables/gameProps.js';
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

    // Create matchups table element
    var matchupsTableElement = document.createElement('div');
    matchupsTableElement.id = 'matchups-table';

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

    // Create props table elements
    var batterPropsElement = document.createElement('div');
    batterPropsElement.id = 'batter-props-table';

    var pitcherPropsElement = document.createElement('div');
    pitcherPropsElement.id = 'pitcher-props-table';

    var gamePropsElement = document.createElement('div');
    gamePropsElement.id = 'game-props-table';

    // Add matchups table container - NOW ACTIVE BY DEFAULT
    var table0Container = document.getElementById('table0-container');
    if (!table0Container) {
        table0Container = document.createElement('div');
        table0Container.className = 'table-container active-table';
        table0Container.id = 'table0-container';
        table0Container.style.cssText = 'width: 100%; display: block;';
    }
    table0Container.appendChild(matchupsTableElement);

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

    // Add props table containers
    var table7Container = document.createElement('div');
    table7Container.className = 'table-container inactive-table';
    table7Container.id = 'table7-container';
    table7Container.style.cssText = 'width: 100%; display: none;';
    table7Container.appendChild(batterPropsElement);

    var table8Container = document.createElement('div');
    table8Container.className = 'table-container inactive-table';
    table8Container.id = 'table8-container';
    table8Container.style.cssText = 'width: 100%; display: none;';
    table8Container.appendChild(pitcherPropsElement);

    var table9Container = document.createElement('div');
    table9Container.className = 'table-container inactive-table';
    table9Container.id = 'table9-container';
    table9Container.style.cssText = 'width: 100%; display: none;';
    table9Container.appendChild(gamePropsElement);

    // Add to tables container
    var tablesContainer = document.querySelector('.tables-container');
    if (tablesContainer) {
        // Make sure table0Container is in the DOM
        if (!document.getElementById('table0-container')) {
            tablesContainer.appendChild(table0Container);
        }
        tablesContainer.appendChild(table3Container);
        tablesContainer.appendChild(table4Container);
        tablesContainer.appendChild(table5Container);
        tablesContainer.appendChild(table6Container);
        tablesContainer.appendChild(table7Container);
        tablesContainer.appendChild(table8Container);
        tablesContainer.appendChild(table9Container);
        
        // Set table1 (Batter Clearances) to inactive since Matchups is now default
        var table1Container = document.getElementById('table1-container');
        if (table1Container) {
            table1Container.className = 'table-container inactive-table';
            table1Container.style.display = 'none';
        }
    }

    // Initialize all table instances
    const table0 = new MatchupsTable("#matchups-table");
    const table1 = new BatterClearancesTable("#batter-table");
    const table2 = new BatterClearancesAltTable("#batter-table-alt");
    const table3 = new PitcherClearancesTable("#pitcher-table");
    const table4 = new PitcherClearancesAltTable("#pitcher-table-alt");
    const table5 = new ModBatterStatsTable("#mod-batter-stats-table");
    const table6 = new ModPitcherStatsTable("#mod-pitcher-stats-table");
    const table7 = new BatterPropsTable("#batter-props-table");
    const table8 = new PitcherPropsTable("#pitcher-props-table");
    const table9 = new GamePropsTable("#game-props-table");

    // Initialize all tables
    table0.initialize();
    table1.initialize();
    table2.initialize();
    table3.initialize();
    table4.initialize();
    table5.initialize();
    table6.initialize();
    table7.initialize();
    table8.initialize();
    table9.initialize();

    // Update tab manager with table instances - passing the class instances
    // TabManager will call the redraw method on these instances
    tabManager.tables = {
        table0: table0,
        table1: table1,
        table2: table2,
        table3: table3,
        table4: table4,
        table5: table5,
        table6: table6,
        table7: table7,
        table8: table8,
        table9: table9
    };

    console.log('All tables initialized successfully');
});
