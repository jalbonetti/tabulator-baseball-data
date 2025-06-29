// tables/batterClearancesAltTable.js
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatClearancePercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BatterClearancesAltTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearancesAlt');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            ajaxConfig: {
                ...this.tableConfig.ajaxConfig,
                headers: {
                    ...this.tableConfig.ajaxConfig.headers,
                    "Range": ""
                }
            },
            progressiveLoad: "load",
            progressiveLoadDelay: 200,
            progressiveLoadScrollMargin: 300,
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
                    width: 180, 
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 160, 
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    formatter: this.createTeamFormatter()
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Batter Prop Type", 
                    width: 120, 
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Batter Prop Value", 
                    width: 80, 
                    sorter: "number", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Batter Prop Split ID", 
                    width: 180, 
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
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
                    width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Batter Games", 
                    width: 80, 
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
                {title: "Players", field: "player", headerSort: false, resizable: false, width: 320},
                {title: "Prop Data", field: "propData", headerSort: false, resizable: false, width: 150}
            ]
        });
    }
}
