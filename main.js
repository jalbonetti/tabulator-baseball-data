// tables/baseTable.js
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.tableConfig = this.getBaseConfig();
    }

    getBaseConfig() {
        return {
            ajaxURL: API_CONFIG.baseURL + this.endpoint,
            ajaxConfig: {
                method: "GET",
                headers: API_CONFIG.headers
            },
            layout: "fitColumns",
            responsiveLayout: "hide",
            persistence: false,
            ajaxContentType: "json",
            paginationSize: false,
            height: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            dataLoaded: (data) => {
                console.log(`Table loaded ${data.length} total records`);
                data.forEach(row => {
                    row._expanded = false;
                });
            }
        };
    }

    // NEW METHOD: Get the Tabulator instance
    getTable() {
        return this.table;
    }

    // Common formatter for Name column with expander
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

    // Common formatter for Team column
    createTeamFormatter() {
        return function(cell) {
            var value = cell.getValue();
            return TEAM_NAME_MAP[value] || value;
        };
    }

    // Setup click handler for row expansion
    setupRowExpansion() {
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Batter Name") {
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

    // Create subtable 1 (common info)
    createSubtable1(container, data) {
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"]
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 150},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 180},
                {title: "Matchup", field: "matchup", headerSort: false, width: 280},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 180}
            ]
        });
    }

    // To be overridden by child classes
    createSubtable2(container, data) {
        throw new Error("createSubtable2 must be implemented by child class");
    }

    // Common row formatter
    createRowFormatter() {
        return (row) => {
            var data = row.getData();
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                var holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                var subtable1 = document.createElement("div");
                var subtable2 = document.createElement("div");
                
                holderEl.appendChild(subtable1);
                holderEl.appendChild(subtable2);
                row.getElement().appendChild(holderEl);
                
                this.createSubtable1(subtable1, data);
                this.createSubtable2(subtable2, data);
            } else if (!data._expanded) {
                var existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    // Initialize the table
    initialize() {
        throw new Error("initialize must be implemented by child class");
    }

    // Redraw the table
    redraw() {
        if (this.table) {
            this.table.redraw();
        }
    }
}
