// tables/combinedMatchupsTable.js - COMPLETELY REFACTORED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        
        // Hardcode the working API configuration
        this.BASE_URL = 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
        
        // Build headers - include apikey if available
        this.HEADERS = {
            'Accept': 'application/json'
        };
        
        // Add API key if available
        if (window.SUPABASE_ANON_KEY) {
            this.HEADERS['apikey'] = window.SUPABASE_ANON_KEY;
        }
        
        console.log('MatchupsTable initialized with BASE_URL:', this.BASE_URL);
        console.log('Headers configured:', Object.keys(this.HEADERS));
        
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
        this.expandedPlayerRows = new Map();
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
                field: "_expanded",
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
                        requestAnimationFrame(() => {
                            self.createMatchupSubtables(row, data);
                        });
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
                data: data
            });
        } else {
            globalState.delete(rowId);
        }
        
        this.setGlobalState(globalState);
        row.update(data);
        row.reformat();
    }
    
    generateRowId(data) {
        return `matchup_${data[this.F.MATCH_ID]}`;
    }
    
    async createMatchupSubtables(row, data) {
        const rowElement = row.getElement();
        const gameId = data[this.F.MATCH_ID];
        
        // Create main container
        const holderEl = document.createElement("div");
        holderEl.classList.add('subrow-container');
        holderEl.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            margin: 10px 0;
            border-radius: 4px;
            display: block;
            width: 100%;
            position: relative;
            z-index: 1;
        `;
        
        // Load all subtable data
        const subtableData = await this.loadSubtableData(gameId);
        
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
        
        // Row 2: Starting Pitchers
        const pitchersContainer = document.createElement("div");
        pitchersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(pitchersContainer);
        
        // Row 3: Batters
        const battersContainer = document.createElement("div");
        battersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(battersContainer);
        
        // Row 4: Bullpen
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
    }
    
    async loadSubtableData(gameId) {
        // Check cache first
        if (this.subtableDataCache.has(gameId)) {
            return this.subtableDataCache.get(gameId);
        }
        
        console.log(`Loading subtable data for game ID: ${gameId}`);
        
        // Load all data in parallel
        const [park, pitchers, batters, bullpen] = await Promise.all([
            this.fetchSubtableData(this.ENDPOINTS.PARK, this.F.PF_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.PITCHERS, this.F.P_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.BATTERS, this.F.B_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.BULLPEN, this.F.BP_GAME_ID, gameId)
        ]);
        
        console.log(`Loaded data for game ${gameId}:`, {
            park: park?.length || 0,
            pitchers: pitchers?.length || 0,
            batters: batters?.length || 0,
            bullpen: bullpen?.length || 0
        });
        
        const data = { park, pitchers, batters, bullpen };
        this.subtableDataCache.set(gameId, data);
        return data;
    }
    
    async fetchSubtableData(endpoint, fieldName, gameId) {
        // Build headers at fetch time to ensure we have the API key
        const headers = {
            'Accept': 'application/json'
        };
        
        // Try multiple ways to get the API key
        const apiKey = window.SUPABASE_ANON_KEY || 
                      this.apiConfig?.HEADERS?.apikey || 
                      this.apiConfig?.HEADERS?.['apikey'] ||
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5MjIyMzIsImV4cCI6MjAzNzQ5ODIzMn0.6z6R6SgCQKlgqMuRCA5gLBe5H-qUJV2nPuQVKiXkFms';
        
        if (apiKey) {
            headers['apikey'] = apiKey;
        }
        
        const url = `${this.BASE_URL}${endpoint}?${encodeURIComponent(fieldName)}=eq.${encodeURIComponent(gameId)}&select=*`;
        console.log(`Fetching from: ${url} with apikey: ${apiKey ? 'present' : 'missing'}`);
        
        try {
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            console.log(`Fetched ${data.length} records from ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint} data:`, error);
            return [];
        }
    }
    
    createParkFactorsTable(container, parkData, matchupData) {
        const F = this.F;
        
        // Get stadium name from matchup data, removing "(Retractable Roof)" if present
        let stadiumName = matchupData[F.PARK] || "Stadium";
        stadiumName = stadiumName.replace(/\s*\(Retractable Roof\)\s*/gi, '').trim();
        
        // Add title with stadium name
        const title = document.createElement("h4");
        title.textContent = `${stadiumName} Park Factors`;
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: parkData || [],
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
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        const weatherData = [
            { 
                condition: "Game Time",
                value: matchupData[F.WX1] || "-"
            },
            { 
                condition: "Temperature",
                value: matchupData[F.WX2] || "-"
            },
            { 
                condition: "Wind",
                value: matchupData[F.WX3] || "-"
            },
            { 
                condition: "Precipitation",
                value: matchupData[F.WX4] || "-"
            }
        ];
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: weatherData,
            columns: [
                { title: "Condition", field: "condition", widthGrow: 1, resizable: false },
                { title: "Value", field: "value", widthGrow: 2, resizable: false }
            ]
        });
    }
    
    createPitchersTable(container, pitchersData, gameId) {
        const F = this.F;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Starting Pitchers";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process data to group by split
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
                        return data[F.P_SPLIT] || data[F.P_NAME];
                    }
                },
                { title: "TBF", field: F.P_TBF, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "H/TBF", field: F.P_H_TBF, widthGrow: 0.7, hozAlign: "center", resizable: false },
                { title: "H", field: F.P_H, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "1B", field: F.P_1B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "2B", field: F.P_2B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "3B", field: F.P_3B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "HR", field: F.P_HR, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "R", field: F.P_R, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "ERA", field: F.P_ERA, widthGrow: 0.7, hozAlign: "center", resizable: false },
                { title: "BB", field: F.P_BB, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "SO", field: F.P_SO, widthGrow: 0.5, hozAlign: "center", resizable: false }
            ]
        });
        
        // Store table reference for state management
        this.storeSubtableReference(gameId, 'pitchers', pitchersTable);
    }
    
    createBattersTable(container, battersData, gameId) {
        const F = this.F;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Batters";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process data to group by batter
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
                        return data[F.B_SPLIT] || data[F.B_NAME];
                    }
                },
                { title: "PA", field: F.B_PA, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "H/PA", field: F.B_H_PA, widthGrow: 0.7, hozAlign: "center", resizable: false },
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
        
        // Store table reference for state management
        this.storeSubtableReference(gameId, 'batters', battersTable);
    }
    
    createBullpenTable(container, bullpenData, gameId) {
        const F = this.F;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Bullpen";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process and add totals row
        const processedData = this.processBullpenData(bullpenData);
        
        const bullpenTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            data: processedData,
            columns: [
                { 
                    title: "Group", 
                    field: F.BP_HAND_CNT, 
                    widthGrow: 1.5,
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        if (data._isTotal) {
                            return `<strong>${data[F.BP_HAND_CNT]}</strong>`;
                        }
                        return data[F.BP_HAND_CNT];
                    }
                },
                { title: "Split", field: F.BP_SPLIT, widthGrow: 1, resizable: false },
                { title: "TBF", field: F.BP_TBF, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "H/TBF", field: F.BP_H_TBF, widthGrow: 0.7, hozAlign: "center", resizable: false },
                { title: "H", field: F.BP_H, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "1B", field: F.BP_1B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "2B", field: F.BP_2B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "3B", field: F.BP_3B, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "HR", field: F.BP_HR, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "R", field: F.BP_R, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "ERA", field: F.BP_ERA, widthGrow: 0.7, hozAlign: "center", resizable: false },
                { title: "BB", field: F.BP_BB, widthGrow: 0.5, hozAlign: "center", resizable: false },
                { title: "SO", field: F.BP_SO, widthGrow: 0.5, hozAlign: "center", resizable: false }
            ]
        });
        
        // Store table reference for state management
        this.storeSubtableReference(gameId, 'bullpen', bullpenTable);
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
            
            // Check if this is the full season row (usually has specific split ID pattern)
            const splitId = row[splitField];
            if (splitId && (splitId.includes('Full') || splitId.includes('Season') || splitId === 'Total')) {
                grouped[name].parent = { ...row, _isParent: true };
            } else {
                grouped[name].children.push(row);
            }
        });
        
        // Build final data structure
        const result = [];
        
        Object.values(grouped).forEach(group => {
            if (group.parent) {
                // Use parent as main row with children
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
    
    processBullpenData(data) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        const processed = [...data];
        
        // Calculate totals
        const totals = {
            [F.BP_HAND_CNT]: 'Total',
            [F.BP_SPLIT]: '—',
            [F.BP_TBF]: 0,
            [F.BP_H]: 0,
            [F.BP_1B]: 0,
            [F.BP_2B]: 0,
            [F.BP_3B]: 0,
            [F.BP_HR]: 0,
            [F.BP_R]: 0,
            [F.BP_BB]: 0,
            [F.BP_SO]: 0,
            _isTotal: true
        };
        
        data.forEach(row => {
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
            const weightedHTBF = data.reduce((sum, row) => {
                const htbf = parseFloat(row[F.BP_H_TBF] || 0);
                const tbf = parseFloat(row[F.BP_TBF] || 0);
                return sum + (htbf * tbf);
            }, 0) / totals[F.BP_TBF];
            
            totals[F.BP_H_TBF] = weightedHTBF.toFixed(3);
        }
        
        // Calculate ERA if applicable
        if (totals[F.BP_R] > 0 && totals[F.BP_TBF] > 0) {
            const innings = totals[F.BP_TBF] / 3; // Approximate
            totals[F.BP_ERA] = ((totals[F.BP_R] * 9) / innings).toFixed(2);
        }
        
        processed.push(totals);
        return processed;
    }
    
    storeSubtableReference(gameId, tableType, table) {
        const key = `${gameId}_${tableType}`;
        if (!this.expandedPlayerRows.has(key)) {
            this.expandedPlayerRows.set(key, new Set());
        }
        
        // Track expanded state for nested rows
        table.on('dataTreeRowExpanded', (row) => {
            const expandedSet = this.expandedPlayerRows.get(key);
            expandedSet.add(row.getIndex());
        });
        
        table.on('dataTreeRowCollapsed', (row) => {
            const expandedSet = this.expandedPlayerRows.get(key);
            expandedSet.delete(row.getIndex());
        });
    }
    
    // Override methods from BaseTable that need special handling
    setupRowExpansion() {
        // Use the base class method but with our custom handler
        if (!this.table) return;
        
        const self = this;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            if (field === "_expanded" || field === this.F.TEAM) {
                e.preventDefault();
                e.stopPropagation();
                
                const row = cell.getRow();
                this.toggleRowExpansion(row);
            }
        });
    }
}

// Default export for compatibility with different import styles
export default MatchupsTable;
