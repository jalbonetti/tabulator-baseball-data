// tables/combinedMatchupsTable.js
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class CombinedMatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, null); // No single endpoint - we'll fetch multiple
        this.matchupsData = [];
        this.parkFactorsData = [];
        this.batterMatchupsData = [];
        this.pitcherMatchupsData = [];
        this.bullpenMatchupsData = [];
    }

    async fetchAllData() {
        try {
            // Fetch all data in parallel
            const [matchups, parkFactors, batters, pitchers, bullpen] = await Promise.all([
                this.fetchData('ModMatchupsData'),
                this.fetchData('ModParkFactors'),
                this.fetchData('ModBatterMatchups'),
                this.fetchData('ModPitcherMatchups'),
                this.fetchData('ModBullpenMatchups')
            ]);

            this.matchupsData = matchups;
            this.parkFactorsData = parkFactors;
            this.batterMatchupsData = batters;
            this.pitcherMatchupsData = pitchers;
            this.bullpenMatchupsData = bullpen;

            console.log('All data fetched successfully', {
                matchups: matchups.length,
                parkFactors: parkFactors.length,
                batters: batters.length,
                pitchers: pitchers.length,
                bullpen: bullpen.length
            });

            return this.combineData();
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    async fetchData(tableName) {
        const response = await fetch(API_CONFIG.baseURL + tableName, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${tableName}`);
        }
        
        return response.json();
    }

    combineData() {
        // Group all data by Game ID
        const gameMap = new Map();
        
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
                    weather: `${matchup['Matchup Weather 1']} | ${matchup['Matchup Weather 2']} | ${matchup['Matchup Weather 3']} | ${matchup['Matchup Weather 4']}`,
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
                    avg: batter['Batter AVG'],
                    h: batter['Batter H'],
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
                    avg: pitcher['Starter AVG'],
                    h: pitcher['Starter H'],
                    singles: pitcher['Starter 1B'],
                    doubles: pitcher['Starter 2B'],
                    triples: pitcher['Starter 3B'],
                    hr: pitcher['Starter HR'],
                    r: pitcher['Starter R'],
                    er: pitcher['Starter ER'],
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
                    avg: bullpen['Bullpen AVG'],
                    h: bullpen['Bullpen H'],
                    singles: bullpen['Bullpen 1B'],
                    doubles: bullpen['Bullpen 2B'],
                    triples: bullpen['Bullpen 3B'],
                    hr: bullpen['Bullpen HR'],
                    r: bullpen['Bullpen R'],
                    er: bullpen['Bullpen ER'],
                    bb: bullpen['Bullpen BB'],
                    so: bullpen['Bullpen SO']
                });
            }
        });

        // Convert to array and sort by game ID pairs
        const combinedData = Array.from(gameMap.values());
        
        // Sort by game ID to maintain pair order (11, 12, 21, 22, etc.)
        combinedData.sort((a, b) => {
            const aPair = Math.floor(a.gameId / 10);
            const bPair = Math.floor(b.gameId / 10);
            if (aPair !== bPair) return aPair - bPair;
            return a.gameId - b.gameId;
        });

        // Add expansion state
        combinedData.forEach(row => {
            row._expanded = false;
        });

        return combinedData;
    }

    initialize() {
        // First create the table structure without data
        const config = {
            layout: "fitColumns",
            responsiveLayout: "hide",
            persistence: false,
            paginationSize: false,
            height: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            columns: this.getColumns(),
            initialSort: [
                {column: "gameId", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            placeholder: "Loading data..."
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        // Then fetch and load the data
        this.fetchAllData().then(data => {
            this.table.setData(data);
            console.log('Combined Matchups table loaded with', data.length, 'rows');
        });
        
        this.table.on("tableBuilt", () => {
            console.log("Combined Matchups table built successfully");
        });
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
                    var teamName = TEAM_NAME_MAP[value] || value;
                    
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
            },
            {
                title: "Ballpark", 
                field: "ballpark", 
                width: 200, 
                minWidth: 150,
                resizable: false
            },
            {
                title: "Weather", 
                field: "weather", 
                width: 300, 
                minWidth: 250,
                resizable: false
            }
        ];
    }

    // Override setupRowExpansion to use Team field
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
                
                // Create containers for each subtable
                var parkFactorsDiv = document.createElement("div");
                var pitcherDiv = document.createElement("div");
                var batterDiv = document.createElement("div");
                var bullpenDiv = document.createElement("div");
                
                parkFactorsDiv.style.marginBottom = "15px";
                pitcherDiv.style.marginBottom = "15px";
                batterDiv.style.marginBottom = "15px";
                
                holderEl.appendChild(parkFactorsDiv);
                holderEl.appendChild(pitcherDiv);
                holderEl.appendChild(batterDiv);
                holderEl.appendChild(bullpenDiv);
                row.getElement().appendChild(holderEl);
                
                // Create subtables
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

    createParkFactorsSubtable(container, data) {
        // Sort park factors by split ID (A first, then R, then L)
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
                    {title: "Split ID", field: "splitId", headerSort: false, width: 80},
                    {title: "H", field: "h", headerSort: false, width: 60},
                    {title: "1B", field: "singles", headerSort: false, width: 60},
                    {title: "2B", field: "doubles", headerSort: false, width: 60},
                    {title: "3B", field: "triples", headerSort: false, width: 60},
                    {title: "HR", field: "hr", headerSort: false, width: 60},
                    {title: "R", field: "r", headerSort: false, width: 60},
                    {title: "BB", field: "bb", headerSort: false, width: 60},
                    {title: "SO", field: "so", headerSort: false, width: 60}
                ]}
            ]
        });
    }

    createPitcherSubtable(container, data) {
        // Create nested structure for pitcher data
        const pitcherRows = this.createNestedRows(data.pitcherMatchups, 'Starter');
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: pitcherRows,
            columns: [
                {title: "Starter", field: "name", headerSort: false, width: 200},
                {title: "Time/Location Split", field: "timeLocation", headerSort: false, width: 180},
                {title: "TBF", field: "tbf", headerSort: false, width: 60},
                {title: "H", field: "h", headerSort: false, width: 60},
                {title: "1B", field: "singles", headerSort: false, width: 60},
                {title: "2B", field: "doubles", headerSort: false, width: 60},
                {title: "3B", field: "triples", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "R", field: "r", headerSort: false, width: 60},
                {title: "ER", field: "er", headerSort: false, width: 60},
                {title: "BB", field: "bb", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ],
            rowFormatter: (row) => {
                var data = row.getData();
                if (data.isPrimary) {
                    row.getElement().style.fontWeight = 'bold';
                    row.getElement().style.backgroundColor = '#e9ecef';
                }
            }
        });
    }

    createBatterSubtable(container, data) {
        // Sort batters by spot (1-9)
        const sortedBatters = [...data.batterMatchups].sort((a, b) => {
            const spotA = parseInt(a.name.match(/\d+$/)?.[0] || '999');
            const spotB = parseInt(b.name.match(/\d+$/)?.[0] || '999');
            return spotA - spotB;
        });

        // Create nested structure for each batter
        const batterRows = [];
        const batterGroups = new Map();

        // Group by batter spot
        sortedBatters.forEach(batter => {
            const spot = batter.name.match(/\d+$/)?.[0] || '0';
            if (!batterGroups.has(spot)) {
                batterGroups.set(spot, []);
            }
            batterGroups.get(spot).push(batter);
        });

        // Create rows for each batter
        batterGroups.forEach((batters, spot) => {
            batters.forEach(batter => {
                batterRows.push({
                    ...batter,
                    timeLocation: this.mapSplitId(batter.splitId),
                    isPrimary: batter.splitId === 'CSeason'
                });
            });
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: batterRows,
            columns: [
                {title: "Batter", field: "name", headerSort: false, width: 200},
                {title: "Time/Location Split", field: "timeLocation", headerSort: false, width: 180},
                {title: "PA", field: "pa", headerSort: false, width: 60},
                {title: "H", field: "h", headerSort: false, width: 60},
                {title: "1B", field: "singles", headerSort: false, width: 60},
                {title: "2B", field: "doubles", headerSort: false, width: 60},
                {title: "3B", field: "triples", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "R", field: "r", headerSort: false, width: 60},
                {title: "RBI", field: "rbi", headerSort: false, width: 60},
                {title: "BB", field: "bb", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ],
            rowFormatter: (row) => {
                var data = row.getData();
                if (data.isPrimary) {
                    row.getElement().style.fontWeight = 'bold';
                    row.getElement().style.backgroundColor = '#e9ecef';
                }
            }
        });
    }

    createBullpenSubtable(container, data) {
        // Sort bullpen by hand (R before L)
        const sortedBullpen = [...data.bullpenMatchups].sort((a, b) => {
            const handA = a.hand.charAt(0);
            const handB = b.hand.charAt(0);
            if (handA === 'R' && handB === 'L') return -1;
            if (handA === 'L' && handB === 'R') return 1;
            return 0;
        });

        // Create nested structure
        const bullpenRows = [];
        sortedBullpen.forEach(bullpen => {
            bullpenRows.push({
                ...bullpen,
                timeLocation: this.mapSplitId(bullpen.splitId),
                isPrimary: bullpen.splitId === 'CSeason'
            });
        });

        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: bullpenRows,
            columns: [
                {title: "Hand", field: "hand", headerSort: false, width: 100},
                {title: "Time/Location Split", field: "timeLocation", headerSort: false, width: 180},
                {title: "TBF", field: "tbf", headerSort: false, width: 60},
                {title: "H", field: "h", headerSort: false, width: 60},
                {title: "1B", field: "singles", headerSort: false, width: 60},
                {title: "2B", field: "doubles", headerSort: false, width: 60},
                {title: "3B", field: "triples", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "R", field: "r", headerSort: false, width: 60},
                {title: "ER", field: "er", headerSort: false, width: 60},
                {title: "BB", field: "bb", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ],
            rowFormatter: (row) => {
                var data = row.getData();
                if (data.isPrimary) {
                    row.getElement().style.fontWeight = 'bold';
                    row.getElement().style.backgroundColor = '#e9ecef';
                }
            }
        });
    }

    createNestedRows(matchups, type) {
        const rows = [];
        const groups = new Map();

        // Group by name
        matchups.forEach(matchup => {
            const name = matchup.name;
            if (!groups.has(name)) {
                groups.set(name, []);
            }
            groups.get(name).push(matchup);
        });

        // Create rows in the specified order
        groups.forEach((matchupGroup, name) => {
            // Sort by split ID order
            const splitOrder = ['CSeason', 'CSeason@', 'C30', 'C30@', 'RSeason', 'RSeason@', 'R30', 'R30@', 'LSeason', 'LSeason@', 'L30', 'L30@'];
            matchupGroup.sort((a, b) => {
                const indexA = splitOrder.indexOf(a.splitId);
                const indexB = splitOrder.indexOf(b.splitId);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });

            matchupGroup.forEach(matchup => {
                rows.push({
                    ...matchup,
                    timeLocation: this.mapSplitId(matchup.splitId),
                    isPrimary: matchup.splitId === 'CSeason'
                });
            });
        });

        return rows;
    }

    mapSplitId(splitId) {
        const mapping = {
            'CSeason': 'Full Season',
            'CSeason@': 'Full Season (Home/Away)',
            'C30': 'Last 30 Days',
            'C30@': 'Last 30 Days (Home/Away)',
            'RSeason': 'Full Season (V. R)',
            'RSeason@': 'Full Season (Home/Away) (V. R)',
            'R30': 'Last 30 Days (V. R)',
            'R30@': 'Last 30 Days (Home/Away) (V. R)',
            'LSeason': 'Full Season (V. L)',
            'LSeason@': 'Full Season (Home/Away) (V. L)',
            'L30': 'Last 30 Days (V. L)',
            'L30@': 'Last 30 Days (Home/Away) (V. L)'
        };
        return mapping[splitId] || splitId;
    }
}
