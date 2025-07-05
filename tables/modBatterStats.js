// tables/modBatterStats.js
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class ModBatterStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterStats');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Team", dir: "asc"},
                {column: "Batter Stat Type", dir: "asc"},
                {column: "Batter Prop Split ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Mod Batter Stats table built successfully");
        });
    }

    getColumns() {
        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 180, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Text filter for name
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 180, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false,
                    formatter: this.createTeamFormatter()
                }
            ]},
            {title: "Stat Info", columns: [
                {
                    title: "Stat", 
                    field: "Batter Stat Type", 
                    width: 120, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Batter Prop Split ID", 
                    width: 180, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
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
            {title: "Batter Stats", columns: [
                {
                    title: "V. R", 
                    field: "Batter Total vs R", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "V. L", 
                    field: "Batter Total vs L", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "Total", 
                    field: "Batter Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                }
            ]},
            {title: "Starter", columns: [
                {
                    title: "Total", 
                    field: "SP Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                }
            ]},
            {title: "Relievers", columns: [
                {
                    title: "R.", 
                    field: "RR Stat Total", 
                    width: 70, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "L.", 
                    field: "LR Stat Total", 
                    width: 70, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                }
            ]},
            {title: "Total", columns: [
                {
                    title: "Total", 
                    field: "Opposing Pitching Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                }
            ]},
            {title: "Righties Matchup", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs R", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs R", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]},
            {title: "Lefties Matchup", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs L", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs L", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]},
            {title: "Matchup Total", columns: [
                {
                    title: "Total", 
                    field: "Matchup Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: this.createSimpleNumberFormatter()
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]}
        ];
    }

    // Custom formatter for stat cells that shows "Total StatName (PA: X)"
    createStatFormatter(paField, paLabel) {
        return function(cell) {
            var total = cell.getValue();
            var row = cell.getRow();
            var pa = row.getData()[paField];
            var statType = row.getData()["Batter Stat Type"];
            
            if (total === null || total === undefined) return "-";
            
            // Format the display based on stat type
            var formattedTotal = parseFloat(total).toFixed(0);
            var formattedPA = pa ? parseFloat(pa).toFixed(0) : "0";
            
            return formattedTotal + " " + statType + " (" + paLabel + ": " + formattedPA + ")";
        };
    }

    // Custom formatter for stat value cells that appends the stat name
    createStatValueFormatter() {
        return function(cell) {
            var value = cell.getValue();
            var row = cell.getRow();
            var statType = row.getData()["Batter Stat Type"];
            
            if (value === null || value === undefined) return "-";
            
            return parseFloat(value).toFixed(0) + " " + statType;
        };
    }

    // Override createSubtable1 for the specific subrow layout
    createSubtable1(container, data) {
        // Format bullpen info
        var bullpenInfo = data["R Relievers"] + " R / " + data["L Relievers"] + " L";
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                handedness: data["Handedness"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"],
                bullpen: bullpenInfo
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 130},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 150},
                {title: "Hand", field: "handedness", headerSort: false, width: 80},
                {title: "Matchup", field: "matchup", headerSort: false, width: 200},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 150},
                {title: "Bullpen", field: "bullpen", headerSort: false, width: 120}
            ]
        });
    }

    // Override createSubtable2 - we only need one subtable for this view
    createSubtable2(container, data) {
        // This table doesn't need a second subtable, so we can leave this empty
        // or add any additional information if needed
    }
}
