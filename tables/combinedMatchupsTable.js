// tables/combinedMatchupsTable.js - FULLY REFACTORED VERSION
// tables/combinedMatchupsTable.js - FULLY REFACTORED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        
        // Wait for BaseTable to initialize, then copy its config
        setTimeout(() => {
            if (this.getBaseConfig) {
                const config = this.getBaseConfig();
                console.log('BaseTable config available:', config);
                if (config.ajaxConfig?.headers) {
                    this.HEADERS = config.ajaxConfig.headers;
                    console.log('Copied headers from BaseTable:', this.HEADERS);
                }
            }
        }, 0);
        
        // Hardcode the working API base URL
        this.BASE_URL = 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
        
        // Initialize empty headers - will be populated from BaseTable
        this.HEADERS = null;
        
        console.log('MatchupsTable initialized with BASE_URL:', this.BASE_URL);
        
        // Define endpoints for subtable data
        this.ENDPOINTS = {
            MATCHUPS: 'ModMatchupsData',
            PITCHERS: 'ModPitcherMatchups',
            BATTERS: 'ModBatterMatchups',
            BULLPEN: 'ModBullpenMatchups',
            PARK: 'ModParkFactors'
        };
        
        // Field mappings
        this.F = {
            // Main matchup fields
            MATCH_ID: 'Matchup Game ID',
            TEAM: 'Matchup Team',
            GAME: 'Matchup Game',
            PARK: 'Matchup Ballpark',
            SPREAD: 'Matchup Spread',
            TOTAL: 'Matchup Total',
            LINEUP: 'Matchup Lineup Status',
            WX1: 'Matchup Weather 1',
            WX2: 'Matchup Weather 2',
            WX3: 'Matchup Weather 3',
            WX4: 'Matchup Weather 4',
            
            // Pitcher fields
            P_GAME_ID: 'Starter Game ID',
            P_NAME: 'Starter Name & Hand',
            P_SPLIT: 'Starter Split ID',
            P_TBF: 'Starter TBF',
            P_H_TBF: 'Starter H/TBF',
            P_H: 'Starter H',
            P_1B: 'Starter 1B',
            P_2B: 'Starter 2B',
            P_3B: 'Starter 3B',
            P_HR: 'Starter HR',
            P_R: 'Starter R',
            P_ERA: 'Starter ERA',
            P_BB: 'Starter BB',
            P_SO: 'Starter SO',
            
            // Batter fields
            B_GAME_ID: 'Batter Game ID',
            B_NAME: 'Batter Name & Hand & Spot',
            B_SPLIT: 'Batter Split ID',
            B_PA: 'Batter PA',
            B_H_PA: 'Batter H/PA',
            B_H: 'Batter H',
            B_1B: 'Batter 1B',
            B_2B: 'Batter 2B',
            B_3B: 'Batter 3B',
            B_HR: 'Batter HR',
            B_R: 'Batter R',
            B_RBI: 'Batter RBI',
            B_BB: 'Batter BB',
            B_SO: 'Batter SO',
            
            // Bullpen fields
            BP_GAME_ID: 'Bullpen Game ID',
            BP_HAND_CNT: 'Bullpen Hand & Number',
            BP_SPLIT: 'Bullpen Split ID',
            BP_TBF: 'Bullpen TBF',
            BP_H_TBF: 'Bullpen H/TBF',
            BP_H: 'Bullpen H',
            BP_1B: 'Bullpen 1B',
            BP_2B: 'Bullpen 2B',
            BP_3B: 'Bullpen 3B',
            BP_HR: 'Bullpen HR',
            BP_R: 'Bullpen R',
            BP_ERA: 'Bullpen ERA',
            BP_BB: 'Bullpen BB',
            BP_SO: 'Bullpen SO',
            
            // Park factor fields
            PF_GAME_ID: 'Park Factor Game ID',
            PF_STADIUM: 'Park Factor Stadium',
            PF_SPLIT: 'Park Factor Split ID',
            PF_H: 'Park Factor H',
            PF_1B: 'Park Factor 1B',
            PF_2B: 'Park Factor 2B',
            PF_3B: 'Park Factor 3B',
            PF_HR: 'Park Factor HR',
            PF_R: 'Park Factor R',
            PF_BB: 'Park Factor BB',
            PF_SO: 'Park Factor SO'
        };
        
        // Cache for subtable data
        this.subtableDataCache = new Map();
        
        // Track expanded player rows within subtables
        this.expandedSubtableRows = new Map();
    }
    
    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading matchups data...",
            resizableColumns: false,
            columns: this.getColumns(),
            initialSort: [
                {column: this.F.TEAM, dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };
        
        this.table = new Tabulator(this.elementId, config);
        
        // Use the base class setupRowExpansion for proper state management
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
        });
    }
    
    getColumns() {
        const F = this.F;
        
        return [
            {
                title: "",
                field: F.TEAM,
                width: 40,
                headerSort: false,
                resizable: false,
                formatter: (cell) => {
                    const data = cell.getData();
                    return `<span class="row-expander">${data._expanded ? "−" : "+"}</span>`;
                },
                cellClick: (e, cell) => {
                    e.stopPropagation();
                    this.toggleRowExpansion(cell.getRow());
                }
            },
            { 
                title: "Team", 
                field: F.TEAM, 
                widthGrow: 1.5,
                resizable: false,
                headerFilter: createCustomMultiSelect
            },
            { 
                title: "Game", 
                field: F.GAME, 
                widthGrow: 3,
                resizable: false,
                headerFilter: createCustomMultiSelect
            },
            { 
                title: "Spread", 
                field: F.SPREAD, 
                widthGrow: 0.8,
                resizable: false,
                hozAlign: "center"
            },
            { 
                title: "Total", 
                field: F.TOTAL, 
                widthGrow: 0.8,
                resizable: false,
                hozAlign: "center"
            },
            { 
                title: "Lineup", 
                field: F.LINEUP, 
                widthGrow: 1.2,
                resizable: false,
                headerFilter: createCustomMultiSelect
            }
        ];
    }
    
    createRowFormatter() {
        const self = this;
        
        return function(row) {
            const data = row.getData();
            const rowElement = row.getElement();
            
            // Initialize expansion state
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
                
                // During restoration or if doesn't exist, create subtables
                if (!existingSubrow || self.isRestoringState) {
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        // Don't use requestAnimationFrame to avoid scroll issues
                        self.createMatchupSubtables(row, data);
                    }
                }
            } else {
                // Remove subtables when collapsed
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }
    
    toggleRowExpansion(row) {
        const data = row.getData();
        data._expanded = !data._expanded;
        
        // Update global state
        const rowId = this.generateRowId(data);
        const globalState = this.getGlobalState();
        
        if (data._expanded) {
            globalState.set(rowId, {
                timestamp: Date.now(),
                data: data,
                expandedSubrows: Array.from(this.expandedSubtableRows.get(rowId) || [])
            });
        } else {
            globalState.delete(rowId);
            this.expandedSubtableRows.delete(rowId);
        }
        
        this.setGlobalState(globalState);
        row.update(data);
        row.reformat();
    }
    
    generateRowId(data) {
        return `matchup_${data[this.F.MATCH_ID]}`;
    }
    
    getOpponentGameId(gameId) {
        // Games are paired: 11-12, 21-22, 31-32, etc.
        const id = parseInt(gameId);
        if (id % 10 === 1) {
            return id + 1; // 11 -> 12, 21 -> 22
        } else {
            return id - 1; // 12 -> 11, 22 -> 21
        }
    }
    
    async createMatchupSubtables(row, data) {
        const rowElement = row.getElement();
        const gameId = data[this.F.MATCH_ID];
        const opponentGameId = this.getOpponentGameId(gameId);
        
        // Create main container
        const holderEl = document.createElement("div");
        holderEl.classList.add('subrow-container');
        holderEl.style.cssText = `
            padding: 10px;
            background: #f8f9fa;
            margin: 10px 0;
            border-radius: 4px;
            display: block;
            width: 100%;
            position: relative;
            z-index: 1;
        `;
        
        // Load all subtable data (use opponent ID for pitcher/bullpen)
        const subtableData = await this.loadSubtableData(gameId, opponentGameId);
        
        // Create layout structure
        // Row 1: Park Factors and Weather (side by side)
        const topRow = document.createElement("div");
        topRow.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px;";
        
        const parkContainer = document.createElement("div");
        parkContainer.style.cssText = "flex: 1;";
        
        const weatherContainer = document.createElement("div");
        weatherContainer.style.cssText = "flex: 1;";
        
        topRow.appendChild(parkContainer);
        topRow.appendChild(weatherContainer);
        holderEl.appendChild(topRow);
        
        // Row 2: Starting Pitchers (opponent's)
        const pitchersContainer = document.createElement("div");
        pitchersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(pitchersContainer);
        
        // Row 3: Batters
        const battersContainer = document.createElement("div");
        battersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(battersContainer);
        
        // Row 4: Bullpen (opponent's)
        const bullpenContainer = document.createElement("div");
        bullpenContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(bullpenContainer);
        
        // Append to row
        rowElement.appendChild(holderEl);
        
        // Create all subtables
        this.createParkFactorsTable(parkContainer, subtableData.park, data);
        this.createWeatherTable(weatherContainer, data);
        this.createPitchersTable(pitchersContainer, subtableData.pitchers, gameId);
        this.createBattersTable(battersContainer, subtableData.batters, gameId);
        this.createBullpenTable(bullpenContainer, subtableData.bullpen, gameId);
        
        // Restore expanded state for subtables
        this.restoreSubtableExpandedState(gameId);
    }
    
    async loadSubtableData(gameId, opponentGameId) {
        // Check cache first
        const cacheKey = `${gameId}_${opponentGameId}`;
        if (this.subtableDataCache.has(cacheKey)) {
            return this.subtableDataCache.get(cacheKey);
        }
        
        console.log(`Loading subtable data for game ID: ${gameId}, opponent: ${opponentGameId}`);
        
        // Load all data in parallel (use opponent ID for pitcher/bullpen)
        const [park, pitchers, batters, bullpen] = await Promise.all([
            this.fetchSubtableData(this.ENDPOINTS.PARK, this.F.PF_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.PITCHERS, this.F.P_GAME_ID, opponentGameId),
            this.fetchSubtableData(this.ENDPOINTS.BATTERS, this.F.B_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.BULLPEN, this.F.BP_GAME_ID, opponentGameId)
        ]);
        
        console.log(`Loaded data for game ${gameId}:`, {
            park: park?.length || 0,
            pitchers: pitchers?.length || 0,
            batters: batters?.length || 0,
            bullpen: bullpen?.length || 0
        });
        
        const data = { park, pitchers, batters, bullpen };
        this.subtableDataCache.set(cacheKey, data);
        return data;
    }
    
    async fetchSubtableData(endpoint, fieldName, gameId) {
        const url = `${this.BASE_URL}${endpoint}?${encodeURIComponent(fieldName)}=eq.${encodeURIComponent(gameId)}&select=*`;
        
        // Use the headers we copied from BaseTable in the constructor
        let headers = this.HEADERS;
        
        if (!headers || !headers.apikey) {
            // Try to get headers from BaseTable config
            if (this.getBaseConfig) {
                const config = this.getBaseConfig();
                if (config.ajaxConfig?.headers) {
                    headers = config.ajaxConfig.headers;
                    console.log('Using headers from BaseTable config');
                }
            }
        }
        
        if (!headers) {
            console.error('No headers available!');
            return [];
        }
        
        console.log(`Fetching from: ${url}`);
        
        try {
            const response = await fetch(url, { 
                method: 'GET',
                headers: headers 
            });
            
            if (!response.ok) {
                console.error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
                try {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                } catch (e) {
                    console.error('Could not read error response');
                }
                return [];
            }
            
            const data = await response.json();
            console.log(`Successfully fetched ${data.length} records from ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint} data:`, error);
            return [];
        }
    }
    
    formatRatio(value) {
        // Format to 3 decimal places, no leading zero
        if (value == null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        const formatted = num.toFixed(3);
        return formatted.startsWith('0.') ? formatted.substring(1) : formatted;
    }
    
    formatERA(value) {
        // Format to 2 decimal places
        if (value == null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(2);
    }
    
    formatSplitName(split) {
        if (!split) return '';
        
        // Convert @ to at Home/Away
        let formatted = split.replace(/@/g, 'at Home');
        
        // Handle specific replacements
        formatted = formatted.replace(/vs L/g, 'vs Lefties');
        formatted = formatted.replace(/vs R/g, 'vs Righties');
        formatted = formatted.replace(/L @/g, 'Lefties at Home');
        formatted = formatted.replace(/R @/g, 'Righties at Home');
        
        return formatted;
    }
    
    createParkFactorsTable(container, parkData, matchupData) {
        const F = this.F;
        
        // Get stadium name from matchup data, removing "(Retractable Roof)" if present
        let stadiumName = matchupData[F.PARK] || "Stadium";
        stadiumName = stadiumName.replace(/\s*\(Retractable Roof\)\s*/gi, '').trim();
        
        // Add title with stadium name
        const title = document.createElement("h4");
        title.textContent = `${stadiumName} Park Factors`;
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process park data to rename splits
        const processedData = (parkData || []).map(row => ({
            ...row,
            [F.PF_SPLIT]: row[F.PF_SPLIT] === 'A' ? 'All' : 
                         row[F.PF_SPLIT] === 'R' ? 'Right' : 
                         row[F.PF_SPLIT] === 'L' ? 'Left' : row[F.PF_SPLIT]
        }));
        
        // Sort: All first, then Right, then Left
        processedData.sort((a, b) => {
            const order = { 'All': 0, 'Right': 1, 'Left': 2 };
            return (order[a[F.PF_SPLIT]] || 99) - (order[b[F.PF_SPLIT]] || 99);
        });
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: processedData,
            columns: [
                { title: "Split", field: F.PF_SPLIT, widthGrow: 1.5, resizable: false },
                { title: "H", field: F.PF_H, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "1B", field: F.PF_1B, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "2B", field: F.PF_2B, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "3B", field: F.PF_3B, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "HR", field: F.PF_HR, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "R", field: F.PF_R, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "BB", field: F.PF_BB, widthGrow: 0.6, hozAlign: "center", resizable: false },
                { title: "SO", field: F.PF_SO, widthGrow: 0.6, hozAlign: "center", resizable: false }
            ]
        });
    }
    
    createWeatherTable(container, matchupData) {
        const F = this.F;
        
        // Check if stadium has retractable roof
        const stadiumName = matchupData[F.PARK] || "";
        const hasRetractableRoof = stadiumName.includes("(Retractable Roof)");
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = hasRetractableRoof ? "Weather Conditions (Retractable Roof)" : "Weather Conditions";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Extract time values and weather conditions
        const weatherData = [];
        
        // Parse weather fields - extract time and conditions
        if (matchupData[F.WX1]) {
            const parts = matchupData[F.WX1].split(' - ');
            if (parts.length >= 2) {
                weatherData.push({
                    time: parts[0] || '-',
                    conditions: parts.slice(1).join(' - ') || '-'
                });
            }
        }
        
        if (matchupData[F.WX2]) {
            const parts = matchupData[F.WX2].split(' - ');
            if (parts.length >= 2) {
                weatherData.push({
                    time: parts[0] || '-',
                    conditions: parts.slice(1).join(' - ') || '-'
                });
            }
        }
        
        if (matchupData[F.WX3]) {
            const parts = matchupData[F.WX3].split(' - ');
            if (parts.length >= 2) {
                weatherData.push({
                    time: parts[0] || '-',
                    conditions: parts.slice(1).join(' - ') || '-'
                });
            }
        }
        
        if (matchupData[F.WX4]) {
            const parts = matchupData[F.WX4].split(' - ');
            if (parts.length >= 2) {
                weatherData.push({
                    time: parts[0] || '-',
                    conditions: parts.slice(1).join(' - ') || '-'
                });
            }
        }
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: weatherData,
            columns: [
                { title: "Time", field: "time", widthGrow: 1, resizable: false },
                { title: "Weather Conditions", field: "conditions", widthGrow: 3, resizable: false }
            ]
        });
    }
    
    createPitchersTable(container, pitchersData, gameId) {
        const F = this.F;
        const self = this;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Opposing Starting Pitcher";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process and sort data
        const processedData = this.processPlayerData(pitchersData, 'pitcher');
        
        const pitchersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.P_NAME,
                    widthGrow: 2,
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        if (data._isParent) {
                            return `<strong>${data[F.P_NAME]}</strong>`;
                        }
                        return this.formatSplitName(data[F.P_SPLIT] || data[F.P_NAME]);
                    }
                },
                { title: "TBF", field: F.P_TBF, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { 
                    title: "H/TBF", 
                    field: F.P_H_TBF, 
                    widthGrow: 0.7, 
                    hozAlign: "center", 
                    resizable: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.P_H, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "1B", field: F.P_1B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "2B", field: F.P_2B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "3B", field: F.P_3B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "HR", field: F.P_HR, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "R", field: F.P_R, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { 
                    title: "ERA", 
                    field: F.P_ERA, 
                    widthGrow: 0.7, 
                    hozAlign: "center", 
                    resizable: false,
                    formatter: (cell) => this.formatERA(cell.getValue())
                },
                { title: "BB", field: F.P_BB, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "SO", field: F.P_SO, widthGrow: 0.5, hozAlign: "center", resizable: false }
            ]
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'pitchers', pitchersTable);
    }
    
    createBattersTable(container, battersData, gameId) {
        const F = this.F;
        const self = this;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Batters";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process and sort data
        const processedData = this.processPlayerData(battersData, 'batter');
        
        const battersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.B_NAME,
                    widthGrow: 2,
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        if (data._isParent) {
                            return `<strong>${data[F.B_NAME]}</strong>`;
                        }
                        return this.formatSplitName(data[F.B_SPLIT] || data[F.B_NAME]);
                    }
                },
                { title: "PA", field: F.B_PA, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { 
                    title: "H/PA", 
                    field: F.B_H_PA, 
                    widthGrow: 0.7, 
                    hozAlign: "center", 
                    resizable: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.B_H, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "1B", field: F.B_1B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "2B", field: F.B_2B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "3B", field: F.B_3B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "HR", field: F.B_HR, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "R", field: F.B_R, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "RBI", field: F.B_RBI, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "BB", field: F.B_BB, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "SO", field: F.B_SO, widthGrow: 0.5, hozAlign: "center", resizable: false }
            ]
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'batters', battersTable);
    }
    
    createBullpenTable(container, bullpenData, gameId) {
        const F = this.F;
        const self = this;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Opposing Bullpen";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process bullpen data into groups
        const processedData = this.processBullpenDataGrouped(bullpenData);
        
        const bullpenTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            columns: [
                { 
                    title: "Bullpen Group", 
                    field: F.BP_HAND_CNT, 
                    widthGrow: 1.5,
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        if (data._isGroup) {
                            return `<strong>${data[F.BP_HAND_CNT]}</strong>`;
                        }
                        return this.formatSplitName(data[F.BP_SPLIT] || '');
                    }
                },
                { title: "TBF", field: F.BP_TBF, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { 
                    title: "H/TBF", 
                    field: F.BP_H_TBF, 
                    widthGrow: 0.7, 
                    hozAlign: "center", 
                    resizable: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.BP_H, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "1B", field: F.BP_1B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "2B", field: F.BP_2B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "3B", field: F.BP_3B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "HR", field: F.BP_HR, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "R", field: F.BP_R, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { 
                    title: "ERA", 
                    field: F.BP_ERA, 
                    widthGrow: 0.7, 
                    hozAlign: "center", 
                    resizable: false,
                    formatter: (cell) => this.formatERA(cell.getValue())
                },
                { title: "BB", field: F.BP_BB, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "SO", field: F.BP_SO, widthGrow: 0.5, hozAlign: "center", resizable: false }
            ]
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'bullpen', bullpenTable);
    }
    
    processPlayerData(data, type) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        const nameField = type === 'pitcher' ? F.P_NAME : F.B_NAME;
        const splitField = type === 'pitcher' ? F.P_SPLIT : F.B_SPLIT;
        
        // Group by player name
        const grouped = {};
        
        data.forEach(row => {
            const name = row[nameField];
            if (!grouped[name]) {
                grouped[name] = {
                    parent: null,
                    children: []
                };
            }
            
            // Check split type
            const splitId = row[splitField];
            if (splitId && !splitId.includes('vs') && !splitId.includes('@')) {
                // This is likely the parent row (full season)
                grouped[name].parent = { ...row, _isParent: true };
            } else {
                grouped[name].children.push(row);
            }
        });
        
        // Build final data structure
        const result = [];
        
        Object.values(grouped).forEach(group => {
            if (group.parent) {
                // Sort children: R before L, non-@ before @
                group.children.sort((a, b) => {
                    const splitA = a[splitField] || '';
                    const splitB = b[splitField] || '';
                    
                    // Priority order
                    const getPriority = (split) => {
                        if (split.includes('vs R') && !split.includes('@')) return 0;
                        if (split.includes('vs L') && !split.includes('@')) return 1;
                        if (split.includes('@ ') || split.includes('at Home')) return 2;
                        if (split.includes('vs R') && split.includes('@')) return 3;
                        if (split.includes('vs L') && split.includes('@')) return 4;
                        return 5;
                    };
                    
                    return getPriority(splitA) - getPriority(splitB);
                });
                
                group.parent._children = group.children;
                result.push(group.parent);
            } else if (group.children.length > 0) {
                // No clear parent, use first child as parent
                const parent = { ...group.children[0], _isParent: true };
                parent._children = group.children.slice(1);
                result.push(parent);
            }
        });
        
        return result;
    }
    
    processBullpenDataGrouped(data) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        
        // Separate into righties and lefties
        const righties = [];
        const lefties = [];
        
        data.forEach(row => {
            const handCnt = row[F.BP_HAND_CNT] || '';
            if (handCnt.includes('R')) {
                righties.push(row);
            } else if (handCnt.includes('L')) {
                lefties.push(row);
            }
        });
        
        const result = [];
        
        // Create Righties group
        if (righties.length > 0) {
            // Count unique pitchers (number in parentheses)
            const rightCount = new Set(righties.map(r => {
                const match = (r[F.BP_HAND_CNT] || '').match(/\((\d+)\)/);
                return match ? match[1] : '';
            })).size;
            
            const rightGroup = {
                [F.BP_HAND_CNT]: `Righties (${rightCount})`,
                _isGroup: true,
                _children: righties.map(r => ({
                    ...r,
                    [F.BP_SPLIT]: this.formatSplitName(r[F.BP_SPLIT] || '')
                }))
            };
            
            // Calculate totals for the group
            this.calculateGroupTotals(rightGroup, righties, F);
            result.push(rightGroup);
        }
        
        // Create Lefties group
        if (lefties.length > 0) {
            const leftCount = new Set(lefties.map(r => {
                const match = (r[F.BP_HAND_CNT] || '').match(/\((\d+)\)/);
                return match ? match[1] : '';
            })).size;
            
            const leftGroup = {
                [F.BP_HAND_CNT]: `Lefties (${leftCount})`,
                _isGroup: true,
                _children: lefties.map(r => ({
                    ...r,
                    [F.BP_SPLIT]: this.formatSplitName(r[F.BP_SPLIT] || '')
                }))
            };
            
            // Calculate totals for the group
            this.calculateGroupTotals(leftGroup, lefties, F);
            result.push(leftGroup);
        }
        
        return result;
    }
    
    calculateGroupTotals(group, rows, F) {
        // Calculate totals for the group row
        let totals = {
            [F.BP_TBF]: 0,
            [F.BP_H]: 0,
            [F.BP_1B]: 0,
            [F.BP_2B]: 0,
            [F.BP_3B]: 0,
            [F.BP_HR]: 0,
            [F.BP_R]: 0,
            [F.BP_BB]: 0,
            [F.BP_SO]: 0
        };
        
        rows.forEach(row => {
            totals[F.BP_TBF] += parseFloat(row[F.BP_TBF] || 0);
            totals[F.BP_H] += parseFloat(row[F.BP_H] || 0);
            totals[F.BP_1B] += parseFloat(row[F.BP_1B] || 0);
            totals[F.BP_2B] += parseFloat(row[F.BP_2B] || 0);
            totals[F.BP_3B] += parseFloat(row[F.BP_3B] || 0);
            totals[F.BP_HR] += parseFloat(row[F.BP_HR] || 0);
            totals[F.BP_R] += parseFloat(row[F.BP_R] || 0);
            totals[F.BP_BB] += parseFloat(row[F.BP_BB] || 0);
            totals[F.BP_SO] += parseFloat(row[F.BP_SO] || 0);
        });
        
        // Calculate weighted H/TBF
        if (totals[F.BP_TBF] > 0) {
            const weightedHTBF = rows.reduce((sum, row) => {
                const htbf = parseFloat(row[F.BP_H_TBF] || 0);
                const tbf = parseFloat(row[F.BP_TBF] || 0);
                return sum + (htbf * tbf);
            }, 0) / totals[F.BP_TBF];
            
            totals[F.BP_H_TBF] = weightedHTBF;
        }
        
        // Calculate ERA
        if (totals[F.BP_R] > 0 && totals[F.BP_TBF] > 0) {
            const innings = totals[F.BP_TBF] / 3; // Approximate
            totals[F.BP_ERA] = (totals[F.BP_R] * 9) / innings;
        }
        
        // Apply totals to group
        Object.assign(group, totals);
    }
    
    trackSubtableExpansion(gameId, tableType, table) {
        const key = `${gameId}_${tableType}`;
        
        // Track expanded state for nested rows
        table.on('dataTreeRowExpanded', (row) => {
            if (!this.expandedSubtableRows.has(gameId)) {
                this.expandedSubtableRows.set(gameId, new Set());
            }
            const expandedSet = this.expandedSubtableRows.get(gameId);
            expandedSet.add(`${tableType}_${row.getIndex()}`);
            
            // Update global state
            const globalState = this.getGlobalState();
            const mainRowId = `matchup_${gameId}`;
            if (globalState.has(mainRowId)) {
                const state = globalState.get(mainRowId);
                state.expandedSubrows = Array.from(expandedSet);
                globalState.set(mainRowId, state);
                this.setGlobalState(globalState);
            }
        });
        
        table.on('dataTreeRowCollapsed', (row) => {
            const expandedSet = this.expandedSubtableRows.get(gameId);
            if (expandedSet) {
                expandedSet.delete(`${tableType}_${row.getIndex()}`);
                
                // Update global state
                const globalState = this.getGlobalState();
                const mainRowId = `matchup_${gameId}`;
                if (globalState.has(mainRowId)) {
                    const state = globalState.get(mainRowId);
                    state.expandedSubrows = Array.from(expandedSet);
                    globalState.set(mainRowId, state);
                    this.setGlobalState(globalState);
                }
            }
        });
    }
    
    restoreSubtableExpandedState(gameId) {
        // Get expanded state from global state
        const globalState = this.getGlobalState();
        const mainRowId = `matchup_${gameId}`;
        
        if (globalState.has(mainRowId)) {
            const state = globalState.get(mainRowId);
            if (state.expandedSubrows && state.expandedSubrows.length > 0) {
                // Store for later restoration
                if (!this.expandedSubtableRows.has(gameId)) {
                    this.expandedSubtableRows.set(gameId, new Set(state.expandedSubrows));
                }
                
                // The actual expansion will happen when the tables are created
                // and the dataTree rows are available
            }
        }
    }
    
    // Override methods from BaseTable that need special handling
    setupRowExpansion() {
        // Use the base class method but with our custom handler
        if (!this.table) return;
        
        const self = this;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            // Allow full cell click on Team column for expand/collapse
            if (field === this.F.TEAM) {
                e.preventDefault();
                e.stopPropagation();
                
                const row = cell.getRow();
                this.toggleRowExpansion(row);
            }
        });
    }
}

// Default export for compatibility
export default MatchupsTable;
