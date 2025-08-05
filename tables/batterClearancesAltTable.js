// tables/batterClearancesAltTable.js - ENHANCED VERSION FOR LARGE DATASETS
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, getSwitchHitterVersus, formatClearancePercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BatterClearancesAltTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearancesAlt');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            // Optimize for large datasets
            virtualDom: true, // Essential for 40k records
            virtualDomBuffer: 500, // Increased buffer for smoother scrolling
            renderVertical: "virtual", // Virtual rendering for performance
            renderHorizontal: "virtual",
            // Remove pagination - we want all data loaded
            pagination: false,
            paginationSize: false,
            // Optimize rendering
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            // Large dataset specific settings
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading batter clearance alt records... This may take a moment for large datasets.",
            columns: this.getColumns(),
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Team", dir: "asc"},
                {column: "Batter Prop Type", dir: "asc"},
                {column: "Batter Prop Value", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            // Add data loaded callback for large datasets
            dataLoaded: (data) => {
                console.log(`BatterClearancesAlt loaded ${data.length} records successfully`);
                this.dataLoaded = true;
                
                // Initialize expanded state for all rows
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                // Update any loading indicators
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                }
                
                // Trigger initial render optimization
                setTimeout(() => {
                    if (this.table) {
                        this.table.redraw(true);
                    }
                }, 100);
            },
            // Add data loading error handler
            ajaxError: (error) => {
                console.error("Error loading BatterClearancesAlt data:", error);
                const element = document.querySelector(this.elementId);
                if (element) {
                    element.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: red;">
                            Error loading data. Please refresh the page or try again later.
                            <br>
                            <button onclick="location.reload()">Refresh Page</button>
                        </div>
                    `;
                }
            }
        };

        // Create loading indicator for large dataset
        const element = document.querySelector(this.elementId);
        if (element && !element.querySelector('.loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; text-align: center;';
            loadingDiv.innerHTML = `
                <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>Loading data...</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">This table contains many records and may take a moment to load.</div>
            `;
            element.appendChild(loadingDiv);
        }

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Batter Clearances Alt table built successfully");
            
            // Add refresh button for manual cache refresh
            this.addRefreshButton();
        });
        
        // Optimize scroll performance for large datasets
        this.table.on("scrollVertical", () => {
            // Debounce scroll events
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            this.scrollTimeout = setTimeout(() => {
                // Force garbage collection hint
                if (window.gc) {
                    window.gc();
                }
            }, 300);
        });
    }

    // Add refresh button to manually clear cache and reload data
    addRefreshButton() {
        const headerElement = document.querySelector(`${this.elementId} .tabulator-header`);
        if (headerElement && !headerElement.querySelector('.refresh-button')) {
            const refreshButton = document.createElement('button');
            refreshButton.className = 'refresh-button';
            refreshButton.style.cssText = 'position: absolute; right: 10px; top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; z-index: 100;';
            refreshButton.textContent = 'Refresh Data';
            refreshButton.title = 'Clear cache and reload data from server';
            
            refreshButton.addEventListener('click', async () => {
                refreshButton.disabled = true;
                refreshButton.textContent = 'Refreshing...';
                
                try {
                    await this.refreshData();
                    refreshButton.textContent = 'Refresh Data';
                } catch (error) {
                    console.error('Error refreshing data:', error);
                    refreshButton.textContent = 'Error - Try Again';
                } finally {
                    refreshButton.disabled = false;
                }
            });
            
            headerElement.style.position = 'relative';
            headerElement.appendChild(refreshButton);
        }
    }

    getPlayerLocation(matchup, playerTeam) {
        if (!matchup || !playerTeam) return "Home/Away";
        
        if (matchup.includes(" @ ")) {
            const teams = matchup.split(" @ ");
            if (teams.length === 2) {
                const awayTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const homeTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                } else if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                }
            }
        } else if (matchup.includes(" vs ")) {
            const teams = matchup.split(" vs ");
            if (teams.length === 2) {
                const homeTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const awayTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                } else if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                }
            }
        }
        
        return "Home/Away";
    }

    getColumns() {
        const self = this;
        
        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 120,
                    minWidth: 80,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 80
                        });
                    },
                    resizable: false,
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Batter Prop Type", 
                    width: 160, 
                    minWidth: 120,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 120
                        });
                    },
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Batter Prop Value", 
                    width: 120, 
                    minWidth: 80,
                    sorter: "number", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 60
                        });
                    },
                    resizable: false
                },
                {
                    title: "Split", 
                    field: "Batter Prop Split ID", 
                    width: 180, 
                    minWidth: 140,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 140
                        });
                    },
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var rowData = cell.getRow().getData();
                        var location = self.getPlayerLocation(rowData["Matchup"], rowData["Batter Team"]);
                        
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (" + location + ")",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (" + location + ")"
                        };
                        return mapping[value] || value;
                    }
                }
            ]},
            {title: "Prop Clearance", columns: [
                {
                    title: "% Above", 
                    field: "Batter Clearance", 
                    width: 110, 
                    minWidth: 90,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Batter Games", 
                    width: 90, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]}
        ];
    }

    createSubtable2(container, data) {
        try {
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
            
            // Extract SP handedness
            var spInfo = data["SP"] || "";
            var spHandedness = null;
            
            if (spInfo.includes("(") && spInfo.includes(")")) {
                var match = spInfo.match(/\(([RL])\)/);
                if (match) {
                    spHandedness = match[1];
                }
            }
            
            var spVersusText;
            if (data["Handedness"] === "S") {
                if (spHandedness === "R") {
                    spVersusText = "Lefties";
                } else if (spHandedness === "L") {
                    spVersusText = "Righties";
                } else {
                    spVersusText = "Unknown";
                }
            } else {
                spVersusText = data["Handedness"] === "L" ? "Lefties" : "Righties";
            }
            
            var rrVersusText = data["Handedness"] === "S" ? "Lefties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
            var lrVersusText = data["Handedness"] === "S" ? "Righties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
            
            var tableData = [
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                    propData: data["Batter Prop Total R"] || "-"
                },
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                    propData: data["Batter Prop Total L"] || "-"
                },
                {
                    player: data["SP"] + " Versus " + spVersusText,
                    propData: data["SP Prop Total"] || "-"
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + (data["R Relievers"] || "0") + ") Versus " + rrVersusText,
                    propData: data["RR Prop Total"] || "-"
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + (data["L Relievers"] || "0") + ") Versus " + lrVersusText,
                    propData: data["LR Prop Total"] || "-"
                }
            ];
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                resizableColumns: false,
                resizableRows: false,
                movableColumns: false,
                data: tableData,
                columns: [
                    {title: "Players", field: "player", headerSort: false, resizable: false, width: 350},
                    {title: "Prop Data", field: "propData", headerSort: false, resizable: false, width: 220}
                ]
            });
        } catch (error) {
            console.error("Error creating batter clearances alt subtable2:", error, data);
            container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
        }
    }
}
