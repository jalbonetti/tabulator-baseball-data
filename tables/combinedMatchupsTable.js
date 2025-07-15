// tables/combinedMatchupsTable.js - LAZY LOADING VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.additionalDataCache = new Map(); // Cache for additional data
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
                // Sort by Game ID to order by time
                {column: "Matchup Game ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`✅ Matchups data successfully loaded: ${data.length} rows`);
                // Initialize expansion state
                data.forEach(row => {
                    row._expanded = false;
                    row._additionalDataFetched = false;
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
                title: "ID",
                field: "Matchup Game ID",
                visible: false,  // Hidden but used for sorting
                sorter: "number"
            },
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
                headerSort: false  // No sorting on game column
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 120,
                hozAlign: "center",
                headerSort: false  // Disable sorting on spread
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 120,
                hozAlign: "center",
                headerSort: false  // Disable sorting on total
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 150,
                hozAlign: "center",
                headerFilter: createCustomMultiSelect,  // Keep filtering
                headerSort: false,  // Disable sorting on lineup status
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

    // Fetch additional data for a specific matchup (lazy loading)
    async fetchAdditionalData(matchupId) {
        // Check cache first
        if (this.additionalDataCache.has(matchupId)) {
            return this.additionalDataCache.get(matchupId);
        }

        try {
            console.log(`Fetching additional data for matchup ${matchupId}...`);
            
            // Fetch from multiple tables in parallel
            const [parkFactors, batterMatchups, pitcherMatchups, bullpenMatchups] = await Promise.all([
                this.fetchTableData('ModParkFactors', matchupId),
                this.fetchTableData('ModBatterMatchups', matchupId),
                this.fetchTableData('ModPitcherMatchups', matchupId),
                this.fetchTableData('ModBullpenMatchups', matchupId)
            ]);

            const additionalData = {
                parkFactors,
                batterMatchups,
                pitcherMatchups,
                bullpenMatchups
            };

            // Cache the result
            this.additionalDataCache.set(matchupId, additionalData);
            
            return additionalData;
        } catch (error) {
            console.error('Error fetching additional data:', error);
            return null;
        }
    }

    // Helper to fetch data from a specific table
    async fetchTableData(tableName, matchupId) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}${tableName}?Matchup_Game_ID=eq.${matchupId}`,
                {
                    method: 'GET',
                    headers: API_CONFIG.headers
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${tableName}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return [];
        }
    }

    // Override setupRowExpansion to include data fetching
    setupRowExpansion() {
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                
                // If expanding and no additional data yet, fetch it
                if (!data._expanded && !data._additionalDataFetched) {
                    // Show loading indicator
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳'; // Loading symbol
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    // Fetch additional data
                    const matchupId = data["Matchup Game ID"];
                    const additionalData = await this.fetchAdditionalData(matchupId);
                    
                    if (additionalData) {
                        // Add the additional data to the row
                        data._additionalData = additionalData;
                        data._additionalDataFetched = true;
                        row.update(data);
                    }
                    
                    // Remove loading spinner
                    if (expanderIcon) {
                        expanderIcon.style.animation = '';
                    }
                }
                
                // Toggle expansion
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

    // Create matchups-specific subtable with weather time periods
    createMatchupsSubtable(container, data) {
        // Weather data - these are full weather strings with times
        const weatherData = [
            data["Matchup Weather 1"] || "No weather data",
            data["Matchup Weather 2"] || "No weather data",
            data["Matchup Weather 3"] || "No weather data",
            data["Matchup Weather 4"] || "No weather data"
        ];

        // Create a custom HTML table for the special layout
        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd; margin-bottom: 10px;">
                <tbody>
                    <tr>
                        <td rowspan="4" style="width: 40%; padding: 15px; border-right: 2px solid #ddd; vertical-align: middle; text-align: center; background: #f8f9fa; font-weight: bold; font-size: 14px;">
                            ${data["Matchup Ballpark"] || "Unknown Ballpark"}
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #333; font-size: 13px;">
                            ${weatherData[0]}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #333; font-size: 13px;">
                            ${weatherData[1]}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #333; font-size: 13px;">
                            ${weatherData[2]}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 15px; color: #333; font-size: 13px;">
                            ${weatherData[3]}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        // If additional data is available, show it
        if (data._additionalData) {
            const { parkFactors, batterMatchups, pitcherMatchups, bullpenMatchups } = data._additionalData;
            
            // Add a summary section with more detailed information
            tableHTML += `
                <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Additional Matchup Data</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div>
                            <strong style="color: #1976d2;">Park Factors:</strong> 
                            <span>${parkFactors.length} records loaded</span>
                        </div>
                        <div>
                            <strong style="color: #1976d2;">Batter Matchups:</strong> 
                            <span>${batterMatchups.length} records loaded</span>
                        </div>
                        <div>
                            <strong style="color: #1976d2;">Pitcher Matchups:</strong> 
                            <span>${pitcherMatchups.length} records loaded</span>
                        </div>
                        <div>
                            <strong style="color: #1976d2;">Bullpen Matchups:</strong> 
                            <span>${bullpenMatchups.length} records loaded</span>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;
        
        // Add loading animation CSS if not already added
        if (!document.getElementById('matchups-loading-css')) {
            const style = document.createElement('style');
            style.id = 'matchups-loading-css';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // We don't need the other subtable methods for matchups
    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }
}
