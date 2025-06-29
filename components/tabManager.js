// components/tabManager.js
export class TabManager {
    constructor(tables) {
        this.tables = tables; // { table1: tableInstance, table2: tableInstance }
        this.currentActiveTab = 'table1';
        this.setupTabSwitching();
    }

    setupTabSwitching() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                var targetTab = e.target.dataset.tab;
                console.log('Switching to tab:', targetTab);
                
                // Update button states
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Get containers
                var table1Container = document.getElementById('table1-container');
                var table2Container = document.getElementById('table2-container');
                
                // Hide all containers
                if (table1Container) {
                    table1Container.className = 'table-container inactive-table';
                }
                if (table2Container) {
                    table2Container.className = 'table-container inactive-table';
                }
                
                // Show target container
                if (targetTab === 'table1' && table1Container) {
                    table1Container.className = 'table-container active-table';
                    this.currentActiveTab = 'table1';
                    
                    setTimeout(() => {
                        if (this.tables.table1) {
                            this.tables.table1.redraw();
                        }
                    }, 100);
                    
                } else if (targetTab === 'table2' && table2Container) {
                    table2Container.className = 'table-container active-table';
                    this.currentActiveTab = 'table2';
                    
                    setTimeout(() => {
                        if (this.tables.table2) {
                            this.tables.table2.redraw();
                        }
                    }, 100);
                }
            }
        });
    }

    createTabStructure(tableElement) {
        if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
            
            // Create tabs container
            var tabsContainer = document.createElement('div');
            tabsContainer.className = 'tabs-container';
            tabsContainer.innerHTML = `
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab="table1">Batter Prop Clearances</button>
                    <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
                </div>
            `;
            
            // Create table containers wrapper
            var tablesContainer = document.createElement('div');
            tablesContainer.className = 'tables-container';
            tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
            
            // Move original table into first container
            var table1Container = document.createElement('div');
            table1Container.className = 'table-container active-table';
            table1Container.id = 'table1-container';
            table1Container.style.cssText = 'width: 100%; display: block;';
            
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
            
            tablesContainer.appendChild(table1Container);
            tablesContainer.appendChild(table2Container);
        }
    }
}
