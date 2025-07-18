// tables/gameProps.js
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class GamePropsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModGameProps');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            initialSort: [
                {column: "Label", dir: "asc"},
                {column: "Prop Type", dir: "asc"},
                {column: "Prop Line", dir: "asc"}  // Updated from "Line"
            ],
            dataLoaded: (data) => {
                console.log(`Game Props table loaded ${data.length} records`);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Game Props table built successfully");
        });
    }

    getColumns() {
        return [
            {
                title: "Matchup", 
                field: "Game Matchup",
                width: 200,
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                sorter: false
            },
            {
                title: "Label", 
                field: "Game Label",
                width: 180,
                headerFilter: createCustomMultiSelect,
                sorter: "string"
            },
            {
                title: "Prop Type", 
                field: "Game Prop Type",
                width: 160,
                headerFilter: createCustomMultiSelect,
                sorter: "string"
            },
            {
                title: "Prop Line",  // Renamed from "Line"
                field: "Game Line",
                width: 100,
                sorter: "number",
                hozAlign: "center",
                headerFilter: createCustomMultiSelect  // Added dropdown filter
            },
            {
                title: "DraftKings", 
                field: "Game DraftKings Odds",
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
                field: "Game FanDuel Odds",
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
                field: "Game BetRivers Odds",
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
                field: "Game BetMGM Odds",
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
                field: "Game Caesars Odds",
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
                field: "Game Fanatics Odds",
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
                field: "Game ESPN Odds",
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
                field: "Game Median Odds",
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
                field: "Game Best Odds",
                width: 300,  // Increased width to accommodate full data
                hozAlign: "left",  // Left align for better readability
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    return value;  // Show full data
                },
                sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
                    // Extract the first number for sorting
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
