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
        
        // Create and initialize the table using BaseTable's ajax loading
        const config = this.getTableConfig();
        this.table = new Tabulator(this.elementId, config);
        
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
        
        return {
            ...baseConfig,
            columns: this.getColumns(),
            rowFormatter: (row) => this.rowFormatter(row),
            dataLoaded: (data) => {
                console.log(`Data loaded for ${this.elementId}: ${data.length} rows`);
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
                headerFilter: () => createCustomMultiSelect(),
                headerSort: false
            },
            {
                title: "Game",
                field: "Matchup Game",
                width: 250,
                headerFilter: () => createCustomMultiSelect(),
                headerSort: false
            },
            {
                title: "Spread",
                field: "Spread",
                width: 120,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const team = cell.getRow().getData()["Matchup Team"];
                    
                    if (!value || value === "-" || value === null) return "-";
                    
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
                headerSort: false
            },
            {
                title: "Lineup Status",
                field: "Lineup Status",
                width: 150,
                formatter: (cell) => {
                    const value = cell.getValue();
                    let bgColor = "#f8f9fa";
                    let textColor = "#333";
                    
                    if (value === "Confirmed") {
                        bgColor = "#d4edda";
                        textColor = "#155724";
                    } else if (value === "Probable") {
                        bgColor = "#fff3cd";
                        textColor = "#856404";
                    }
                    
                    return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${value || ""}</span>`;
                },
                headerFilter: () => createCustomMultiSelect(),
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
        
        // Handle expansion
        if (data._expanded) {
            try {
                // FIXED: Fetch all required data before creating subtables
                const matchupId = data["Matchup Game ID"];
                if (matchupId) {
                    await this.loadAllSubtableData(data);
                }
            } catch (error) {
                console.error('Error loading subtable data:', error);
            }
        }
        
        // Reformat the row
        setTimeout(() => {
            row.reformat();
        }, 10);
    }

    // FIXED: Load all subtable data at once
    async loadAllSubtableData(data) {
        const matchupId = data["Matchup Game ID"];
        if (!matchupId) return;
        
        try {
            // Fetch all data in parallel
            const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                this.fetchParkFactors(matchupId),
                this.fetchPitcherStats(matchupId),
                this.fetchBatterMatchups(matchupId),
                this.fetchBullpenMatchups(matchupId)
            ]);
            
            // FIXED: Attach data to row data object
            data._parkFactors = parkFactors || [];
            data._pitcherStats = pitcherStats || [];
            data._batterMatchups = batterMatchups || [];
            data._bullpenMatchups = bullpenMatchups || [];
            
            console.log(`Loaded subtable data for matchup ${matchupId}:`, {
                parkFactors: data._parkFactors.length,
                pitcherStats: data._pitcherStats.length,
                batterMatchups: data._batterMatchups.length,
                bullpenMatchups: data._bullpenMatchups.length
            });
            
        } catch (error) {
            console.error('Error loading all subtable data:', error);
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

    // FIXED: Create park factors table (Issue #1 - Missing ModParkFactors data)
    createParkFactorsTable(data) {
        if (data._parkFactors && data._parkFactors.length > 0) {
            const containerId = `park-factors-container-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            const columns = [
                { title: "Split", field: "split", width: this.subtableConfig.parkFactorsColumns.split, headerSort: false },
                { title: "H", field: "H", width: this.subtableConfig.parkFactorsColumns.H, headerSort: false },
                { title: "1B", field: "1B", width: this.subtableConfig.parkFactorsColumns["1B"], headerSort: false },
                { title: "2B", field: "2B", width: this.subtableConfig.parkFactorsColumns["2B"], headerSort: false },
                { title: "3B", field: "3B", width: this.subtableConfig.parkFactorsColumns["3B"], headerSort: false },
                { title: "HR", field: "HR", width: this.subtableConfig.parkFactorsColumns.HR, headerSort: false },
                { title: "R", field: "R", width: this.subtableConfig.parkFactorsColumns.R, headerSort: false },
                { title: "BB", field: "BB", width: this.subtableConfig.parkFactorsColumns.BB, headerSort: false },
                { title: "SO", field: "SO", width: this.subtableConfig.parkFactorsColumns.SO, headerSort: false }
            ];
            
            new Tabulator(`#${containerId}`, {
                layout: "fitData",
                data: data._parkFactors.map(pf => ({
                    split: pf["Park Factor Split"] || "Park",
                    H: pf["Park Factor H"],
                    "1B": pf["Park Factor 1B"],
                    "2B": pf["Park Factor 2B"],
                    "3B": pf["Park Factor 3B"],
                    HR: pf["Park Factor HR"],
                    R: pf["Park Factor R"],
                    BB: pf["Park Factor BB"],
                    SO: pf["Park Factor SO"]
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

    // FIXED: Create weather table with proper formatting (Issue #2 - Weather table formatting)
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
            data: weatherData,
            columns: [
                { title: "Time", field: "time", width: 120, headerSort: false },
                { title: "Conditions", field: "conditions", width: 400, headerSort: false }
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

    // FIXED: Create pitcher stats table with consistent formatting
    createPitcherStatsTable(data) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const containerId = `pitcher-stats-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Pitcher Stats</h4><div id="pitcher-stats-table-' + data["Matchup Game ID"] + '"></div>';
            
            const columns = [
                { title: "Name", field: "name", width: this.subtableConfig.statTableColumns.name, headerSort: false },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false },
                { title: "TBF", field: "tbf", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false },
                { title: "H/TBF", field: "h_tbf", width: this.subtableConfig.statTableColumns.ratio, headerSort: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false },
                { title: "ERA", field: "era", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false }
            ];
            
            new Tabulator(`#pitcher-stats-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                data: data._pitcherStats.map(ps => ({
                    name: ps["Pitcher Name"] || "Unknown",
                    split: ps["Pitcher Split"] || "Full Season",
                    tbf: ps["TBF"] || 0,
                    h_tbf: ps["H/TBF"] || "0.000",
                    h: ps["H"] || 0,
                    era: ps["ERA"] || "0.00",
                    so: ps["SO"] || 0,
                    bb: ps["BB"] || 0,
                    r: ps["R"] || 0
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

    // FIXED: Create batter matchups table (Issue #4 - ModBatterMatchups data)
    createBatterMatchupsTable(data) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            const containerId = `batter-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Batter Matchups</h4><div id="batter-matchups-table-' + data["Matchup Game ID"] + '"></div>';
            
            const columns = [
                { title: "Name", field: "name", width: this.subtableConfig.statTableColumns.name, headerSort: false },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false },
                { title: "PA", field: "pa", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false },
                { title: "H/PA", field: "h_pa", width: this.subtableConfig.statTableColumns.ratio, headerSort: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false },
                { title: "RBI", field: "rbi", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false }
            ];
            
            new Tabulator(`#batter-matchups-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                data: data._batterMatchups.map(bm => ({
                    name: bm["Batter Name"] || "Unknown",
                    split: bm["Batter Split"] || "Full Season",
                    pa: bm["PA"] || 0,
                    h_pa: bm["H/PA"] || "0.000",
                    h: bm["H"] || 0,
                    rbi: bm["RBI"] || 0,
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

    // FIXED: Create bullpen matchups table with consistent formatting
    createBullpenMatchupsTable(data) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const containerId = `bullpen-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) return;
            
            // Add header
            containerElement.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Bullpen Matchups</h4><div id="bullpen-matchups-table-' + data["Matchup Game ID"] + '"></div>';
            
            const columns = [
                { title: "Name", field: "name", width: this.subtableConfig.statTableColumns.name, headerSort: false },
                { title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false },
                { title: "TBF", field: "tbf", width: this.subtableConfig.statTableColumns.tbf_pa, headerSort: false },
                { title: "H/TBF", field: "h_tbf", width: this.subtableConfig.statTableColumns.ratio, headerSort: false },
                { title: "H", field: "h", width: this.subtableConfig.statTableColumns.stat, headerSort: false },
                { title: "ERA", field: "era", width: this.subtableConfig.statTableColumns.era_rbi, headerSort: false },
                { title: "SO", field: "so", width: this.subtableConfig.statTableColumns.so, headerSort: false },
                { title: "BB", field: "bb", width: this.subtableConfig.statTableColumns.h_pa, headerSort: false },
                { title: "R", field: "r", width: this.subtableConfig.statTableColumns.pa, headerSort: false }
            ];
            
            new Tabulator(`#bullpen-matchups-table-${data["Matchup Game ID"]}`, {
                layout: "fitData",
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

    // API fetch methods with proper error handling
    async fetchParkFactors(matchupId) {
        if (this.parkFactorsCache.has(matchupId)) {
            return this.parkFactorsCache.get(matchupId);
        }

        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}ModParkFactors?Game ID=eq.${matchupId}`,
                { method: 'GET', headers: API_CONFIG.headers }
            );
            
            if (!response.ok) throw new Error('Failed to fetch park factors');
            
            const parkFactors = await response.json();
            this.parkFactorsCache.set(matchupId, parkFactors);
            return parkFactors;
        } catch (error) {
            console.error('Error fetching park factors:', error);
            return [];
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
            return [];
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
            return [];
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
            return [];
        }
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
            if (this.lastScrollPosition) {
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
                    if (tabId === 'table0') {  // Matchups is typically table0
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
