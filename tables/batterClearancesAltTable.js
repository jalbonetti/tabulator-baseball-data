// tables/batterClearancesAltTable.js - OPTIMIZED VERSION
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
            // Remove progressive loading to improve performance
            progressiveLoad: false,
            progressiveLoadDelay: null,
            progressiveLoadScrollMargin: null,
            // Add performance optimizations
            virtualDom: true, // Re-enable for large dataset
            virtualDomBuffer: 100, // Reduced buffer
            renderVertical: "virtual", // Virtual rendering for performance
            placeholder: "Loading all batter clearance alt records...",
            columns: this.getColumns(),
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Team", dir: "asc"},
                {column: "Batter Prop Type", dir: "asc"},
                {column: "Batter Prop Value", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Batter Clearances Alt table built successfully");
        });
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
