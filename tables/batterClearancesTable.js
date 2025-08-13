// tables/batterClearancesTable.js - FIXED VERSION WITH PROPER STATE PRESERVATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage, formatRatio, removeLeadingZeroFromValue} from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BatterClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearances');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading all batter clearance records...",
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
            console.log("Batter Clearances table built successfully");
        });
    }

    getColumns() {
        // Odds formatter function
        const oddsFormatter = function(cell) {
            const value = cell.getValue();
            if (!value || value === null || value === undefined) return "-";
            const num = parseInt(value);
            if (isNaN(num)) return "-";
            return num > 0 ? `+${num}` : `${num}`;
        };

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
                    minWidth: 60,
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
                    width: 200, 
                    minWidth: 140,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 180
                        });
                    },
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Batter Prop Value", 
                    width: 200, 
                    minWidth: 140,
                    sorter: "number", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 100
                        });
                    },
                    resizable: false
                }
            ]},
            {title: "Full Season", columns: [
                {
                    title: "% Above", 
                    field: "Clearance Season", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number", 
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatPercentage(cell.getValue())  // KEEPS leading zero
                },
                {
                    title: "Games", 
                    field: "Games Season", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Full Season (Home/Away)", columns: [
                {
                    title: "% Above", 
                    field: "Clearance Season At", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatPercentage(cell.getValue())  // KEEPS leading zero
                },
                {
                    title: "Games", 
                    field: "Games Season At", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Last 30 Days", columns: [
                {
                    title: "% Above", 
                    field: "Clearance 30", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatPercentage(cell.getValue())  // KEEPS leading zero
                },
                {
                    title: "Games", 
                    field: "Games 30", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Last 30 Days (Home/Away)", columns: [
                {
                    title: "% Above", 
                    field: "Clearance 30 At", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatPercentage(cell.getValue())  // KEEPS leading zero
                },
                {
                    title: "Games", 
                    field: "Games 30 At", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Median Odds", columns: [
                {
                    title: "Over", 
                    field: "Batter Median Over Odds", 
                    width: 90, 
                    minWidth: 75,
                    sorter: "number",
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Batter Median Under Odds", 
                    width: 90, 
                    minWidth: 75,
                    sorter: "number",
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                }
            ]}
        ];
    }

    createSubtable1(container, data) {
        const matchup = data["Matchup"] || "";
        const batterTeam = data["Batter Team"];
        
        let location = "Unknown";
        if (matchup.includes(" @ ")) {
            const teams = matchup.split(" @ ");
            if (teams.length === 2) {
                const awayTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const homeTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (awayTeam && awayTeam[0] === batterTeam) {
                    location = "Away";
                } else if (homeTeam && homeTeam[0] === batterTeam) {
                    location = "Home";
                }
            }
        } else if (matchup.includes(" vs ")) {
            const teams = matchup.split(" vs ");
            if (teams.length === 2) {
                const homeTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const awayTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (homeTeam && homeTeam[0] === batterTeam) {
                    location = "Home";
                } else if (awayTeam && awayTeam[0] === batterTeam) {
                    location = "Away";
                }
            }
        }
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                location: location,
                matchup: data["Matchup"],
                opposingPitcher: data["SP"]
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 300},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 200},
                {title: "Location", field: "location", headerSort: false, width: 100},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 400}
            ]
        });
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
            
            // Determine matchups
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
            
            // Format values to remove leading zeros from ratios
            const formatValue = (value) => {
                if (value === null || value === undefined || value === "" || value === "-") return "-";
                // Check if it's a decimal ratio value (e.g., 0.xxx)
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && value.toString().includes('.')) {
                    return formatRatio(value, 3);
                }
                return value;
            };
            
            // Prepare table data with formatted values
            var tableData = [
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                    fullSeason: removeLeadingZeroFromValue(data["Batter Prop Total R Season"]) || "-",
                    fullSeasonHA: removeLeadingZeroFromValue(data["Batter Prop Total R Season At"]) || "-",
                    last30: removeLeadingZeroFromValue(data["Batter Prop Total R 30"]) || "-",
                    last30HA: removeLeadingZeroFromValue(data["Batter Prop Total R 30 At"]) || "-"
                },
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                    fullSeason: removeLeadingZeroFromValue(data["Batter Prop Total L Season"]) || "-",
                    fullSeasonHA: removeLeadingZeroFromValue(data["Batter Prop Total L Season At"]) || "-",
                    last30: removeLeadingZeroFromValue(data["Batter Prop Total L 30"]) || "-",
                    last30HA: removeLeadingZeroFromValue(data["Batter Prop Total L 30 At"]) || "-"
                },
                {
                    player: data["SP"] + " Versus " + spVersusText,
                    fullSeason: removeLeadingZeroFromValue(data["SP Prop Total Vs Season"]) || "-",
                    fullSeasonHA: removeLeadingZeroFromValue(data["SP Prop Total Vs Season At"]) || "-",
                    last30: removeLeadingZeroFromValue(data["SP Prop Total Vs 30"]) || "-",
                    last30HA: removeLeadingZeroFromValue(data["SP Prop Total Vs 30 At"]) || "-"
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + (data["R Relievers"] || "0") + ") Versus " + rrVersusText,
                    fullSeason: removeLeadingZeroFromValue(data["RR Prop Total Vs Season"]) || "-",
                    fullSeasonHA: removeLeadingZeroFromValue(data["RR Prop Total Vs Season At"]) || "-",
                    last30: removeLeadingZeroFromValue(data["RR Prop Total Vs 30"]) || "-",
                    last30HA: removeLeadingZeroFromValue(data["RR Prop Total Vs 30 At"]) || "-"
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + (data["L Relievers"] || "0") + ") Versus " + lrVersusText,
                    fullSeason: removeLeadingZeroFromValue(data["LR Prop Total Vs Season"]) || "-",
                    fullSeasonHA: removeLeadingZeroFromValue(data["LR Prop Total Vs Season At"]) || "-",
                    last30: removeLeadingZeroFromValue(data["LR Prop Total Vs 30"]) || "-",
                    last30HA: removeLeadingZeroFromValue(data["LR Prop Total Vs 30 At"]) || "-"
                }
            ];
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                data: tableData,
                columns: [
                    {title: "Players", field: "player", headerSort: false, width: 350},
                    {title: "Full Season", field: "fullSeason", headerSort: false, width: 220},
                    {title: "Full Season (Home/Away)", field: "fullSeasonHA", headerSort: false, width: 220},
                    {title: "Last 30 Days", field: "last30", headerSort: false, width: 220},
                    {title: "Last 30 Days (Home/Away)", field: "last30HA", headerSort: false, width: 220}
                ]
            });
        } catch (error) {
            console.error("Error creating batter clearances subtable2:", error, data);
            container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
        }
    }
}
