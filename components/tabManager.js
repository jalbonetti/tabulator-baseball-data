// components/tabManager.js - RESTORED TAB STYLING VERSION
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
                    
                    // Update button states with better visual feedback
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-selected', 'false');
                    });
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-selected', 'true');
                    
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
                            
                            const tableWrapper = this.tables[targetTab];
                            if (tableWrapper && tableWrapper.table) {
                                const table = tableWrapper.table;
                                const rows = table.getRows();
                                
                                rows.forEach(row => {
                                    const data = row.getData();
                                    if (data._expanded) {
                                        const cells = row.getCells();
                                        const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                                        
                                        for (let field of nameFields) {
                                            const nameCell = cells.find(cell => cell.getField() === field);
                                            if (nameCell) {
                                                const cellElement = nameCell.getElement();
                                                const expander = cellElement.querySelector('.row-expander');
                                                if (expander && expander.innerHTML !== "−") {
                                                    console.log('Fixing expander icon mismatch');
                                                    expander.innerHTML = "−";
                                                }
                                                break;
                                            }
                                        }
                                    }
                                });
                            }
                        }, 500);
                    } else {
                        this.isTransitioning = false;
                    }
                }, 100);
            }
        });
    }

    // ... (rest of the methods remain the same) ...

    createTabStructure(tableElement) {
        if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
            
            var tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            tabsContainer.innerHTML = `
                <div class="tab-buttons" role="tablist">
                    <button class="tab-button active" data-tab="table0" role="tab" aria-selected="true">
                        <span class="tab-label">Matchups</span>
                    </button>
                    <button class="tab-button" data-tab="table1" role="tab" aria-selected="false">
                        <span class="tab-label">Batter Prop Clearances</span>
                    </button>
                    <button class="tab-button" data-tab="table2" role="tab" aria-selected="false">
                        <span class="tab-label">Batter Prop Clearances (Alt. View)</span>
                    </button>
                    <button class="tab-button" data-tab="table3" role="tab" aria-selected="false">
                        <span class="tab-label">Pitcher Prop Clearances</span>
                    </button>
                    <button class="tab-button" data-tab="table4" role="tab" aria-selected="false">
                        <span class="tab-label">Pitcher Prop Clearances (Alt. View)</span>
                    </button>
                    <button class="tab-button" data-tab="table5" role="tab" aria-selected="false">
                        <span class="tab-label">Batter Stats</span>
                    </button>
                    <button class="tab-button" data-tab="table6" role="tab" aria-selected="false">
                        <span class="tab-label">Pitcher Stats</span>
                    </button>
                    <button class="tab-button" data-tab="table7" role="tab" aria-selected="false">
                        <span class="tab-label">Batter Props</span>
                    </button>
                    <button class="tab-button" data-tab="table8" role="tab" aria-selected="false">
                        <span class="tab-label">Pitcher Props</span>
                    </button>
                    <button class="tab-button" data-tab="table9" role="tab" aria-selected="false">
                        <span class="tab-label">Game Props</span>
                    </button>
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
            
            // Create containers for all tables
            for (let i = 0; i <= 9; i++) {
                var container = document.createElement('div');
                container.className = i === 0 ? 'table-container active-table' : 'table-container inactive-table';
                container.id = `table${i}-container`;
                container.style.cssText = i === 0 ? 'width: 100%; display: block;' : 'width: 100%; display: none;';
                tablesContainer.appendChild(container);
            }
            
            tableElement.parentNode.insertBefore(wrapper, tableElement);
            wrapper.appendChild(tabsContainer);
            wrapper.appendChild(tablesContainer);
            
            // Move the original table into table1 container
            document.getElementById('table1-container').appendChild(tableElement);
        }
    }
    
    // ... (remaining methods stay the same) ...
}

// Export enhanced tab styling CSS
export const TAB_STYLES = `
/* ===================================
   RESTORED TAB BUTTON STYLING
   =================================== */

.tabs-container {
    width: 100%;
    background: #ffffff;
    border-bottom: 2px solid #dee2e6;
    margin-bottom: 24px;
    padding: 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-buttons {
    display: flex;
    gap: 0;
    padding: 0;
    margin: 0;
    background: #f8f9fa;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.tab-buttons::-webkit-scrollbar {
    display: none;
}

/* RESTORED ORIGINAL BUTTON SIZING */
.tab-button {
    /* Original comfortable sizing */
    padding: 14px 24px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    
    /* Button styling */
    background: #ffffff;
    border: none;
    border-top: 3px solid transparent;
    border-bottom: 3px solid transparent;
    color: #495057;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;
    position: relative;
    
    /* Remove any transform scaling */
    transform: none !important;
    
    /* Text styling */
    text-align: center;
    line-height: 1.5;
    letter-spacing: 0.3px;
}

/* Hover state */
.tab-button:hover:not(.active) {
    background: #f1f3f5;
    color: #212529;
    border-bottom-color: #adb5bd;
}

/* CLEAR ACTIVE STATE INDICATION */
.tab-button.active {
    background: #007bff !important;
    color: #ffffff !important;
    border-top-color: #0056b3 !important;
    border-bottom-color: #0056b3 !important;
    font-weight: 700 !important;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
}

/* Active indicator bar */
.tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 3px;
    background: #0056b3;
    animation: slideIn 0.3s ease;
}

/* Active label enhancement */
.tab-button.active .tab-label {
    position: relative;
    z-index: 1;
}

/* Inactive state for contrast */
.tab-button:not(.active) {
    opacity: 0.85;
}

.tab-button:not(.active):hover {
    opacity: 1;
}

/* Focus state for accessibility */
.tab-button:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

.tab-button.active:focus {
    outline-color: #0056b3;
}

/* Animation for active indicator */
@keyframes slideIn {
    from {
        width: 0;
        left: 50%;
    }
    to {
        width: 100%;
        left: 0;
    }
}

/* Mobile responsive - keep buttons readable */
@media screen and (max-width: 768px) {
    .tabs-container {
        position: relative;
        margin-bottom: 16px;
    }
    
    .tab-buttons {
        padding: 0 8px;
        gap: 4px;
    }
    
    .tab-button {
        /* Slightly smaller on mobile but still readable */
        padding: 12px 16px !important;
        font-size: 13px !important;
        border-radius: 4px 4px 0 0;
    }
    
    /* Add scroll indicators on mobile */
    .tab-buttons::before,
    .tab-buttons::after {
        content: '';
        position: sticky;
        width: 20px;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }
    
    .tab-buttons::before {
        left: 0;
        background: linear-gradient(to right, #f8f9fa, transparent);
    }
    
    .tab-buttons::after {
        right: 0;
        background: linear-gradient(to left, #f8f9fa, transparent);
    }
}

/* Tablet responsive */
@media screen and (min-width: 769px) and (max-width: 1199px) {
    .tab-button {
        padding: 12px 20px !important;
        font-size: 14px !important;
    }
}

/* Loading indicator styling */
.tab-loading-indicator {
    text-align: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.95);
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
