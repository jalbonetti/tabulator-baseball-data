// tables/combinedMatchupsTable.js - UPDATED WITH PARK FACTORS
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.parkFactorsCache = new Map(); // Cache for park factors data
    }

    initialize() {
        console.log('Initializing enhanced matchups table...');
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            // Remove fixed height to allow natural expansion
            height: false,
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
                    row._parkFactorsFetched = false;
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

    // Fetch park factors data for a specific matchup (lazy loading)
    async fetchParkFactors(matchupId) {
        // Check cache first
        if (this.parkFactorsCache.has(matchupId)) {
            return this.parkFactorsCache.get(matchupId);
        }

        try {
            console.log(`Fetching park factors for matchup ${matchupId}...`);
            
            const response = await fetch(
                `${API_CONFIG.baseURL}ModParkFactors?Park Factor Game ID=eq.${matchupId}`,
                {
                    method: 'GET',
                    headers: API_CONFIG.headers
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch park factors');
            }
            
            const parkFactors = await response.json();
            
            // Cache the result
            this.parkFactorsCache.set(matchupId, parkFactors);
            
            return parkFactors;
        } catch (error) {
            console.error('Error fetching park factors:', error);
            return null;
        }
    }

    // Override setupRowExpansion to include data fetching
    setupRowExpansion() {
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                
                // If expanding and no park factors yet, fetch them
                if (!data._expanded && !data._parkFactorsFetched) {
                    // Show loading indicator
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳'; // Loading symbol
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    // Fetch park factors data
                    const matchupId = data["Matchup Game ID"];
                    const parkFactors = await this.fetchParkFactors(matchupId);
                    
                    if (parkFactors) {
                        // Add the park factors to the row data
                        data._parkFactors = parkFactors;
                        data._parkFactorsFetched = true;
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

    // Create matchups-specific subtable with park factors
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

        // If park factors data is available, show it
        if (data._parkFactors && data._parkFactors.length > 0) {
            // Transform Split ID values
            const splitIdMap = {
                'A': 'All',
                'R': 'Righties',
                'L': 'Lefties'
            };

            // Sort park factors by split ID (A, R, L order)
            const sortedParkFactors = data._parkFactors.sort((a, b) => {
                const order = { 'A': 0, 'R': 1, 'L': 2 };
                return order[a["Park Factor Split ID"]] - order[b["Park Factor Split ID"]];
            });

            // Create the park factors table
            tableHTML += `
                <div style="margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Park Factors</h4>
                    <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>
            `;

            container.innerHTML = tableHTML;

            // Create Tabulator instance for park factors
            new Tabulator(`#park-factors-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitColumns",
                data: sortedParkFactors.map(pf => ({
                    split: splitIdMap[pf["Park Factor Split ID"]] || pf["Park Factor Split ID"],
                    H: pf["Park Factor H"],
                    "1B": pf["Park Factor 1B"],
                    "2B": pf["Park Factor 2B"],
                    "3B": pf["Park Factor 3B"],
                    HR: pf["Park Factor HR"],
                    R: pf["Park Factor R"],
                    BB: pf["Park Factor BB"],
                    SO: pf["Park Factor SO"]
                })),
                columns: [
                    {title: "Split", field: "split", width: 100, headerSort: false},
                    {title: "H", field: "H", width: 70, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: 70, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: 70, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: 70, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: 70, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: 70, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: 70, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: 70, hozAlign: "center", headerSort: false}
                ],
                height: false,  // Allow natural height
                headerHeight: 30,
                rowHeight: 28
            });
        } else {
            container.innerHTML = tableHTML;
        }
        
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
