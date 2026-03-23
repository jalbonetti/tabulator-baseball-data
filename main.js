// main.js - Baseball Props Table System
// Phase 1: Batter Odds, Pitcher Odds, Game Odds
// Matching NBA repository architecture

import { injectStyles } from './styles/tableStyles.js';
import { BatterOddsTable } from './tables/batterOdds.js';
import { PitcherOddsTable } from './tables/pitcherOdds.js';
import { GameOddsTable } from './tables/gameOdds.js';
import { TabManager } from './components/tabManager.js';

// Global state for expanded rows - shared across all tables
window.globalExpandedState = window.globalExpandedState || new Map();

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing baseball table system");
    
    // Inject styles first
    injectStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Find the existing batter-table element (Webflow container)
    const existingTable = document.getElementById('batter-table');
    if (!existingTable) {
        console.log("No batter-table element found - cannot proceed");
        return;
    }

    console.log("Found batter-table element, creating structure...");

    try {
        createCompleteTableStructure(existingTable);
        
        console.log("Creating table instances...");
        const tableInstances = createAllTableInstances();
        
        console.log("Initializing TabManager...");
        const tabManager = new TabManager(tableInstances);
        window.tabManager = tabManager;
        
        // Store references globally for debugging
        window.baseballTables = tableInstances;
        
        console.log("✅ Baseball table system initialized successfully!");
        
    } catch (error) {
        console.error("❌ Error initializing baseball table system:", error);
        console.log("Falling back to basic table...");
        try {
            const fallbackTable = new BatterOddsTable('#batter-table');
            fallbackTable.initialize();
            console.log("Fallback table initialized");
        } catch (fallbackError) {
            console.error("Even fallback failed:", fallbackError);
        }
    }
});

function createCompleteTableStructure(existingTable) {
    console.log("Creating complete DOM structure...");
    
    // Create main wrapper
    const tabWrapper = document.createElement('div');
    tabWrapper.className = 'table-wrapper';
    tabWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';
    tabsContainer.innerHTML = `
        <div class="tab-buttons">
            <button class="tab-button active" data-tab="table0">Batter Odds</button>
            <button class="tab-button" data-tab="table1">Pitcher Odds</button>
            <button class="tab-button" data-tab="table2">Game Odds</button>
        </div>
    `;
    
    // Create tables container
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    tablesContainer.style.cssText = 'width: 100%; position: relative;';
    
    tabWrapper.appendChild(tabsContainer);
    tabWrapper.appendChild(tablesContainer);
    
    // Insert into DOM
    if (existingTable && existingTable.parentElement) {
        existingTable.parentElement.insertBefore(tabWrapper, existingTable);
        existingTable.style.display = 'none';
    } else {
        document.body.appendChild(tabWrapper);
    }
    
    // Create table containers
    createAllTableContainers(tablesContainer);
    
    console.log("✅ DOM structure created");
}

function createAllTableContainers(tablesContainer) {
    // Table 0 - Batter Odds (active by default)
    const batterOddsElement = document.createElement('div');
    batterOddsElement.id = 'batter-odds-table';
    const table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    table0Container.appendChild(batterOddsElement);
    tablesContainer.appendChild(table0Container);
    
    // Table 1 - Pitcher Odds
    const pitcherOddsElement = document.createElement('div');
    pitcherOddsElement.id = 'pitcher-odds-table';
    const table1Container = document.createElement('div');
    table1Container.className = 'table-container inactive-table';
    table1Container.id = 'table1-container';
    table1Container.style.cssText = 'width: 100%; display: none;';
    table1Container.appendChild(pitcherOddsElement);
    tablesContainer.appendChild(table1Container);
    
    // Table 2 - Game Odds
    const gameOddsElement = document.createElement('div');
    gameOddsElement.id = 'game-odds-table';
    const table2Container = document.createElement('div');
    table2Container.className = 'table-container inactive-table';
    table2Container.id = 'table2-container';
    table2Container.style.cssText = 'width: 100%; display: none;';
    table2Container.appendChild(gameOddsElement);
    tablesContainer.appendChild(table2Container);
}

function createAllTableInstances() {
    return {
        'table0': new BatterOddsTable('#batter-odds-table'),
        'table1': new PitcherOddsTable('#pitcher-odds-table'),
        'table2': new GameOddsTable('#game-odds-table')
    };
}

function initializeGlobalState() {
    if (!window.globalExpandedState) {
        window.globalExpandedState = new Map();
    }
    
    // Debug tools
    window.tableDebug = {
        getGlobalState: () => window.globalExpandedState,
        clearGlobalState: () => { window.globalExpandedState.clear(); console.log('Global state cleared'); },
        getTables: () => window.baseballTables,
        getTabManager: () => window.tabManager
    };
}
