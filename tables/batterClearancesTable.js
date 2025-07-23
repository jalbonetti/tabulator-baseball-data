// tables/batterClearancesTable.js - UPDATED WITH CONTRACTED TEAM NAMES AND LOCATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BatterClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearances');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            // Remove all limit overrides - use base class pagination
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
        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Keep text filter for name
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 120, // Reduced width for abbreviations
                    minWidth: 60,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 80 // Custom width for team dropdown
                        });
                    },
                    resizable: false,
                    // No formatter - show abbreviation as-is
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
                            dropdownWidth: 180 // Custom width for prop type dropdown
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
                            dropdownWidth: 100 // Custom width for prop value dropdown
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
                    formatter: (cell) => formatPercentage(cell.getValue())
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
                    formatter: (cell) => formatPercentage(cell.getValue())
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
                    formatter: (cell) => formatPercentage(cell.getValue())
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
                    formatter: (cell) => formatPercentage(cell.getValue())
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
            ]}
        ];
    }

    // Override createSubtable1 to add Location column
    createSubtable1(container, data) {
        // Determine if batter is home or away based on matchup
        const matchup = data["Matchup"] || "";
        const batterTeam = data["Batter Team"];
        
        let location = "Unknown";
        if (matchup.includes(" @ ")) {
            // Format: Away @ Home
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
            // Format: Home vs Away
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
            height: false, // Auto height
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
        var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
        
        // Determine what handedness the SP faces based on batter type
        var spVersusText;
        if (data["Handedness"] === "S") {
            // Switch hitter - they bat opposite of pitcher's hand
            if (data["SP Handedness"] === "R") {
                spVersusText = "Lefties"; // Switch hitter bats left vs righty
            } else if (data["SP Handedness"] === "L") {
                spVersusText = "Righties"; // Switch hitter bats right vs lefty
            } else {
                // SP Handedness not available, try to extract from SP name
                var spInfo = data["SP"] || "";
                if (spInfo.includes("(R)")) {
                    spVersusText = "Lefties";
                } else if (spInfo.includes("(L)")) {
                    spVersusText = "Righties";
                } else {
                    spVersusText = "Unknown"; // Better than "Switch"
                }
            }
        } else {
            // Regular hitter - pitcher faces their natural handedness
            spVersusText = data["Handedness"] === "L" ? "Lefties" : "Righties";
        }
        
        // For relievers with switch hitters
        var rrVersusText = data["Handedness"] === "S" ? "Lefties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
        var lrVersusText = data["Handedness"] === "S" ? "Righties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            data: [
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                    fullSeason: data["Batter Prop Total R Season"],
                    fullSeasonHA: data["Batter Prop Total R Season At"],
                    last30: data["Batter Prop Total R 30"],
                    last30HA: data["Batter Prop Total R 30 At"]
                },
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                    fullSeason: data["Batter Prop Total L Season"],
                    fullSeasonHA: data["Batter Prop Total L Season At"],
                    last30: data["Batter Prop Total L 30"],
                    last30HA: data["Batter Prop Total L 30 At"]
                },
                {
                    player: data["SP"] + " Versus " + spVersusText,
                    fullSeason: data["SP Prop Total Vs Season"],
                    fullSeasonHA: data["SP Prop Total Vs Season At"],
                    last30: data["SP Prop Total Vs 30"],
                    last30HA: data["SP Prop Total Vs 30 At"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + data["R Relievers"] + ") Versus " + rrVersusText,
                    fullSeason: data["RR Prop Total Vs Season"],
                    fullSeasonHA: data["RR Prop Total Vs Season At"],
                    last30: data["RR Prop Total Vs 30"],
                    last30HA: data["RR Prop Total Vs 30 At"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + data["L Relievers"] + ") Versus " + lrVersusText,
                    fullSeason: data["LR Prop Total Vs Season"],
                    fullSeasonHA: data["LR Prop Total Vs Season At"],
                    last30: data["LR Prop Total Vs 30"],
                    last30HA: data["LR Prop Total Vs 30 At"]
                }
            ],
            columns: [
                {title: "Players", field: "player", headerSort: false, width: 350},
                {title: "Full Season", field: "fullSeason", headerSort: false, width: 220},
                {title: "Full Season (Home/Away)", field: "fullSeasonHA", headerSort: false, width: 220},
                {title: "Last 30 Days", field: "last30", headerSort: false, width: 220},
                {title: "Last 30 Days (Home/Away)", field: "last30HA", headerSort: false, width: 220}
            ]
        });
    }
}
