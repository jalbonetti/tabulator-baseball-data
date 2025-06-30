// tables/batterClearancesAltTable.js
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, getSwitchHitterVersus, formatClearancePercentage } from '../shared/utils.js';

export class BatterClearancesAltTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearancesAlt');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            // Override the ajax config to handle pagination
            ajaxURL: this.tableConfig.ajaxURL + "?select=*",
            ajaxConfig: {
                ...this.tableConfig.ajaxConfig,
                headers: {
                    ...this.tableConfig.ajaxConfig.headers,
                    "Prefer": "count=exact"
                }
            },
            ajaxRequestFunc: function(url, config, params) {
                // Add pagination parameters
                var pageSize = 1000; // Request 1000 records at a time
                var offset = 0;
                
                // Build the URL with pagination
                var requestUrl = url + "&limit=" + pageSize + "&offset=" + offset;
                
                return fetch(requestUrl, config)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Alt table data received:", data.length, "records");
                        return data;
                    })
                    .catch(error => {
                        console.error("Error loading alt table:", error);
                        return [];
                    });
            },
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

    getColumns() {
        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Simple text filter for now
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Simple text filter for now
                    resizable: false,
                    formatter: this.createTeamFormatter()
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Batter Prop Type", 
                    width: 140, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: true,  // Simple text filter for now
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Batter Prop Value", 
                    width: 90, 
                    minWidth: 70,
                    sorter: "number", 
                    headerFilter: "number",
                    headerFilterPlaceholder: "Min",
                    headerFilterFunc: ">=",
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Batter Prop Split ID", 
                    width: 220, 
                    minWidth: 180,
                    sorter: "string", 
                    headerFilter: true,  // Simple text filter for now
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (Home/Away)",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (Home/Away)"
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
        var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
        
        // Fixed switch hitter logic for starting pitcher
        var spVersusText;
        if (data["Handedness"] === "S") {
            if (data["SP Handedness"] === "R") {
                spVersusText = "Righties";
            } else if (data["SP Handedness"] === "L") {
                spVersusText = "Lefties";
            } else {
                spVersusText = "Switch";
            }
        } else {
            spVersusText = data["Handedness"] === "L" ? "Lefties" : "Righties";
        }
        
        // For relievers with switch hitters
        var rrVersusText = data["Handedness"] === "S" ? "Righties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
        var lrVersusText = data["Handedness"] === "S" ? "Lefties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                    propData: data["Batter Prop Total R"]
                },
                {
                    player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                    propData: data["Batter Prop Total L"]
                },
                {
                    player: data["SP"] + " Versus " + spVersusText,
                    propData: data["SP Prop Total"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + data["R Relievers"] + ") Versus " + rrVersusText,
                    propData: data["RR Prop Total"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + data["L Relievers"] + ") Versus " + lrVersusText,
                    propData: data["LR Prop Total"]
                }
            ],
            columns: [
                {title: "Players", field: "player", headerSort: false, resizable: false, width: 400},
                {title: "Prop Data", field: "propData", headerSort: false, resizable: false, width: 200}
            ]
        });
    }
}
