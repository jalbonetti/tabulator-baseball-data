// main.js - ENHANCED VERSION WITH SERVICE WORKER
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
import { SW_CONFIG } from './shared/config.js';

// Register Service Worker for advanced caching
async function registerServiceWorker() {
    if ('serviceWorker' in navigator && SW_CONFIG.enabled) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered successfully:', registration);
            
            // Check for updates every hour
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
            
            // Send periodic cleanup message
            setInterval(() => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'CLEANUP_CACHE'
                    });
                }
            }, 30 * 60 * 1000); // Every 30 minutes
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Check if data needs refresh based on cache age
async function checkDataFreshness() {
    if ('caches' in window) {
        try {
            const cache = await caches.open('tabulator-api-v1');
            const keys = await cache.keys();
            
            for (const request of keys) {
                const response = await cache.match(request);
                const cachedAt = response.headers.get('sw-cached-at');
                
                if (cachedAt) {
                    const age = Date.now() - parseInt(cachedAt);
                    
                    // If cache is older than 15 minutes, trigger background refresh
                    if (age > 15 * 60 * 1000) {
                        console.log('Cache is stale, triggering refresh for:', request.url);
                        fetch(request.url).catch(() => {}); // Silent background refresh
                    }
                }
            }
        } catch (error) {
            console.error('Error checking cache freshness:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('GitHub Pages: DOM ready, initializing modular Tabulator functionality with enhanced caching...');

    // Register Service Worker first
    await registerServiceWorker();

    // Inject styles
    injectStyles();

    // Check data freshness
    checkDataFreshness();

    // Check if required element exists
    var tableElement = document.getElementById('batter-table');
    if (!tableElement) {
        console.error("Element 'batter-table' not found!");
        return;
    } else {
        console.log("Found batter-table element, proceeding with initialization...");
    }

    // Create table instances but DON'T initialize them yet (lazy loading)
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

    // Initialize tab manager with table instances
    const tabManager = new TabManager({
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
    });

    // Export for debugging - MOVED INSIDE THE FUNCTION WHERE tabManager IS DEFINED
    window.tabManager = tabManager;

    // Create tab structure
    tabManager.createTabStructure(tableElement);

    // Create all table elements but don't initialize tables yet
    createTableElements();

    // Start periodic cleanup of unused tabs
    tabManager.startPeriodicCleanup();

    // Add performance monitoring
    if (window.performance && window.performance.mark) {
        window.performance.mark('tables-initialized');
        
        // Log performance metrics
        window.performance.measure('init-time', 'navigationStart', 'tables-initialized');
        const measure = window.performance.getEntriesByName('init-time')[0];
        console.log(`Tables initialized in ${measure.duration.toFixed(2)}ms`);
    }

    // Monitor memory usage for large datasets
    if (performance.memory) {
        setInterval(() => {
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            console.log(`Memory usage: ${used}MB / ${total}MB`);
        }, 30000); // Every 30 seconds
    }

    // Add global error handler for network issues
    window.addEventListener('online', () => {
        console.log('Connection restored - refreshing stale data');
        checkDataFreshness();
    });

    window.addEventListener('offline', () => {
        console.log('Connection lost - using cached data');
    });

    console.log('Enhanced lazy loading setup complete - tables will load on demand with advanced caching');
});

function createTableElements() {
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

    // Add matchups table container
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
}

// Preload data for next likely tab (predictive loading)
window.addEventListener('mouseover', function(e) {
    if (e.target.classList.contains('tab-button')) {
        const tabId = e.target.dataset.tab;
        const tabManager = window.tabManager;
        
        if (tabManager && !tabManager.tabInitialized[tabId]) {
            console.log(`Pre-warming tab: ${tabId}`);
            // Pre-fetch data but don't fully initialize
            const table = tabManager.tables[tabId];
            if (table && table.endpoint && !table.dataLoaded) {
                // This will trigger the data fetch and caching
                table.getBaseConfig();
            }
        }
    }
});
