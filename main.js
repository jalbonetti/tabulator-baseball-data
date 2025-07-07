// main.js - Diagnostic version
console.log('Main.js loading...');

import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { PitcherClearancesTable } from './tables/pitcherClearancesTable.js';
import { PitcherClearancesAltTable } from './tables/pitcherClearancesAltTable.js';
import { ModBatterStatsTable } from './tables/modBatterStats.js';
import { ModPitcherStatsTable } from './tables/modPitcherStats.js';
import { TabManager } from './components/tabManager.js';
import { injectStyles } from './styles/tableStyles.js';

// Try to import CombinedMatchupsTable with error handling
let CombinedMatchupsTable;
try {
    const module = await import('./tables/combinedMatchupsTable.js');
    CombinedMatchupsTable = module.CombinedMatchupsTable;
    console.log('CombinedMatchupsTable imported successfully');
} catch (error) {
    console.error('Failed to import CombinedMatchupsTable:', error);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages: DOM ready, initializing modular Tabulator functionality...');

    try {
        // Inject styles
        injectStyles();
        console.log('Styles injected');

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
        console.log('Tab manager created');

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

        // Create combined matchups table element
        var combinedMatchupsElement = document.createElement('div');
        combinedMatchupsElement.id = 'combined-matchups-table';

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

        // Add combined matchups table container
        var table7Container = document.createElement('div');
        table7Container.className = 'table-container inactive-table';
        table7Container.id = 'table7-container';
        table7Container.style.cssText = 'width: 100%; display: none;';
        table7Container.appendChild(combinedMatchupsElement);

        // Add to tables container
        var tablesContainer = document.querySelector('.tables-container');
        if (tablesContainer) {
            tablesContainer.appendChild(table3Container);
            tablesContainer.appendChild(table4Container);
            tablesContainer.appendChild(table5Container);
            tablesContainer.appendChild(table6Container);
            tablesContainer.appendChild(table7Container);
            console.log('All table containers added to DOM');
        } else {
            console.error('Tables container not found!');
        }

        // Initialize all tables
        console.log('Initializing tables...');
        
        const table1 = new BatterClearancesTable("#batter-table");
        console.log('Table 1 created');
        
        const table2 = new BatterClearancesAltTable("#batter-table-alt");
        console.log('Table 2 created');
        
        const table3 = new PitcherClearancesTable("#pitcher-table");
        console.log('Table 3 created');
        
        const table4 = new PitcherClearancesAltTable("#pitcher-table-alt");
        console.log('Table 4 created');
        
        const table5 = new ModBatterStatsTable("#mod-batter-stats-table");
        console.log('Table 5 created');
        
        const table6 = new ModPitcherStatsTable("#mod-pitcher-stats-table");
        console.log('Table 6 created');
        
        let table7;
        if (CombinedMatchupsTable) {
            table7 = new CombinedMatchupsTable("#combined-matchups-table");
            console.log('Table 7 created');
        } else {
            console.warn('CombinedMatchupsTable not available, skipping table 7');
        }

        table1.initialize();
        console.log('Table 1 initialized');
        
        table2.initialize();
        console.log('Table 2 initialized');
        
        table3.initialize();
        console.log('Table 3 initialized');
        
        table4.initialize();
        console.log('Table 4 initialized');
        
        table5.initialize();
        console.log('Table 5 initialized');
        
        table6.initialize();
        console.log('Table 6 initialized');
        
        if (table7) {
            table7.initialize();
            console.log('Table 7 initialized');
        }

        // Update tab manager with table instances
        tabManager.tables = {
            table1: table1,
            table2: table2,
            table3: table3,
            table4: table4,
            table5: table5,
            table6: table6,
            table7: table7
        };

        console.log('All tables initialized successfully');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        console.error('Stack trace:', error.stack);
    }
});
