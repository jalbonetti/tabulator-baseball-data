// components/tabManager.js - FIXED VERSION WITH SCROLL POSITION PRESERVATION
export class TabManager {
    constructor(tables) {
        this.tables = tables; // { table0: tableInstance, table1: tableInstance, ..., table6: tableInstance }
        this.currentActiveTab = 'table0';
        this.scrollPositions = {}; // Store scroll positions for each tab
        this.setupTabSwitching();
    }

    setupTabSwitching() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                e.preventDefault();
                e.stopPropagation();
                
                var targetTab = e.target.dataset.tab;
                console.log('Switching to tab:', targetTab);
                
                // Save current scroll position
                this.scrollPositions[this.currentActiveTab] = {
                    window: window.scrollY,
                    table: this.getTableScrollPosition(this.currentActiveTab)
                };
                
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
                    table6: document.getElementById('table6-container')
                };
                
                // Hide all containers
                Object.values(containers).forEach(container => {
                    if (container) {
                        container.className = 'table-container inactive-table';
                    }
                });
                
                // Show target container
                if (containers[targetTab]) {
                    containers[targetTab].className = 'table-container active-table';
                    this.currentActiveTab = targetTab;
                    
                    setTimeout(() => {
                        if (this.tables[targetTab]) {
                            this.tables[targetTab].redraw();
                        }
                        
                        // Restore scroll positions
                        if (this.scrollPositions[targetTab]) {
                            window.scrollTo(0, this.scrollPositions[targetTab].window || 0);
                            this.setTableScrollPosition(targetTab, this.scrollPositions[targetTab].table || 0);
                        }
                    }, 100);
                }
            }
        });
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
            
            // Create tabs container with all tabs - Matchups now first
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
