// components/tabManager.js - FINAL FIXED VERSION
export class TabManager {
    constructor(tables) {
        this.tables = tables;
        this.currentActiveTab = 'table0';
        this.scrollPositions = {};
        this.tableStates = {};
        this.tabInitialized = {};
        this.isTransitioning = false;
        this.expandedRowsStates = {};
        this.setupTabSwitching();
        
        // Only initialize the first tab
        this.initializeTab(this.currentActiveTab);
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) {
            return Promise.resolve();
        }
        
        console.log(`Lazy initializing tab: ${tabId}`);
        
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const tableWrapper = this.tables[tabId];
                
                if (tableWrapper && !tableWrapper.isInitialized) {
                    tableWrapper.initialize();
                    tableWrapper.isInitialized = true; // ENSURE this is set
                    this.tabInitialized[tabId] = true;
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
                
                if (this.isTransitioning) {
                    console.log('Tab transition in progress, ignoring click');
                    return;
                }
                
                var targetTab = e.target.dataset.tab;
                
                if (targetTab === this.currentActiveTab) {
                    return;
                }
                
                if (switchTimeout) {
                    clearTimeout(switchTimeout);
                }
                
                // Save state BEFORE the timeout
                console.log(`About to switch from ${this.currentActiveTab} to ${targetTab}`);
                this.saveCurrentTabState();
                
                switchTimeout = setTimeout(async () => {
                    console.log('Switching to tab:', targetTab);
                    this.isTransitioning = true;
                    
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    const currentContainer = document.getElementById(`${this.currentActiveTab}-container`);
                    if (currentContainer) {
                        currentContainer.className = 'table-container inactive-table';
                        currentContainer.style.display = 'none';
                    }
                    
                    await this.initializeTab(targetTab);
                    
                    const targetContainer = document.getElementById(`${targetTab}-container`);
                    if (targetContainer) {
                        targetContainer.className = 'table-container active-table';
                        targetContainer.style.display = 'block';
                        this.currentActiveTab = targetTab;
                        
                        requestAnimationFrame(() => {
                            this.restoreTabState(targetTab);
                            
                            setTimeout(() => {
                                this.isTransitioning = false;
                            }, 300);
                        });
                    } else {
                        this.isTransitioning = false;
                    }
                }, 100);
            }
        });
    }

    saveCurrentTabState() {
        const tableWrapper = this.tables[this.currentActiveTab];
        
        if (!tableWrapper) {
            console.log(`No table wrapper found for ${this.currentActiveTab}`);
            return;
        }
        
        // Check if table has been initialized by checking for the table property
        const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
        if (!table) {
            console.log(`Table not yet initialized for ${this.currentActiveTab}`);
            return;
        }
        
        console.log(`Saving state for ${this.currentActiveTab}`);
        
        // Try to use the table's saveState method if it exists
        if (tableWrapper.saveState && typeof tableWrapper.saveState === 'function') {
            console.log(`Calling saveState on ${this.currentActiveTab}`);
            tableWrapper.saveState();
        } else {
            console.log(`Using fallback save for ${this.currentActiveTab}`);
            
            // Fallback: manually save state
            const tableHolder = table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder) {
                this.scrollPositions[this.currentActiveTab] = tableHolder.scrollTop;
            }
            
            const expandedRows = [];
            const rows = table.getRows();
            
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId(data);
                    const rowElement = row.getElement();
                    const hasVisibleSubrow = rowElement.querySelector('.subrow-container') !== null;
                    
                    expandedRows.push({
                        id: id,
                        hasSubrow: hasVisibleSubrow,
                        data: data
                    });
                }
            });
            
            this.expandedRowsStates[this.currentActiveTab] = expandedRows;
            this.tableStates[this.currentActiveTab] = {
                savedAt: Date.now(),
                expandedCount: expandedRows.length
            };
            
            console.log(`Fallback saved ${expandedRows.length} expanded rows for ${this.currentActiveTab}`);
        }
    }

    generateRowId(data) {
        // For Matchups table
        if (data["Matchup Game ID"]) {
            return `matchup_${data["Matchup Game ID"]}`;
        } 
        // For Batter tables
        else if (data["Batter Name"]) {
            let id = `batter_${data["Batter Name"]}_${data["Batter Team"]}`;
            if (data["Batter Prop Type"]) id += `_${data["Batter Prop Type"]}`;
            if (data["Batter Prop Value"]) id += `_${data["Batter Prop Value"]}`;
            if (data["Batter Prop Split ID"]) id += `_${data["Batter Prop Split ID"]}`;
            if (data["Batter Stat Type"]) id += `_${data["Batter Stat Type"]}`;
            return id;
        }
        // For Pitcher tables
        else if (data["Pitcher Name"]) {
            let id = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"]}`;
            if (data["Pitcher Prop Type"]) id += `_${data["Pitcher Prop Type"]}`;
            if (data["Pitcher Prop Value"]) id += `_${data["Pitcher Prop Value"]}`;
            if (data["Pitcher Prop Split ID"]) id += `_${data["Pitcher Prop Split ID"]}`;
            if (data["Pitcher Stat Type"]) id += `_${data["Pitcher Stat Type"]}`;
            return id;
        }
        // Fallback
        return JSON.stringify(Object.keys(data).slice(0, 5).map(k => data[k]));
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (!tableWrapper) {
            console.log(`No table wrapper found for ${tabId}`);
            return;
        }
        
        // Check if table has been initialized by checking for the table property
        const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
        if (!table) {
            console.log(`Table not yet initialized for ${tabId}`);
            return;
        }
        
        console.log(`Restoring state for ${tabId}`);
        
        // Try to use the table's restoreState method first
        if (tableWrapper.restoreState && typeof tableWrapper.restoreState === 'function') {
            console.log(`Calling restoreState on ${tabId}`);
            tableWrapper.restoreState();
            
            // Also restore scroll position after table's restoration
            setTimeout(() => {
                const scrollPos = this.scrollPositions[tabId];
                if (scrollPos !== undefined) {
                    const tableHolder = table.element.querySelector('.tabulator-tableHolder');
                    if (tableHolder) {
                        tableHolder.scrollTop = scrollPos;
                    }
                }
            }, 500);
        } else {
            console.log(`Using fallback restore for ${tabId}`);
            
            // Fallback restoration
            const savedExpandedRows = this.expandedRowsStates[tabId];
            if (savedExpandedRows && savedExpandedRows.length > 0) {
                console.log(`Fallback restoring ${savedExpandedRows.length} expanded rows for ${tabId}`);
                
                const rows = table.getRows();
                const rowsToReformat = [];
                
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    
                    const savedRow = savedExpandedRows.find(sr => sr.id === rowId);
                    if (savedRow) {
                        data._expanded = true;
                        row.update(data);
                        rowsToReformat.push({
                            row: row,
                            hadSubrow: savedRow.hasSubrow
                        });
                        
                        this.updateExpanderIcon(row, true);
                    } else if (data._expanded) {
                        data._expanded = false;
                        row.update(data);
                        this.updateExpanderIcon(row, false);
                    }
                });
                
                setTimeout(() => {
                    rowsToReformat.forEach(({row, hadSubrow}) => {
                        const rowElement = row.getElement();
                        const existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                        
                        row.reformat();
                        
                        if (hadSubrow) {
                            setTimeout(() => {
                                const newSubrow = rowElement.querySelector('.subrow-container');
                                if (!newSubrow) {
                                    console.log('Forcing second reformat for row');
                                    row.reformat();
                                }
                            }, 100);
                        }
                    });
                    
                    setTimeout(() => {
                        rowsToReformat.forEach(({row}) => {
                            row.normalizeHeight();
                        });
                        table.redraw(false);
                    }, 200);
                }, 100);
            }
            
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
        const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
        
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
            
            var loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'tab-loading-indicator';
            loadingIndicator.style.cssText = 'display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;';
            loadingIndicator.innerHTML = '<div class="spinner"></div><div>Loading table...</div>';
            
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            tablesContainer.appendChild(loadingIndicator);
            
            var table0Container = document.createElement('div');
            table0Container.className = 'table-container active-table';
            table0Container.id = 'table0-container';
            table0Container.style.cssText = 'width: 100%; display: block;';
            
            var table1Container = document.createElement('div');
            table1Container.className = 'table-container inactive-table';
            table1Container.id = 'table1-container';
            table1Container.style.cssText = 'width: 100%; display: none;';
            
            var table2Container = document.createElement('div');
            table2Container.className = 'table-container inactive-table';
            table2Container.id = 'table2-container';
            table2Container.style.cssText = 'width: 100%; display: none;';
            
            var table2Element = document.createElement('div');
            table2Element.id = 'batter-table-alt';
            
            tableElement.parentNode.insertBefore(wrapper, tableElement);
            wrapper.appendChild(tabsContainer);
            wrapper.appendChild(tablesContainer);
            
            table1Container.appendChild(tableElement);
            table2Container.appendChild(table2Element);
            
            tablesContainer.appendChild(table0Container);
            tablesContainer.appendChild(table1Container);
            tablesContainer.appendChild(table2Container);
        }
    }
    
    showLoading() {
        const indicator = document.querySelector('.tab-loading-indicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }
    
    hideLoading() {
        const indicator = document.querySelector('.tab-loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    cleanupInactiveTab(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (tableWrapper && tableWrapper.isInitialized) {
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
    
    startPeriodicCleanup() {
        setInterval(() => {
            Object.keys(this.tables).forEach(tabId => {
                if (tabId !== this.currentActiveTab) {
                    this.cleanupInactiveTab(tabId);
                }
            });
        }, 60 * 1000);
    }
}

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
