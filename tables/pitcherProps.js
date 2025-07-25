// tables/pitcherProps.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class PitcherPropsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherProps');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            // FIXED: Use correct field names
            initialSort: [
                {column: "Pitcher Name", dir: "asc"},
                {column: "Pitcher Prop Type", dir: "asc"},
                {column: "Pitcher Over/Under", dir: "asc"},
                {column: "Pitcher Prop Line", dir: "asc"}
            ],
            dataLoaded: (data) => {
                console.log(`Pitcher Props table loaded ${data.length} records`);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Pitcher Props table built successfully");
        });
    }

    getColumns() {
        return [
            {
                title: "Matchup", 
                field: "Pitcher Matchup",
                width: 120,
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                sorter: false
            },
            {
                title: "Name", 
                field: "Pitcher Name",
                width: 180,
                headerFilter: true,
                sorter: "string"
            },
            {
                title: "Prop Type", 
                field: "Pitcher Prop Type",
                width: 140,
                headerFilter: createCustomMultiSelect,
                sorter: "string"
            },
            {
                title: "Over/Under", 
                field: "Pitcher Over/Under",
                width: 100,
                sorter: "string",
                hozAlign: "center",
                headerFilter: createCustomMultiSelect
            },
            {
                title: "Prop Line", 
                field: "Pitcher Prop Line",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                headerFilter: createCustomMultiSelect
            },
            {
                title: "DraftKings", 
                field: "Pitcher DraftKings Odds",
                width: 110,
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
                field: "Pitcher FanDuel Odds",
                width: 110,
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
                field: "Pitcher BetRivers Odds",
                width: 110,
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
                field: "Pitcher BetMGM Odds",
                width: 110,
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
                title: "Caesars", 
                field: "Pitcher Caesars Odds",
                width: 110,
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
                field: "Pitcher Fanatics Odds",
                width: 110,
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
                field: "Pitcher ESPN Odds",
                width: 110,
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
                field: "Pitcher Median Odds",
                width: 110,
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
                field: "Pitcher Best Odds",
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
