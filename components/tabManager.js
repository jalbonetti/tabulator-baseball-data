// components/tabManager.js - UPDATED VERSION WITH BETTER STATE MANAGEMENT
export class TabManager {
    constructor(tables) {
        this.tables = tables; // { table0: tableInstance, table1: tableInstance, ..., table9: tableInstance }
        this.currentActiveTab = 'table0';
        this.scrollPositions = {}; // Store scroll positions for each tab
        this.tableStates = {}; // Store table states for each tab
        this.setupTabSwitching();
    }

    setupTabSwitching() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                e.stopPropagation();
                
                var targetTab = e.target.dataset.tab;
                console.log('Switching to tab:', targetTab);
                
                // Save current tab state
                this.saveCurrentTabState();
                
                // Update button states
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Get all containers
                var containers = {
                    table0: document.getElementById('table0-container'),
                    table1: document.getElementById('table1-container'),
                    table2: document.getElementById('table2-container'),
                    table3: document.getElementById('table3-container'),
                    table4: document.getElementById('table4-container'),
                    table5: document.getElementById('table5-container'),
                    table6: document.getElementById('table6-container'),
                    table7: document.getElementById('table7-container'),
                    table8: document.getElementById('table8-container'),
                    table9: document.getElementById('table9-container')
                };
                
                // Hide all containers
                Object.entries(containers).forEach(([tabId, container]) => {
                    if (container) {
                        container.className = 'table-container inactive-table';
                        container.style.display = 'none';
                    }
                });
                
                // Show target container
                if (containers[targetTab]) {
                    containers[targetTab].className = 'table-container active-table';
                    containers[targetTab].style.display = 'block';
                    this.currentActiveTab = targetTab;
                    
                    // Restore tab state and redraw
                    setTimeout(() => {
                        this.restoreTabState(targetTab);
                    }, 100);
                }
            }
        });
    }

    saveCurrentTabState() {
        // Save scroll positions
        this.scrollPositions[this.currentActiveTab] = {
            window: window.scrollY,
            table: this.getTableScrollPosition(this.currentActiveTab)
        };
        
        // Save expanded rows state for matchups table
        if (this.currentActiveTab === 'table0' && this.tables[this.currentActiveTab]) {
            const expandedRows = new Set();
            const tableWrapper = this.tables[this.currentActiveTab];
            const tableInstance = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
            
            if (tableInstance && tableInstance.getRows) {
                const rows = tableInstance.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    if (data._expanded) {
                        expandedRows.add(data["Matchup Game ID"] || data["_id"]);
                    }
                });
                
                this.tableStates[this.currentActiveTab] = {
                    expandedRows: Array.from(expandedRows)
                };
            }
        }
    }

    restoreTabState(tabId) {
        const tableWrapper = this.tables[tabId];
        
        if (tableWrapper) {
            // First redraw the table
            if (tableWrapper.redraw) {
                tableWrapper.redraw(); // Call the wrapper's redraw method
            }
            
            // Get the actual Tabulator instance
            const tableInstance = tableWrapper.getTabulator ? tableWrapper.getTabulator() : tableWrapper.table;
            
            // Restore expanded rows for matchups table
            if (tabId === 'table0' && this.tableStates[tabId] && this.tableStates[tabId].expandedRows && tableInstance) {
                setTimeout(() => {
                    const expandedRows = this.tableStates[tabId].expandedRows;
                    if (tableInstance.getRows && expandedRows.length > 0) {
                        const rows = tableInstance.getRows();
                        rows.forEach(row => {
                            const data = row.getData();
                            const rowId = data["Matchup Game ID"] || data["_id"];
                            if (expandedRows.includes(rowId) && !data._expanded) {
                                data._expanded = true;
                                row.reformat();
                            }
                        });
                    }
                }, 200);
            }
            
            // Restore scroll positions
            if (this.scrollPositions[tabId]) {
                setTimeout(() => {
                    window.scrollTo(0, this.scrollPositions[tabId].window || 0);
                    this.setTableScrollPosition(tabId, this.scrollPositions[tabId].table || 0);
                }, 300);
            }
        }
    }

    getTableScrollPosition(tabId) {
        const container = document.getElementById(`${tabId}-container`);
        if (container) {
            const tableHolder = container.querySelector('.tabulator-tableHolder');
            return tableHolder ? tableHolder.scrollTop : 0;
        }
        return 0;
    }

    setTableScrollPosition(tabId, position) {
        const container = document.getElementById(`${tabId}-container`);
        if (container) {
            const tableHolder = container.querySelector('.tabulator-tableHolder');
            if (tableHolder) {
                tableHolder.scrollTop = position;
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
            
            // Create table containers wrapper
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            
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
}
