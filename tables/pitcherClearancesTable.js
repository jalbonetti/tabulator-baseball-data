// tables/pitcherClearancesTable.js - COMPLETE VERSION WITH STATE PRESERVATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatClearancePercentage, formatRatio, removeLeadingZeroFromValue } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class PitcherClearancesTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherClearances');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading all pitcher clearance records...",
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
        
        // CRITICAL: Use the base class setupRowExpansion which has proper global state management
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Pitcher Clearances table built successfully");
        });
    }

    getColumns() {
        // Odds formatter function
        const oddsFormatter = function(cell) {
            const value = cell.getValue();
            if (!value || value === null || value === undefined) return "-";
            const num = parseInt(value);
            if (isNaN(num)) return "-";
            return num > 0 ? `+${num}` : `${num}`;
        };

        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Pitcher Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Pitcher Team", 
                    width: 120,
                    minWidth: 60,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 80
                        });
                    },
                    resizable: false,
                }
            ]},
            {title: "Prop Info", columns: [
                {
                    title: "Prop", 
                    field: "Pitcher Prop Type", 
                    width: 200, 
                    minWidth: 140,
                    sorter: "string", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 180
                        });
                    },
                    resizable: false
                },
                {
                    title: "Value", 
                    field: "Pitcher Prop Value", 
                    width: 200, 
                    minWidth: 140,
                    sorter: "number", 
                    headerFilter: (cell, onRendered, success, cancel, editorParams) => {
                        return createCustomMultiSelect(cell, onRendered, success, cancel, {
                            dropdownWidth: 100
                        });
                    },
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
            ]},
            {title: "Median Odds", columns: [
                {
                    title: "Over", 
                    field: "Pitcher Median Over Odds", 
                    width: 90, 
                    minWidth: 75,
                    sorter: "number",
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                },
                {
                    title: "Under", 
                    field: "Pitcher Median Under Odds", 
                    width: 90, 
                    minWidth: 75,
                    sorter: "number",
                    resizable: false,
                    formatter: oddsFormatter,
                    hozAlign: "center"
                }
            ]}
        ];
    }

    // Override setupRowExpansion to use Pitcher Name field with proper global state
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            if (field === "Pitcher Name") {
                e.preventDefault();
                e.stopPropagation();
                
                if (self.isRestoringState) {
                    console.log("Click during restoration - queueing for later");
                    setTimeout(() => {
                        if (!self.isRestoringState) {
                            cell.getElement().click();
                        }
                    }, 500);
                    return;
                }
                
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    if (self.isRestoringState) {
                        console.log("Still restoring, ignoring click");
                        return;
                    }
                    
                    var row = cell.getRow();
                    var data = row.getData();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    // Toggle expansion
                    data._expanded = !data._expanded;
                    
                    // CRITICAL: Update global state immediately
                    const rowId = self.generateRowId(data);
                    const globalState = self.getGlobalState();
                    
                    if (data._expanded) {
                        globalState.set(rowId, {
                            timestamp: Date.now(),
                            data: data
                        });
                    } else {
                        globalState.delete(rowId);
                    }
                    
                    self.setGlobalState(globalState);
                    
                    console.log(`Pitcher row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                    
                    row.update(data);
                    
                    var cellElement = cell.getElement();
                    var expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                    }
                    
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        requestAnimationFrame(() => {
                            try {
                                var updatedCellElement = cell.getElement();
                                if (updatedCellElement) {
                                    var updatedExpanderIcon = updatedCellElement.querySelector('.row-expander');
                                    if (updatedExpanderIcon) {
                                        updatedExpanderIcon.innerHTML = data._expanded ? "−" : "+";
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        });
                    });
                }, 50);
            }
        });
    }

    createRowFormatter() {
        const self = this;
        
        return (row) => {
            var data = row.getData();
            var rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow || self.isRestoringState) {
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        requestAnimationFrame(() => {
                            var holderEl = document.createElement("div");
                            holderEl.classList.add('subrow-container');
                            holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%; position: relative; z-index: 1;';
                            
                            var subtable1 = document.createElement("div");
                            subtable1.style.marginBottom = "15px";
                            var subtable2 = document.createElement("div");
                            
                            holderEl.appendChild(subtable1);
                            holderEl.appendChild(subtable2);
                            rowElement.appendChild(holderEl);
                            
                            try {
                                self.createSubtable1(subtable1, data);
                            } catch (error) {
                                console.error("Error creating subtable1:", error);
                                subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1: ' + error.message + '</div>';
                            }
                            
                            try {
                                self.createSubtable2(subtable2, data);
                            } catch (error) {
                                console.error("Error creating subtable2:", error);
                                subtable2.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 2: ' + error.message + '</div>';
                            }
                            
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 100);
                        });
                    }
                }
            } else {
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }

    createSubtable1(container, data) {
        var parkFactorDisplay = "R: " + (data["Pitcher Prop Park Factor R"] || "-") + " / L: " + (data["Pitcher Prop Park Factor L"] || "-");
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            virtualDom: false,
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
                resizableColumns: false,
                resizableRows: false,
                movableColumns: false,
                virtualDom: false,
                height: false,
                data: [
                    {
                        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Righties",
                        fullSeason: removeLeadingZeroFromValue(data["Pitcher Prop Total R Vs Season"]) || "-",
                        fullSeasonHA: removeLeadingZeroFromValue(data["Pitcher Prop Total R Vs Season At"]) || "-",
                        last30: removeLeadingZeroFromValue(data["Pitcher Prop Total R Vs 30"]) || "-",
                        last30HA: removeLeadingZeroFromValue(data["Pitcher Prop Total R Vs 30 At"]) || "-"
                    },
                    {
                        player: data["Pitcher Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                        fullSeason: removeLeadingZeroFromValue(data["Pitcher Prop Total L Vs Season"]) || "-",
                        fullSeasonHA: removeLeadingZeroFromValue(data["Pitcher Prop Total L Vs Season At"]) || "-",
                        last30: removeLeadingZeroFromValue(data["Pitcher Prop Total L Vs 30"]) || "-",
                        last30HA: removeLeadingZeroFromValue(data["Pitcher Prop Total L Vs 30 At"]) || "-"
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Righty Batters (" + (data["R Batters"] || "0") + ") Versus " + (data["Handedness"] === "L" ? "Lefties" : "Righties"),
                        fullSeason: removeLeadingZeroFromValue(data["RB Prop Total Vs Season"]) || "-",
                        fullSeasonHA: removeLeadingZeroFromValue(data["RB Prop Total Vs Season At"]) || "-",
                        last30: removeLeadingZeroFromValue(data["RB Prop Total Vs 30"]) || "-",
                        last30HA: removeLeadingZeroFromValue(data["RB Prop Total Vs 30 At"]) || "-"
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Batters (" + (data["L Batters"] || "0") + ") Versus " + (data["Handedness"] === "R" ? "Righties" : "Lefties"),
                        fullSeason: removeLeadingZeroFromValue(data["LB Prop Total Vs Season"]) || "-",
                        fullSeasonHA: removeLeadingZeroFromValue(data["LB Prop Total Vs Season At"]) || "-",
                        last30: removeLeadingZeroFromValue(data["LB Prop Total Vs 30"]) || "-",
                        last30HA: removeLeadingZeroFromValue(data["LB Prop Total Vs 30 At"]) || "-"
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
