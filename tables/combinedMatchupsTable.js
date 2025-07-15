// tables/combinedMatchupsTable.js - SIMPLE FIX VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, null);
        this.matchupsData = [];
        this.parkFactorsData = [];
        this.batterMatchupsData = [];
        this.pitcherMatchupsData = [];
        this.bullpenMatchupsData = [];
        this.visibilityFixed = false; // Prevent infinite loops
    }

    async fetchAllData() {
        try {
            const tableNames = {
                matchups: 'ModMatchupsData',
                parkFactors: 'ModParkFactors', 
                batters: 'ModBatterMatchups',
                pitchers: 'ModPitcherMatchups',
                bullpen: 'ModBullpenMatchups'
            };
            
            console.log('Fetching data from tables:', tableNames);
            
            const [matchups, parkFactors, batters, pitchers, bullpen] = await Promise.all([
                this.fetchData(tableNames.matchups),
                this.fetchData(tableNames.parkFactors),
                this.fetchData(tableNames.batters),
                this.fetchData(tableNames.pitchers),
                this.fetchData(tableNames.bullpen)
            ]);

            this.matchupsData = matchups || [];
            this.parkFactorsData = parkFactors || [];
            this.batterMatchupsData = batters || [];
            this.pitcherMatchupsData = pitchers || [];
            this.bullpenMatchupsData = bullpen || [];

            console.log('All data fetched successfully', {
                matchups: this.matchupsData.length,
                parkFactors: this.parkFactorsData.length,
                batters: this.batterMatchupsData.length,
                pitchers: this.pitcherMatchupsData.length,
                bullpen: this.bullpenMatchupsData.length
            });

            return this.combineData();
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    async fetchData(tableName) {
        try {
            console.log(`Fetching ${tableName}...`);
            const response = await fetch(API_CONFIG.baseURL + tableName, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            console.log(`Response status for ${tableName}:`, response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${tableName}: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`Fetched ${data.length} records from ${tableName}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            throw error;
        }
    }

    isHomeGame(matchup, team) {
        if (!matchup || !team) return false;
        
        if (matchup.includes(' vs ')) {
            const teams = matchup.split(' vs ');
            return teams[0].includes(team);
        }
        
        if (matchup.includes(' @ ')) {
            const teams = matchup.split(' @ ');
            return teams[1].includes(team);
        }
        
        return false;
    }

    combineData() {
        const gameMap = new Map();
        
        console.log('Combining data...');
        console.log('Matchups data:', this.matchupsData.length);
        console.log('Park factors:', this.parkFactorsData.length);
        console.log('Batter matchups:', this.batterMatchupsData.length);
        console.log('Pitcher matchups:', this.pitcherMatchupsData.length);
        console.log('Bullpen matchups:', this.bullpenMatchupsData.length);
        
        if (!this.matchupsData || this.matchupsData.length === 0) {
            console.warn('No matchups data available');
            return [];
        }
        
        console.log('First matchup record:', this.matchupsData[0]);
        
        // Process matchups data (primary rows)
        this.matchupsData.forEach(matchup => {
            const gameId = matchup['Matchup Game ID'];
            if (!gameMap.has(gameId)) {
                gameMap.set(gameId, {
                    gameId: gameId,
                    team: matchup['Matchup Team'],
                    game: matchup['Matchup Game'],
                    ballpark: matchup['Matchup Ballpark'],
                    spread: matchup['Matchup Spread'],
                    total: matchup['Matchup Total'],
                    lineupStatus: matchup['Matchup Lineup Status'],
                    weather1: matchup['Matchup Weather 1'],
                    weather2: matchup['Matchup Weather 2'],
                    weather3: matchup['Matchup Weather 3'],
                    weather4: matchup['Matchup Weather 4'],
                    parkFactors: [],
                    batterMatchups: [],
                    pitcherMatchups: [],
                    bullpenMatchups: []
                });
            }
        });

        // Add park factors
        this.parkFactorsData.forEach(pf => {
            const gameId = pf['Park Factor Game ID'];
            const game = gameMap.get(gameId);
            if (game) {
                game.parkFactors.push({
                    splitId: pf['Park Factor Split ID'],
                    stadium: pf['Park Factor Stadium'],
                    h: pf['Park Factor H'],
                    singles: pf['Park Factor 1B'],
                    doubles: pf['Park Factor 2B'],
                    triples: pf['Park Factor 3B'],
                    hr: pf['Park Factor HR'],
                    r: pf['Park Factor R'],
                    bb: pf['Park Factor BB'],
                    so: pf['Park Factor SO']
                });
            }
        });

        // Add batter matchups
        this.batterMatchupsData.forEach(batter => {
            const gameId = batter['Batter Game ID'];
            const game = gameMap.get(gameId);
            if (game) {
                game.batterMatchups.push({
                    name: batter['Batter Name & Hand & Spot'],
                    splitId: batter['Batter Split ID'],
                    pa: batter['Batter PA'],
                    hits: batter['Batter H'],
                    singles: batter['Batter 1B'],
                    doubles: batter['Batter 2B'],
                    triples: batter['Batter 3B'],
                    hr: batter['Batter HR'],
                    r: batter['Batter R'],
                    rbi: batter['Batter RBI'],
                    bb: batter['Batter BB'],
                    so: batter['Batter SO']
                });
            }
        });

        // Add pitcher matchups
        this.pitcherMatchupsData.forEach(pitcher => {
            const gameId = pitcher['Starter Game ID'];
            const game = gameMap.get(gameId);
            if (game) {
                game.pitcherMatchups.push({
                    name: pitcher['Starter Name & Hand'],
                    splitId: pitcher['Starter Split ID'],
                    tbf: pitcher['Starter TBF'],
                    hits: pitcher['Starter H'],
                    singles: pitcher['Starter 1B'],
                    doubles: pitcher['Starter 2B'],
                    triples: pitcher['Starter 3B'],
                    hr: pitcher['Starter HR'],
                    r: pitcher['Starter R'],
                    era: pitcher['Starter ERA'],
                    bb: pitcher['Starter BB'],
                    so: pitcher['Starter SO']
                });
            }
        });

        // Add bullpen matchups
        this.bullpenMatchupsData.forEach(bullpen => {
            const gameId = bullpen['Bullpen Game ID'];
            const game = gameMap.get(gameId);
            if (game) {
                game.bullpenMatchups.push({
                    hand: bullpen['Bullpen Hand & Number'],
                    splitId: bullpen['Bullpen Split ID'],
                    tbf: bullpen['Bullpen TBF'],
                    hits: bullpen['Bullpen H'],
                    singles: bullpen['Bullpen 1B'],
                    doubles: bullpen['Bullpen 2B'],
                    triples: bullpen['Bullpen 3B'],
                    hr: bullpen['Bullpen HR'],
                    r: bullpen['Bullpen R'],
                    era: bullpen['Bullpen ERA'],
                    bb: bullpen['Bullpen BB'],
                    so: bullpen['Bullpen SO']
                });
            }
        });

        const combinedData = Array.from(gameMap.values());
        
        console.log('Combined data sample:', combinedData[0]);
        
        combinedData.sort((a, b) => {
            const aPair = Math.floor(a.gameId / 10);
            const bPair = Math.floor(b.gameId / 10);
            if (aPair !== bPair) return aPair - bPair;
            return a.gameId - b.gameId;
        });

        combinedData.forEach(row => {
            row._expanded = false;
        });

        return combinedData;
    }

    // SIMPLE FIX: Just set data directly without complex event handling
    initialize() {
        console.log('Initializing matchups table...');
        
        // Create table with minimal config first
        this.table = new Tabulator(this.elementId, {
            data: [], // Start with empty data
            layout: "fitColumns",
            height: "400px", // Set explicit height
            columns: this.getColumns(),
            placeholder: "Loading matchups data...",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false
        });

        // Simple approach: fetch data then set it directly
        this.fetchAllData().then(data => {
            console.log('Setting data in matchups table:', data.length, 'rows');
            
            if (data && data.length > 0) {
                // Use replaceData instead of setData
                this.table.replaceData(data).then(() => {
                    console.log('✅ Matchups data successfully loaded');
                    
                    // Single visibility fix after data is loaded
                    if (!this.visibilityFixed) {
                        this.visibilityFixed = true;
                        setTimeout(() => {
                            this.ensureVisibility();
                        }, 100);
                    }
                });
            }
        }).catch(error => {
            console.error('Failed to load matchups data:', error);
        });

        // Setup row expansion
        this.setupRowExpansion();
        
        // Simple event handlers (no infinite loops)
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
        });
    }

    // Simple visibility check without causing redraws
    ensureVisibility() {
        const container = document.getElementById('table0-container');
        const tableEl = document.getElementById('matchups-table');
        
        if (container && tableEl) {
            // Ensure container is visible
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            
            // Ensure table is visible  
            tableEl.style.display = 'block';
            tableEl.style.visibility = 'visible';
            tableEl.style.opacity = '1';
            
            // Check if rows are visible
            const rows = tableEl.querySelectorAll('.tabulator-row');
            console.log('Matchups table rows visible:', rows.length);
            
            if (rows.length === 0) {
                console.log('No rows visible, will try alternative approach');
                // Don't force a redraw here - that causes the infinite loop
            } else {
                console.log('✅ Matchups table is properly visible');
            }
        }
    }

    getColumns() {
        return [
            {
                title: "Team", 
                field: "team", 
                width: 180, 
                minWidth: 150,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                formatter: (cell, formatterParams, onRendered) => {
                    var value = cell.getValue();
                    var row = cell.getRow();
                    var expanded = row.getData()._expanded || false;
                    var teamName = value;
                    
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
                                textSpan.textContent = teamName || "";
                                
                                container.appendChild(expander);
                                container.appendChild(textSpan);
                                
                                cellElement.appendChild(container);
                            }
                        } catch (error) {
                            console.error("Error in formatter onRendered:", error);
                        }
                    });
                    
                    return (expanded ? "− " : "+ ") + teamName;
                }
            },
            {
                title: "Game", 
                field: "game", 
                width: 250, 
                minWidth: 200,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false
            },
            {
                title: "Spread", 
                field: "spread", 
                width: 100, 
                minWidth: 80,
                sorter: "number",
                resizable: false
            },
            {
                title: "Total", 
                field: "total", 
                width: 100, 
                minWidth: 80,
                sorter: "number",
                resizable: false
            },
            {
                title: "Lineup Status", 
                field: "lineupStatus", 
                width: 150, 
                minWidth: 120,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false
            }
        ];
    }

    setupRowExpansion() {
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "team") {
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

    createRowFormatter() {
        return (row) => {
            var data = row.getData();
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                var holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                var weatherDiv = document.createElement("div");
                var parkFactorsDiv = document.createElement("div");
                var pitcherDiv = document.createElement("div");
                var batterDiv = document.createElement("div");
                var bullpenDiv = document.createElement("div");
                
                weatherDiv.style.marginBottom = "15px";
                parkFactorsDiv.style.marginBottom = "15px";
                pitcherDiv.style.marginBottom = "15px";
                batterDiv.style.marginBottom = "15px";
                
                holderEl.appendChild(weatherDiv);
                holderEl.appendChild(parkFactorsDiv);
                holderEl.appendChild(pitcherDiv);
                holderEl.appendChild(batterDiv);
                holderEl.appendChild(bullpenDiv);
                row.getElement().appendChild(holderEl);
                
                this.createWeatherSubtable(weatherDiv, data);
                this.createParkFactorsSubtable(parkFactorsDiv, data);
                this.createPitcherSubtable(pitcherDiv, data);
                this.createBatterSubtable(batterDiv, data);
                this.createBullpenSubtable(bullpenDiv, data);
            } else if (!data._expanded) {
                var existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    createWeatherSubtable(container, data) {
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                ballpark: data.ballpark,
                weather1: data.weather1,
                weather2: data.weather2,
                weather3: data.weather3,
                weather4: data.weather4
            }],
            columns: [
                {title: "Ballpark", field: "ballpark", headerSort: false, width: 200},
                {title: "Weather 1", field: "weather1", headerSort: false, width: 150},
                {title: "Weather 2", field: "weather2", headerSort: false, width: 150},
                {title: "Weather 3", field: "weather3", headerSort: false, width: 150},
                {title: "Weather 4", field: "weather4", headerSort: false, width: 150}
            ]
        });
    }

    createParkFactorsSubtable(container, data) {
        const sortedParkFactors = [...data.parkFactors].sort((a, b) => {
            const order = {A: 0, R: 1, L: 2};
            return (order[a.splitId] || 999) - (order[b.splitId] || 999);
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: sortedParkFactors,
            columns: [
                {title: "Park Factors", columns: [
                    {title: "Split", field: "splitId", headerSort: false, width: 80,
                        formatter: (cell) => {
                            const value = cell.getValue();
                            if (value === 'A') return 'All';
                            if (value === 'R') return 'Right';
                            if (value === 'L') return 'Left';
                            return value;
                        }
                    },
                    {title: "H", field: "h", headerSort: false, width: 60},
                    {title: "1B", field: "singles", headerSort: false, width: 60},
                    {title: "2B", field: "doubles", headerSort: false, width: 60},
                    {title: "3B", field: "triples", headerSort: false, width: 60},
                    {title: "HR", field: "hr", headerSort: false, width: 60},
                    {title: "R", field: "r", headerSort: false, width: 60},
                    {title: "BB", field: "bb", headerSort: false, width: 60},
                    {title: "SO", field: "so", headerSort: false, width: 60}
                ]}
            ],
            rowFormatter: (row) => {
                var data = row.getData();
                if (data.splitId === 'A') {
                    row.getElement().style.fontWeight = 'bold';
                    row.getElement().style.backgroundColor = '#e9ecef';
                }
            }
        });
    }

    createPitcherSubtable(container, data) {
        // Simplified version for now
        const primaryRows = [];
        
        data.pitcherMatchups.forEach(pitcher => {
            if (pitcher.splitId === 'CSeason') {
                primaryRows.push({
                    name: pitcher.name,
                    tbf: pitcher.tbf,
                    hits: pitcher.hits,
                    hr: pitcher.hr,
                    era: pitcher.era,
                    so: pitcher.so
                });
            }
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: primaryRows,
            columns: [
                {title: "Starter", field: "name", headerSort: false, width: 200},
                {title: "TBF", field: "tbf", headerSort: false, width: 80},
                {title: "Hits", field: "hits", headerSort: false, width: 80},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "ERA", field: "era", headerSort: false, width: 80},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ]
        });
    }

    createBatterSubtable(container, data) {
        // Simplified version for now
        const primaryRows = [];
        
        data.batterMatchups.forEach(batter => {
            if (batter.splitId === 'CSeason') {
                primaryRows.push({
                    name: batter.name,
                    pa: batter.pa,
                    hits: batter.hits,
                    hr: batter.hr,
                    rbi: batter.rbi,
                    so: batter.so
                });
            }
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: primaryRows,
            columns: [
                {title: "Batter", field: "name", headerSort: false, width: 200},
                {title: "PA", field: "pa", headerSort: false, width: 60},
                {title: "Hits", field: "hits", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "RBI", field: "rbi", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ]
        });
    }

    createBullpenSubtable(container, data) {
        // Simplified version for now
        const primaryRows = [];
        
        data.bullpenMatchups.forEach(bullpen => {
            if (bullpen.splitId === 'CSeason') {
                primaryRows.push({
                    hand: bullpen.hand,
                    tbf: bullpen.tbf,
                    hits: bullpen.hits,
                    hr: bullpen.hr,
                    era: bullpen.era,
                    so: bullpen.so
                });
            }
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: primaryRows,
            columns: [
                {title: "Bullpen", field: "hand", headerSort: false, width: 120},
                {title: "TBF", field: "tbf", headerSort: false, width: 60},
                {title: "Hits", field: "hits", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "ERA", field: "era", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ]
        });
    }
}
