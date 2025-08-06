// components/tabManager.js - FIXED VERSION WITH PROPER STATE PRESERVATION FOR ALL TABLES
export class TabManager {
    constructor(tables) {
        this.tables = tables; // { table0: tableInstance, table1: tableInstance, ..., table9: tableInstance }
        this.currentActiveTab = 'table0';
        this.scrollPositions = {}; // Store scroll positions for each tab
        this.tableStates = {}; // Store table states for each tab
        this.tabInitialized = {}; // Track which tabs have been initialized
        this.isTransitioning = false; // Prevent rapid tab switching
        this.expandedRowsStates = {}; // Store expanded rows state for each tab
        this.setupTabSwitching();
        
        // Only initialize the first tab
        this.initializeTab(this.currentActiveTab);
    }

    // Lazy initialize a specific tab
    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) {
            return Promise.resolve();
        }
        
        console.log(`Lazy initializing tab: ${tabId}`);
        
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const tableWrapper = this.tables[tabId];
                
                if (tableWrapper && !tableWrapper.isInitialized) {
                    // Initialize the table
                    tableWrapper.initialize();
                    this.tabInitialized[tabId] = true;
                    
                    // Give the table time to render
                    setTimeout(resolve, 100);
                } else {
                    this.tabInitialized[tabId] = true;
                    resolve();
                }
            });
        });
    }

    setupTabSwitching() {
        let switchTimeout;
        
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent rapid switching
                if (this.isTransitioning) {
                    console.log('Tab transition in progress, ignoring click');
                    return;
                }
                
                var targetTab = e.target.dataset.tab;
                
                // Don't switch if already on this tab
                if (targetTab === this.currentActiveTab) {
                    return;
                }
                
                // Clear any pending switch
                if (switchTimeout) {
                    clearTimeout(switchTimeout);
                }
                
                // Debounce tab switching
                switchTimeout = setTimeout(async () => {
                    console.log('Switching to tab:', targetTab);
                    this.isTransitioning = true;
                    
                    // Save current tab state before switching
                    this.saveCurrentTabState();
                    
                    // Update button states immediately for responsive UI
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Hide current tab
                    const currentContainer = document.getElementById(`${this.currentActiveTab}-container`);
                    if (currentContainer) {
                        currentContainer.className = 'table-container inactive-table';
                        currentContainer.style.display = 'none';
                    }
                    
                    // Initialize target tab if needed (lazy loading)
                    await this.initializeTab(targetTab);
                    
                    // Show target tab
                    const targetContainer = document.getElementById(`${targetTab}-container`);
                    if (targetContainer) {
                        targetContainer.className = 'table-container active-table';
                        targetContainer.style.display = 'block';
                        this.currentActiveTab = targetTab;
                        
                        // Restore tab state with improved logic
                        requestAnimationFrame(() => {
                            this.restoreTabState(targetTab);
                            
                            // Clear transition flag after a delay
                            setTimeout(() => {
                                this.isTransitioning = false;
                            }, 300);
                        });
                    } else {
                        this.isTransitioning = false;
                    }
                }, 100); // 100ms debounce
            }
        });
    }

    saveCurrentTabState() {
        const tableWrapper = this.tables[this.currentActiveTab];
        
        if (tableWrapper && tableWrapper.isInitialized) {
            console.log(`Saving state for ${this.currentActiveTab}`);
            
            // Call the table's saveState method if it exists
            if (typeof tableWrapper.saveState === 'function') {
                tableWrapper.saveState();
            }
            
            // Get the actual Tabulator instance
            const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
            if (!table) return;
            
            // Save scroll position
            const tableHolder = table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder) {
                this.scrollPositions[this.currentActiveTab] = tableHolder.scrollTop;
            }
            
            // Save expanded rows with their full data state
            const expandedRows = [];
            const rows = table.getRows();
            
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    // Generate a unique ID for the row
                    let id = this.generateRowId(data);
                    
                    // Store the ID and whether the row has a visible subrow
                    const rowElement = row.getElement();
                    const hasVisibleSubrow = rowElement.querySelector('.subrow-container') !== null;
                    
                    expandedRows.push({
                        id: id,
                        hasSubrow: hasVisibleSubrow,
                        data: data // Store the full data for restoration
                    });
                }
            });
            
            this.expandedRowsStates[this.currentActiveTab] = expandedRows;
            this.tableStates[this.currentActiveTab] = {
                savedAt: Date.now(),
                expandedCount: expandedRows.length
            };
            
            console.log(`Saved state for ${this.currentActiveTab}: ${expandedRows.length} expanded rows`);
        }
    }

    generateRowId(data) {
        // For Matchups table
        if (data["Matchup Game ID"]) {
            return data["Matchup Game ID"];
        } 
        // For Batter Clearances tables
        else if (data["Batter Name"]) {
            let id = `${data["Batter Name"]}_${data["Batter Team"]}`;
            if (data["Batter Prop Type"]) id += `_${data["Batter Prop Type"]}`;
            if (data["Batter Prop Value"]) id += `_${data["Batter Prop Value"]}`;
            if (data["Batter Prop Split ID"]) id += `_${data["Batter Prop Split ID"]}`;
            if (data["Batter Stat Type"]) id += `_${data["Batter Stat Type"]}`;
            return id;
        }
        // For Pitcher Clearances tables
        else if (data["Pitcher Name"]) {
            let id = `${data["Pitcher Name"]}_${data["Pitcher Team"]}`;
            if (data["Pitcher Prop Type"]) id += `_${data["Pitcher Prop Type"]}`;
            if (data["Pitcher Prop Value"]) id += `_${data["Pitcher Prop Value"]}`;
            if (data["Pitcher Prop Split ID"]) id += `_${data["Pitcher Prop Split ID"]}`;
            if (data["Pitcher Stat Type"]) id += `_${data["Pitcher Stat Type"]}`;
            return id;
        }
        // Fallback
        else {
            return JSON.stringify(data);
        }
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (tableWrapper && tableWrapper.isInitialized) {
            console.log(`Restoring state for ${tabId}`);
            
            // Call the table's restoreState method if it exists
            if (typeof tableWrapper.restoreState === 'function') {
                tableWrapper.restoreState();
                
                // Also restore scroll position after table's own restoration
                setTimeout(() => {
                    const scrollPos = this.scrollPositions[tabId];
                    if (scrollPos !== undefined) {
                        const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
                        if (table) {
                            const tableHolder = table.element.querySelector('.tabulator-tableHolder');
                            if (tableHolder) {
                                tableHolder.scrollTop = scrollPos;
                            }
                        }
                    }
                }, 500);
                
                return; // Let the table handle its own restoration
            }
            
            // Fallback restoration if table doesn't have its own method
            const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
            if (!table) return;
            
            // Restore expanded rows
            const savedExpandedRows = this.expandedRowsStates[tabId];
            if (savedExpandedRows && savedExpandedRows.length > 0) {
                console.log(`Restoring ${savedExpandedRows.length} expanded rows for ${tabId}`);
                
                // First pass: Mark rows as expanded
                const rows = table.getRows();
                const rowsToReformat = [];
                
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    
                    const savedRow = savedExpandedRows.find(sr => sr.id === rowId);
                    if (savedRow) {
                        // Update the expanded state
                        data._expanded = true;
                        row.update(data);
                        rowsToReformat.push({
                            row: row,
                            hadSubrow: savedRow.hasSubrow
                        });
                        
                        // Update expander icon immediately
                        this.updateExpanderIcon(row, true);
                    } else if (data._expanded) {
                        // Collapse if not in saved list
                        data._expanded = false;
                        row.update(data);
                        this.updateExpanderIcon(row, false);
                    }
                });
                
                // Second pass: Force reformat to create subtables
                setTimeout(() => {
                    rowsToReformat.forEach(({row, hadSubrow}) => {
                        const rowElement = row.getElement();
                        
                        // Remove any existing subrow first
                        const existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                        
                        // Force reformat to recreate the subrow
                        row.reformat();
                        
                        // For rows that had subtables, ensure they're recreated
                        if (hadSubrow) {
                            // Trigger another reformat after a delay if subrow isn't created
                            setTimeout(() => {
                                const newSubrow = rowElement.querySelector('.subrow-container');
                                if (!newSubrow) {
                                    console.log('Forcing second reformat for row');
                                    row.reformat();
                                }
                            }, 100);
                        }
                    });
                    
                    // Normalize heights after all reformats
                    setTimeout(() => {
                        rowsToReformat.forEach(({row}) => {
                            row.normalizeHeight();
                        });
                        
                        // Force a table redraw to ensure everything is visible
                        table.redraw(false);
                    }, 200);
                }, 100);
            }
            
            // Restore scroll position after everything is rendered
            setTimeout(() => {
                const scrollPos = this.scrollPositions[tabId];
                if (scrollPos !== undefined) {
                    const tableHolder = table.element.querySelector('.tabulator-tableHolder');
                    if (tableHolder) {
                        tableHolder.scrollTop = scrollPos;
                    }
                }
            }, 400);
        }
    }

    updateExpanderIcon(row, isExpanded) {
        const cells = row.getCells();
        
        // Find the appropriate name field based on table type
        const nameFields = [
            "Batter Name", 
            "Pitcher Name", 
            "Matchup Team"
        ];
        
        for (let field of nameFields) {
            const nameCell = cells.find(cell => cell.getField() === field);
            if (nameCell) {
                const cellElement = nameCell.getElement();
                const expander = cellElement.querySelector('.row-expander');
                if (expander) {
                    expander.innerHTML = isExpanded ? "−" : "+";
                }
                break;
            }
        }
    }

    createTabStructure(tableElement) {
        if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
            
            // Create tabs container with all tabs including new props tabs
            var tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            tabsContainer.innerHTML = `
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab="table0">Matchups</button>
                    <button class="tab-button" data-tab="table1">Batter Prop Clearances</button>
                    <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
                    <button class="tab-button" data-tab="table3">Pitcher Prop Clearances</button>
                    <button class="tab-button" data-tab="table4">Pitcher Prop Clearances (Alt. View)</button>
                    <button class="tab-button" data-tab="table5">Batter Stats</button>
                    <button class="tab-button" data-tab="table6">Pitcher Stats</button>
                    <button class="tab-button" data-tab="table7">Batter Props</button>
                    <button class="tab-button" data-tab="table8">Pitcher Props</button>
                    <button class="tab-button" data-tab="table9">Game Props</button>
                </div>
            `;
            
            // Add loading indicator
            var loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'tab-loading-indicator';
            loadingIndicator.style.cssText = 'display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
            loadingIndicator.innerHTML = '<div class="spinner"></div><div>Loading table...</div>';
            
            // Create table containers wrapper
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            tablesContainer.appendChild(loadingIndicator);
            
            // Create matchups container - now the active table
            var table0Container = document.createElement('div');
            table0Container.className = 'table-container active-table';
            table0Container.id = 'table0-container';
            table0Container.style.cssText = 'width: 100%; display: block;';
            
            // Move original table into first container - now inactive
            var table1Container = document.createElement('div');
            table1Container.className = 'table-container inactive-table';
            table1Container.id = 'table1-container';
            table1Container.style.cssText = 'width: 100%; display: none;';
            
            // Create second table container
            var table2Container = document.createElement('div');
            table2Container.className = 'table-container inactive-table';
            table2Container.id = 'table2-container';
            table2Container.style.cssText = 'width: 100%; display: none;';
            
            // Create second table element
            var table2Element = document.createElement('div');
            table2Element.id = 'batter-table-alt';
            
            tableElement.parentNode.insertBefore(wrapper, tableElement);
            wrapper.appendChild(tabsContainer);
            wrapper.appendChild(tablesContainer);
            
            // Move table1 into its container
            table1Container.appendChild(tableElement);
            table2Container.appendChild(table2Element);
            
            tablesContainer.appendChild(table0Container);
            tablesContainer.appendChild(table1Container);
            tablesContainer.appendChild(table2Container);
        }
    }
    
    // Show loading indicator
    showLoading() {
        const indicator = document.querySelector('.tab-loading-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }
    
    // Hide loading indicator
    hideLoading() {
        const indicator = document.querySelector('.tab-loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    // Memory cleanup for inactive tabs
    cleanupInactiveTab(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (tableWrapper && tableWrapper.isInitialized) {
            // Only cleanup if tab hasn't been used recently (5 minutes)
            const lastUsed = this.tableStates[tabId]?.savedAt || 0;
            const timeSinceUsed = Date.now() - lastUsed;
            
            if (timeSinceUsed > 5 * 60 * 1000) {
                console.log(`Cleaning up inactive tab: ${tabId}`);
                tableWrapper.destroy();
                this.tabInitialized[tabId] = false;
                delete this.tableStates[tabId];
                delete this.expandedRowsStates[tabId];
            }
        }
    }
    
    // Periodic cleanup of inactive tabs
    startPeriodicCleanup() {
        setInterval(() => {
            Object.keys(this.tables).forEach(tabId => {
                if (tabId !== this.currentActiveTab) {
                    this.cleanupInactiveTab(tabId);
                }
            });
        }, 60 * 1000); // Check every minute
    }
}

// Add CSS for loading spinner
const style = document.createElement('style');
style.textContent = `
    .tab-loading-indicator {
        text-align: center;
        padding: 20px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
