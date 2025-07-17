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
                {column: "Team", dir: "asc"},
                {column: "Prop Type", dir: "asc"},
                {column: "Line", dir: "asc"}
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
                title: "Team", 
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
                title: "Line", 
                field: "Game Line",
                width: 100,
                sorter: "number",
                hozAlign: "center"
            },
            {
                title: "DraftKings", 
                field: "Game DraftKings Line",
                width: 110,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseFloat(value);
                    if (isNaN(num)) return value;
                    // Format as odds if it's an integer-like value > 100 or < -100
                    if (Math.abs(num) >= 100 && num % 1 === 0) {
                        return num > 0 ? `+${num}` : `${num}`;
                    }
                    return value;
                }
            },
            {
                title: "FanDuel", 
                field: "Game FanDuel Line",
                width: 110,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseFloat(value);
                    if (isNaN(num)) return value;
                    if (Math.abs(num) >= 100 && num % 1 === 0) {
                        return num > 0 ? `+${num}` : `${num}`;
                    }
                    return value;
                }
            },
            {
                title: "BetRivers", 
                field: "Game BetRivers Line",
                width: 110,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseFloat(value);
                    if (isNaN(num)) return value;
                    if (Math.abs(num) >= 100 && num % 1 === 0) {
                        return num > 0 ? `+${num}` : `${num}`;
                    }
                    return value;
                }
            },
            {
                title: "BetMGM", 
                field: "Game BetMGM Line",
                width: 110,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseFloat(value);
                    if (isNaN(num)) return value;
                    if (Math.abs(num) >= 100 && num % 1 === 0) {
                        return num > 0 ? `+${num}` : `${num}`;
                    }
                    return value;
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
                title: "Best", 
                field: "Game Best Odds",
                width: 110,
                sorter: "number",
                hozAlign: "center",
                formatter: function(cell) {
                    const value = cell.getValue();
                    if (!value) return "-";
                    const num = parseInt(value);
                    return num > 0 ? `+${num}` : `${num}`;
                },
                headerTooltip: "Best Available Odds"
            }
        ];
    }
}
