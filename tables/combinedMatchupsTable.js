// tables/combinedMatchupsTable.js - COMPLETE FIXED VERSION WITH ALL ISSUES RESOLVED
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { formatRatio, formatDecimal } from '../shared/utils.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');  // This sets this.endpoint in BaseTable
        this.matchupsData = [];
        this.parkFactorsCache = new Map();
        this.pitcherStatsCache = new Map();
        this.batterMatchupsCache = new Map();
        this.bullpenMatchupsCache = new Map();
        
        // FIXED: Use consistent state management like other tables
        this.expandedRowsCache = new Set();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.isRestoringState = false;
        this.pendingRestoration = null;
        this.restorationAttempts = 0;
        this.maxRestorationAttempts = 3;
        
        // Container configuration with proper sizing - FIXED: Consistent scaling
        this.subtableConfig = {
            parkFactorsContainerWidth: 550,
            weatherContainerWidth: 550,
            containerGap: 20,
            maxTotalWidth: 1120,
            
            // FIXED: Consistent column widths for all subtables
            parkFactorsColumns: {
                split: 90,
                H: 55,
                "1B": 55,
                "2B": 55,
                "3B": 55,
                HR: 55,
                R: 55,
                BB: 55,
                SO: 55
            },
            
            // FIXED: Standardized widths for pitcher/batter/bullpen tables
            statTableColumns: {
                name: 300,
                split: 160,
                tbf_pa: 60,
                ratio: 60,
                stat: 60,
                era_rbi: 60,
                so: 60,
                h_pa: 60,
                pa: 60
            }
        };
    }

    initialize() {
        console.log('Initializing enhanced matchups table with all fixes...');
        console.log('Matchups table endpoint:', this.endpoint);
        console.log('Matchups table elementId:', this.elementId);
        
        // Create and initialize the table using BaseTable's ajax loading
        const config = this.getTableConfig();
        console.log('Matchups table config:', config);
        
        this.table = new Tabulator(this.elementId, config);
        
        // CRITICAL: Add tableBuilt event handler like other tables
        this.table.on("tableBuilt", () => {
            console.log("✅ Matchups table built successfully");
        });
        
        // Add error handling
        this.table.on("dataLoadError", (error) => {
            console.error("❌ Matchups table data load error:", error);
        });
        
        // FIXED: Proper click handler for row expansion with state management
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                this.toggleRow(cell.getRow());
            }
        });
        
        console.log('Matchups table initialized - data will load automatically via ajax');
    }

    getTableConfig() {
        const baseConfig = super.getBaseConfig();
        const self = this;
        
        console.log('Matchups getTableConfig - baseConfig:', baseConfig);
        
        return {
            ...baseConfig,
            // CRITICAL FIX: Ensure data loading is properly configured
            ajaxURL: baseConfig.ajaxURL,
            ajaxConfig: baseConfig.ajaxConfig,
            // CRITICAL FIX: Add data loading debug
            dataLoading: (data) => {
                console.log(`Matchups data loading started...`);
            },
            columns: this.getColumns(),
            rowFormatter: (row) => this.rowFormatter(row),
            // FIXED: Disable column resizing completely
            resizableColumns: false,
            // FIXED: Set proper table dimensions
            maxHeight: "600px",
            height: "600px",
            layout: "fitColumns", // Changed from fitData to fitColumns for proper sizing
            dataLoaded: (data) => {
                console.log(`✅ Matchups data loaded: ${data.length} rows`);
                this.data = data;
                this.matchupsData = data;
                this.dataLoaded = true;
                this.attachEventHandlers();
                
                // FIXED: Restore state after data loads using same pattern as other tables
                if (this.pendingRestoration || this.expandedRowsCache.size > 0 || this.expandedRowsSet.size > 0) {
                    setTimeout(() => {
                        this.restoreState();
                        this.pendingRestoration = null;
                    }, 100);
                }
            },
            dataProcessing: () => {
                console.log(`Data processing for ${self.elementId}`);
                if (!self.isRestoringState) {
                    self.saveTemporaryExpandedState();
                }
            },
            dataProcessed: () => {
                console.log(`Data processed for ${self.elementId}`);
                if (!self.isRestoringState && self.temporaryExpandedRows.size > 0) {
                    setTimeout(() => {
                        self.restoreTemporaryExpandedState();
                    }, 50);
                }
            }
        };
    }

    getColumns() {
        const self = this;
        
        return [
            {
                title: "Team",
                field: "Matchup Team",
                width: 200,
                minWidth: 200,
                resizable: false, // ✅ FIXED: Disable resizing
                formatter: (cell) => {
                    const data = cell.getData();
                    const team = cell.getValue();
                    const expanded = data._expanded || false;
                    
                    return `<div style="display: flex; align-items: center;">
                        <span class="row-expander" style="margin-right: 8px; cursor: pointer; font-weight: bold; color: #007bff;">
                            ${expanded ? "−" : "+"}
                        </span>
                        <span>${team}</span>
                    </div>`;
                },
                headerFilter: createCustomMultiSelect,
                headerSort: false
            },
            {
                title: "Game",
                field: "Matchup Game",
                width: 280,
                minWidth: 280,
                resizable: false, // ✅ FIXED: Disable resizing
                headerFilter: createCustomMultiSelect, // ✅ FIXED: Removed arrow function
                headerSort: false
            },
            {
                title: "Spread",
                field: "Spread",
                width: 120,
                minWidth: 120,
                resizable: false, // ✅ FIXED: Disable resizing
                formatter: (cell) => {
                    const value = cell.getValue();
                    const team = cell.getRow().getData()["Matchup Team"];
                    
                    if (!value || value === "-" || value === null || value === "") return "-";
                    
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) return value;
                    
                    const prefix = numValue >= 0 ? (team ? team.substring(0, 3).toUpperCase() + " +" : "+") : (team ? team.substring(0, 3).toUpperCase() + " " : "");
                    return prefix + numValue;
                },
                headerSort: false
            },
            {
                title: "Total",
                field: "Total",
                width: 120,
                minWidth: 120,
                resizable: false, // ✅ FIXED: Disable resizing
                formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value || value === "-" || value === null || value === "") return "-";
                    return value;
                },
                headerSort: false
            },
            {
                title: "Lineup Status",
                field: "Lineup Status",
                width: 150,
                minWidth: 150,
                resizable: false, // ✅ FIXED: Disable resizing
                formatter: (cell) => {
                    const value = cell.getValue();
                    let bgColor = "#f8f9fa";
                    let textColor = "#333";
                    
                    if (!value || value === "-" || value === null || value === "") {
                        return `<span style="background-color: #f8f9fa; color: #666; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Unknown</span>`;
                    }
                    
                    if (value === "Confirmed") {
                        bgColor = "#d4edda";
                        textColor = "#155724";
                    } else if (value === "Probable") {
                        bgColor = "#fff3cd";
                        textColor = "#856404";
                    }
                    
                    return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${value}</span>`;
                },
                headerFilter: createCustomMultiSelect, // ✅ FIXED: Removed arrow function
                headerSort: false
            }
        ];
    }

    // FIXED: Proper row ID generation like other tables
    generateRowId(data) {
        if (data["Matchup Game ID"]) {
            return `matchup_${data["Matchup Game ID"]}`;
        }
        
        // Fallback to other identifiers
        const identifiers = [];
        if (data["Matchup Team"]) identifiers.push(data["Matchup Team"]);
        if (data["Matchup Game"]) identifiers.push(data["Matchup Game"]);
        if (data["Spread"]) identifiers.push(data["Spread"]);
        
        return identifiers.length > 0 ? `matchup_${identifiers.join('_')}` : JSON.stringify(data);
    }

    // FIXED: Enhanced row toggle with proper data fetching and state management
    async toggleRow(row) {
        if (this.isRestoringState) return;
        
        const data = row.getData();
        const rowId = this.generateRowId(data);
        
        // Initialize _expanded if undefined
        if (data._expanded === undefined) {
            data._expanded = false;
        }
        
        // Toggle expansion state
        data._expanded = !data._expanded;
        
        // FIXED: Update state management like other tables
        const globalState = this.getGlobalState();
        if (data._expanded) {
            globalState.set(rowId, {
                timestamp: Date.now(),
                data: data
            });
            this.expandedRowsCache.add(rowId);
            this.expandedRowsSet.add(rowId);
        } else {
            globalState.delete(rowId);
            this.expandedRowsCache.delete(rowId);
            this.expandedRowsSet.delete(rowId);
        }
        this.setGlobalState(globalState);
        
        console.log(`Matchups row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
        
        // Update the row
        row.update(data);
        
        // Update expander icon
        const cellElement = row.getCells().find(cell => cell.getField() === "Matchup Team")?.getElement();
        const expanderIcon = cellElement?.querySelector('.row-expander');
        if (expanderIcon) {
            expanderIcon.innerHTML = data._expanded ? "−" : "+";
        }
        
        // Load subtable data if expanding
        if (data._expanded) {
            await this.loadAllSubtableData(data);
        }
        
        // Force a reformat to show/hide the subtables
        setTimeout(() => {
            row.reformat();
        }, 50);
    }

    // FIXED: Load all subtable data with better error handling and CORRECT API ENDPOINTS
    async loadAllSubtableData(data) {
        const gameId = data["Matchup Game ID"];
        
        if (!gameId) {
            console.warn('No game ID found for subtable data loading');
            return;
        }
        
        console.log(`Loading all subtable data for game ${gameId}`);
        
        try {
            // FIXED: Load all data types concurrently for better performance with CORRECT endpoints
            const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                this.loadParkFactorsData(gameId),
                this.loadPitcherStatsData(gameId),
                this.loadBatterMatchupsData(gameId),
                this.loadBullpenMatchupsData(gameId)
            ]);
            
            // Store data on the row data object
            data._parkFactors = parkFactors;
            data._pitcherStats = pitcherStats;
            data._batterMatchups = batterMatchups;
            data._bullpenMatchups = bullpenMatchups;
            
            console.log(`Successfully loaded all subtable data:`, {
                parkFactors: data._parkFactors.length,
                pitcherStats: data._pitcherStats.length,
                batterMatchups: data._batterMatchups.length,
                bullpenMatchups: data._bullpenMatchups.length
            });
            
        } catch (error) {
            console.error('Error loading all subtable data:', error);
        }
    }

    // ✅ FIXED: Data loading methods with CORRECT field names from database schema
    async loadParkFactorsData(gameId) {
        // ✅ FIXED: ModParkFactors uses "Park Factor Game ID" field
        return this.loadSubtableData('ModParkFactors', `Park%20Factor%20Game%20ID=eq.${gameId}`, this.parkFactorsCache, gameId);
    }

    async loadPitcherStatsData(gameId) {
        // ✅ FIXED: ModPitcherMatchups uses "Starter Game ID" field
        return this.loadSubtableData('ModPitcherMatchups', `Starter%20Game%20ID=eq.${gameId}`, this.pitcherStatsCache, gameId);
    }

    async loadBatterMatchupsData(gameId) {
        // ✅ FIXED: ModBatterMatchups uses "Batter Game ID" field
        return this.loadSubtableData('ModBatterMatchups', `Batter%20Game%20ID=eq.${gameId}`, this.batterMatchupsCache, gameId);
    }

    async loadBullpenMatchupsData(gameId) {
        // ✅ FIXED: ModBullpenMatchups uses "Bullpen Game ID" field
        return this.loadSubtableData('ModBullpenMatchups', `Bullpen%20Game%20ID=eq.${gameId}`, this.bullpenMatchupsCache, gameId);
    }

    // ✅ FIXED: Better error handling and debug information
    async loadSubtableData(endpoint, filter, cache, gameId) {
        if (cache.has(gameId)) {
            console.log(`Using cached data for ${endpoint} - game ${gameId}`);
            return cache.get(gameId);
        }

        try {
            // ✅ FIXED: Use correct API_CONFIG.baseURL format and proper URL construction
            const url = `${API_CONFIG.baseURL}${endpoint}?${filter}&select=*`;
            console.log(`Loading ${endpoint} data:`, url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                console.error(`❌ ${endpoint} API Error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: url,
                    gameId: gameId
                });
                
                // Try to get error details from response
                try {
                    const errorData = await response.text();
                    console.error(`❌ ${endpoint} Error Response:`, errorData);
                } catch (parseError) {
                    console.error(`❌ Could not parse error response for ${endpoint}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            cache.set(gameId, data);
            console.log(`✅ Loaded ${data.length} ${endpoint} records for game ${gameId}`);
            return data;
            
        } catch (error) {
            console.error(`❌ Error loading ${endpoint} data for game ${gameId}:`, error);
            return [];
        }
    }

    rowFormatter(row) {
        const data = row.getData();
        const rowElement = row.getElement();
        
        // FIXED: Ensure proper row formatting and expansion state
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
            let existingSubrow = rowElement.querySelector('.subrow-container');
            
            if (!existingSubrow) {
                const container = document.createElement("div");
                container.className = 'subrow-container';
                // FIXED: Ensure proper font sizes - no shrinking
                container.style.cssText = `
                    padding: 15px 20px;
                    background: #f8f9fa;
                    margin: 10px 0;
                    border-radius: 6px;
                    display: block;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                    font-size: inherit !important;
                `;
                
                rowElement.appendChild(container);
                this.createSubtableContent(container, data);
            }
        } else {
            // Remove subtable if collapsed
            const existingSubrow = rowElement.querySelector('.subrow-container');
            if (existingSubrow) {
                existingSubrow.remove();
            }
        }
        
        // Normalize heights
        setTimeout(() => {
            row.normalizeHeight();
        }, 50);
    }

    // FIXED: Create subtable content with proper structure and ballpark positioning
    createSubtableContent(container, data) {
        // Get ballpark name for proper positioning
        const ballparkName = data["Matchup Ballpark"] || "Unknown Ballpark";
        
        // FIXED: Proper HTML structure with ballpark above park factors
        container.innerHTML = `
            <div style="display: flex; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 15px; justify-content: center;">
                <div style="flex: 0 0 ${this.subtableConfig.parkFactorsContainerWidth}px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-align: center;">${ballparkName}</h4>
                    <div id="park-factors-container-${data["Matchup Game ID"]}"></div>
                </div>
                <div style="flex: 0 0 ${this.subtableConfig.weatherContainerWidth}px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-align: center;">Weather${this.getRetractableRoofInfo(data)}</h4>
                    <div id="weather-container-${data["Matchup Game ID"]}"></div>
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}"></div>
            </div>
            <div style="margin-bottom: 15px;">
                <div id="batter-matchups-subtable-${data["Matchup Game ID"]}"></div>
            </div>
            <div style="margin-bottom: 15px;">
                <div id="bullpen-matchups-subtable-${data["Matchup Game ID"]}"></div>
            </div>
        `;
        
        // Create each subtable with a slight delay to ensure DOM is ready
        setTimeout(() => {
            this.createParkFactorsTable(data);
            this.createWeatherTable(data);
            this.createPitcherStatsTable(data);
            this.createBatterMatchupsTable(data);
            this.createBullpenMatchupsTable(data);
        }, 10);
    }

    // FIXED: Get retractable roof info for weather header
    getRetractableRoofInfo(data) {
        // Check for retractable roof indicators in the data
        const ballpark = data["Matchup Ballpark"] || "";
        const weatherInfo = data["Matchup Weather 1"] || data["Matchup Weather 2"] || data["Matchup Weather 3"] || data["Matchup Weather 4"] || "";
        
        // List of stadiums with retractable roofs (you can expand this)
        const retractableRoofStadiums = [
            "Miller Park", "Marlins Park", "Minute Maid Park", "Rogers Centre", 
            "Chase Field", "T-Mobile Park", "Globe Life Field", "American Family Field"
        ];
        
        const hasRetractableRoof = retractableRoofStadiums.some(stadium => ballpark.includes(stadium));
        
        return hasRetractableRoof ? " (Retractable Roof)" : "";
    }

    // FIXED: Create park factors table with CORRECT field mappings and expandable rows
    createParkFactorsTable(data) {
        if (data._parkFactors && data._parkFactors.length > 0) {
            const containerId = `park-factors-container-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            const columns = [
                { title: "Split", field: "split", width: this.subtableConfig.parkFactorsColumns.split, headerSort: false, resizable: false },
                { title: "H", field: "H", width: this.subtableConfig.parkFactorsColumns.H, headerSort: false, resizable: false },
                { title: "1B", field: "1B", width: this.subtableConfig.parkFactorsColumns["1B"], headerSort: false, resizable: false },
                { title: "2B", field: "2B", width: this.subtableConfig.parkFactorsColumns["2B"], headerSort: false, resizable: false },
                { title: "3B", field: "3B", width: this.subtableConfig.parkFactorsColumns["3B"], headerSort: false, resizable: false },
                { title: "HR", field: "HR", width: this.subtableConfig.parkFactorsColumns.HR, headerSort: false, resizable: false },
                { title: "R", field: "R", width: this.subtableConfig.parkFactorsColumns.R, headerSort: false, resizable: false },
                { title: "BB", field: "BB", width: this.subtableConfig.parkFactorsColumns.BB, headerSort: false, resizable: false },
                { title: "SO", field: "SO", width: this.subtableConfig.parkFactorsColumns.SO, headerSort: false, resizable: false }
            ];
            
            new Tabulator(`#${containerId}`, {
                layout: "fitData",
                resizableColumns: false, // ✅ FIXED: Disable resizing for subtables
                data: data._parkFactors.map(pf => ({
                    // ✅ FIXED: Use correct field names from database schema
                    split: pf["Park Factor Split ID"] || "Park",
                    H: pf["Park Factor H"] || "-",
                    "1B": pf["Park Factor 1B"] || "-",
                    "2B": pf["Park Factor 2B"] || "-",
                    "3B": pf["Park Factor 3B"] || "-",
                    HR: pf["Park Factor HR"] || "-",
                    R: pf["Park Factor R"] || "-",
                    BB: pf["Park Factor BB"] || "-",
                    SO: pf["Park Factor SO"] || "-"
                })),
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 28,
                // FIXED: Ensure consistent text sizing
                css: {
                    fontSize: 'inherit !important'
                }
            });
        } else {
            // Show placeholder when no data
            const containerId = `park-factors-container-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            if (containerElement) {
                containerElement.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No park factors data available</div>';
            }
        }
    }

    // FIXED: Create weather table with proper formatting
    createWeatherTable(data) {
        const containerId = `weather-container-${data["Matchup Game ID"]}`;
        const containerElement = document.getElementById(containerId);
        
        if (!containerElement) return;
        
        // FIXED: Parse weather data to extract times vs conditions
        const weatherFields = [
            data["Matchup Weather 1"],
            data["Matchup Weather 2"], 
            data["Matchup Weather 3"],
            data["Matchup Weather 4"]
        ];
        
        const weatherData = [];
        
        weatherFields.forEach((weatherString, index) => {
            if (weatherString && weatherString !== "-") {
                // Parse time and conditions from strings like "12:00 PM EST - 71° / Clear Sky / 7 MPH Winds / 0% Rain"
                const parts = weatherString.split(' - ');
                let time = parts[0] || `Time ${index + 1}`;
                let conditions = parts.length > 1 ? parts[1] : weatherString;
                
                // Clean up time format
                if (!time.includes('PM') && !time.includes('AM')) {
                    time = `Time ${index + 1}`;
                }
                
                weatherData.push({
                    time: time,
                    conditions: conditions
                });
            }
        });
        
        // If no parsed data, create default structure
        if (weatherData.length === 0) {
            weatherData.push({
                time: "No time data",
                conditions: "No weather data available"
            });
        }
        
        new Tabulator(`#${containerId}`, {
            layout: "fitData",
            resizableColumns: false, // ✅ FIXED: Disable resizing
            data: weatherData,
            columns: [
                { title: "Time", field: "time", width: 120, headerSort: false, resizable: false },
                { title: "Conditions", field: "conditions", width: 400, headerSort: false, resizable: false }
            ],
            height: false,
            headerHeight: 30,
            rowHeight: 28,
            // FIXED: Ensure consistent text sizing
            css: {
                fontSize: 'inherit !important'
            }
        });
    }

    // FIXED: Create pitcher stats table with expandable rows and CORRECT field mappings
    createPitcherStatsTable(data) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const containerId = `pitcher-stats-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Pitcher Matchups</h4><div id="pitcher-stats-table-' + data["Matchup Game ID"] + '"></div>';
            
            // ✅ FIXED: Group by player and create expandable structure
            const groupedData = this.groupPlayerData(data._pitcherStats, "Starter Name & Hand");
            
            const columns = [
                { 
                    title: "Name", 
                    field: "name", 
                    width: this.subtableConfig.statTableColumns.name, 
                    headerSort: false, 
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        const expanded = data._expanded || false;
                        const hasDetails = data._hasDetails || false;
                        
                        if (!hasDetails) {
                            return `<span>${data.name}</span>`;
                        }
                        
                        return `<div style="display: flex; align-items: center;">
                            <span class="row-expander" style="margin-right: 8px; cursor: pointer; font-weight: bold; color: #007bff;">
                                ${expanded ? "−" : "+"}
                            </span>
                            <span>${data.name}</span>
                        </div>`;
                    }
                },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false, resizable: false },
                { title: "TBF", field: "tbf", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false, resizable: false },
                { title: "H/TBF", field: "h_tbf", width: this.subtableConfig.statTableColumns.ratio, headerSort: false, resizable: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false, resizable: false },
                { title: "ERA", field: "era", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false, resizable: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false, resizable: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false, resizable: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false, resizable: false }
            ];
            
            const table = new Tabulator(`#pitcher-stats-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                resizableColumns: false,
                data: groupedData,
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 28,
                css: {
                    fontSize: 'inherit !important'
                }
            });
            
            // Add click handler for expansion
            table.on("cellClick", (e, cell) => {
                if (cell.getField() === "name") {
                    this.toggleSubtableRow(table, cell.getRow());
                }
            });
        }
    }

    // FIXED: Create batter matchups table with expandable rows and correct field mappings
    createBatterMatchupsTable(data) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            const containerId = `batter-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Batter Matchups</h4><div id="batter-matchups-table-' + data["Matchup Game ID"] + '"></div>';
            
            // ✅ FIXED: Group by player and create expandable structure
            const groupedData = this.groupPlayerData(data._batterMatchups, "Batter Name & Hand & Spot");
            
            const columns = [
                { 
                    title: "Name", 
                    field: "name", 
                    width: this.subtableConfig.statTableColumns.name, 
                    headerSort: false, 
                    resizable: false,
                    formatter: (cell) => {
                        const data = cell.getData();
                        const expanded = data._expanded || false;
                        const hasDetails = data._hasDetails || false;
                        
                        if (!hasDetails) {
                            return `<span>${data.name}</span>`;
                        }
                        
                        return `<div style="display: flex; align-items: center;">
                            <span class="row-expander" style="margin-right: 8px; cursor: pointer; font-weight: bold; color: #007bff;">
                                ${expanded ? "−" : "+"}
                            </span>
                            <span>${data.name}</span>
                        </div>`;
                    }
                },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false, resizable: false },
                { title: "PA", field: "pa", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false, resizable: false },
                { title: "H/PA", field: "h_pa", width: this.subtableConfig.statTableColumns.ratio, headerSort: false, resizable: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false, resizable: false },
                { title: "RBI", field: "rbi", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false, resizable: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false, resizable: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false, resizable: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false, resizable: false }
            ];
            
            const table = new Tabulator(`#batter-matchups-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                resizableColumns: false,
                data: groupedData,
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 28,
                css: {
                    fontSize: 'inherit !important'
                }
            });
            
            // Add click handler for expansion
            table.on("cellClick", (e, cell) => {
                if (cell.getField() === "name") {
                    this.toggleSubtableRow(table, cell.getRow());
                }
            });
        }
    }

    // FIXED: Create bullpen matchups table with consistent formatting
    createBullpenMatchupsTable(data) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const containerId = `bullpen-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Bullpen Matchups</h4><div id="bullpen-matchups-table-' + data["Matchup Game ID"] + '"></div>';
            
            const columns = [
                { title: "Name", field: "name", width: this.subtableConfig.statTableColumns.name, headerSort: false, resizable: false },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false, resizable: false },
                { title: "TBF", field: "tbf", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false, resizable: false },
                { title: "H/TBF", field: "h_tbf", width: this.subtableConfig.statTableColumns.ratio, headerSort: false, resizable: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false, resizable: false },
                { title: "ERA", field: "era", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false, resizable: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false, resizable: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false, resizable: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false, resizable: false }
            ];
            
            new Tabulator(`#bullpen-matchups-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                resizableColumns: false, // ✅ FIXED: Disable resizing
                data: data._bullpenMatchups.map(bm => ({
                    name: bm["Bullpen Name"] || "Unknown",
                    split: bm["Bullpen Split"] || "Full Season",
                    tbf: bm["TBF"] || 0,
                    h_tbf: bm["H/TBF"] || "0.000",
                    h: bm["H"] || 0,
                    era: bm["ERA"] || "0.00",
                    so: bm["SO"] || 0,
                    bb: bm["BB"] || 0,
                    r: bm["R"] || 0
                })),
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 28,
                css: {
                    fontSize: 'inherit !important'
                }
            });
        }
    }

    // ✅ IMPROVED: Helper method to group player data and create expandable structure  
    groupPlayerData(rawData, nameField) {
        const grouped = new Map();
        
        // Group data by player name or bullpen group
        rawData.forEach(item => {
            let playerName;
            if (nameField.includes("Bullpen")) {
                // For bullpen, use the hand & number directly as the group name
                playerName = item[nameField] || "Unknown";
            } else {
                // For players, extract clean name
                playerName = this.extractPlayerName(item[nameField] || "Unknown");
            }
            
            if (!grouped.has(playerName)) {
                grouped.set(playerName, []);
            }
            grouped.get(playerName).push(item);
        });
        
        const result = [];
        
        // Create main rows and detail rows
        grouped.forEach((playerData, playerName) => {
            // Find the "Full Season" row as the main row
            const mainRow = playerData.find(item => {
                const splitId = item["Starter Split ID"] || item["Batter Split ID"] || item["Bullpen Split ID"] || "";
                return splitId === "Full Season";
            }) || playerData[0]; // fallback to first row if no Full Season found
            
            // Create main row
            const mainRowData = this.mapPlayerDataToTableRow(mainRow, nameField);
            mainRowData._hasDetails = playerData.length > 1;
            mainRowData._expanded = false;
            mainRowData._playerName = playerName;
            mainRowData._rawData = playerData;
            mainRowData._isMainRow = true;
            
            result.push(mainRowData);
        });
        
        return result;
    }
    
    // ✅ NEW: Helper to extract clean player name from full name field
    extractPlayerName(fullName) {
        // Extract name from formats like "Jackson Holliday (L) — 1" or "Kyle Bradish (R)"
        return fullName.split('(')[0].trim();
    }
    
    // ✅ NEW: Map database fields to table row format
    mapPlayerDataToTableRow(item, nameField) {
        const isStarter = nameField.includes("Starter");
        const isBatter = nameField.includes("Batter");
        const isBullpen = nameField.includes("Bullpen");
        
        if (isStarter) {
            return {
                name: this.extractPlayerName(item["Starter Name & Hand"] || "Unknown"),
                split: item["Starter Split ID"] || "Full Season",
                tbf: item["Starter TBF"] || 0,
                h_tbf: item["Starter H/TBF"] || "0.000",
                h: item["Starter H"] || 0,
                era: item["Starter ERA"] || "0.00",
                so: item["Starter SO"] || 0,
                bb: item["Starter BB"] || 0,
                r: item["Starter R"] || 0
            };
        } else if (isBatter) {
            return {
                name: this.extractPlayerName(item["Batter Name & Hand & Spot"] || "Unknown"),
                split: item["Batter Split ID"] || "Full Season",
                pa: item["Batter PA"] || 0,
                h_pa: item["Batter H/PA"] || "0.000",
                h: item["Batter H"] || 0,
                rbi: item["Batter RBI"] || 0,
                so: item["Batter SO"] || 0,
                bb: item["Batter BB"] || 0,
                r: item["Batter R"] || 0
            };
        } else if (isBullpen) {
            return {
                name: item["Bullpen Hand & Number"] || "Unknown",
                split: item["Bullpen Split ID"] || "Full Season",
                tbf: item["Bullpen TBF"] || 0,
                h_tbf: item["Bullpen H/TBF"] || "0.000",
                h: item["Bullpen H"] || 0,
                era: item["Bullpen ERA"] || "0.00",
                so: item["Bullpen SO"] || 0,
                bb: item["Bullpen BB"] || 0,
                r: item["Bullpen R"] || 0
            };
        }
        
        return {};
    }
    
    // ✅ IMPROVED: Toggle subtable row expansion with better field detection
    toggleSubtableRow(table, row) {
        const data = row.getData();
        
        if (!data._hasDetails) return;
        
        data._expanded = !data._expanded;
        row.update(data);
        
        if (data._expanded) {
            // Add detail rows
            const detailRows = data._rawData
                .filter(item => {
                    const splitId = item["Starter Split ID"] || item["Batter Split ID"] || item["Bullpen Split ID"] || "";
                    return splitId !== "Full Season"; // Show all non-Full Season rows
                })
                .map(item => {
                    // Detect data type based on available fields
                    let nameField;
                    if (item["Starter Name & Hand"]) {
                        nameField = "Starter Name & Hand";
                    } else if (item["Batter Name & Hand & Spot"]) {
                        nameField = "Batter Name & Hand & Spot";
                    } else {
                        nameField = "Bullpen Hand & Number";
                    }
                    
                    const detailRow = this.mapPlayerDataToTableRow(item, nameField);
                    detailRow._isDetailRow = true;
                    detailRow._parentName = data._playerName;
                    detailRow.name = "  └ " + detailRow.split; // Indent and show split as name
                    return detailRow;
                });
            
            // Insert detail rows after main row
            const rowIndex = table.getRowPosition(row);
            detailRows.forEach((detailRow, index) => {
                table.addRow(detailRow, rowIndex + index + 1);
            });
        } else {
            // Remove detail rows
            const allRows = table.getRows();
            const rowIndex = table.getRowPosition(row);
            
            // Find and remove detail rows that belong to this player
            for (let i = rowIndex + 1; i < allRows.length; i++) {
                const nextRowData = allRows[i].getData();
                if (nextRowData._isDetailRow && nextRowData._parentName === data._playerName) {
                    allRows[i].delete();
                } else {
                    break; // Stop when we hit a non-detail row
                }
            }
        }
    }
}
getTableScrollPosition() {
    const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
    return tableHolder ? tableHolder.scrollTop : 0;
    }

    setTableScrollPosition(position) {
        const tableHolder = document.querySelector(`${this.elementId} .tabulator-tableHolder`);
        if (tableHolder) {
            tableHolder.scrollTop = position;
        }
    }

    // FIXED: Enhanced state management matching other tables
    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        // Save scroll position
        this.lastScrollPosition = this.getTableScrollPosition();
        
        // Clear and rebuild expanded rows set
        this.expandedRowsCache.clear();
        this.expandedRowsSet.clear();
        
        const globalState = this.getGlobalState();
        const rows = this.table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                this.expandedRowsCache.add(id);
                this.expandedRowsSet.add(id);
                
                // Store in global state with metadata
                globalState.set(id, {
                    timestamp: Date.now(),
                    data: data
                });
                
                console.log(`Preserving expanded state for row: ${id}`);
            }
        });
        
        this.setGlobalState(globalState);
        console.log(`State saved: ${this.expandedRowsCache.size} expanded rows, scroll: ${this.lastScrollPosition}`);
    }

    restoreState() {
        if (!this.table) return;
        
        console.log(`Restoring state for ${this.elementId}`);
        this.isRestoringState = true;
        
        try {
            // Restore scroll position
            if (this.lastScrollPosition > 0) {
                this.setTableScrollPosition(this.lastScrollPosition);
            }
            
            // Restore expanded rows from global state
            const globalState = this.getGlobalState();
            if (globalState.size > 0) {
                console.log(`Restoring ${globalState.size} globally stored expanded rows`);
                
                const rows = this.table.getRows();
                let restoredCount = 0;
                
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    
                    if (globalState.has(rowId)) {
                        if (!data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            restoredCount++;
                            
                            // Update the expander icon
                            setTimeout(() => {
                                const cellElement = row.getCells().find(cell => cell.getField() === "Matchup Team")?.getElement();
                                const expanderIcon = cellElement?.querySelector('.row-expander');
                                if (expanderIcon) {
                                    expanderIcon.innerHTML = "−";
                                }
                                
                                row.reformat();
                            }, 50);
                        }
                    }
                });
                
                console.log(`Successfully restored ${restoredCount} expanded rows`);
            }
            
        } finally {
            setTimeout(() => {
                this.isRestoringState = false;
            }, 500);
        }
    }

    saveTemporaryExpandedState() {
        this.temporaryExpandedRows.clear();
        if (this.table) {
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId(data);
                    this.temporaryExpandedRows.add(id);
                }
            });
        }
        console.log(`Temporarily saved ${this.temporaryExpandedRows.size} expanded rows for ${this.elementId}`);
    }

    restoreTemporaryExpandedState() {
        if (this.temporaryExpandedRows.size > 0 && this.table) {
            console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily expanded rows for ${this.elementId}`);
            
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId(data);
                    
                    if (this.temporaryExpandedRows.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }, 100);
        }
    }

    // FIXED: Tab manager integration methods (Issue #7)
    attachEventHandlers() {
        console.log('Attaching matchups table event handlers');
        
        // Save state when tab is hidden
        if (window.tabManager) {
            const originalSaveState = window.tabManager.saveTabState;
            if (originalSaveState) {
                window.tabManager.saveTabState = (tabId) => {
                    if (tabId === 'table0') {
                        // Matchups is typically table0
                        this.saveState();
                    }
                    if (typeof originalSaveState === 'function') {
                        originalSaveState.call(window.tabManager, tabId);
                    }
                };
            }
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.table) {
                this.table.redraw();
            }
        });
    }

    // Public methods for tab manager integration (Issue #7)
    onTabHidden() {
        console.log(`Matchups table hidden - saving state`);
        this.saveState();
    }
    
    onTabShown() {
        console.log(`Matchups table shown - restoring state`);
        setTimeout(() => {
            this.restoreState();
            if (this.table) {
                this.table.redraw();
            }
        }, 100);
    }
    
    // Override redraw to preserve state
    redraw(force) {
        this.saveState();
        if (this.table) {
            this.table.redraw(force);
        }
        setTimeout(() => this.restoreState(), 100);
    }

    // FIXED: State management methods matching other tables (Issue #7)
    getGlobalState() {
        if (!window.globalExpandedState) {
            window.globalExpandedState = new Map();
        }
        return window.globalExpandedState;
    }

    setGlobalState(state) {
        window.globalExpandedState = state;
    }

    // Cache management methods
    clearCache() {
        const cacheKey = `${this.endpoint}_data`;
        if (typeof dataCache !== 'undefined' && dataCache && dataCache.delete) {
            dataCache.delete(cacheKey);
        }
        
        // Clear all subtable caches
        this.parkFactorsCache.clear();
        this.pitcherStatsCache.clear();
        this.batterMatchupsCache.clear();
        this.bullpenMatchupsCache.clear();
    }

    async refreshData() {
        const cacheKey = `${this.endpoint}_data`;
        if (typeof dataCache !== 'undefined' && dataCache && dataCache.delete) {
            dataCache.delete(cacheKey);
        }
        
        // Clear all subtable caches
        this.clearCache();
        
        if (this.table) {
            this.table.setData();
        }
    }

    // Clean up method
    destroy() {
        if (this.table) {
            this.saveState();
            this.table.destroy();
            this.table = null;
        }
        this.dataLoaded = false;
        this.pendingRestoration = null;
        this.isRestoringState = false;
        
        // Clear all caches
        this.parkFactorsCache.clear();
        this.pitcherStatsCache.clear();
        this.batterMatchupsCache.clear();
        this.bullpenMatchupsCache.clear();
        this.expandedRowsCache.clear();
        this.expandedRowsSet.clear();
        this.expandedRowsMetadata.clear();
        this.temporaryExpandedRows.clear();
    }
}
