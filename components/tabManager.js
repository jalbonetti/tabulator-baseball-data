// components/tabManager.js - OPTIMIZED VERSION WITH LAZY LOADING AND PERFORMANCE IMPROVEMENTS
export class TabManager {
    constructor(tables) {
        this.tables = tables; // { table0: tableInstance, table1: tableInstance, ..., table9: tableInstance }
        this.currentActiveTab = 'table0';
        this.scrollPositions = {}; // Store scroll positions for each tab
        this.tableStates = {}; // Store table states for each tab
        this.tabInitialized = {}; // Track which tabs have been initialized
        this.isTransitioning = false; // Prevent rapid tab switching
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
                        
                        // Restore tab state with animation frame for smoothness
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
            // Use the table's built-in save state method
            tableWrapper.saveState();
            
            // Save additional state info
            this.tableStates[this.currentActiveTab] = {
                savedAt: Date.now()
            };
        }
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (tableWrapper && tableWrapper.isInitialized) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                // Use the table's built-in restore state method
                tableWrapper.restoreState();
                
                // For very large tables, use progressive restoration
                if (tabId === 'table2' || tabId === 'table4') {
                    // These are the Alt view tables with potentially more data
                    this.progressiveRestore(tableWrapper);
                }
            }, 50);
        }
    }

    // Progressive restoration for large tables
    progressiveRestore(tableWrapper) {
        if (!tableWrapper.expandedRowsCache || tableWrapper.expandedRowsCache.size === 0) {
            return;
        }
        
        const table = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
        if (!table) return;
        
        const expandedIds = Array.from(tableWrapper.expandedRowsCache);
        let index = 0;
        
        const restoreNext = () => {
            if (index >= expandedIds.length) return;
            
            const id = expandedIds[index];
            const rows = table.getRows();
            
            for (let row of rows) {
                const data = row.getData();
                const rowId = data["Matchup Game ID"] || data["_id"] || 
                            `${data["Batter Name"] || data["Pitcher Name"]}_${data["Batter Prop Type"] || data["Pitcher Prop Type"]}_${data["Batter Prop Value"] || data["Pitcher Prop Value"]}`;
                
                if (rowId === id && !data._expanded) {
                    data._expanded = true;
                    row.update(data);
                    row.reformat();
                    break;
                }
            }
            
            index++;
            
            // Continue with next item after a small delay
            if (index < expandedIds.length) {
                requestAnimationFrame(restoreNext);
            }
        };
        
        // Start progressive restoration
        requestAnimationFrame(restoreNext);
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
