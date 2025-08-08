// tables/pitcherClearancesAltTable.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatClearancePercentage, formatRatio, formatDecimal, removeLeadingZeroFromValue } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class PitcherClearancesAltTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherClearancesAlt');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading all pitcher clearance alt records...",
            columns: this.getColumns(),
            initialSort: [
                {column: "Pitcher Name", dir: "asc"},
                {column: "Pitcher Team", dir: "asc"},
                {column: "Pitcher Prop Type", dir: "asc"},
                {column: "Pitcher Prop Value", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Pitcher Clearances Alt table built successfully");
        });
    }

    // Helper method to determine if team is home or away
    getPlayerLocation(matchup, playerTeam) {
        if (!matchup || !playerTeam) return "Home/Away";
        
        if (matchup.includes(" @ ")) {
            // Format: Away @ Home
            const teams = matchup.split(" @ ");
            if (teams.length === 2) {
                const awayTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const homeTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                } else if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                }
            }
        } else if (matchup.includes(" vs ")) {
            // Format: Home vs Away
            const teams = matchup.split(" vs ");
            if (teams.length === 2) {
                const homeTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const awayTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                } else if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                }
            }
        }
        
        return "Home/Away"; // Fallback if we can't determine
    }

    getColumns() {
        const self = this; // Reference to use in formatter
        
        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Pitcher Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Keep text filter for name
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Pitcher Team", 
                    width: 80, // Reduced width for abbreviations
                    minWidth: 60,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 120 // Custom width for team dropdown
                        });
                    },
                    resizable: false,
                    // No formatter - show abbreviation as-is
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Pitcher Prop Type", 
                    width: 200, 
                    minWidth: 150,
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
                    field: "Pitcher Prop Value", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "number", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 100 // Custom width for prop value dropdown
                        });
                    },
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Pitcher Prop Split ID", 
                    width: 300, 
                    minWidth: 220,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 220 // Custom width for split dropdown
                        });
                    },
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var rowData = cell.getRow().getData();
                        var location = self.getPlayerLocation(rowData["Matchup"], rowData["Pitcher Team"]);
                        
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (" + location + ")",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (" + location + ")"
                        };
                        return mapping[value] || value;
                    }
                }
            ]},
            {title: "Prop Clearance", columns: [
                {
                    title: "% Above", 
                    field: "Pitcher Clearance", 
                    width: 110, 
                    minWidth: 90,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Pitcher Games", 
                    width: 90, 
                    minWidth: 70,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]}
        ];
    }

    // Override createNameFormatter to use Pitcher Name field
    createNameFormatter() {
        return function(cell, formatterParams, onRendered) {
            var value = cell.getValue();
            var row = cell.getRow();
            var expanded = row.getData()._expanded || false;
            
            onRendered(function() {
                try {
                    var cellElement = cell.getElement();
                    if (cellElement && cellElement.querySelector) {
                        cellElement.innerHTML = '';
                        
                        var container = document.createElement("div");
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.cursor = "pointer";
                        
                        var expander = document.createElement("span");
                        expander.innerHTML = expanded ? "−" : "+";
                        expander.style.marginRight = "8px";
                        expander.style.fontWeight = "bold";
                        expander.style.color = "#007bff";
                        expander.style.fontSize = "14px";
                        expander.style.minWidth = "12px";
                        expander.classList.add("row-expander");
                        
                        var textSpan = document.createElement("span");
                        textSpan.textContent = value || "";
                        
                        container.appendChild(expander);
                        container.appendChild(textSpan);
                        
                        cellElement.appendChild(container);
                    }
                } catch (error) {
                    console.error("Error in formatter onRendered:", error);
                }
            });
            
            return (expanded ? "− " : "+ ") + (value || "");
        };
    }

    // Override setupRowExpansion to use Pitcher Name field
    setupRowExpansion() {
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Pitcher Name") {
                e.preventDefault();
                e.stopPropagation();
                
                var row = cell.getRow();
                var data = row.getData();
                data._expanded = !data._expanded;
                
                requestAnimationFrame(() => {
                    row.update(data);
                    
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        setTimeout(() => {
                            try {
                                var cellElement = cell.getElement();
                                if (cellElement && cellElement.querySelector) {
                                    var expanderIcon = cellElement.querySelector('.row-expander');
                                    if (expanderIcon) {
                                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        }, 10);
                    });
                });
            }
        });
    }

    // Override createSubtable1 for pitcher data
    createSubtable1(container, data) {
        // Combine park factors for display (R/L order)
        var parkFactorDisplay = "R: " + (data["Pitcher Prop Park Factor R"] || "-") + " / L: " + (data["Pitcher Prop Park Factor L"] || "-");
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: parkFactorDisplay,
                matchup: data["Matchup"] || "-",
                handedness: data["Handedness"] || "-"
            }],
            columns: [
                {title: "Prop Park Factor (R/L)", field: "propFactor", headerSort: false, width: 300},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Handedness", field: "handedness", headerSort: false, width: 150}
            ]
        });
    }

createSubtable2(container, data) {
    try {
        var opponentTeam = getOpponentTeam(data["Matchup"], data["Pitcher Team"]);
        
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
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
data: [
    {
        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Righties",
        propData: removeLeadingZeroFromValue(data["Pitcher Prop Total R"]) || "-"
    },
    {
        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Lefties",
        propData: removeLeadingZeroFromValue(data["Pitcher Prop Total L"]) || "-"
    },
    {
        player: (opponentTeam ? opponentTeam + " " : "") + "Righty Batters (" + (data["R Batters"] || "0") + ") Versus " + (data["Handedness"] === "L" ? "Lefties" : "Righties"),
        propData: removeLeadingZeroFromValue(data["RB Prop Total"]) || "-"
    },
    {
        player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Batters (" + (data["L Batters"] || "0") + ") Versus " + (data["Handedness"] === "R" ? "Righties" : "Lefties"),
        propData: removeLeadingZeroFromValue(data["LB Prop Total"]) || "-"
    }
]
        });
    } catch (error) {
        console.error("Error creating pitcher clearances alt subtable2:", error, data);
        container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
    }
}
}
