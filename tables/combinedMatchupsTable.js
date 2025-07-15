// tables/combinedMatchupsTable.js - ENHANCED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
    }

    initialize() {
        console.log('Initializing enhanced matchups table...');
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            height: 400,
            layout: "fitColumns",
            placeholder: "Loading matchups data...",
            initialSort: [
                {column: "Matchup Team", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`✅ Matchups data successfully loaded: ${data.length} rows`);
                // Initialize expansion state
                data.forEach(row => {
                    row._expanded = false;
                });
                this.matchupsData = data;
            }
        };

        // Create the Tabulator instance
        this.table = new Tabulator(this.elementId, config);
        
        // Setup row expansion for matchups
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Enhanced matchups table built successfully");
        });
    }

    getColumns() {
        return [
            {
                title: "Team", 
                field: "Matchup Team",
                width: 200,
                headerFilter: true,  // Text search filter
                headerFilterPlaceholder: "Search teams...",
                sorter: "string",
                formatter: (cell, formatterParams, onRendered) => {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const expanded = row.getData()._expanded || false;
                    
                    // Use the team name formatter and add expander
                    const teamName = TEAM_NAME_MAP[value] || value;
                    
                    onRendered(function() {
                        try {
                            const cellElement = cell.getElement();
                            if (cellElement) {
                                cellElement.innerHTML = '';
                                
                                const container = document.createElement("div");
                                container.style.display = "flex";
                                container.style.alignItems = "center";
                                container.style.cursor = "pointer";
                                
                                const expander = document.createElement("span");
                                expander.innerHTML = expanded ? "−" : "+";
                                expander.style.marginRight = "8px";
                                expander.style.fontWeight = "bold";
                                expander.style.color = "#007bff";
                                expander.style.fontSize = "14px";
                                expander.style.minWidth = "12px";
                                expander.classList.add("row-expander");
                                
                                const textSpan = document.createElement("span");
                                textSpan.textContent = teamName;
                                
                                container.appendChild(expander);
                                container.appendChild(textSpan);
                                
                                cellElement.appendChild(container);
                                cellElement.style.textAlign = "left";
                            }
                        } catch (error) {
                            console.error("Error in team formatter:", error);
                        }
                    });
                    
                    return (expanded ? "− " : "+ ") + teamName;
                }
            },
            {
                title: "Game", 
                field: "Matchup Game",
                width: 300,
                headerFilter: createCustomMultiSelect,  // Dropdown filter
                sorter: "string"
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 120,
                hozAlign: "center",
                sorter: "string"
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 120,
                hozAlign: "center",
                sorter: "string"
            },
            {
                title: "Lineup Status",  // Changed from "Status"
                field: "Matchup Lineup Status",
                width: 150,
                hozAlign: "center",
                headerFilter: createCustomMultiSelect,
                formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return "";
                    
                    // Add styling to the status
                    const color = value.toLowerCase().includes('confirmed') ? '#28a745' : '#6c757d';
                    return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${value}</span>`;
                }
            }
        ];
    }

    // Override setupRowExpansion to work with Team column
    setupRowExpansion() {
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                data._expanded = !data._expanded;
                row.update(data);
                row.reformat();
                
                setTimeout(() => {
                    try {
                        const cellElement = cell.getElement();
                        if (cellElement) {
                            const expanderIcon = cellElement.querySelector('.row-expander');
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

    // Override createRowFormatter for matchups-specific subtable
    createRowFormatter() {
        return (row) => {
            const data = row.getData();
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                const holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                const subtableEl = document.createElement("div");
                holderEl.appendChild(subtableEl);
                row.getElement().appendChild(holderEl);
                
                // Create the matchups-specific subtable
                this.createMatchupsSubtable(subtableEl, data);
            } else if (!data._expanded) {
                const existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    // Create matchups-specific subtable
    createMatchupsSubtable(container, data) {
        // Combine weather data with "/" separator
        const weatherData = [
            data["Matchup Weather 1"],
            data["Matchup Weather 2"],
            data["Matchup Weather 3"],
            data["Matchup Weather 4"]
        ].filter(w => w !== null && w !== undefined && w !== '')
         .join(' / ');

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                ballpark: data["Matchup Ballpark"] || "Unknown",
                weather: weatherData || "No weather data"
            }],
            columns: [
                {
                    title: "Ballpark", 
                    field: "ballpark", 
                    headerSort: false, 
                    width: 400,
                    formatter: (cell) => {
                        // Left align ballpark name
                        const el = cell.getElement();
                        if (el) {
                            el.style.textAlign = "left";
                        }
                        return cell.getValue();
                    }
                },
                {
                    title: "Weather", 
                    field: "weather", 
                    headerSort: false,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        // Style the weather data
                        return `<span style="color: #666; font-style: italic;">${value}</span>`;
                    }
                }
            ]
        });
    }

    // We don't need the other subtable methods for matchups
    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }
}
