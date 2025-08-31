// main.js - UPDATED WITH MATCHUPS TABLE INTEGRATION - ALL ISSUES FIXED
import { injectStyles } from './styles/tableStyles.js';
import { MatchupsTable } from './tables/combinedMatchupsTable.js';
import { BatterClearancesTable } from './tables/batterClearancesTable.js';
import { BatterClearancesAltTable } from './tables/batterClearancesAltTable.js';
import { PitcherClearancesTable } from './tables/pitcherClearancesTable.js';
import { PitcherClearancesAltTable } from './tables/pitcherClearancesAltTable.js';
import { BatterStatsTable } from './tables/batterStatsTable.js';
import { PitcherStatsTable } from './tables/pitcherStatsTable.js';
import { TabManager } from './components/tabManager.js';

// Global state for expanded rows - shared across all tables
window.globalExpandedState = window.globalExpandedState || new Map();

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - initializing enhanced table system with matchups fixes");
    
    // Inject styles first
    injectStyles();
    
    // Initialize global state management
    initializeGlobalState();
    
    // Table instances storage
    const tableInstances = {};
    
    try {
        // FIXED: Initialize Matchups table with proper state management
        if (document.getElementById('table0')) {
            console.log("Initializing Matchups table with all fixes...");
            const matchupsTable = new MatchupsTable('#table0');
            
            // Add enhanced state management methods
            enhanceTableInstance(matchupsTable);
            
            matchupsTable.initialize();
            tableInstances.matchups = matchupsTable;
            
            console.log("Matchups table initialized with state preservation");
        }
        
        // Initialize other tables with existing working state management
        if (document.getElementById('table1')) {
            console.log("Initializing Batter Clearances table...");
            const batterClearancesTable = new BatterClearancesTable('#table1');
            enhanceTableInstance(batterClearancesTable);
            batterClearancesTable.initialize();
            tableInstances.batterClearances = batterClearancesTable;
        }
        
        if (document.getElementById('table2')) {
            console.log("Initializing Batter Clearances Alt table...");
            const batterClearancesAltTable = new BatterClearancesAltTable('#table2');
            enhanceTableInstance(batterClearancesAltTable);
            batterClearancesAltTable.initialize();
            tableInstances.batterClearancesAlt = batterClearancesAltTable;
        }
        
        if (document.getElementById('table3')) {
            console.log("Initializing Pitcher Clearances table...");
            const pitcherClearancesTable = new PitcherClearancesTable('#table3');
            enhanceTableInstance(pitcherClearancesTable);
            pitcherClearancesTable.initialize();
            tableInstances.pitcherClearances = pitcherClearancesTable;
        }
        
        if (document.getElementById('table4')) {
            console.log("Initializing Pitcher Clearances Alt table...");
            const pitcherClearancesAltTable = new PitcherClearancesAltTable('#table4');
            enhanceTableInstance(pitcherClearancesAltTable);
            pitcherClearancesAltTable.initialize();
            tableInstances.pitcherClearancesAlt = pitcherClearancesAltTable;
        }
        
        if (document.getElementById('table5')) {
            console.log("Initializing Batter Stats table...");
            const batterStatsTable = new BatterStatsTable('#table5');
            enhanceTableInstance(batterStatsTable);
            batterStatsTable.initialize();
            tableInstances.batterStats = batterStatsTable;
        }
        
        if (document.getElementById('table6')) {
            console.log("Initializing Pitcher Stats table...");
            const pitcherStatsTable = new PitcherStatsTable('#table6');
            enhanceTableInstance(pitcherStatsTable);
            pitcherStatsTable.initialize();
            tableInstances.pitcherStats = pitcherStatsTable;
        }
        
        // Initialize tab manager after all tables are created
        console.log("Initializing tab manager with enhanced state management...");
        const tabManager = new TabManager();
        const tableMap = {
            'table0': tableInstances.matchups,
            'table1': tableInstances.batterClearances,
            'table2': tableInstances.batterClearancesAlt,
            'table3': tableInstances.pitcherClearances,
            'table4': tableInstances.pitcherClearancesAlt,
            'table5': tableInstances.batterStats,
            'table6': tableInstances.pitcherStats
        };
        
        tabManager.initialize(tableMap);
        window.tabManager = tabManager;
        
        // FIXED: Ensure matchups table integrates properly with tab manager
        setupMatchupsTableIntegration(tableInstances.matchups, tabManager);
        
        console.log("All tables initialized successfully with state preservation");
        
    } catch (error) {
        console.error("Error initializing tables:", error);
    }
});

// FIXED: Setup specific integration for matchups table with tab manager
function setupMatchupsTableIntegration(matchupsTable, tabManager) {
    if (!matchupsTable) return;
    
    console.log("Setting up matchups table integration with tab manager");
    
    // Hook into tab manager's tab switching for matchups table
    const originalSwitchTab = tabManager.switchTab;
    if (originalSwitchTab) {
        tabManager.switchTab = function(targetTab) {
            // Save matchups table state when switching away from it
            if (this.currentActiveTab === 'table0' && matchupsTable) {
                console.log("Saving matchups table state before tab switch");
                matchupsTable.saveState();
            }
            
            // Call original switch tab
            const result = originalSwitchTab.call(this, targetTab);
            
            // Restore matchups table state when switching to it
            if (targetTab === 'table0' && matchupsTable) {
                console.log("Restoring matchups table state after tab switch");
                setTimeout(() => {
                    matchupsTable.restoreState();
                    if (matchupsTable.table) {
                        matchupsTable.table.redraw();
                    }
                }, 150);
            }
            
            return result;
        };
    }
    
    // Add matchups-specific event handlers
    if (matchupsTable.table) {
        matchupsTable.table.on("dataLoaded", () => {
            console.log("Matchups data loaded - checking for state restoration");
            if (matchupsTable.expandedRowsCache.size > 0 || matchupsTable.expandedRowsSet.size > 0) {
                setTimeout(() => {
                    matchupsTable.restoreState();
                }, 200);
            }
        });
    }
}

function initializeGlobalState() {
    // Initialize global expanded state if it doesn't exist
    if (!window.globalExpandedState) {
        window.globalExpandedState = new Map();
        console.log("Initialized global expanded state");
    }
    
    // Initialize global state management functions
    window.getGlobalExpandedState = function() {
        return window.globalExpandedState;
    };
    
    window.setGlobalExpandedState = function(state) {
        window.globalExpandedState = state;
    };
    
    window.clearGlobalExpandedState = function() {
        window.globalExpandedState.clear();
        console.log("Cleared global expanded state");
    };
}

function enhanceTableInstance(tableInstance) {
    if (!tableInstance) return;
    
    console.log(`Enhancing table instance: ${tableInstance.elementId}`);
    
    // Ensure global state access methods exist
    if (!tableInstance.getGlobalState) {
        tableInstance.getGlobalState = function() {
            if (!window.globalExpandedState) {
                window.globalExpandedState = new Map();
            }
            return window.globalExpandedState;
        };
    }
    
    if (!tableInstance.setGlobalState) {
        tableInstance.setGlobalState = function(state) {
            window.globalExpandedState = state;
        };
    }
    
    // Initialize state management properties if they don't exist
    if (!tableInstance.expandedRowsCache) {
        tableInstance.expandedRowsCache = new Set();
    }
    
    if (!tableInstance.expandedRowsSet) {
        tableInstance.expandedRowsSet = new Set();
    }
    
    if (!tableInstance.expandedRowsMetadata) {
        tableInstance.expandedRowsMetadata = new Map();
    }
    
    if (!tableInstance.temporaryExpandedRows) {
        tableInstance.temporaryExpandedRows = new Set();
    }
    
    if (!tableInstance.lastScrollPosition) {
        tableInstance.lastScrollPosition = 0;
    }
    
    // Store original redraw method
    const originalRedraw = tableInstance.redraw ? 
        tableInstance.redraw.bind(tableInstance) : null;
    
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
                    
                    if (this.expandedRowsCache.has(id)) {
                        if (!data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            
                            setTimeout(() => {
                                row.reformat();
                                
                                // Update expander icon for supported tables
                                setTimeout(() => {
                                    const cells = row.getCells();
                                    const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                                    
                                    for (let field of nameFields) {
                                        const nameCell = cells.find(cell => cell.getField() === field);
                                        if (nameCell) {
                                            const cellElement = nameCell.getElement();
                                            const expander = cellElement.querySelector('.row-expander');
                                            if (expander) {
                                                expander.innerHTML = "−";
                                            }
                                            break;
                                        }
                                    }
                                }, 50);
                            }, 100);
                        }
                    }
                });
            }
        };
    }
    
    // Add saveTemporaryExpandedState if not exists
    if (!tableInstance.saveTemporaryExpandedState) {
        tableInstance.saveTemporaryExpandedState = function() {
            this.temporaryExpandedRows.clear();
            if (this.table) {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    if (data._expanded) {
                        const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                        this.temporaryExpandedRows.add(id);
                    }
                });
            }
            console.log(`Temporarily saved ${this.temporaryExpandedRows.size} expanded rows for ${this.elementId}`);
        };
    }
    
    // Add restoreTemporaryExpandedState if not exists
    if (!tableInstance.restoreTemporaryExpandedState) {
        tableInstance.restoreTemporaryExpandedState = function() {
            if (this.temporaryExpandedRows.size > 0 && this.table) {
                console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily expanded rows for ${this.elementId}`);
                
                setTimeout(() => {
                    const rows = this.table.getRows();
                    rows.forEach(row => {
                        const data = row.getData();
                        const id = this.generateRowId ? this.generateRowId(data) : JSON.stringify(data);
                        
                        if (this.temporaryExpandedRows.has(id) && !data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            row.reformat();
                        }
                    });
                }, 100);
            }
        };
    }
    
    // Add generateRowId if not exists
    if (!tableInstance.generateRowId) {
        tableInstance.generateRowId = function(data) {
            const fields = [];
            
            // Matchups table ID generation
            if (data["Matchup Game ID"] !== undefined) {
                return `matchup_${data["Matchup Game ID"]}`;
            }
            
            // Batter table ID generation
            if (data["Batter Name"]) {
                fields.push(data["Batter Name"]);
                if (data["Batter Team"]) fields.push(data["Batter Team"]);
                if (data["Batter Prop Type"]) fields.push(data["Batter Prop Type"]);
                if (data["Batter Prop Value"]) fields.push(data["Batter Prop Value"]);
                if (data["Batter Prop Split ID"]) fields.push(data["Batter Prop Split ID"]);
                if (data["Batter Stat Type"]) fields.push(data["Batter Stat Type"]);
                return `batter_${fields.join('_')}`;
            }
            
            // Pitcher table ID generation
            if (data["Pitcher Name"]) {
                fields.push(data["Pitcher Name"]);
                if (data["Pitcher Team"]) fields.push(data["Pitcher Team"]);
                if (data["Pitcher Prop Type"]) fields.push(data["Pitcher Prop Type"]);
                if (data["Pitcher Prop Value"]) fields.push(data["Pitcher Prop Value"]);
                if (data["Pitcher Prop Split ID"]) fields.push(data["Pitcher Prop Split ID"]);
                if (data["Pitcher Stat Type"]) fields.push(data["Pitcher Stat Type"]);
                return `pitcher_${fields.join('_')}`;
            }
            
            // Fallback ID generation
            const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
            return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
        };
    }
    
    console.log(`Enhanced table instance: ${tableInstance.elementId} with complete state management`);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error in table system:', e.error);
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.tabManager && window.tabManager.tables) {
        Object.values(window.tabManager.tables).forEach(table => {
            if (table && table.table) {
                table.table.redraw();
            }
        });
    }
});

// Export for debugging
window.tableDebug = {
    getGlobalState: () => window.globalExpandedState,
    clearGlobalState: () => {
        window.globalExpandedState.clear();
        console.log("Global state cleared");
    },
    logState: () => {
        console.log("Current global state:", Array.from(window.globalExpandedState.entries()));
    }
};

console.log("Enhanced table system with matchups fixes loaded successfully");
