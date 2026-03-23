// components/tabManager.js - Tab Manager for Baseball Tables
// Matching NBA repository pattern with 3 tabs for Phase 1

import { isMobile, isTablet } from '../shared/config.js';

export const TAB_STYLES = `
    .table-wrapper {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 auto !important;
    }
    
    .tabs-container {
        width: 100%;
        margin-bottom: 0;
        z-index: 10;
    }
    
    .tab-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px;
        padding: 10px;
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
    }
    
    .tab-button {
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .tab-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .tab-button.active {
        background: white;
        color: #b91c1c;
        font-weight: bold;
    }
    
    .tables-container {
        width: 100%;
        position: relative;
        min-height: 500px;
    }
    
    .table-container {
        width: 100%;
    }
    
    .table-container.active-table {
        display: block !important;
    }
    
    .table-container.inactive-table {
        display: none !important;
    }
    
    .table-container .tabulator {
        border-radius: 0 0 6px 6px;
        border-top: none;
    }
    
    @media screen and (max-width: 768px) {
        .tab-button {
            padding: 8px 12px;
            font-size: 11px;
        }
        
        .tab-buttons {
            gap: 4px;
            padding: 8px;
        }
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
        
        Object.keys(tables).forEach(tabId => {
            this.tabInitialized[tabId] = false;
        });
        
        this.injectStyles();
        this.setupTabSwitching();
        this.initializeTab(this.currentActiveTab);
        
        console.log("TabManager: Initialized with tabs:", Object.keys(tables));
    }
    
    injectStyles() {
        if (!document.querySelector('#tab-manager-styles')) {
            const style = document.createElement('style');
            style.id = 'tab-manager-styles';
            style.textContent = TAB_STYLES;
            document.head.appendChild(style);
            console.log("TabManager: Styles injected");
        }
    }

    getContainerIdForTab(tabId) {
        const containerMap = {
            'table0': 'table0-container',
            'table1': 'table1-container',
            'table2': 'table2-container'
        };
        return containerMap[tabId] || `${tabId}-container`;
    }

    applyContainerWidth(tableContainer) {
        if (!tableContainer) return;
        
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        if (isSmallScreen) {
            tableContainer.style.width = '100%';
            tableContainer.style.maxWidth = '100vw';
            tableContainer.style.minWidth = '';
            
            const tabulator = tableContainer.querySelector('.tabulator');
            if (tabulator) {
                tabulator.style.width = '100%';
                tabulator.style.minWidth = '0';
                tabulator.style.maxWidth = '100%';
            }
        } else {
            tableContainer.style.width = 'fit-content';
            tableContainer.style.minWidth = 'auto';
            tableContainer.style.maxWidth = 'none';
        }
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) return;
        
        const tableInstance = this.tables[tabId];
        if (!tableInstance) {
            console.error(`TabManager: No table instance for ${tabId}`);
            return;
        }
        
        console.log(`TabManager: Initializing ${tabId}...`);
        
        try {
            tableInstance.initialize();
            this.tabInitialized[tabId] = true;
            
            const containerId = this.getContainerIdForTab(tabId);
            const container = document.getElementById(containerId);
            if (container) {
                this.applyContainerWidth(container);
            }
            
            console.log(`TabManager: ${tabId} initialized successfully`);
        } catch (error) {
            console.error(`TabManager: Failed to initialize ${tabId}:`, error);
        }
    }

    setupTabSwitching() {
        const self = this;
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                if (self.isTransitioning) return;
                
                const targetTab = this.getAttribute('data-tab');
                if (targetTab === self.currentActiveTab) return;
                
                self.isTransitioning = true;
                
                // Update button active states
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                
                // Save state of current tab
                const currentTable = self.tables[self.currentActiveTab];
                if (currentTable && currentTable.saveState) {
                    currentTable.saveState();
                }
                
                // Hide current tab
                const currentContainerId = self.getContainerIdForTab(self.currentActiveTab);
                const currentContainer = document.getElementById(currentContainerId);
                if (currentContainer) {
                    currentContainer.className = 'table-container inactive-table';
                    currentContainer.style.display = 'none';
                }
                
                // Show target tab
                const targetContainerId = self.getContainerIdForTab(targetTab);
                const targetContainer = document.getElementById(targetContainerId);
                if (targetContainer) {
                    targetContainer.className = 'table-container active-table';
                    targetContainer.style.display = 'block';
                }
                
                // Initialize if needed, otherwise redraw
                if (!self.tabInitialized[targetTab]) {
                    self.initializeTab(targetTab);
                } else {
                    const targetTable = self.tables[targetTab];
                    if (targetTable && targetTable.table) {
                        setTimeout(() => {
                            targetTable.table.redraw(true);
                            
                            if (targetTable.restoreState) {
                                targetTable.restoreState();
                            }
                            
                            // Recalculate widths
                            if (targetTable.calculateAndApplyWidths) {
                                targetTable.calculateAndApplyWidths();
                            }
                            if (targetTable.ensureNameColumnWidth) {
                                targetTable.ensureNameColumnWidth();
                            }
                        }, 100);
                    }
                }
                
                // Apply container width
                if (targetContainer) {
                    self.applyContainerWidth(targetContainer);
                }
                
                self.currentActiveTab = targetTab;
                
                setTimeout(() => {
                    self.isTransitioning = false;
                }, 300);
                
                console.log(`TabManager: Switched to ${targetTab}`);
            });
        });
    }
}
