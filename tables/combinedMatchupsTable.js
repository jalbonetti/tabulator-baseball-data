// tables/combinedMatchupsTable.js - WITH PARK FACTORS AND PITCHER STATS
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.parkFactorsCache = new Map(); // Cache for park factors data
        this.pitcherStatsCache = new Map(); // Cache for pitcher stats data
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
                    row._pitcherStatsFetched = false;
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

    // Determine if the team is home or away
    isTeamHome(matchupGame, teamCode) {
        // Check if the game string contains "vs" (home) or "@" (away)
        if (matchupGame.includes(" vs ")) {
            // Team before "vs" is home
            const homeTeam = matchupGame.split(" vs ")[0].trim();
            return homeTeam.includes(teamCode);
        } else if (matchupGame.includes(" @ ")) {
            // Team after "@" is home
            const teams = matchupGame.split(" @ ");
            const homeTeam = teams[1] ? teams[1].trim() : "";
            return homeTeam.includes(teamCode);
        }
        return false;
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

    // Fetch pitcher stats data for a specific matchup (lazy loading)
    async fetchPitcherStats(matchupId) {
        // Check cache first
        if (this.pitcherStatsCache.has(matchupId)) {
            return this.pitcherStatsCache.get(matchupId);
        }

        try {
            console.log(`Fetching pitcher stats for matchup ${matchupId}...`);
            
            const response = await fetch(
                `${API_CONFIG.baseURL}ModPitcherMatchups?Starter Game ID=eq.${matchupId}`,
                {
                    method: 'GET',
                    headers: API_CONFIG.headers
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch pitcher stats');
            }
            
            const pitcherStats = await response.json();
            
            // Cache the result
            this.pitcherStatsCache.set(matchupId, pitcherStats);
            
            return pitcherStats;
        } catch (error) {
            console.error('Error fetching pitcher stats:', error);
            return null;
        }
    }

    // Override setupRowExpansion to include data fetching
    setupRowExpansion() {
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                
                // If expanding and no data yet, fetch it
                if (!data._expanded && (!data._parkFactorsFetched || !data._pitcherStatsFetched)) {
                    // Show loading indicator
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳'; // Loading symbol
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    // Fetch data in parallel
                    const matchupId = data["Matchup Game ID"];
                    const [parkFactors, pitcherStats] = await Promise.all([
                        !data._parkFactorsFetched ? this.fetchParkFactors(matchupId) : Promise.resolve(data._parkFactors),
                        !data._pitcherStatsFetched ? this.fetchPitcherStats(matchupId) : Promise.resolve(data._pitcherStats)
                    ]);
                    
                    if (parkFactors) {
                        data._parkFactors = parkFactors;
                        data._parkFactorsFetched = true;
                    }
                    
                    if (pitcherStats) {
                        data._pitcherStats = pitcherStats;
                        data._pitcherStatsFetched = true;
                    }
                    
                    row.update(data);
                    
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

    // Create matchups-specific subtable with park factors and pitcher stats
    createMatchupsSubtable(container, data) {
        // Weather data - these are full weather strings with times
        const weatherData = [
            data["Matchup Weather 1"] || "No weather data",
            data["Matchup Weather 2"] || "No weather data",
            data["Matchup Weather 3"] || "No weather data",
            data["Matchup Weather 4"] || "No weather data"
        ];

        // Determine if the team is home or away
        const isHome = this.isTeamHome(data["Matchup Game"], data["Matchup Team"]);
        const locationText = isHome ? "Home" : "Away";
        const opposingLocationText = isHome ? "Away" : "Home"; // Opposite for pitcher

        // Create the three-column layout
        let tableHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <!-- Ballpark Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Ballpark</h5>
                    <div style="text-align: center; padding: 20px 10px; font-weight: bold; font-size: 14px; color: #333;">
                        ${data["Matchup Ballpark"] || "Unknown Ballpark"}
                    </div>
                </div>

                <!-- Park Factors Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Park Factors</h5>
                    <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>

                <!-- Weather Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Weather</h5>
                    <div style="font-size: 12px; color: #333;">
                        <div style="padding: 5px 0; border-bottom: 1px solid #eee;">${weatherData[0]}</div>
                        <div style="padding: 5px 0; border-bottom: 1px solid #eee;">${weatherData[1]}</div>
                        <div style="padding: 5px 0; border-bottom: 1px solid #eee;">${weatherData[2]}</div>
                        <div style="padding: 5px 0;">${weatherData[3]}</div>
                    </div>
                </div>
            </div>
        `;

        // Add pitcher stats section
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Starting Pitcher</h4>
                    <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        // Create park factors table if data exists
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
                    {title: "Split", field: "split", width: 80, headerSort: false},
                    {title: "H", field: "H", width: 50, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: 50, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: 50, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: 50, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: 50, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 25,
                rowHeight: 24
            });
        }

        // Create pitcher stats table if data exists
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            // Get pitcher name from first row
            const pitcherName = data._pitcherStats[0]["Starter Name & Hand"] || "Unknown Pitcher";
            
            // Define the order and transform split IDs
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season @", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs R",
                "vs L": "vs L",
                "Full Season @": `Full Season ${opposingLocationText}`,
                "vs R @": `vs R ${opposingLocationText}`,
                "vs L @": `vs L ${opposingLocationText}`
            };

            // Sort and prepare the data
            const sortedPitcherStats = data._pitcherStats
                .sort((a, b) => {
                    const aIndex = splitOrder.indexOf(a["Starter Split ID"]);
                    const bIndex = splitOrder.indexOf(b["Starter Split ID"]);
                    return aIndex - bIndex;
                });

            // Find the Full Season row (main row)
            const mainRowData = sortedPitcherStats.find(stat => stat["Starter Split ID"] === "Full Season");
            
            if (mainRowData) {
                // Create table data with only the main row initially
                const tableData = [{
                    _id: `${data["Matchup Game ID"]}-main`,
                    _isExpanded: false,
                    _rowType: 'main',
                    name: pitcherName,
                    split: "Full Season",
                    TBF: mainRowData["Starter TBF"],
                    "H/TBF": mainRowData["Starter H/TBF"],
                    H: mainRowData["Starter H"],
                    "1B": mainRowData["Starter 1B"],
                    "2B": mainRowData["Starter 2B"],
                    "3B": mainRowData["Starter 3B"],
                    HR: mainRowData["Starter HR"],
                    R: mainRowData["Starter R"],
                    ERA: mainRowData["Starter ERA"],
                    BB: mainRowData["Starter BB"],
                    SO: mainRowData["Starter SO"]
                }];

                // Create the pitcher stats table
                const pitcherTable = new Tabulator(`#pitcher-stats-subtable-${data["Matchup Game ID"]}`, {
                    layout: "fitColumns",
                    data: tableData,
                    columns: [
                        {
                            title: "Name", 
                            field: "name", 
                            width: 200,
                            headerSort: false,
                            formatter: function(cell) {
                                const rowData = cell.getRow().getData();
                                const value = cell.getValue();
                                
                                // Only show expander on main row
                                if (rowData._rowType === 'main') {
                                    const expanded = rowData._isExpanded || false;
                                    return `<div style="cursor: pointer; display: flex; align-items: center;">
                                        <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;">${expanded ? '−' : '+'}</span>
                                        <span>${value}</span>
                                    </div>`;
                                }
                                // Child rows are indented
                                return `<div style="margin-left: 30px;">${value}</div>`;
                            }
                        },
                        {title: "Split", field: "split", width: 150, headerSort: false},
                        {title: "TBF", field: "TBF", width: 60, hozAlign: "center", headerSort: false},
                        {title: "H/TBF", field: "H/TBF", width: 70, hozAlign: "center", headerSort: false},
                        {title: "H", field: "H", width: 50, hozAlign: "center", headerSort: false},
                        {title: "1B", field: "1B", width: 50, hozAlign: "center", headerSort: false},
                        {title: "2B", field: "2B", width: 50, hozAlign: "center", headerSort: false},
                        {title: "3B", field: "3B", width: 50, hozAlign: "center", headerSort: false},
                        {title: "HR", field: "HR", width: 50, hozAlign: "center", headerSort: false},
                        {title: "R", field: "R", width: 50, hozAlign: "center", headerSort: false},
                        {title: "ERA", field: "ERA", width: 60, hozAlign: "center", headerSort: false},
                        {title: "BB", field: "BB", width: 50, hozAlign: "center", headerSort: false},
                        {title: "SO", field: "SO", width: 50, hozAlign: "center", headerSort: false}
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });

                // Handle row clicks for expansion
                pitcherTable.on("cellClick", function(e, cell) {
                    if (cell.getField() === "name") {
                        const row = cell.getRow();
                        const rowData = row.getData();
                        
                        if (rowData._rowType === 'main') {
                            rowData._isExpanded = !rowData._isExpanded;
                            row.update(rowData);
                            
                            if (rowData._isExpanded) {
                                // Add child rows
                                const childRows = [];
                                let insertPosition = row.getPosition() + 1;
                                
                                // Add the other splits in order
                                ["vs R", "vs L", "Full Season @", "vs R @", "vs L @"].forEach((splitId, index) => {
                                    const statData = sortedPitcherStats.find(s => s["Starter Split ID"] === splitId);
                                    if (statData) {
                                        childRows.push({
                                            _id: `${data["Matchup Game ID"]}-child-${index}`,
                                            _rowType: 'child',
                                            _parentId: rowData._id,
                                            name: pitcherName,
                                            split: splitMap[splitId],
                                            TBF: statData["Starter TBF"],
                                            "H/TBF": statData["Starter H/TBF"],
                                            H: statData["Starter H"],
                                            "1B": statData["Starter 1B"],
                                            "2B": statData["Starter 2B"],
                                            "3B": statData["Starter 3B"],
                                            HR: statData["Starter HR"],
                                            R: statData["Starter R"],
                                            ERA: statData["Starter ERA"],
                                            BB: statData["Starter BB"],
                                            SO: statData["Starter SO"]
                                        });
                                    }
                                });
                                
                                // Add rows to table
                                childRows.forEach((childRow, index) => {
                                    pitcherTable.addRow(childRow, false, insertPosition + index);
                                });
                            } else {
                                // Remove child rows
                                const allRows = pitcherTable.getRows();
                                allRows.forEach(r => {
                                    const data = r.getData();
                                    if (data._rowType === 'child' && data._parentId === rowData._id) {
                                        r.delete();
                                    }
                                });
                            }
                            
                            // Update the expander icon
                            pitcherTable.redraw();
                        }
                    }
                });
            }
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
