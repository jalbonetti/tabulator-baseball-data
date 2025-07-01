// tables/pitcherClearancesAltTable.js
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatClearancePercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class PitcherClearancesAltTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherClearancesAlt');
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
                        console.log("Pitcher alt table data received:", data.length, "records");
                        return data;
                    })
                    .catch(error => {
                        console.error("Error loading pitcher alt table:", error);
                        return [];
                    });
            },
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

    getColumns() {
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
                    field: "Pitcher Prop Type", 
                    width: 140, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Pitcher Prop Value", 
                    width: 90, 
                    minWidth: 70,
                    sorter: "number", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Pitcher Prop Split ID", 
                    width: 220, 
                    minWidth: 180,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
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
                var row = cell.getRow();
                var data = row.getData();
                data._expanded = !data._expanded;
                row.update(data);
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
                }, 100);
            }
        });
    }

    // Override createSubtable1 for pitcher data
    createSubtable1(container, data) {
        // Combine park factors for display
        var parkFactorDisplay = "L: " + data["Pitcher Prop Park Factor L"] + " / R: " + data["Pitcher Prop Park Factor R"];
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: parkFactorDisplay,
                matchup: data["Matchup"],
                handedness: data["Handedness"]
            }],
            columns: [
                {title: "Prop Park Factor (L/R)", field: "propFactor", headerSort: false, width: 200},
                {title: "Matchup", field: "matchup", headerSort: false, width: 400},
                {title: "Handedness", field: "handedness", headerSort: false, width: 150}
            ]
        });
    }

    createSubtable2(container, data) {
        var opponentTeam = getOpponentTeam(data["Matchup"], data["Pitcher Team"]);
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [
                {
                    player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Righties",
                    propData: data["Pitcher Prop Total R"]
                },
                {
                    player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                    propData: data["Pitcher Prop Total L"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Batters (" + data["R Batters"] + ") Versus " + (data["Handedness"] === "L" ? "Lefties" : "Righties"),
                    propData: data["RB Prop Total"]
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Batters (" + data["L Batters"] + ") Versus " + (data["Handedness"] === "R" ? "Righties" : "Lefties"),
                    propData: data["LB Prop Total"]
                }
            ],
            columns: [
                {title: "Players", field: "player", headerSort: false, resizable: false, width: 400},
                {title: "Prop Data", field: "propData", headerSort: false, resizable: false, width: 200}
            ]
        });
    }
}
