// tables/batterProps.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BatterPropsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterProps');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading all batter props records...",
            columns: this.getColumns(),
            // FIXED: Use correct field names that match the column definitions
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Prop Type", dir: "asc"},
                {column: "Batter Over/Under", dir: "asc"},
                {column: "Batter Prop Line", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Batter Props table loaded ${data.length} records`);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Batter Props table built successfully");
        });
    }

    getColumns() {
        return [
            {
                title: "Matchup", 
                field: "Batter Matchup",
                width: 160,
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                sorter: false
            },
            {
                title: "Name", 
                field: "Batter Name",
                width: 200,
                headerFilter: true,
                sorter: "string"
            },
            {
                title: "Prop Type", 
                field: "Batter Prop Type",
                width: 100,
                headerFilter: createCustomMultiSelect,
                sorter: "string"
            },
            {
                title: "Over/Under", 
                field: "Batter Over/Under",
                width: 100,
                sorter: "string",
                hozAlign: "center",
                headerFilter: createCustomMultiSelect
            },
            {
                title: "Prop Line", 
                field: "Batter Prop Line",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                headerFilter: createCustomMultiSelect
            },
            {
                title: "DraftKings", 
                field: "Batter DraftKings Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "FanDuel", 
                field: "Batter FanDuel Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "BetRivers", 
                field: "Batter BetRivers Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "BetMGM", 
                field: "Batter BetMGM Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "Pinnacle", 
                field: "Batter Pinnacle Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "Fanatics", 
                field: "Batter Fanatics Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "ESPN", 
                field: "Batter ESPN Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "Median", 
                field: "Batter Median Odds",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                }
            },
            {
                title: "Best Above Median", 
                field: "Batter Best Odds",
                width: 300,
                hozAlign: "left",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    return value;
                },
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    const extractFirstNumber = (str) => {
                        if (!str) return 0;
                        const match = str.match(/^([+-]?\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };
                    
                    const aNum = extractFirstNumber(a);
                    const bNum = extractFirstNumber(b);
                    
                    return aNum - bNum;
                },
                headerTooltip: "Best odds above median, sorted by first value"
            }
        ];
    }
}
