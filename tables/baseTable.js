// tables/baseTable.js - FIXED VERSION WITH PERFORMANCE IMPROVEMENTS
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
            // RE-ENABLE virtual rendering for better performance
            virtualDom: true,
            virtualDomBuffer: 300,
            renderVertical: "virtual", // Changed back to virtual
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

    // FIXED: Setup row expansion without scroll manipulation
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
                
                if (data._expanded === undefined) {
                    data._expanded = false;
                }
                
                data._expanded = !data._expanded;
                
                // Use requestAnimationFrame to defer the update
                requestAnimationFrame(() => {
                    row.update(data);
                    
                    // Defer reformatting to prevent stuttering
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        // Update expander icon after reformat
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

    // FIXED: Improved row formatter with better error handling
    createRowFormatter() {
        return (row) => {
            var data = row.getData();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            if (data._expanded) {
                row.getElement().classList.add('row-expanded');
            } else {
                row.getElement().classList.remove('row-expanded');
            }
            
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                var holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                // Check if this is the matchups table
                if (data["Matchup Team"] !== undefined) {
                    var subtableEl = document.createElement("div");
                    holderEl.appendChild(subtableEl);
                    row.getElement().appendChild(holderEl);
                    
                    if (this.createMatchupsSubtable) {
                        this.createMatchupsSubtable(subtableEl, data);
                    }
                } else {
                    // For other tables, create two subtables
                    var subtable1 = document.createElement("div");
                    var subtable2 = document.createElement("div");
                    
                    holderEl.appendChild(subtable1);
                    holderEl.appendChild(subtable2);
                    row.getElement().appendChild(holderEl);
                    
                    // Use Promise.resolve to ensure proper error handling
                    Promise.resolve().then(() => {
                        try {
                            this.createSubtable1(subtable1, data);
                        } catch (error) {
                            console.error("Error creating subtable1:", error);
                            subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1</div>';
                        }
                    });
                    
                    Promise.resolve().then(() => {
                        try {
                            this.createSubtable2(subtable2, data);
                        } catch (error) {
                            console.error("Error creating subtable2:", error);
                            subtable2.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 2</div>';
                        }
                    });
                    
                    holderEl.classList.add('rendered');
                }
                
                // Defer height recalculation
                requestAnimationFrame(() => {
                    row.reformat();
                });
            } else if (!data._expanded) {
                var existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    row.getElement().classList.remove('row-expanded');
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
