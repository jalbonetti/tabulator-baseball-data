// main.js - Baseball Props Table System
// Phase 1: Batter Odds, Pitcher Odds, Game Odds
// Simplified to match CBB repository pattern exactly

import { injectStyles } from './styles/tableStyles.js';
import { BatterOddsTable } from './tables/batterOdds.js';
import { PitcherOddsTable } from './tables/pitcherOdds.js';
import { GameOddsTable } from './tables/gameOdds.js';
import { TabManager } from './components/tabManager.js';

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing baseball table system");
    
    injectStyles();
    
    const existingTable = document.getElementById('batter-table');
    if (!existingTable) {
        console.log("No batter-table element found - cannot proceed");
        return;
    }

    console.log("Found batter-table element, creating structure...");

    try {
        createTableStructure(existingTable);
        
        const tableInstances = {
            table0: new BatterOddsTable("#batter-odds-table"),
            table1: new PitcherOddsTable("#pitcher-odds-table"),
            table2: new GameOddsTable("#game-odds-table")
        };
        
        const tabManager = new TabManager(tableInstances);
        window.tabManager = tabManager;
        window.baseballTables = tableInstances;
        
        console.log("Baseball table system initialized successfully!");
        
    } catch (error) {
        console.error("Error initializing baseball table system:", error);
    }
});

function createTableStructure(existingTable) {
    const tabWrapper = document.createElement('div');
    tabWrapper.className = 'table-wrapper';
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.innerHTML = `
        <div class="tab-buttons">
            <button class="tab-button active" data-tab="table0">Batter Odds</button>
            <button class="tab-button" data-tab="table1">Pitcher Odds</button>
            <button class="tab-button" data-tab="table2">Game Odds</button>
        </div>
    `;
    
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    
    // Table 0 - Batter Odds (active)
    const t0 = document.createElement('div');
    t0.className = 'table-container active-table';
    t0.id = 'table0-container';
    const t0inner = document.createElement('div');
    t0inner.id = 'batter-odds-table';
    t0.appendChild(t0inner);
    tablesContainer.appendChild(t0);
    
    // Table 1 - Pitcher Odds
    const t1 = document.createElement('div');
    t1.className = 'table-container inactive-table';
    t1.id = 'table1-container';
    t1.style.display = 'none';
    const t1inner = document.createElement('div');
    t1inner.id = 'pitcher-odds-table';
    t1.appendChild(t1inner);
    tablesContainer.appendChild(t1);
    
    // Table 2 - Game Odds
    const t2 = document.createElement('div');
    t2.className = 'table-container inactive-table';
    t2.id = 'table2-container';
    t2.style.display = 'none';
    const t2inner = document.createElement('div');
    t2inner.id = 'game-odds-table';
    t2.appendChild(t2inner);
    tablesContainer.appendChild(t2);
    
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    if (existingTable.parentElement) {
        existingTable.parentElement.insertBefore(tabWrapper, existingTable);
        existingTable.style.display = 'none';
    } else {
        document.body.appendChild(tabWrapper);
    }
    
    console.log("DOM structure created");
}
