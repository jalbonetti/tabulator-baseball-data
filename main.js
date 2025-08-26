// main.js - COMPLETE FIXED VERSION WITH ALL ERROR CORRECTIONS
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
import { TabManager, TAB_STYLES } from './components/tabManager.js';
import { injectStyles } from './styles/tableStyles.js';
import { SW_CONFIG } from './shared/config.js';

// Register Service Worker for advanced caching
async function registerServiceWorker() {
    if ('serviceWorker' in navigator && SW_CONFIG.enabled) {
        try {
            // Try multiple paths for service worker
            const paths = [
                '/service-worker.js',
                './service-worker.js',
                'service-worker.js'
            ];
            
            let registered = false;
            for (const path of paths) {
                try {
                    const registration = await navigator.serviceWorker.register(path, {
                        scope: '/'
                    });
                    
                    console.log('Service Worker registered successfully:', registration);
                    registered = true;
                    
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
                    
                    break; // Successfully registered, exit loop
                } catch (err) {
                    console.log(`Failed to register service worker at ${path}:`, err.message);
                }
            }
            
            if (!registered) {
                console.log('Service Worker registration skipped - file not found at any path');
            }
            
        } catch (error) {
            console.log('Service Worker registration failed:', error);
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

    // Register Service Worker first (with error handling)
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

    // Export for debugging - MUST BE INSIDE DOMContentLoaded
    window.tabManager = tabManager;

    // Ensure all tables have the required state preservation methods
    ensureStateMethods(table0);
    ensureStateMethods(table1);
    ensureStateMethods(table2);
    ensureStateMethods(table3);
    ensureStateMethods(table4);
    ensureStateMethods(table5);
    ensureStateMethods(table6);
    ensureStateMethods(table7);
    ensureStateMethods(table8);
    ensureStateMethods(table9);

    // Create tab structure
    tabManager.createTabStructure(tableElement);

    // Create all table elements but don't initialize tables yet
    createTableElements();

    // NO LONGER CALLING startPeriodicCleanup() here - method doesn't exist

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

// Enhanced initialization with immediate responsive scaling
document.addEventListener('DOMContentLoaded', function() {
    // Add this new responsive initialization helper
    initializeResponsiveSystem();
});

function initializeResponsiveSystem() {
    // Create a MutationObserver to watch for table creation
    const tableObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if a table or subrow was added
                        if ((node.classList && (node.classList.contains('tabulator') || 
                            node.classList.contains('subrow-container')))) {
                            // Apply scaling immediately
                            applyImmediateScaling(node);
                        }
                        
                        // Also check children
                        const tables = node.querySelectorAll('.tabulator');
                        const subrows = node.querySelectorAll('.subrow-container');
                        
                        tables.forEach(table => applyImmediateScaling(table));
                        subrows.forEach(subrow => applyImmediateScaling(subrow));
                    }
                });
            }
        });
    });
    
    // Start observing the document body for changes
    tableObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Function to apply immediate scaling to new elements
    function applyImmediateScaling(element) {
        const width = window.innerWidth;
        let scale = 1;
        
        if (width <= 767) {
            scale = 0.75;
        } else if (width <= 1199) {
            scale = 0.85;
        }
        
        // Apply scaling based on element type
        if (element.classList.contains('tabulator')) {
            const container = element.closest('.table-container');
            if (container && scale !== 1) {
                container.style.transform = `scale(${scale})`;
                container.style.transformOrigin = 'top left';
                container.style.width = `${100 / scale}%`;
            }
        } else if (element.classList.contains('subrow-container')) {
            // Subrows inherit parent scaling
            element.style.width = '100%';
            element.style.transition = 'none'; // Remove transition for instant scaling
        }
        
        // Apply appropriate view class
        if (element.classList.contains('tabulator')) {
            if (width <= 767) {
                element.classList.add('mobile-view');
                element.classList.remove('tablet-view', 'desktop-view');
            } else if (width <= 1199) {
                element.classList.add('tablet-view');
                element.classList.remove('mobile-view', 'desktop-view');
            } else {
                element.classList.add('desktop-view');
                element.classList.remove('mobile-view', 'tablet-view');
            }
        }
    }
    
    // Enhanced visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.applyResponsiveScaling) {
            setTimeout(() => {
                window.applyResponsiveScaling();
            }, 100);
        }
    });
    
    // Handle tab switching with immediate scaling
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            // Apply scaling multiple times to ensure it takes effect
            setTimeout(() => {
                if (window.applyResponsiveScaling) {
                    window.applyResponsiveScaling();
                }
            }, 0);
            
            setTimeout(() => {
                if (window.applyResponsiveScaling) {
                    window.applyResponsiveScaling();
                }
            }, 100);
            
            setTimeout(() => {
                if (window.applyResponsiveScaling) {
                    window.applyResponsiveScaling();
                }
            }, 300);
        }
    });
    
    // Performance-optimized scroll handler for subrows
    let scrollTimeout;
    document.addEventListener('scroll', (e) => {
        if (e.target.classList && e.target.classList.contains('tabulator-tableHolder')) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Check if any subrows need scaling adjustment
                const visibleSubrows = e.target.querySelectorAll('.subrow-container');
                if (visibleSubrows.length > 0 && window.applyResponsiveScaling) {
                    window.applyResponsiveScaling();
                }
            }, 150);
        }
    }, true);
    
    // Touch event handler for mobile devices
    let touchTimeout;
    document.addEventListener('touchend', () => {
        clearTimeout(touchTimeout);
        touchTimeout = setTimeout(() => {
            if (window.applyResponsiveScaling) {
                window.applyResponsiveScaling();
            }
        }, 300);
    });
    
    // Ensure tabs never scale
    setInterval(() => {
        const tabContainer = document.querySelector('.tabs-container');
        const tabButtons = document.querySelectorAll('.tab-button');
        
        if (tabContainer) {
            tabContainer.style.transform = 'none';
        }
        
        tabButtons.forEach(button => {
            button.style.transform = 'none';
        });
    }, 1000);
}

// Global function to force responsive update
window.forceResponsiveUpdate = function() {
    // Remove all transforms first
    document.querySelectorAll('.table-container, .subrow-container').forEach(el => {
        el.style.transform = '';
        el.style.width = '';
    });
    
    // Then reapply
    setTimeout(() => {
        if (window.applyResponsiveScaling) {
            window.applyResponsiveScaling();
        }
    }, 50);
};

// Add this to handle page show events (back/forward navigation)
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // Page was restored from cache
        window.forceResponsiveUpdate();
    }
});

// Complete fix - Add this to your main.js to replace the ensureStateMethods function
function ensureStateMethods(tableInstance) {
    // Store original redraw method if exists
    const originalRedraw = tableInstance.redraw ? tableInstance.redraw.bind(tableInstance) : null;
    
    // Override redraw to preserve expanded state
    tableInstance.redraw = function(force) {
        // Save current expanded state before redraw
        const expandedRows = new Set();
        if (this.table) {
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    expandedRows.add(id);
                }
            });
        }
        
        // Call original redraw if it exists
        if (originalRedraw) {
            originalRedraw(force);
        } else if (this.table) {
            this.table.redraw(force);
        }
        
        // Restore expanded state after redraw
        if (expandedRows.size > 0 && this.table) {
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    if (expandedRows.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }, 100);
        }
    };
    
    // Enhanced saveState
    if (!tableInstance.saveState || typeof tableInstance.saveState !== 'function') {
        console.log(`Adding saveState to ${tableInstance.elementId}`);
        
        tableInstance.saveState = function() {
            if (!this.table) return;
            
            console.log(`Saving state for ${this.elementId}`);
            
            // Save scroll position
            const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder) {
                this.lastScrollPosition = tableHolder.scrollTop;
            }
            
            // Initialize caches if they don't exist
            if (!this.expandedRowsCache) this.expandedRowsCache = new Set();
            if (!this.expandedRowsSet) this.expandedRowsSet = new Set();
            if (!this.expandedRowsMetadata) this.expandedRowsMetadata = new Map();
            
            // Clear and rebuild expanded rows cache
            this.expandedRowsCache.clear();
            this.expandedRowsSet.clear();
            
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    this.expandedRowsCache.add(id);
                    this.expandedRowsSet.add(id);
                }
            });
            
            console.log(`State saved: ${this.expandedRowsCache.size} expanded rows`);
        };
    }
    
    // Enhanced restoreState
    if (!tableInstance.restoreState || typeof tableInstance.restoreState !== 'function') {
        console.log(`Adding restoreState to ${tableInstance.elementId}`);
        
        tableInstance.restoreState = function() {
            if (!this.table) return;
            
            console.log(`Restoring state for ${this.elementId}`);
            
            // Restore scroll position
            if (this.lastScrollPosition) {
                const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }
            }
            
            // Restore expanded rows if cache exists
            if (this.expandedRowsCache && this.expandedRowsCache.size > 0) {
                console.log(`Restoring ${this.expandedRowsCache.size} expanded rows`);
                
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                    
                    if (this.expandedRowsCache.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }
        };
    }
}

// Create table elements (moved from global scope)
function createTableElements() {
    // Create elements for table0 (Matchups - now default active)
    var matchupsElement = document.createElement('div');
    matchupsElement.id = 'matchups-table';
    
    var table0Container = document.createElement('div');
    table0Container.className = 'table-container active-table';
    table0Container.id = 'table0-container';
    table0Container.style.cssText = 'width: 100%; display: block;';
    table0Container.appendChild(matchupsElement);

    // Create elements for table3
    var pitcherElement = document.createElement('div');
    pitcherElement.id = 'pitcher-table';
    
    var table3Container = document.createElement('div');
    table3Container.className = 'table-container inactive-table';
    table3Container.id = 'table3-container';
    table3Container.style.cssText = 'width: 100%; display: none;';
    table3Container.appendChild(pitcherElement);

    // Create elements for table4
    var pitcherAltElement = document.createElement('div');
    pitcherAltElement.id = 'pitcher-table-alt';
    
    var table4Container = document.createElement('div');
    table4Container.className = 'table-container inactive-table';
    table4Container.id = 'table4-container';
    table4Container.style.cssText = 'width: 100%; display: none;';
    table4Container.appendChild(pitcherAltElement);

    // Create elements for table5
    var modBatterStatsElement = document.createElement('div');
    modBatterStatsElement.id = 'mod-batter-stats-table';
    
    var table5Container = document.createElement('div');
    table5Container.className = 'table-container inactive-table';
    table5Container.id = 'table5-container';
    table5Container.style.cssText = 'width: 100%; display: none;';
    table5Container.appendChild(modBatterStatsElement);

    // Create elements for table6
    var modPitcherStatsElement = document.createElement('div');
    modPitcherStatsElement.id = 'mod-pitcher-stats-table';
    
    var table6Container = document.createElement('div');
    table6Container.className = 'table-container inactive-table';
    table6Container.id = 'table6-container';
    table6Container.style.cssText = 'width: 100%; display: none;';
    table6Container.appendChild(modPitcherStatsElement);

    // Create elements for table7
    var batterPropsElement = document.createElement('div');
    batterPropsElement.id = 'batter-props-table';
    
    var table7Container = document.createElement('div');
    table7Container.className = 'table-container inactive-table';
    table7Container.id = 'table7-container';
    table7Container.style.cssText = 'width: 100%; display: none;';
    table7Container.appendChild(batterPropsElement);

    // Create elements for table8
    var pitcherPropsElement = document.createElement('div');
    pitcherPropsElement.id = 'pitcher-props-table';
    
    var table8Container = document.createElement('div');
    table8Container.className = 'table-container inactive-table';
    table8Container.id = 'table8-container';
    table8Container.style.cssText = 'width: 100%; display: none;';
    table8Container.appendChild(pitcherPropsElement);

    // Create elements for table9
    var gamePropsElement = document.createElement('div');
    gamePropsElement.id = 'game-props-table';
    
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
