// tables/batterClearancesTable.js
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG } from '../shared/config.js';

export class BatterClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterClearances');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            // Override the ajax URL to include a higher limit
            ajaxURL: `${API_CONFIG.baseURL}${this.endpoint}?select=*&limit=15000`,
            ajaxConfig: {
                ...this.tableConfig.ajaxConfig,
                headers: {
                    ...this.tableConfig.ajaxConfig.headers,
                    "Range": "0-14999" // Request up to 15k records to cover your 10-11k
                }
            },
            // Add loading message
            placeholder: "Loading data (approximately 10,000 records)...",
            // Add virtual DOM settings for performance
            virtualDom: true,
            virtualDomBuffer: 300,
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
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false,
                    formatter: this.createTeamFormatter()
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Batter Prop Type", 
                    width: 200, 
                    minWidth: 140,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Batter Prop Value", 
                    width: 200, 
                    minWidth: 140,
                    sorter: "number", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
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

    createSubtable2(container, data) {
        var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
        var handsText = getSwitchHitterVersus(data["Handedness"], data["SP Handedness"]);
        
        // For switch hitters, determine pitcher-specific matchups
        var spVersusText = handsText;
        var rrVersusText = data["Handedness"] === "S" ? "Lefties" : handsText;
        var lrVersusText = data["Handedness"] === "S" ? "Righties" : handsText;
        
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

// Export the class
export { BatterClearancesTable };
