// tables/baseTable.js - COMPLETE FIXED VERSION
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
        const config = {
            layout: "fitColumns",
            responsiveLayout: false,
            persistence: false,
            paginationSize: false,
            height: "600px",
            minWidth: 1900,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            placeholder: "Loading data...",
            // DISABLE virtual rendering for better compatibility with dynamic row heights
            virtualDom: false,
            virtualDomBuffer: 300,
            renderVertical: "basic",
            renderHorizontal: "basic",
            dataLoaded: (data) => {
                console.log(`Table loaded ${data.length} total records`);
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
            }
        };

        // Only add AJAX config if endpoint is provided
        if (this.endpoint) {
            config.ajaxURL = API_CONFIG.baseURL + this.endpoint;
            config.ajaxConfig = {
                method: "GET",
                headers: {
                    ...API_CONFIG.headers,
                    "Prefer": "count=exact"
                }
            };
            config.ajaxContentType = "json";
            
            // Universal pagination function for all tables
            config.ajaxRequestFunc = async function(url, config, params) {
                const allRecords = [];
                const pageSize = 1000;
                let offset = 0;
                let hasMore = true;
                let totalExpected = null;
                
                console.log(`Loading data from ${url}...`);
                
                while (hasMore) {
                    const requestUrl = `${url}?select=*&limit=${pageSize}&offset=${offset}`;
                    
                    try {
                        const response = await fetch(requestUrl, {
                            ...config,
                            headers: {
                                ...config.headers,
                                'Range': `${offset}-${offset + pageSize - 1}`,
                                'Range-Unit': 'items'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Network response was not ok: ${response.status}`);
                        }
                        
                        const contentRange = response.headers.get('content-range');
                        if (contentRange && totalExpected === null) {
                            const match = contentRange.match(/\d+-\d+\/(\d+)/);
                            if (match) {
                                totalExpected = parseInt(match[1]);
                                console.log(`Total records to fetch: ${totalExpected}`);
                            }
                        }
                        
                        const data = await response.json();
                        allRecords.push(...data);
                        
                        if (totalExpected) {
                            const progress = ((allRecords.length / totalExpected) * 100).toFixed(1);
                            console.log(`Loading progress: ${allRecords.length}/${totalExpected} (${progress}%)`);
                        }
                        
                        hasMore = data.length === pageSize;
                        offset += pageSize;
                        
                        if (offset > 10000) {
                            console.warn('Safety limit reached, stopping data fetch');
                            hasMore = false;
                        }
                    } catch (error) {
                        console.error("Error loading batch:", error);
                        hasMore = false;
                    }
                }
                
                console.log(`✅ Data loading complete: ${allRecords.length} total records`);
                return allRecords;
            };
        }

        return config;
    }

    getTable() {
        return this.table;
    }

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

    createTeamFormatter() {
        return function(cell) {
            var value = cell.getValue();
            return value;
        };
    }

    // FIXED: Setup row expansion with better handling
    setupRowExpansion() {
        if (!this.table) return;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            const expandableFields = [
                "Batter Name", 
                "Pitcher Name", 
                "Matchup Team"
            ];
            
            if (expandableFields.includes(field)) {
                e.preventDefault();
                e.stopPropagation();
                
                var row = cell.getRow();
                var data = row.getData();
                
                // Initialize if undefined
                if (data._expanded === undefined) {
                    data._expanded = false;
                }
                
                // Toggle expansion state
                data._expanded = !data._expanded;
                
                // Update the row data
                row.update(data);
                
                // Use requestAnimationFrame for smooth updates
                requestAnimationFrame(() => {
                    // Reformat the row to trigger the rowFormatter
                    row.reformat();
                    
                    // Update expander icon
                    requestAnimationFrame(() => {
                        try {
                            var cellElement = cell.getElement();
                            if (cellElement) {
                                var expanderIcon = cellElement.querySelector('.row-expander');
                                if (expanderIcon) {
                                    expanderIcon.innerHTML = data._expanded ? "−" : "+";
                                }
                            }
                        } catch (error) {
                            console.error("Error updating expander icon:", error);
                        }
                        
                        // Force a table redraw to ensure proper layout
                        if (this.table && data._expanded) {
                            setTimeout(() => {
                                this.table.redraw();
                            }, 150);
                        }
                    });
                });
            }
        });
    }

    createSubtable1(container, data) {
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"] || data["Pitcher Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"]
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 300},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 200},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 400}
            ]
        });
    }

    createSubtable2(container, data) {
        console.log("createSubtable2 should be overridden by child class");
    }

    // FIXED: Improved row formatter with proper expansion handling
    createRowFormatter() {
        const self = this;
        
        return (row) => {
            var data = row.getData();
            var rowElement = row.getElement();
            
            // Initialize _expanded if undefined
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            // Add/remove expanded class
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            // Handle expansion
            if (data._expanded) {
                // Check if subtables already exist
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow) {
                    // Create container for subtables
                    var holderEl = document.createElement("div");
                    holderEl.classList.add('subrow-container');
                    holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%;';
                    
                    // Check if this is the matchups table
                    if (data["Matchup Team"] !== undefined) {
                        var subtableEl = document.createElement("div");
                        holderEl.appendChild(subtableEl);
                        rowElement.appendChild(holderEl);
                        
                        if (self.createMatchupsSubtable) {
                            self.createMatchupsSubtable(subtableEl, data);
                        }
                    } else {
                        // For other tables, create two subtables
                        var subtable1 = document.createElement("div");
                        subtable1.style.marginBottom = "15px"; // Add spacing between subtables
                        var subtable2 = document.createElement("div");
                        
                        holderEl.appendChild(subtable1);
                        holderEl.appendChild(subtable2);
                        rowElement.appendChild(holderEl);
                        
                        // Create subtables with error handling
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
                    }
                    
                    // Force row height recalculation
                    setTimeout(() => {
                        row.normalizeHeight();
                        // Trigger table redraw to fix any layout issues
                        if (self.table) {
                            self.table.redraw();
                        }
                    }, 100);
                }
            } else {
                // Handle contraction
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    // Force row height recalculation
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }

    initialize() {
        throw new Error("initialize must be implemented by child class");
    }

    redraw() {
        if (this.table) {
            this.table.redraw(true);
        }
    }
    
    getTabulator() {
        return this.table;
    }
}
