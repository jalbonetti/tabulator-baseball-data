// tables/combinedMatchupsTable.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
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
            const tableNames = {
                matchups: 'ModMatchupsData',
                parkFactors: 'ModParkFactors', 
                batters: 'ModBatterMatchups',
                pitchers: 'ModPitcherMatchups',
                bullpen: 'ModBullpenMatchups'
            };
            
            console.log('Fetching data from tables:', tableNames);
            
            // Fetch all data in parallel
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

    // FIXED: Force table visibility after initialization
    forceTableVisibility() {
        setTimeout(() => {
            const tableEl = document.getElementById('matchups-table');
            const container = document.getElementById('table0-container');
            
            if (tableEl && container) {
                // Force container visibility
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                container.style.position = 'relative';
                
                // Force table visibility
                tableEl.style.display = 'block';
                tableEl.style.visibility = 'visible';
                tableEl.style.opacity = '1';
                
                // Remove any lingering placeholders
                const placeholder = tableEl.querySelector('.tabulator-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // Force table holder visibility
                const tableHolder = tableEl.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.style.display = 'block';
                    tableHolder.style.visibility = 'visible';
                    tableHolder.style.opacity = '1';
                }
                
                // Force actual table visibility
                const actualTable = tableEl.querySelector('.tabulator-table');
                if (actualTable) {
                    actualTable.style.display = 'table';
                    actualTable.style.visibility = 'visible';
                    actualTable.style.opacity = '1';
                }
                
                // Force redraw
                if (this.table) {
                    this.table.redraw(true);
                }
                
                console.log('✅ Forced matchups table visibility');
            }
        }, 100);
    }

    initialize() {
        // Create the table structure without data first
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
                {column: "team", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            placeholder: "Loading matchups data...",
            renderComplete: () => {
                console.log("Matchups table render complete");
                this.forceTableVisibility();
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        // Then fetch and load the data
        this.fetchAllData().then(data => {
            console.log('Setting data in table:', data);
            if (this.table && data && data.length > 0) {
                this.table.setData(data).then(() => {
                    console.log('Matchups table loaded with', data.length, 'rows');
                    
                    // Force visibility after data is set
                    this.forceTableVisibility();
                    
                    // Additional forced redraw
                    setTimeout(() => {
                        this.forceTableVisibility();
                        if (this.table) {
                            this.table.redraw(true);
                        }
                    }, 500);
                });
            } else {
                console.error('Table not initialized or no data');
            }
        }).catch(error => {
            console.error('Error loading matchups data:', error);
        });
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
            this.forceTableVisibility();
        });
        
        this.table.on("dataLoaded", () => {
            console.log("Matchups data loaded event fired");
            this.forceTableVisibility();
        });
        
        this.table.on("renderComplete", () => {
            console.log("Matchups render complete event fired");
            this.forceTableVisibility();
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
        const pitchersByName = new Map();
        const isHome = this.isHomeGame(data.game, data.team);
        
        data.pitcherMatchups.forEach(pitcher => {
            const name = pitcher.name;
            if (!pitchersByName.has(name)) {
                pitchersByName.set(name, {
                    name: name,
                    splits: [],
                    _expanded: false
                });
            }
            pitchersByName.get(name).splits.push(pitcher);
        });
        
        const splitOrder = ['CSeason', 'RSeason', 'LSeason', 'CSeason@', 'RSeason@', 'LSeason@'];
        pitchersByName.forEach(pitcher => {
            pitcher.splits.sort((a, b) => {
                const indexA = splitOrder.indexOf(a.splitId);
                const indexB = splitOrder.indexOf(b.splitId);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });
        });
        
        const pitcherTable = new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: Array.from(pitchersByName.values()),
            columns: [
                {title: "Starter", field: "name", headerSort: false, width: 200, frozen: true},
                {title: "Split", field: "timeLocation", headerSort: false, width: 120, frozen: true,
                    formatter: () => "Full Season"
                },
                {title: "TBF", field: "tbf", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.tbf : '';
                    }
                },
                {title: "Hits/TBF", field: "hitsPerTBF", headerSort: false, width: 80,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        if (fullSeason && fullSeason.tbf > 0) {
                            return (fullSeason.hits / fullSeason.tbf).toFixed(3);
                        }
                        return '';
                    }
                },
                {title: "1B", field: "singles", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.singles : '';
                    }
                },
                {title: "2B", field: "doubles", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.doubles : '';
                    }
                },
                {title: "3B", field: "triples", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.triples : '';
                    }
                },
                {title: "HR", field: "hr", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.hr : '';
                    }
                },
                {title: "R", field: "r", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.r : '';
                    }
                },
                {title: "ERA", field: "era", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.era : '';
                    }
                },
                {title: "BB", field: "bb", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.bb : '';
                    }
                },
                {title: "SO", field: "so", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.so : '';
                    }
                }
            ],
            rowFormatter: (row) => {
                const data = row.getData();
                row.getElement().style.fontWeight = 'bold';
                row.getElement().style.backgroundColor = '#e9ecef';
                row.getElement().style.cursor = 'pointer';
            }
        });
        
        pitcherTable.on("rowClick", (e, row) => {
            const data = row.getData();
            data._expanded = !data._expanded;
            row.reformat();
        });
    }

    createBatterSubtable(container, data) {
        const sortedBatters = [...data.batterMatchups].sort((a, b) => {
            const spotA = parseInt(a.name.match(/\d+$/)?.[0] || '999');
            const spotB = parseInt(b.name.match(/\d+$/)?.[0] || '999');
            return spotA - spotB;
        });

        const battersByName = new Map();
        const isHome = this.isHomeGame(data.game, data.team);
        
        sortedBatters.forEach(batter => {
            const key = batter.name;
            
            if (!battersByName.has(key)) {
                battersByName.set(key, {
                    name: batter.name,
                    splits: [],
                    _expanded: false
                });
            }
            battersByName.get(key).splits.push(batter);
        });

        const splitOrder = ['CSeason', 'RSeason', 'LSeason', 'CSeason@', 'RSeason@', 'LSeason@'];
        battersByName.forEach(batter => {
            batter.splits.sort((a, b) => {
                const indexA = splitOrder.indexOf(a.splitId);
                const indexB = splitOrder.indexOf(b.splitId);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });
        });

        const batterTable = new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: Array.from(battersByName.values()),
            columns: [
                {title: "Batter", field: "name", headerSort: false, width: 200, frozen: true},
                {title: "Split", field: "timeLocation", headerSort: false, width: 120, frozen: true,
                    formatter: () => "Full Season"
                },
                {title: "PA", field: "pa", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.pa : '';
                    }
                },
                {title: "Hits/PA", field: "hitsPerPA", headerSort: false, width: 80,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        if (fullSeason && fullSeason.pa > 0) {
                            return (fullSeason.hits / fullSeason.pa).toFixed(3);
                        }
                        return '';
                    }
                },
                {title: "1B", field: "singles", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.singles : '';
                    }
                },
                {title: "2B", field: "doubles", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.doubles : '';
                    }
                },
                {title: "3B", field: "triples", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.triples : '';
                    }
                },
                {title: "HR", field: "hr", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.hr : '';
                    }
                },
                {title: "R", field: "r", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.r : '';
                    }
                },
                {title: "RBI", field: "rbi", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.rbi : '';
                    }
                },
                {title: "BB", field: "bb", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.bb : '';
                    }
                },
                {title: "SO", field: "so", headerSort: false, width: 60,
                    formatter: (cell) => {
                        const data = cell.getRow().getData();
                        const fullSeason = data.splits.find(s => s.splitId === 'CSeason');
                        return fullSeason ? fullSeason.so : '';
                    }
                }
            ],
            rowFormatter: (row) => {
                const data = row.getData();
                row.getElement().style.fontWeight = 'bold';
                row.getElement().style.backgroundColor = '#e9ecef';
                row.getElement().style.cursor = 'pointer';
            }
        });
        
        batterTable.on("rowClick", (e, row) => {
            const data = row.getData();
            data._expanded = !data._expanded;
            row.reformat();
        });
    }

    createBullpenSubtable(container, data) {
        const sortedBullpen = [...data.bullpenMatchups].sort((a, b) => {
            const handA = a.hand.charAt(0);
            const handB = b.hand.charAt(0);
            if (handA === 'R' && handB === 'L') return -1;
            if (handA === 'L' && handB === 'R') return 1;
            return 0;
        });

        const bullpenByHand = new Map();
        const isHome = this.isHomeGame(data.game, data.team);
        
        sortedBullpen.forEach(bullpen => {
            const match = bullpen.hand.match(/(\d+)\s*(Righties|Lefties)/);
            let displayHand = bullpen.hand;
            if (match) {
                const num = match[1];
                const type = match[2];
                displayHand = `${type} (${num})`;
            }
            
            if (!bullpenByHand.has(displayHand)) {
                bullpenByHand.set(displayHand, []);
            }
            bullpenByHand.get(displayHand).push({
                ...bullpen,
                displayHand: displayHand
            });
        });

        const primaryRows = [];
        bullpenByHand.forEach((bullpenGroup, hand) => {
            const fullSeason = bullpenGroup.find(b => b.splitId === 'CSeason');
            if (fullSeason) {
                primaryRows.push({
                    ...fullSeason,
                    hand: fullSeason.displayHand,
                    timeLocation: 'Full Season',
                    isPrimary: true
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
                {title: "Bullpen", field: "hand", headerSort: false, width: 100},
                {title: "Split", field: "timeLocation", headerSort: false, width: 120},
                {title: "TBF", field: "tbf", headerSort: false, width: 60},
                {title: "Hits/TBF", field: "hitsPerTBF", headerSort: false, width: 80,
                    formatter: (cell) => {
                        const data = cell.getData();
                        if (data.tbf > 0) {
                            return (data.hits / data.tbf).toFixed(3);
                        }
                        return '';
                    }
                },
                {title: "1B", field: "singles", headerSort: false, width: 60},
                {title: "2B", field: "doubles", headerSort: false, width: 60},
                {title: "3B", field: "triples", headerSort: false, width: 60},
                {title: "HR", field: "hr", headerSort: false, width: 60},
                {title: "R", field: "r", headerSort: false, width: 60},
                {title: "ERA", field: "era", headerSort: false, width: 60},
                {title: "BB", field: "bb", headerSort: false, width: 60},
                {title: "SO", field: "so", headerSort: false, width: 60}
            ],
            rowFormatter: (row) => {
                row.getElement().style.fontWeight = 'bold';
                row.getElement().style.backgroundColor = '#e9ecef';
            }
        });
    }

    mapSplitId(splitId, isHome) {
        const mapping = {
            'CSeason': 'Full Season',
            'CSeason@': isHome ? 'Home' : 'Away',
            'RSeason': 'vs R',
            'RSeason@': `vs R ${isHome ? 'Home' : 'Away'}`,
            'LSeason': 'vs L',
            'LSeason@': `vs L ${isHome ? 'Home' : 'Away'}`
        };
        return mapping[splitId] || splitId;
    }
}
