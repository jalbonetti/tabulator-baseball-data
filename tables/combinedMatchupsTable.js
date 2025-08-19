// tables/combinedMatchupsTable.js - COMPLETE VERSION WITH ALL FIXES
// tables/combinedMatchupsTable.js - COMPLETE VERSION WITH ALL FIXES
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { formatRatio, formatDecimal } from '../shared/utils.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.parkFactorsCache = new Map();
        this.pitcherStatsCache = new Map();
        this.batterMatchupsCache = new Map();
        this.bullpenMatchupsCache = new Map();
        
        // FIXED: Reduced widths to prevent overlap
        this.subtableConfig = {
            parkFactorsContainerWidth: 480, // Reduced from 530
            weatherContainerWidth: 480, // Reduced from 530
            containerGap: 40, // Increased gap from 30
            maxTotalWidth: 1000, // Reduced from 1100
            
            parkFactorsColumns: {
                split: 90,
                H: 50,
                "1B": 50,
                "2B": 50,
                "3B": 50,
                HR: 50,
                R: 50,
                BB: 50,
                SO: 50
            },
            
            statTableColumns: {
                name: 280,
                split: 160,
                tbf_pa: 60,
                ratio: 70,
                stat: 50,
                era_rbi: 60,
                so: 60,
                h_pa: 70,
                pa: 60
            }
        };
    }

    getColumns() {
        return [
            {
                title: "ID",
                field: "Matchup Game ID",
                visible: false,
                sorter: "number",
                resizable: false
            },
            {
                title: "Team", 
                field: "Matchup Team",
                width: 340,
                headerFilter: true,
                headerFilterPlaceholder: "Search teams...",
                sorter: "string",
                resizable: false,
                formatter: (cell, formatterParams, onRendered) => {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const expanded = row.getData()._expanded || false;
                    
                    const teamName = value; // Keep full team name
                    
                    onRendered(function() {
                        try {
                            const cellElement = cell.getElement();
                            if (cellElement) {
                                cellElement.innerHTML = '';
                                
                                const container = document.createElement("div");
                                container.style.display = "flex";
                                container.style.alignItems = "center";
                                container.style.cursor = "pointer";
                                
                                const expander = document.createElement("span");
                                expander.innerHTML = expanded ? "−" : "+";
                                expander.style.marginRight = "8px";
                                expander.style.fontWeight = "bold";
                                expander.style.color = "#007bff";
                                expander.style.fontSize = "14px";
                                expander.style.minWidth = "12px";
                                expander.classList.add("row-expander");
                                
                                const textSpan = document.createElement("span");
                                textSpan.textContent = teamName;
                                
                                container.appendChild(expander);
                                container.appendChild(textSpan);
                                
                                cellElement.appendChild(container);
                                cellElement.style.textAlign = "left";
                            }
                        } catch (error) {
                            console.error("Error in team formatter:", error);
                        }
                    });
                    
                    return (expanded ? "− " : "+ ") + teamName;
                }
            },
            {
                title: "Game", 
                field: "Matchup Game",
                width: 340,
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                resizable: false
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 110,
                hozAlign: "center",
                headerSort: false,
                resizable: false
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 110,
                hozAlign: "center",
                headerSort: false,
                resizable: false
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 250,
                hozAlign: "center",
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                resizable: false,
                formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return "";
                    
                    const color = value.toLowerCase().includes('confirmed') ? '#28a745' : '#6c757d';
                    return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${value}</span>`;
                }
            }
        ];
    }


// Update createMatchupsSubtable to fix weather overlap:
createMatchupsSubtable(container, data) {
    const weatherData = [
        data["Matchup Weather 1"] || "No weather data",
        data["Matchup Weather 2"] || "",
        data["Matchup Weather 3"] || "",
        data["Matchup Weather 4"] || ""
    ].filter(d => d); // Filter out empty strings

    const isTeamAway = this.isTeamAway(data["Matchup Game"]);
    const opposingPitcherLocation = isTeamAway ? "at Home" : "Away";
    
    let ballparkName = data["Matchup Ballpark"] || "Unknown Ballpark";
    let hasRetractableRoof = false;
    
    if (ballparkName.includes("(Retractable Roof)")) {
        hasRetractableRoof = true;
        ballparkName = ballparkName.replace("(Retractable Roof)", "").trim();
    }
    
    const weatherTitle = hasRetractableRoof ? "Weather (Retractable Roof)" : "Weather";
    
    const totalWidth = this.subtableConfig.maxTotalWidth;

    let tableHTML = `
        <div style="display: flex; justify-content: space-between; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 20px; width: ${totalWidth}px; max-width: 100%; overflow: visible; margin-left: auto; margin-right: auto; position: relative;">
            <!-- Park Factors Section -->
            <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.parkFactorsContainerWidth}px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${ballparkName} Park Factors</h5>
                <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
            </div>

            <!-- Weather Section -->
            <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.weatherContainerWidth}px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${weatherTitle}</h5>
                <div style="font-size: 12px; color: #333;">
                    ${weatherData.map(w => `<div style="padding: 8px 12px; border-bottom: 1px solid #eee;">${w}</div>`).join('')}
                </div>
            </div>
        </div>
    `;

    // Rest of the HTML generation remains the same but use consistent column widths...
    // Continue with the rest of the subtables
}

// Update createBatterMatchupsTable to use consistent column widths:
createBatterMatchupsTable(data) {
    if (data._batterMatchups && data._batterMatchups.length > 0) {
        // ... existing setup code ...

        const batterTable = new Tabulator(`#batter-matchups-subtable-${data["Matchup Game ID"]}`, {
            layout: "fitData",
            data: tableData,
            columns: [
                {
                    title: "Name", 
                    field: "name", 
                    width: this.subtableConfig.statTableColumns.name, 
                    headerSort: false,
                    formatter: function(cell) {
                        // ... existing formatter ...
                    }
                },
                {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                {title: "PA", field: "PA", width: this.subtableConfig.statTableColumns.pa, hozAlign: "center", headerSort: false},
                {title: "H/PA", field: "H/PA", width: this.subtableConfig.statTableColumns.h_pa, hozAlign: "center", headerSort: false},
                {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "RBI", field: "RBI", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
            ],
            height: false,
            headerHeight: 30,
            rowHeight: 28
        });

        // ... rest of the click handler ...
    }
}

initialize() {
        console.log('Initializing enhanced matchups table with correct formatters...');
        
        // Add loading indicator
        const element = document.querySelector(this.elementId);
        if (element && !element.querySelector('.loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);';
            loadingDiv.innerHTML = `
                <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>Loading matchups data...</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Please wait while data loads...</div>
            `;
            element.appendChild(loadingDiv);
            
            // Add spinner animation if not already present
            if (!document.querySelector('#matchups-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'matchups-spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            width: "1200px",
            maxWidth: "1200px",
            height: "600px",
            layout: "fitData",
            placeholder: "Loading matchups data...",
            headerVisible: true,
            headerHozAlign: "center",
            renderVertical: "basic",
            renderHorizontal: "basic",
            layoutColumnsOnNewData: false,
            virtualDomBuffer: 100,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            initialSort: [
                {column: "Matchup Game ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`✅ Matchups data successfully loaded: ${data.length} rows`);
                data.forEach(row => {
                    row._expanded = false;
                    row._dataFetched = false;
                });
                this.matchupsData = data;
                
                // Remove loading indicator
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                }
            },
            ajaxError: (error) => {
                console.error("Error loading Matchups data:", error);
                
                // Update loading indicator to show error
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.innerHTML = `
                            <div style="color: red; font-weight: bold;">Error loading matchups data</div>
                            <div style="font-size: 12px; margin-top: 10px;">Please refresh the page or try again later.</div>
                            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
                        `;
                    }
                }
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Enhanced matchups table built successfully");
            
            const tableElement = document.querySelector(this.elementId);
            if (tableElement) {
                tableElement.style.overflow = "hidden";
                tableElement.style.maxWidth = "1200px";
                
                const tableHolder = tableElement.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.style.overflowX = "hidden";
                    tableHolder.style.maxWidth = "100%";
                }
            }
        });
    }


    // Override destroy method to properly clean up
    destroy() {
        // Remove any loading indicators
        const element = document.querySelector(this.elementId);
        if (element) {
            const loadingDiv = element.querySelector('.loading-indicator');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
        
        // Call parent destroy
        super.destroy();
    }

    // Override setupRowExpansion to handle async data fetching and use base class state management
    setupRowExpansion() {
        const self = this;
        
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                e.preventDefault();
                e.stopPropagation();
                
                // Don't process clicks during state restoration
                if (self.isRestoringState) {
                    console.log("Ignoring click during state restoration");
                    return;
                }
                
                const row = cell.getRow();
                const data = row.getData();
                const matchupId = data["Matchup Game ID"];
                
                const scrollPos = this.getTableScrollPosition();
                
                // Fetch data if not already fetched
                if (!data._expanded && !data._dataFetched) {
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳';
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    const matchupData = await this.fetchMatchupData(matchupId);
                    
                    Object.assign(data, {
                        _parkFactors: matchupData.parkFactors,
                        _pitcherStats: matchupData.pitcherStats,
                        _batterMatchups: matchupData.batterMatchups,
                        _bullpenMatchups: matchupData.bullpenMatchups,
                        _dataFetched: true
                    });
                    
                    row.update(data);
                    
                    if (expanderIcon) {
                        expanderIcon.style.animation = '';
                    }
                }
                
                // Toggle expansion using the new global state system
                data._expanded = !data._expanded;
                
                // Update global state using base class method
                const rowId = self.generateRowId(data);
                const globalState = self.getGlobalState();
                
                if (data._expanded) {
                    globalState.set(rowId, {
                        timestamp: Date.now(),
                        data: data
                    });
                } else {
                    // IMPORTANT: Remove from global state when collapsing
                    globalState.delete(rowId);
                }
                
                // Update the global state
                self.setGlobalState(globalState);
                
                console.log(`Matchup row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                
                row.update(data);
                
                requestAnimationFrame(() => {
                    row.reformat();
                    
                    requestAnimationFrame(() => {
                        this.setTableScrollPosition(scrollPos);
                        
                        setTimeout(() => {
                            try {
                                const cellElement = cell.getElement();
                                if (cellElement) {
                                    const expanderIcon = cellElement.querySelector('.row-expander');
                                    if (expanderIcon) {
                                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        }, 50);
                    });
                });
            }
        });
    }

    // Add helper methods to access global state
    getGlobalState() {
        // Access the global state map
        if (typeof GLOBAL_EXPANDED_STATE !== 'undefined' && GLOBAL_EXPANDED_STATE.has(this.elementId)) {
            return GLOBAL_EXPANDED_STATE.get(this.elementId);
        }
        const newState = new Map();
        if (typeof GLOBAL_EXPANDED_STATE !== 'undefined') {
            GLOBAL_EXPANDED_STATE.set(this.elementId, newState);
        }
        return newState;
    }
    
    setGlobalState(state) {
        if (typeof GLOBAL_EXPANDED_STATE !== 'undefined') {
            GLOBAL_EXPANDED_STATE.set(this.elementId, state);
        }
    }

    // Override saveState to handle matchup-specific data
    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        // Save scroll position
        const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.lastScrollPosition = tableHolder.scrollTop;
        }
        
        // Get or create global state for this table
        const globalState = this.getGlobalState();
        
        // Clear and rebuild global expanded state
        globalState.clear();
        
        const rows = this.table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                globalState.set(id, {
                    timestamp: Date.now(),
                    data: data,
                    dataFetched: data._dataFetched || false
                });
            }
        });
        
        // Update global state
        this.setGlobalState(globalState);
        
        console.log(`Saved ${globalState.size} expanded matchup rows`);
    }

    // Override restoreState to handle async data fetching
    restoreState() {
        if (!this.table) return;
        
        const globalState = this.getGlobalState();
        
        if (!globalState || globalState.size === 0) {
            // Just restore scroll position
            if (this.lastScrollPosition > 0) {
                setTimeout(() => {
                    const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                    if (tableHolder) {
                        tableHolder.scrollTop = this.lastScrollPosition;
                    }
                }, 500);
            }
            return;
        }
        
        console.log(`Restoring ${globalState.size} expanded matchup rows`);
        
        // Set flag to indicate we're restoring
        this.isRestoringState = true;
        
        // Apply the global state with async data fetching
        const applyStateAttempt = async (attemptNum) => {
            if (attemptNum > 3) {
                // Clear restoration flag after final attempt
                this.isRestoringState = false;
                return;
            }
            
            const rows = this.table.getRows();
            let restoredCount = 0;
            
            for (const row of rows) {
                const data = row.getData();
                const rowId = this.generateRowId(data);
                
                if (globalState.has(rowId)) {
                    const savedState = globalState.get(rowId);
                    
                    // Fetch data if needed
                    if (!data._dataFetched && savedState.dataFetched) {
                        const matchupData = await this.fetchMatchupData(data["Matchup Game ID"]);
                        Object.assign(data, {
                            _parkFactors: matchupData.parkFactors,
                            _pitcherStats: matchupData.pitcherStats,
                            _batterMatchups: matchupData.batterMatchups,
                            _bullpenMatchups: matchupData.bullpenMatchups,
                            _dataFetched: true
                        });
                    }
                    
                    if (!data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        restoredCount++;
                        
                        // Delay reformat to ensure it happens after data update
                        setTimeout(() => {
                            row.reformat();
                            
                            // Update icon
                            const cells = row.getCells();
                            const teamCell = cells.find(cell => cell.getField() === "Matchup Team");
                            if (teamCell) {
                                const cellElement = teamCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "−";
                                }
                            }
                        }, 50 * attemptNum);
                    }
                }
            }
            
            if (restoredCount > 0) {
                console.log(`Restoration attempt ${attemptNum}: restored ${restoredCount} matchup rows`);
            }
            
            // Try again after a delay if needed
            if (restoredCount < globalState.size && attemptNum < 3) {
                setTimeout(() => {
                    applyStateAttempt(attemptNum + 1);
                }, 300 * attemptNum);
            } else {
                // Clear restoration flag
                this.isRestoringState = false;
            }
        };
        
        // Start restoration attempts
        setTimeout(() => {
            applyStateAttempt(1);
        }, 100);
        
        // Restore scroll position
        if (this.lastScrollPosition > 0) {
            setTimeout(() => {
                const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }
            }, 400);
        }
    }

   getColumns() {
    return [
        {
            title: "ID",
            field: "Matchup Game ID",
            visible: false,
            sorter: "number",
            resizable: false // Disable resizing
        },
        {
            title: "Team", 
            field: "Matchup Team",
            width: 340,
            headerFilter: true,
            headerFilterPlaceholder: "Search teams...",
            sorter: "string",
            resizable: false, // DISABLE RESIZING
            formatter: (cell, formatterParams, onRendered) => {
                const value = cell.getValue();
                const row = cell.getRow();
                const expanded = row.getData()._expanded || false;
                
                // FIXED: Show full team name, not abbreviation
                const teamName = value; // Use the full team name as-is
                
                onRendered(function() {
                    try {
                        const cellElement = cell.getElement();
                        if (cellElement) {
                            cellElement.innerHTML = '';
                            
                            const container = document.createElement("div");
                            container.style.display = "flex";
                            container.style.alignItems = "center";
                            container.style.cursor = "pointer";
                            
                            const expander = document.createElement("span");
                            expander.innerHTML = expanded ? "−" : "+";
                            expander.style.marginRight = "8px";
                            expander.style.fontWeight = "bold";
                            expander.style.color = "#007bff";
                            expander.style.fontSize = "14px";
                            expander.style.minWidth = "12px";
                            expander.classList.add("row-expander");
                            
                            const textSpan = document.createElement("span");
                            textSpan.textContent = teamName; // Full team name
                            
                            container.appendChild(expander);
                            container.appendChild(textSpan);
                            
                            cellElement.appendChild(container);
                            cellElement.style.textAlign = "left";
                        }
                    } catch (error) {
                        console.error("Error in team formatter:", error);
                    }
                });
                
                return (expanded ? "− " : "+ ") + teamName; // Full team name
            }
        },
        {
            title: "Game", 
            field: "Matchup Game",
            width: 340,
            headerFilter: createCustomMultiSelect,
            headerSort: false,
            resizable: false // DISABLE RESIZING
        },
        {
            title: "Spread", 
            field: "Matchup Spread",
            width: 110,
            hozAlign: "center",
            headerSort: false,
            resizable: false // DISABLE RESIZING
        },
        {
            title: "Total", 
            field: "Matchup Total",
            width: 110,
            hozAlign: "center",
            headerSort: false,
            resizable: false // DISABLE RESIZING
        },
        {
            title: "Lineup Status",
            field: "Matchup Lineup Status",
            width: 250,
            hozAlign: "center",
            headerFilter: createCustomMultiSelect,
            headerSort: false,
            resizable: false, // DISABLE RESIZING
            formatter: (cell) => {
                const value = cell.getValue();
                if (!value) return "";
                
                const color = value.toLowerCase().includes('confirmed') ? '#28a745' : '#6c757d';
                return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${value}</span>`;
            }
        }
    ];

createMatchupsSubtable(container, data) {
    const weatherData = [
        data["Matchup Weather 1"] || "No weather data",
        data["Matchup Weather 2"] || "",
        data["Matchup Weather 3"] || "",
        data["Matchup Weather 4"] || ""
    ].filter(d => d);

    const isTeamAway = this.isTeamAway(data["Matchup Game"]);
    const opposingPitcherLocation = isTeamAway ? "at Home" : "Away";
    
    let ballparkName = data["Matchup Ballpark"] || "Unknown Ballpark";
    let hasRetractableRoof = false;
    
    if (ballparkName.includes("(Retractable Roof)")) {
        hasRetractableRoof = true;
        ballparkName = ballparkName.replace("(Retractable Roof)", "").trim();
    }
    
    const weatherTitle = hasRetractableRoof ? "Weather (Retractable Roof)" : "Weather";
    
    // FIXED: Use proper widths and add clear:both to prevent overlap
    let tableHTML = `
        <div style="display: flex; justify-content: center; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 20px; width: ${this.subtableConfig.maxTotalWidth}px; max-width: 100%; margin-left: auto; margin-right: auto; clear: both;">
            <!-- Park Factors Section -->
            <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.parkFactorsContainerWidth}px; min-width: ${this.subtableConfig.parkFactorsContainerWidth}px; max-width: ${this.subtableConfig.parkFactorsContainerWidth}px; flex: 0 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${ballparkName} Park Factors</h5>
                <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
            </div>

            <!-- Weather Section -->
            <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.weatherContainerWidth}px; min-width: ${this.subtableConfig.weatherContainerWidth}px; max-width: ${this.subtableConfig.weatherContainerWidth}px; flex: 0 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${weatherTitle}</h5>
                <div style="font-size: 12px; color: #333;">
                    ${weatherData.map(w => `<div style="padding: 8px 12px; border-bottom: 1px solid #eee; word-wrap: break-word;">${w}</div>`).join('')}
                </div>
            </div>
        </div>
    `;

        if (data._pitcherStats && data._pitcherStats.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Starting Pitcher</h4>
                    <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._batterMatchups && data._batterMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Starting Lineup</h4>
                    <div id="batter-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Bullpen</h4>
                    <div id="bullpen-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        setTimeout(() => {
            this.createParkFactorsTable(data);
            this.createPitcherStatsTable(data, opposingPitcherLocation);
            this.createBatterMatchupsTable(data);
            this.createBullpenMatchupsTable(data, opposingPitcherLocation);
        }, 50);
    }

    createParkFactorsTable(data) {
        if (data._parkFactors && data._parkFactors.length > 0) {
            const splitIdMap = {
                'A': 'All',
                'R': 'Righties',
                'L': 'Lefties'
            };

            const sortedParkFactors = data._parkFactors.sort((a, b) => {
                const order = { 'A': 0, 'R': 1, 'L': 2 };
                return order[a["Park Factor Split ID"]] - order[b["Park Factor Split ID"]];
            });

            const totalColumnsWidth = Object.values(this.subtableConfig.parkFactorsColumns)
                .reduce((sum, width) => sum + width, 0);

            const columns = [
                {title: "Split", field: "split", width: this.subtableConfig.parkFactorsColumns.split, headerSort: false, hozAlign: "center"},
                {title: "H", field: "H", width: this.subtableConfig.parkFactorsColumns.H, hozAlign: "center", headerSort: false},
                {title: "1B", field: "1B", width: this.subtableConfig.parkFactorsColumns["1B"], hozAlign: "center", headerSort: false},
                {title: "2B", field: "2B", width: this.subtableConfig.parkFactorsColumns["2B"], hozAlign: "center", headerSort: false},
                {title: "3B", field: "3B", width: this.subtableConfig.parkFactorsColumns["3B"], hozAlign: "center", headerSort: false},
                {title: "HR", field: "HR", width: this.subtableConfig.parkFactorsColumns.HR, hozAlign: "center", headerSort: false},
                {title: "R", field: "R", width: this.subtableConfig.parkFactorsColumns.R, hozAlign: "center", headerSort: false},
                {title: "BB", field: "BB", width: this.subtableConfig.parkFactorsColumns.BB, hozAlign: "center", headerSort: false},
                {title: "SO", field: "SO", width: this.subtableConfig.parkFactorsColumns.SO, hozAlign: "center", headerSort: false}
            ];

            new Tabulator(`#park-factors-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                width: totalColumnsWidth,
                data: sortedParkFactors.map(pf => ({
                    split: splitIdMap[pf["Park Factor Split ID"]] || pf["Park Factor Split ID"],
                    H: pf["Park Factor H"],
                    "1B": pf["Park Factor 1B"],
                    "2B": pf["Park Factor 2B"],
                    "3B": pf["Park Factor 3B"],
                    HR: pf["Park Factor HR"],
                    R: pf["Park Factor R"],
                    BB: pf["Park Factor BB"],
                    SO: pf["Park Factor SO"]
                })),
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 26,
                resizableColumns: false
            });
        }
    }

    createPitcherStatsTable(data, opposingLocationText) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const pitcherName = data._pitcherStats[0]["Starter Name & Hand"] || "Unknown Pitcher";
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingLocationText}`,
                "vs R @": `vs Righties ${opposingLocationText}`,
                "vs L @": `vs Lefties ${opposingLocationText}`
            };

            const sortedPitcherStats = data._pitcherStats
                .sort((a, b) => {
                    const aIndex = splitOrder.indexOf(a["Starter Split ID"]);
                    const bIndex = splitOrder.indexOf(b["Starter Split ID"]);
                    return aIndex - bIndex;
                });

            const mainRowData = sortedPitcherStats.find(stat => stat["Starter Split ID"] === "Full Season");
            
            if (mainRowData) {
                const tableData = [{
                    _id: `${data["Matchup Game ID"]}-main`,
                    _isExpanded: false,
                    _rowType: 'main',
                    _sortOrder: 0,
                    name: pitcherName,
                    split: "Full Season",
                    TBF: mainRowData["Starter TBF"],
                    "H/TBF": formatRatio(mainRowData["Starter H/TBF"], 3),
                    H: mainRowData["Starter H"],
                    "1B": mainRowData["Starter 1B"],
                    "2B": mainRowData["Starter 2B"],
                    "3B": mainRowData["Starter 3B"],
                    HR: mainRowData["Starter HR"],
                    R: mainRowData["Starter R"],
                    ERA: formatDecimal(mainRowData["Starter ERA"], 2),
                    BB: mainRowData["Starter BB"],
                    SO: mainRowData["Starter SO"]
                }];

                const pitcherTable = new Tabulator(`#pitcher-stats-subtable-${data["Matchup Game ID"]}`, {
                    layout: "fitData",
                    data: tableData,
                    columns: [
                        {
                            title: "Name", 
                            field: "name", 
                            width: this.subtableConfig.statTableColumns.name, 
                            headerSort: false,
                            formatter: function(cell) {
                                const rowData = cell.getRow().getData();
                                const value = cell.getValue();
                                
                                if (rowData._rowType === 'main') {
                                    const expanded = rowData._isExpanded || false;
                                    return `<div style="cursor: pointer; display: flex; align-items: center;">
                                        <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
                                        <span>${value}</span>
                                    </div>`;
                                }
                                return `<div style="margin-left: 30px;">${value}</div>`;
                            }
                        },
                        {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                        {title: "TBF", field: "TBF", width: this.subtableConfig.statTableColumns.tbf_pa, hozAlign: "center", headerSort: false},
                        {title: "H/TBF", field: "H/TBF", width: this.subtableConfig.statTableColumns.ratio, hozAlign: "center", headerSort: false},
                        {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "ERA", field: "ERA", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                        {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });

                pitcherTable.on("cellClick", function(e, cell) {
                    if (cell.getField() === "name") {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const row = cell.getRow();
                        const rowData = row.getData();
                        
                        if (rowData._rowType === 'main') {
                            rowData._isExpanded = !rowData._isExpanded;
                            row.update(rowData);
                            
                            const cellElement = cell.getElement();
                            const expander = cellElement.querySelector('.subtable-expander');
                            if (expander) {
                                expander.innerHTML = rowData._isExpanded ? '−' : '+';
                            }
                            
                            if (rowData._isExpanded) {
                                const allData = pitcherTable.getData();
                                
                                const childRows = [];
                                ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                    const statData = sortedPitcherStats.find(s => s["Starter Split ID"] === splitId);
                                    if (statData) {
                                        childRows.push({
                                            _id: `${data["Matchup Game ID"]}-child-${index}`,
                                            _rowType: 'child',
                                            _parentId: rowData._id,
                                            _sortOrder: index + 1,
                                            name: pitcherName,
                                            split: splitMap[splitId],
                                            TBF: statData["Starter TBF"],
                                            "H/TBF": formatRatio(statData["Starter H/TBF"], 3),
                                            H: statData["Starter H"],
                                            "1B": statData["Starter 1B"],
                                            "2B": statData["Starter 2B"],
                                            "3B": statData["Starter 3B"],
                                            HR: statData["Starter HR"],
                                            R: statData["Starter R"],
                                            ERA: formatDecimal(statData["Starter ERA"], 2),
                                            BB: statData["Starter BB"],
                                            SO: statData["Starter SO"]
                                        });
                                    }
                                });
                                
                                const parentIndex = allData.findIndex(d => d._id === rowData._id);
                                allData.splice(parentIndex + 1, 0, ...childRows);
                                
                                pitcherTable.replaceData(allData);
                                
                            } else {
                                const filteredData = pitcherTable.getData().filter(d => 
                                    !(d._rowType === 'child' && d._parentId === rowData._id)
                                );
                                pitcherTable.replaceData(filteredData);
                            }
                        }
                    }
                });
            }
        }
    }

    createBatterMatchupsTable(data) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            const containerId = `batter-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) {
                console.error(`Container element not found: ${containerId}`);
                return;
            }
            
            const isTeamAway = this.isTeamAway(data["Matchup Game"]);
            const batterLocationText = isTeamAway ? "Away" : "at Home";
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${batterLocationText}`,
                "vs R @": `vs Righties ${batterLocationText}`,
                "vs L @": `vs Lefties ${batterLocationText}`
            };
            
            const battersByOrder = {};
            data._batterMatchups.forEach(batter => {
                const nameHandSpot = batter["Batter Name & Hand & Spot"];
                const match = nameHandSpot.match(/(.+?)\s+(\d+)$/);
                if (match) {
                    const batterName = match[1];
                    const battingOrder = parseInt(match[2]);
                    
                    if (!battersByOrder[battingOrder]) {
                        battersByOrder[battingOrder] = {
                            name: batterName,
                            order: battingOrder,
                            splits: []
                        };
                    }
                    battersByOrder[battingOrder].splits.push(batter);
                }
            });
            
            const tableData = [];
            Object.keys(battersByOrder)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach((order, orderIndex) => {
                    const batterData = battersByOrder[order];
                    const fullSeasonData = batterData.splits.find(s => s["Batter Split ID"] === "Full Season");
                    
                    if (fullSeasonData) {
                        tableData.push({
                            _id: `${data["Matchup Game ID"]}-batter-${order}`,
                            _isExpanded: false,
                            _rowType: 'main',
                            _batterOrder: order,
                            _sortOrder: orderIndex * 10,
                            name: `${batterData.name} ${order}`,
                            split: "Full Season",
                            PA: fullSeasonData["Batter PA"],
                            "H/PA": formatRatio(fullSeasonData["Batter H/PA"], 3),
                            H: fullSeasonData["Batter H"],
                            "1B": fullSeasonData["Batter 1B"],
                            "2B": fullSeasonData["Batter 2B"],
                            "3B": fullSeasonData["Batter 3B"],
                            HR: fullSeasonData["Batter HR"],
                            R: fullSeasonData["Batter R"],
                            RBI: fullSeasonData["Batter RBI"],
                            BB: fullSeasonData["Batter BB"],
                            SO: fullSeasonData["Batter SO"],
                            _childData: batterData.splits
                        });
                    }
                });

            const batterTable = new Tabulator(`#batter-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                data: tableData,
                columns: [
                    {
                        title: "Name", 
                        field: "name", 
                        width: this.subtableConfig.statTableColumns.name, 
                        headerSort: false,
                        formatter: function(cell) {
                            const rowData = cell.getRow().getData();
                            const value = cell.getValue();
                            
                            if (rowData._rowType === 'main') {
                                const expanded = rowData._isExpanded || false;
                                return `<div style="cursor: pointer; display: flex; align-items: center;">
                                    <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                    {title: "PA", field: "PA", width: 50, hozAlign: "center", headerSort: false},
                    {title: "H/PA", field: "H/PA", width: 60, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: 50, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: 50, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: 50, hozAlign: "center", headerSort: false},
                    {title: "RBI", field: "RBI", width: 50, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: 50, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: 70, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });

            batterTable.on("cellClick", function(e, cell) {
                if (cell.getField() === "name") {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = cell.getRow();
                    const rowData = row.getData();
                    
                    if (rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        row.update(rowData);
                        
                        const cellElement = cell.getElement();
                        const expander = cellElement.querySelector('.subtable-expander');
                        if (expander) {
                            expander.innerHTML = rowData._isExpanded ? '−' : '+';
                        }
                        
                        if (rowData._isExpanded) {
                            const allData = batterTable.getData();
                            
                            const childRows = [];
                            ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                const statData = rowData._childData.find(s => s["Batter Split ID"] === splitId);
                                if (statData) {
                                    childRows.push({
                                        _id: `${data["Matchup Game ID"]}-batter-child-${rowData._batterOrder}-${index}`,
                                        _rowType: 'child',
                                        _parentId: rowData._id,
                                        _sortOrder: rowData._sortOrder + index + 1,
                                        name: `${rowData.name.replace(/ \d+$/, '')} ${rowData._batterOrder}`,
                                        split: splitMap[splitId],
                                        PA: statData["Batter PA"],
                                        "H/PA": formatRatio(statData["Batter H/PA"], 3),
                                        H: statData["Batter H"],
                                        "1B": statData["Batter 1B"],
                                        "2B": statData["Batter 2B"],
                                        "3B": statData["Batter 3B"],
                                        HR: statData["Batter HR"],
                                        R: statData["Batter R"],
                                        RBI: statData["Batter RBI"],
                                        BB: statData["Batter BB"],
                                        SO: statData["Batter SO"]
                                    });
                                }
                            });
                            
                            const parentIndex = allData.findIndex(d => d._id === rowData._id);
                            allData.splice(parentIndex + 1, 0, ...childRows);
                            
                            batterTable.replaceData(allData);
                            
                        } else {
                            const filteredData = batterTable.getData().filter(d => 
                                !(d._rowType === 'child' && d._parentId === rowData._id)
                            );
                            batterTable.replaceData(filteredData);
                        }
                    }
                }
            });
        }
    }

    createBullpenMatchupsTable(data, opposingLocationText) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingLocationText}`,
                "vs R @": `vs Righties ${opposingLocationText}`,
                "vs L @": `vs Lefties ${opposingLocationText}`
            };
            
            const groupedData = {
                "Righties": [],
                "Lefties": []
            };
            
            data._bullpenMatchups.forEach(bullpen => {
                const handNumber = bullpen["Bullpen Hand & Number"];
                const match = handNumber.match(/(\d+)\s+(Righties|Lefties)/);
                if (match) {
                    const handType = match[2];
                    groupedData[handType].push(bullpen);
                }
            });

            const tableData = [];
            const handOrder = ["Righties", "Lefties"];
            
            handOrder.forEach((handType, handIndex) => {
                const handData = groupedData[handType];
                if (handData && handData.length > 0) {
                    const fullSeasonData = handData.find(d => d["Bullpen Split ID"] === "Full Season");
                    
                    if (fullSeasonData) {
                        tableData.push({
                            _id: `${data["Matchup Game ID"]}-bullpen-${handType}`,
                            _isExpanded: false,
                            _rowType: 'main',
                            _handType: handType,
                            _sortOrder: handIndex * 10,
                            name: fullSeasonData["Bullpen Hand & Number"],
                            split: "Full Season",
                            TBF: fullSeasonData["Bullpen TBF"],
                            "H/TBF": formatRatio(fullSeasonData["Bullpen H/TBF"], 3),
                            H: fullSeasonData["Bullpen H"],
                            "1B": fullSeasonData["Bullpen 1B"],
                            "2B": fullSeasonData["Bullpen 2B"],
                            "3B": fullSeasonData["Bullpen 3B"],
                            HR: fullSeasonData["Bullpen HR"],
                            R: fullSeasonData["Bullpen R"],
                            ERA: formatDecimal(fullSeasonData["Bullpen ERA"], 2),
                            BB: fullSeasonData["Bullpen BB"],
                            SO: fullSeasonData["Bullpen SO"],
                            _childData: handData
                        });
                    }
                }
            });

            const bullpenTable = new Tabulator(`#bullpen-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                data: tableData,
                columns: [
                    {
                        title: "Type", 
                        field: "name", 
                        width: this.subtableConfig.statTableColumns.name, 
                        headerSort: false,
                        formatter: function(cell) {
                            const rowData = cell.getRow().getData();
                            const value = cell.getValue();
                            
                            if (rowData._rowType === 'main') {
                                const expanded = rowData._isExpanded || false;
                                return `<div style="cursor: pointer; display: flex; align-items: center;">
                                    <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                    {title: "TBF", field: "TBF", width: this.subtableConfig.statTableColumns.tbf_pa, hozAlign: "center", headerSort: false},
                    {title: "H/TBF", field: "H/TBF", width: this.subtableConfig.statTableColumns.ratio, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "ERA", field: "ERA", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });

            bullpenTable.on("cellClick", function(e, cell) {
                if (cell.getField() === "name") {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = cell.getRow();
                    const rowData = row.getData();
                    
                    if (rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        row.update(rowData);
                        
                        const cellElement = cell.getElement();
                        const expander = cellElement.querySelector('.subtable-expander');
                        if (expander) {
                            expander.innerHTML = rowData._isExpanded ? '−' : '+';
                        }
                        
                        if (rowData._isExpanded) {
                            const allData = bullpenTable.getData();
                            
                            const childRows = [];
                            ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                const statData = rowData._childData.find(s => s["Bullpen Split ID"] === splitId);
                                if (statData) {
                                    childRows.push({
                                        _id: `${data["Matchup Game ID"]}-bullpen-child-${rowData._handType}-${index}`,
                                        _rowType: 'child',
                                        _parentId: rowData._id,
                                        _sortOrder: rowData._sortOrder + index + 1,
                                        name: statData["Bullpen Hand & Number"],
                                        split: splitMap[splitId],
                                        TBF: statData["Bullpen TBF"],
                                        "H/TBF": formatRatio(statData["Bullpen H/TBF"], 3),
                                        H: statData["Bullpen H"],
                                        "1B": statData["Bullpen 1B"],
                                        "2B": statData["Bullpen 2B"],
                                        "3B": statData["Bullpen 3B"],
                                        HR: statData["Bullpen HR"],
                                        R: statData["Bullpen R"],
                                        ERA: formatDecimal(statData["Bullpen ERA"], 2),
                                        BB: statData["Bullpen BB"],
                                        SO: statData["Bullpen SO"]
                                    });
                                }
                            });
                            
                            const parentIndex = allData.findIndex(d => d._id === rowData._id);
                            allData.splice(parentIndex + 1, 0, ...childRows);
                            
                            bullpenTable.replaceData(allData);
                            
                        } else {
                            const filteredData = bullpenTable.getData().filter(d => 
                                !(d._rowType === 'child' && d._parentId === rowData._id)
                            );
                            bullpenTable.replaceData(filteredData);
                        }
                    }
                }
            });
        }
    }

    // Helper methods
    isTeamAway(matchupGame) {
        return matchupGame.includes(" @ ");
    }

    getOpposingMatchupId(matchupId) {
        const id = parseInt(matchupId);
        return id % 2 === 1 ? id + 1 : id - 1;
    }

    async fetchMatchupData(matchupId) {
        try {
            console.log(`Fetching all data for matchup ${matchupId}...`);
            
            const opposingMatchupId = this.getOpposingMatchupId(matchupId);
            console.log(`Using opposing matchup ID ${opposingMatchupId} for pitcher/bullpen data`);
            
            const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                this.fetchParkFactors(matchupId),
                this.fetchPitcherStats(opposingMatchupId),
                this.fetchBatterMatchups(matchupId),
                this.fetchBullpenMatchups(opposingMatchupId)
            ]);
            
            return { parkFactors, pitcherStats, batterMatchups, bullpenMatchups };
        } catch (error) {
            console.error('Error fetching matchup data:', error);
            return { parkFactors: null, pitcherStats: null, batterMatchups: null, bullpenMatchups: null };
        }
    }

    async fetchParkFactors(matchupId) {
        if (this.parkFactorsCache.has(matchupId)) {
            return this.parkFactorsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModParkFactors?Park Factor Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch park factors');
            
            const parkFactors = await response.json();
            this.parkFactorsCache.set(matchupId, parkFactors);
            return parkFactors;
        } catch (error) {
            console.error('Error fetching park factors:', error);
            return null;
        }
    }

    async fetchPitcherStats(matchupId) {
        if (this.pitcherStatsCache.has(matchupId)) {
            return this.pitcherStatsCache.get(matchupId);
        }

        try {
            console.log(`Fetching opposing pitcher stats for matchup ID: ${matchupId}`);
            const response = await fetch(
                `${API_CONFIG.baseURL}ModPitcherMatchups?Starter Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch pitcher stats');
            
            const pitcherStats = await response.json();
            this.pitcherStatsCache.set(matchupId, pitcherStats);
            return pitcherStats;
        } catch (error) {
            console.error('Error fetching pitcher stats:', error);
            return null;
        }
    }

    async fetchBatterMatchups(matchupId) {
        if (this.batterMatchupsCache.has(matchupId)) {
            return this.batterMatchupsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModBatterMatchups?Batter Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch batter matchups');
            
            const batterMatchups = await response.json();
            this.batterMatchupsCache.set(matchupId, batterMatchups);
            return batterMatchups;
        } catch (error) {
            console.error('Error fetching batter matchups:', error);
            return null;
        }
    }

    async fetchBullpenMatchups(matchupId) {
        if (this.bullpenMatchupsCache.has(matchupId)) {
            return this.bullpenMatchupsCache.get(matchupId);
        }

        try {
            console.log(`Fetching opposing bullpen matchups for matchup ID: ${matchupId}`);
            const response = await fetch(
                `${API_CONFIG.baseURL}ModBullpenMatchups?Bullpen Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch bullpen matchups');
            
            const bullpenMatchups = await response.json();
            this.bullpenMatchupsCache.set(matchupId, bullpenMatchups);
            return bullpenMatchups;
        } catch (error) {
            console.error('Error fetching bullpen matchups:', error);
            return null;
        }
    }

    getTableScrollPosition() {
        const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
        return tableHolder ? tableHolder.scrollTop : 0;
    }
    
    setTableScrollPosition(position) {
        const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
        if (tableHolder) {
            tableHolder.scrollTop = position;
        }
    }
    
    getTabulator() {
        return this.table;
    }

    createRowFormatter() {
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            rowElement.style.maxWidth = "100%";
            rowElement.style.overflow = "hidden";
            
            if (data._expanded && !rowElement.querySelector('.subrow-container')) {
                const holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                holderEl.style.maxWidth = "100%";
                holderEl.style.overflow = "hidden";
                
                const subtableEl = document.createElement("div");
                subtableEl.style.maxWidth = "100%";
                subtableEl.style.overflow = "hidden";
                holderEl.appendChild(subtableEl);
                rowElement.appendChild(holderEl);
                
                this.createMatchupsSubtable(subtableEl, data);
            } else if (!data._expanded) {
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }
}
