// tables/combinedMatchupsTable.js - COMPLETE VERSION WITH ALL SUBTABLES
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.parkFactorsCache = new Map();
        this.pitcherStatsCache = new Map();
        this.batterMatchupsCache = new Map();
        this.bullpenMatchupsCache = new Map();
    }

    initialize() {
        console.log('Initializing enhanced matchups table...');
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            height: false,
            layout: "fitColumns",
            placeholder: "Loading matchups data...",
            initialSort: [
                {column: "Matchup Game ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`✅ Matchups data successfully loaded: ${data.length} rows`);
                data.forEach(row => {
                    row._expanded = false;
                    row._dataFetched = false;
                });
                this.matchupsData = data;
            }
        };

        this.table = new Tabulator(this.elementId, config);
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
                visible: false,
                sorter: "number"
            },
            {
                title: "Team", 
                field: "Matchup Team",
                width: 200,
                headerFilter: true,
                headerFilterPlaceholder: "Search teams...",
                sorter: "string",
                formatter: (cell, formatterParams, onRendered) => {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const expanded = row.getData()._expanded || false;
                    
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
                headerFilter: createCustomMultiSelect,
                headerSort: false
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 120,
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 120,
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 150,
                hozAlign: "center",
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return "";
                    
                    const color = value.toLowerCase().includes('confirmed') ? '#28a745' : '#6c757d';
                    return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${value}</span>`;
                }
            }
        ];
    }

    // Determine if the team is home or away based on game string
    isTeamAway(matchupGame) {
        // If game contains @, the team before @ is away
        return matchupGame.includes(" @ ");
    }

    // Fetch all data for a matchup
    async fetchMatchupData(matchupId) {
        try {
            console.log(`Fetching all data for matchup ${matchupId}...`);
            
            const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                this.fetchParkFactors(matchupId),
                this.fetchPitcherStats(matchupId),
                this.fetchBatterMatchups(matchupId),
                this.fetchBullpenMatchups(matchupId)
            ]);
            
            return { parkFactors, pitcherStats, batterMatchups, bullpenMatchups };
        } catch (error) {
            console.error('Error fetching matchup data:', error);
            return { parkFactors: null, pitcherStats: null, batterMatchups: null, bullpenMatchups: null };
        }
    }

    async fetchParkFactors(matchupId) {
        if (this.parkFactorsCache.has(matchupId)) {
            return this.parkFactorsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModParkFactors?Park Factor Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch park factors');
            
            const parkFactors = await response.json();
            this.parkFactorsCache.set(matchupId, parkFactors);
            return parkFactors;
        } catch (error) {
            console.error('Error fetching park factors:', error);
            return null;
        }
    }

    async fetchPitcherStats(matchupId) {
        if (this.pitcherStatsCache.has(matchupId)) {
            return this.pitcherStatsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModPitcherMatchups?Starter Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch pitcher stats');
            
            const pitcherStats = await response.json();
            this.pitcherStatsCache.set(matchupId, pitcherStats);
            return pitcherStats;
        } catch (error) {
            console.error('Error fetching pitcher stats:', error);
            return null;
        }
    }

    async fetchBatterMatchups(matchupId) {
        if (this.batterMatchupsCache.has(matchupId)) {
            return this.batterMatchupsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModBatterMatchups?Batter Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch batter matchups');
            
            const batterMatchups = await response.json();
            this.batterMatchupsCache.set(matchupId, batterMatchups);
            return batterMatchups;
        } catch (error) {
            console.error('Error fetching batter matchups:', error);
            return null;
        }
    }

    async fetchBullpenMatchups(matchupId) {
        if (this.bullpenMatchupsCache.has(matchupId)) {
            return this.bullpenMatchupsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModBullpenMatchups?Bullpen Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch bullpen matchups');
            
            const bullpenMatchups = await response.json();
            this.bullpenMatchupsCache.set(matchupId, bullpenMatchups);
            return bullpenMatchups;
        } catch (error) {
            console.error('Error fetching bullpen matchups:', error);
            return null;
        }
    }

    setupRowExpansion() {
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                
                if (!data._expanded && !data._dataFetched) {
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳';
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    const matchupId = data["Matchup Game ID"];
                    const matchupData = await this.fetchMatchupData(matchupId);
                    
                    Object.assign(data, {
                        _parkFactors: matchupData.parkFactors,
                        _pitcherStats: matchupData.pitcherStats,
                        _batterMatchups: matchupData.batterMatchups,
                        _bullpenMatchups: matchupData.bullpenMatchups,
                        _dataFetched: true
                    });
                    
                    row.update(data);
                    
                    if (expanderIcon) {
                        expanderIcon.style.animation = '';
                    }
                }
                
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
                
                this.createMatchupsSubtable(subtableEl, data);
            } else if (!data._expanded) {
                const existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    createMatchupsSubtable(container, data) {
        const weatherData = [
            data["Matchup Weather 1"] || "No weather data",
            data["Matchup Weather 2"] || "No weather data",
            data["Matchup Weather 3"] || "No weather data",
            data["Matchup Weather 4"] || "No weather data"
        ];

        const isTeamAway = this.isTeamAway(data["Matchup Game"]);
        const opposingPitcherLocation = isTeamAway ? "at Home" : "Away";

        const ballparkName = data["Matchup Ballpark"] || "Unknown Ballpark";

        // Create the two-column layout (removed Ballpark column)
        let tableHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <!-- Park Factors Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${ballparkName} Park Factors</h5>
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

        // Add sections for the other data
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Starting Pitcher</h4>
                    <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>
            `;
        }

        if (data._batterMatchups && data._batterMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Starting Lineup</h4>
                    <div id="batter-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>
            `;
        }

        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Bullpen</h4>
                    <div id="bullpen-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%;"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        // Create park factors table
        this.createParkFactorsTable(data);
        
        // Create pitcher stats table
        this.createPitcherStatsTable(data, opposingPitcherLocation);
        
        // Create batter matchups table
        this.createBatterMatchupsTable(data);
        
        // Create bullpen matchups table
        this.createBullpenMatchupsTable(data, opposingPitcherLocation);
        
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

    createParkFactorsTable(data) {
        if (data._parkFactors && data._parkFactors.length > 0) {
            const splitIdMap = {
                'A': 'All',
                'R': 'Righties',
                'L': 'Lefties'
            };

            const sortedParkFactors = data._parkFactors.sort((a, b) => {
                const order = { 'A': 0, 'R': 1, 'L': 2 };
                return order[a["Park Factor Split ID"]] - order[b["Park Factor Split ID"]];
            });

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
    }

    createPitcherStatsTable(data, opposingLocationText) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const pitcherName = data._pitcherStats[0]["Starter Name & Hand"] || "Unknown Pitcher";
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs R",
                "vs L": "vs L",
                "Full Season@": `Full Season ${opposingLocationText}`,
                "vs R @": `vs R ${opposingLocationText}`,
                "vs L @": `vs L ${opposingLocationText}`
            };

            const sortedPitcherStats = data._pitcherStats
                .sort((a, b) => {
                    const aIndex = splitOrder.indexOf(a["Starter Split ID"]);
                    const bIndex = splitOrder.indexOf(b["Starter Split ID"]);
                    return aIndex - bIndex;
                });

            const mainRowData = sortedPitcherStats.find(stat => stat["Starter Split ID"] === "Full Season");
            
            if (mainRowData) {
                const tableData = [{
                    _id: `${data["Matchup Game ID"]}-main`,
                    _isExpanded: false,
                    _rowType: 'main',
                    name: pitcherName,
                    split: "Full Season",
                    TBF: mainRowData["Starter TBF"],
                    "H/TBF": parseFloat(mainRowData["Starter H/TBF"]).toFixed(3),
                    H: mainRowData["Starter H"],
                    "1B": mainRowData["Starter 1B"],
                    "2B": mainRowData["Starter 2B"],
                    "3B": mainRowData["Starter 3B"],
                    HR: mainRowData["Starter HR"],
                    R: mainRowData["Starter R"],
                    ERA: parseFloat(mainRowData["Starter ERA"]).toFixed(2),
                    BB: mainRowData["Starter BB"],
                    SO: mainRowData["Starter SO"]
                }];

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
                                
                                if (rowData._rowType === 'main') {
                                    const expanded = rowData._isExpanded || false;
                                    return `<div style="cursor: pointer; display: flex; align-items: center;">
                                        <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;">${expanded ? '−' : '+'}</span>
                                        <span>${value}</span>
                                    </div>`;
                                }
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

                pitcherTable.on("cellClick", function(e, cell) {
                    if (cell.getField() === "name") {
                        const row = cell.getRow();
                        const rowData = row.getData();
                        
                        if (rowData._rowType === 'main') {
                            rowData._isExpanded = !rowData._isExpanded;
                            row.update(rowData);
                            
                            if (rowData._isExpanded) {
                                const childRows = [];
                                let insertPosition = row.getPosition() + 1;
                                
                                ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                    const statData = sortedPitcherStats.find(s => s["Starter Split ID"] === splitId);
                                    if (statData) {
                                        childRows.push({
                                            _id: `${data["Matchup Game ID"]}-child-${index}`,
                                            _rowType: 'child',
                                            _parentId: rowData._id,
                                            name: pitcherName,
                                            split: splitMap[splitId],
                                            TBF: statData["Starter TBF"],
                                            "H/TBF": parseFloat(statData["Starter H/TBF"]).toFixed(3),
                                            H: statData["Starter H"],
                                            "1B": statData["Starter 1B"],
                                            "2B": statData["Starter 2B"],
                                            "3B": statData["Starter 3B"],
                                            HR: statData["Starter HR"],
                                            R: statData["Starter R"],
                                            ERA: parseFloat(statData["Starter ERA"]).toFixed(2),
                                            BB: statData["Starter BB"],
                                            SO: statData["Starter SO"]
                                        });
                                    }
                                });
                                
                                childRows.forEach((childRow, index) => {
                                    pitcherTable.addRow(childRow, false, insertPosition + index);
                                });
                            } else {
                                const allRows = pitcherTable.getRows();
                                allRows.forEach(r => {
                                    const data = r.getData();
                                    if (data._rowType === 'child' && data._parentId === rowData._id) {
                                        r.delete();
                                    }
                                });
                            }
                            
                            pitcherTable.redraw();
                        }
                    }
                });
            }
        }
    }

    createBatterMatchupsTable(data) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            // Extract batting order number and sort
            const sortedBatters = data._batterMatchups
                .map(batter => {
                    const nameHandSpot = batter["Batter Name & Hand & Spot"];
                    const match = nameHandSpot.match(/(\d+)$/);
                    const battingOrder = match ? parseInt(match[1]) : 999;
                    return { ...batter, battingOrder };
                })
                .sort((a, b) => a.battingOrder - b.battingOrder);

            new Tabulator(`#batter-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitColumns",
                data: sortedBatters.map(batter => ({
                    name: batter["Batter Name & Hand & Spot"],
                    split: batter["Batter Split ID"],
                    PA: batter["Batter PA"],
                    "H/PA": parseFloat(batter["Batter H/PA"]).toFixed(3),
                    H: batter["Batter H"],
                    "1B": batter["Batter 1B"],
                    "2B": batter["Batter 2B"],
                    "3B": batter["Batter 3B"],
                    HR: batter["Batter HR"],
                    R: batter["Batter R"],
                    RBI: batter["Batter RBI"],
                    BB: batter["Batter BB"],
                    SO: batter["Batter SO"]
                })),
                columns: [
                    {title: "Name", field: "name", width: 200, headerSort: false},
                    {title: "Split", field: "split", width: 100, headerSort: false},
                    {title: "PA", field: "PA", width: 50, hozAlign: "center", headerSort: false},
                    {title: "H/PA", field: "H/PA", width: 60, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: 45, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: 45, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: 45, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: 45, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: 45, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: 45, hozAlign: "center", headerSort: false},
                    {title: "RBI", field: "RBI", width: 50, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: 45, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: 45, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });
        }
    }

    createBullpenMatchupsTable(data, opposingLocationText) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            // Group by hand type (Righties/Lefties)
            const groupedData = {};
            
            data._bullpenMatchups.forEach(bullpen => {
                const handNumber = bullpen["Bullpen Hand & Number"];
                const match = handNumber.match(/(\d+)\s+(Righties|Lefties)/);
                if (match) {
                    const handType = match[2];
                    if (!groupedData[handType]) {
                        groupedData[handType] = [];
                    }
                    groupedData[handType].push(bullpen);
                }
            });

            // Create main rows for Righties and Lefties
            const tableData = [];
            const handOrder = ["Righties", "Lefties"];
            
            handOrder.forEach((handType, index) => {
                const handData = groupedData[handType];
                if (handData && handData.length > 0) {
                    // Calculate totals for main row
                    const totalData = handData[0]; // Use first row as template
                    
                    tableData.push({
                        _id: `${data["Matchup Game ID"]}-bullpen-${handType}`,
                        _isExpanded: false,
                        _rowType: 'main',
                        _handType: handType,
                        name: `${handType} (${handData.length})`,
                        split: "Combined",
                        TBF: handData.reduce((sum, d) => sum + parseInt(d["Bullpen TBF"] || 0), 0),
                        "H/TBF": "-", // Would need calculation
                        H: handData.reduce((sum, d) => sum + parseInt(d["Bullpen H"] || 0), 0),
                        "1B": handData.reduce((sum, d) => sum + parseInt(d["Bullpen 1B"] || 0), 0),
                        "2B": handData.reduce((sum, d) => sum + parseInt(d["Bullpen 2B"] || 0), 0),
                        "3B": handData.reduce((sum, d) => sum + parseInt(d["Bullpen 3B"] || 0), 0),
                        HR: handData.reduce((sum, d) => sum + parseInt(d["Bullpen HR"] || 0), 0),
                        R: handData.reduce((sum, d) => sum + parseInt(d["Bullpen R"] || 0), 0),
                        ERA: "-", // Would need calculation
                        BB: handData.reduce((sum, d) => sum + parseInt(d["Bullpen BB"] || 0), 0),
                        SO: handData.reduce((sum, d) => sum + parseInt(d["Bullpen SO"] || 0), 0),
                        _childData: handData
                    });
                }
            });

            const bullpenTable = new Tabulator(`#bullpen-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitColumns",
                data: tableData,
                columns: [
                    {
                        title: "Type", 
                        field: "name", 
                        width: 150,
                        headerSort: false,
                        formatter: function(cell) {
                            const rowData = cell.getRow().getData();
                            const value = cell.getValue();
                            
                            if (rowData._rowType === 'main') {
                                const expanded = rowData._isExpanded || false;
                                return `<div style="cursor: pointer; display: flex; align-items: center;">
                                    <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;">${expanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: 120, headerSort: false},
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

            bullpenTable.on("cellClick", function(e, cell) {
                if (cell.getField() === "name") {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    
                    if (rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        row.update(rowData);
                        
                        if (rowData._isExpanded) {
                            const childRows = [];
                            let insertPosition = row.getPosition() + 1;
                            
                            // Transform split IDs
                            const splitMap = {
                                "Full Season": "Full Season",
                                "Full Season@": `Full Season ${opposingLocationText}`,
                                "vs L": "vs L",
                                "vs R": "vs R",
                                "vs L @": `vs L ${opposingLocationText}`,
                                "vs R @": `vs R ${opposingLocationText}`
                            };
                            
                            rowData._childData.forEach((childData, index) => {
                                childRows.push({
                                    _id: `${data["Matchup Game ID"]}-bullpen-child-${rowData._handType}-${index}`,
                                    _rowType: 'child',
                                    _parentId: rowData._id,
                                    name: childData["Bullpen Hand & Number"],
                                    split: splitMap[childData["Bullpen Split ID"]] || childData["Bullpen Split ID"],
                                    TBF: childData["Bullpen TBF"],
                                    "H/TBF": parseFloat(childData["Bullpen H/TBF"]).toFixed(3),
                                    H: childData["Bullpen H"],
                                    "1B": childData["Bullpen 1B"],
                                    "2B": childData["Bullpen 2B"],
                                    "3B": childData["Bullpen 3B"],
                                    HR: childData["Bullpen HR"],
                                    R: childData["Bullpen R"],
                                    ERA: parseFloat(childData["Bullpen ERA"]).toFixed(2),
                                    BB: childData["Bullpen BB"],
                                    SO: childData["Bullpen SO"]
                                });
                            });
                            
                            childRows.forEach((childRow, index) => {
                                bullpenTable.addRow(childRow, false, insertPosition + index);
                            });
                        } else {
                            const allRows = bullpenTable.getRows();
                            allRows.forEach(r => {
                                const data = r.getData();
                                if (data._rowType === 'child' && data._parentId === rowData._id) {
                                    r.delete();
                                }
                            });
                        }
                        
                        bullpenTable.redraw();
                    }
                }
            });
        }
    }

    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }
}
