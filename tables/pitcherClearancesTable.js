// tables/pitcherClearancesTable.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatClearancePercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class PitcherClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherClearances');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
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
            console.log("Pitcher Clearances table built successfully");
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
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Pitcher Prop Value", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "number", 
                    headerFilter: createCustomMultiSelect,  // Use multiselect
                    resizable: false
                }
            ]},
            {title: "Full Season", columns: [
                {
                    title: "% Above", 
                    field: "Pitcher Season Clearance", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Pitcher Season Games", 
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
                    field: "Pitcher Season Loc Clearance", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Pitcher Season Loc Games", 
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
                    field: "Pitcher Clearance", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number", 
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Pitcher Games", 
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
                    field: "Pitcher Location Clearance", 
                    width: 100, 
                    minWidth: 85,
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: (cell) => formatClearancePercentage(cell.getValue())
                },
                {
                    title: "Games", 
                    field: "Pitcher Location Games", 
                    width: 85, 
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
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                data: [
                    {
                        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Righties",
                        fullSeason: data["Pitcher Prop Total R Vs Season"] || "-",
                        fullSeasonHA: data["Pitcher Prop Total R Vs Season At"] || "-",
                        last30: data["Pitcher Prop Total R Vs 30"] || "-",
                        last30HA: data["Pitcher Prop Total R Vs 30 At"] || "-"
                    },
                    {
                        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                        fullSeason: data["Pitcher Prop Total L Vs Season"] || "-",
                        fullSeasonHA: data["Pitcher Prop Total L Vs Season At"] || "-",
                        last30: data["Pitcher Prop Total L Vs 30"] || "-",
                        last30HA: data["Pitcher Prop Total L Vs 30 At"] || "-"
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Righty Batters (" + (data["R Batters"] || "0") + ") Versus " + (data["Handedness"] === "L" ? "Lefties" : "Righties"),
                        fullSeason: data["RB Prop Total Vs Season"] || "-",
                        fullSeasonHA: data["RB Prop Total Vs Season At"] || "-",
                        last30: data["RB Prop Total Vs 30"] || "-",
                        last30HA: data["RB Prop Total Vs 30 At"] || "-"
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Batters (" + (data["L Batters"] || "0") + ") Versus " + (data["Handedness"] === "R" ? "Righties" : "Lefties"),
                        fullSeason: data["LB Prop Total Vs Season"] || "-",
                        fullSeasonHA: data["LB Prop Total Vs Season At"] || "-",
                        last30: data["LB Prop Total Vs 30"] || "-",
                        last30HA: data["LB Prop Total Vs 30 At"] || "-"
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
        } catch (error) {
            console.error("Error creating pitcher clearances subtable2:", error, data);
            container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
        }
    }
}
