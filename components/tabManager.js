// components/tabManager.js - FIXED VERSION WITH TAB_STYLES EXPORT

// Export TAB_STYLES constant
export const TAB_STYLES = `
    /* EMERGENCY TAB FIX */
    .tabs-container {
        width: 100% !important;
        max-width: 100% !important;
        background: #ffffff !important;
        border-bottom: 2px solid #dee2e6 !important;
        margin-bottom: 20px !important;
        padding: 0 !important;
        position: relative !important;
        z-index: 100 !important;
        overflow: hidden !important;
    }

    .tab-buttons {
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: 2px !important;
        padding: 8px !important;
        background: #f8f9fa !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: thin !important;
        width: 100% !important;
        max-width: 100% !important;
    }

    /* Make scrollbar visible for tabs */
    .tab-buttons::-webkit-scrollbar {
        height: 6px !important;
        display: block !important;
    }

    .tab-buttons::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
    }

    .tab-buttons::-webkit-scrollbar-thumb {
        background: #888 !important;
        border-radius: 3px !important;
    }

    .tab-buttons::-webkit-scrollbar-thumb:hover {
        background: #555 !important;
    }

    /* CRITICAL: Make buttons clickable and visible */
    .tab-button {
        /* Sizing */
        padding: 10px 16px !important;
        min-width: fit-content !important;
        flex-shrink: 0 !important;
        
        /* Make clickable */
        pointer-events: auto !important;
        cursor: pointer !important;
        position: relative !important;
        z-index: 101 !important;
        
        /* Styling */
        background: #ffffff !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 4px 4px 0 0 !important;
        color: #495057 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        transition: all 0.2s ease !important;
        
        /* Remove any transforms */
        transform: none !important;
    }

    .tab-button:hover:not(.active) {
        background: #f8f9fa !important;
        border-color: #adb5bd !important;
        color: #212529 !important;
    }

    .tab-button.active {
        background: #007bff !important;
        color: #ffffff !important;
        border-color: #007bff !important;
        font-weight: 600 !important;
        z-index: 102 !important;
    }

    .tab-button:focus {
        outline: 2px solid #007bff !important;
        outline-offset: 2px !important;
    }

    /* Ensure tables container doesn't overflow */
    .tables-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        position: relative !important;
    }

    .table-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: auto !important;
        position: relative !important;
    }

    /* Mobile responsive */
    @media screen and (max-width: 768px) {
        .tab-buttons {
            padding: 4px !important;
        }
        
        .tab-button {
            padding: 8px 12px !important;
            font-size: 12px !important;
        }
    }

    /* Fix for tab loading indicator */
    .tab-loading-indicator {
        display: none !important;
    }
`;

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
        
        // Inject styles when TabManager is created
        this.injectStyles();
    }
    
    injectStyles() {
        // Check if styles already exist
        if (!document.querySelector('#tab-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-manager-styles';
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
        }
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
                    tableWrapper.isInitialized = true;
                    this.tabInitialized[tabId] = true;
                    
                    if (!this.tableStates[tabId]) {
                        this.tableStates[tabId] = {};
                    }
                    this.tableStates[tabId].initializedAt = Date.now();
                    
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
                
                console.log(`Saving state for ${this.currentActiveTab} before switching to ${targetTab}`);
                this.saveCurrentTabState();
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
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
                        
                        const previousTab = this.currentActiveTab;
                        this.currentActiveTab = targetTab;
                        
                        await new Promise(resolve => requestAnimationFrame(resolve));
                        
                        console.log(`Restoring state for ${targetTab}`);
                        this.restoreTabState(targetTab);
                        
                        setTimeout(() => {
                            this.isTransitioning = false;
                        }, 500);
                    } else {
                        this.isTransitioning = false;
                    }
                }, 100);
            }
        });
    }

    saveCurrentTabState() {
        // Implementation remains the same
        const tableWrapper = this.tables[this.currentActiveTab];
        if (!tableWrapper || !tableWrapper.table) return;
        
        const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.scrollPositions[this.currentActiveTab] = tableHolder.scrollTop;
        }
        
        if (tableWrapper.saveState && typeof tableWrapper.saveState === 'function') {
            tableWrapper.saveState();
        }
        
        const expandedRows = [];
        const rows = tableWrapper.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                expandedRows.push(tableWrapper.generateRowId ? tableWrapper.generateRowId(data) : JSON.stringify(data));
            }
        });
        
        this.expandedRowsStates[this.currentActiveTab] = expandedRows;
        
        console.log(`Saved state for ${this.currentActiveTab}: ${expandedRows.length} expanded rows, scroll: ${this.scrollPositions[this.currentActiveTab]}`);
    }

    restoreTabState(tabId) {
        // Implementation remains the same
        const tableWrapper = this.tables[tabId];
        if (!tableWrapper || !tableWrapper.table) return;
        
        if (tableWrapper.restoreState && typeof tableWrapper.restoreState === 'function') {
            tableWrapper.restoreState();
        }
        
        const expandedRowIds = this.expandedRowsStates[tabId] || [];
        if (expandedRowIds.length > 0) {
            console.log(`Restoring ${expandedRowIds.length} expanded rows for ${tabId}`);
            
            setTimeout(() => {
                const rows = tableWrapper.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = tableWrapper.generateRowId ? tableWrapper.generateRowId(data) : JSON.stringify(data);
                    
                    if (expandedRowIds.includes(rowId)) {
                        if (!data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            row.reformat();
                        }
                    }
                });
            }, 200);
        }
        
        if (this.scrollPositions[tabId]) {
            setTimeout(() => {
                const tableHolder = tableWrapper.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.scrollPositions[tabId];
                }
            }, 300);
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
            
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            
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
    
    startPeriodicCleanup() {
        // Optional: Add periodic cleanup if needed
    }
}
