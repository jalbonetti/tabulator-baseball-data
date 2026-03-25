// components/tabManager.js - Tab Manager for Baseball Tables
// EXACT copy of CBB 3-tab tabManager pattern with red colors

import { isMobile, isTablet } from '../shared/config.js';

export const TAB_STYLES = `
    .table-wrapper { display: flex !important; flex-direction: column !important; align-items: center !important; width: 100% !important; margin: 0 auto !important; }
    .tabs-container { width: 100%; margin-bottom: 0; z-index: 10; }
    .tab-buttons { display: flex; justify-content: center; flex-wrap: wrap; gap: 5px; padding: 10px; background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); border-radius: 8px 8px 0 0; margin-bottom: 0; }
    .tab-button { padding: 10px 16px; border: none; border-radius: 4px; background: rgba(255, 255, 255, 0.2); color: white; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease; white-space: nowrap; }
    .tab-button:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-1px); }
    .tab-button.active { background: white; color: #991b1b; font-weight: bold; }
    .tables-container { width: 100%; position: relative; min-height: 500px; }
    .table-container { width: 100%; }
    .table-container.active-table { display: block !important; }
    .table-container.inactive-table { display: none !important; }
    .table-container .tabulator { border-radius: 0 0 6px 6px; border-top: none; }
    @media screen and (max-width: 768px) {
        .tab-button { padding: 8px 12px; font-size: 11px; }
        .tab-buttons { gap: 4px; padding: 8px; }
    }
`;

export class TabManager {
    constructor(tables) {
        this.tables = tables;
        this.currentActiveTab = 'table0';
        this.tabInitialized = {};
        this.isTransitioning = false;
        Object.keys(tables).forEach(tabId => { this.tabInitialized[tabId] = false; });
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
        }
    }

    getContainerIdForTab(tabId) {
        return { 'table0': 'table0-container', 'table1': 'table1-container', 'table2': 'table2-container' }[tabId] || `${tabId}-container`;
    }

    applyContainerWidth(tableContainer) {
        if (!tableContainer) return;
        const tabulator = tableContainer.querySelector('.tabulator');
        if (window.innerWidth <= 1024) {
            tableContainer.style.width = '100%';
            tableContainer.style.maxWidth = '100vw';
            tableContainer.style.overflowX = 'hidden';
            if (tabulator) { tabulator.style.width = '100%'; tabulator.style.minWidth = '0'; tabulator.style.maxWidth = '100%'; }
        } else {
            tableContainer.style.width = 'fit-content';
            tableContainer.style.maxWidth = 'none';
            tableContainer.style.overflowX = '';
            if (tabulator) { tabulator.style.width = ''; tabulator.style.minWidth = ''; tabulator.style.maxWidth = ''; }
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
                try {
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    document.querySelectorAll('.table-container').forEach(c => { c.classList.remove('active-table'); c.classList.add('inactive-table'); c.style.display = 'none'; });
                    const targetContainer = document.getElementById(self.getContainerIdForTab(targetTab));
                    if (targetContainer) { targetContainer.classList.remove('inactive-table'); targetContainer.classList.add('active-table'); targetContainer.style.display = 'block'; }
                    self.currentActiveTab = targetTab;
                    self.initializeTab(targetTab);
                    const targetTableWrapper = self.tables[targetTab];
                    if (targetTableWrapper && targetTableWrapper.table) {
                        setTimeout(() => {
                            targetTableWrapper.table.redraw(true);
                            self.applyContainerWidth(targetContainer);
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    if (targetTableWrapper.forceRecalculateWidths) {
                                        targetTableWrapper.forceRecalculateWidths();
                                    } else if (targetTableWrapper.calculateAndApplyWidths) {
                                        targetTableWrapper.calculateAndApplyWidths();
                                    }
                                });
                            });
                        }, 100);
                    }
                } catch (error) {
                    console.error("TabManager: Error during tab switch:", error);
                } finally {
                    self.isTransitioning = false;
                }
            });
        });
    }

    initializeTab(tabId) {
        if (this.tabInitialized[tabId]) return;
        const table = this.tables[tabId];
        if (!table) return;
        try {
            table.initialize();
            this.tabInitialized[tabId] = true;
            console.log(`TabManager: ${tabId} initialized`);
            const self = this;
            setTimeout(() => {
                const tableContainer = table.table?.element?.closest('.table-container');
                self.applyContainerWidth(tableContainer);
                requestAnimationFrame(() => {
                    if (table.forceRecalculateWidths) { table.forceRecalculateWidths(); }
                    else if (table.calculateAndApplyWidths) { table.calculateAndApplyWidths(); }
                });
            }, 200);
        } catch (error) {
            console.error(`TabManager: Error initializing ${tabId}:`, error);
        }
    }
}
