// tables/combinedMatchupsTable.js - COMPLETE FIXED VERSION WITH ALL METHODS
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
        this.expandedRows = new Set();
        this.lastScrollPosition = 0;
        this.temporaryExpandedRows = new Set();
        this.expandedRowsCache = new Map();
        this.isRestoringState = false;
        this.pendingRestoration = null;
        
        // Container configuration with proper sizing
        this.subtableConfig = {
            parkFactorsContainerWidth: 550,
            weatherContainerWidth: 550,
            containerGap: 20,
            maxTotalWidth: 1120,
            
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
        console.log('Initializing enhanced matchups table with fixes...');
        
        // FORCE CSS FIXES - Ensure alternating rows and scrollbar visibility
        if (!document.getElementById('force-table-fixes')) {
            const fixStyles = document.createElement('style');
            fixStyles.id = 'force-table-fixes';
            fixStyles.innerHTML = `
                /* Force alternating rows using nth-child */
                #matchups-table .tabulator-row:nth-child(even),
                #batter-table .tabulator-row:nth-child(even),
                #pitcher-table .tabulator-row:nth-child(even),
                #mod-batter-stats-table .tabulator-row:nth-child(even),
                #mod-pitcher-stats-table .tabulator-row:nth-child(even) {
                    background-color: #f5f5f5 !important;
                }
                
                #matchups-table .tabulator-row:nth-child(odd),
                #batter-table .tabulator-row:nth-child(odd),
                #pitcher-table .tabulator-row:nth-child(odd),
                #mod-batter-stats-table .tabulator-row:nth-child(odd),
                #mod-pitcher-stats-table .tabulator-row:nth-child(odd) {
                    background-color: white !important;
                }
                
                /* Force scrollbar visibility with fixed height */
                .tabulator .tabulator-tableHolder {
                    overflow-y: scroll !important;
                    height: 600px !important;
                    max-height: 600px !important;
                }
                
                /* Force scrollbar to be visible */
                .tabulator .tabulator-tableHolder::-webkit-scrollbar {
                    width: 14px !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
                    background: #e0e0e0 !important;
                    border-radius: 7px !important;
                    border: 1px solid #ccc !important;
                }
                
                .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
                    background: #888 !important;
                    border-radius: 7px !important;
                    border: 1px solid #666 !important;
                    min-height: 40px !important;
                }
                
                /* Remove any grey padding/margins */
                .table-wrapper,
                .table-container,
                .w-container {
                    padding: 0 !important;
                    background: transparent !important;
                }
                
                /* Fix subtable scaling */
                .subrow-container table,
                .subrow-container .tabulator {
                    transform: none !important;
                    font-size: 12px !important;
                }
                
                /* Ensure expanded row containers are transparent */
                .subrow-container {
                    background: transparent !important;
                    padding: 10px 20px !important;
                }
                
                /* Center all headers */
                #matchups-table .tabulator-header .tabulator-col-title {
                    text-align: center !important;
                }
                
                /* Style for expanded rows */
                .row-expanded {
                    background-color: #f0f8ff !important;
                }
            `;
            document.head.appendChild(fixStyles);
        }
        
        // Create and initialize the table using BaseTable's ajax loading
        const config = this.getTableConfig();
        this.table = new Tabulator(this.elementId, config);
        
        // Add click handler for row expansion
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                this.toggleRow(cell.getRow());
            }
        });
        
        console.log('Matchups table initialized - data will load automatically via ajax');
    }

    getTableConfig() {
        const baseConfig = super.getBaseConfig();  // FIXED: Use getBaseConfig() not getTableConfig()
        
        return {
            ...baseConfig,
            columns: this.getColumns(),
            rowFormatter: (row) => this.rowFormatter(row),
            dataLoaded: (data) => {
                console.log(`Data loaded for ${this.elementId}: ${data.length} rows`);
                this.data = data;
                this.matchupsData = data;  // Keep for backwards compatibility
                this.dataLoaded = true;
                this.attachEventHandlers();
                
                if (this.pendingStateRestore) {
                    this.restoreState();
                    this.pendingStateRestore = false;
                }
            },
            dataProcessing: () => {
                console.log(`Data processing for ${this.elementId}`);
                if (!this.isRestoringState && this.table) {
                    this.saveTemporaryExpandedState();
                }
            },
            dataProcessed: () => {
                console.log(`Data processed for ${this.elementId}`);
                if (this.pendingRestoration) {
                    this.executePendingRestoration();
                }
            },
            dataFiltered: () => {
                console.log(`Data filtered for ${this.elementId}`);
                if (!this.isRestoringState) {
                    this.restoreTemporaryExpandedState();
                }
            }
        };
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
                width: 180,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const data = row.getData();
                    const expanded = data._expanded || false;
                    
                    // Create the HTML directly
                    return `<div style="display: flex; align-items: center; cursor: pointer;">
                        <span class="row-expander" style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px;">
                            ${expanded ? '−' : '+'}
                        </span>
                        <span>${value || ''}</span>
                    </div>`;
                },
                headerSort: false
            },
            {
                title: "Game",
                field: "Matchup Game",
                width: 340,
                headerFilter: createCustomMultiSelect,
                headerSort: false
            },
            {
                title: "Spread",
                field: "Matchup Spread",
                width: 110,
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Total",
                field: "Matchup Total",
                width: 110,
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 250,
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

    rowFormatter(row) {
        const rowElement = row.getElement();
        const data = row.getData();
        
        // Just add a class for styling if needed
        if (data._expanded) {
            rowElement.classList.add('row-expanded');
        } else {
            rowElement.classList.remove('row-expanded');
        }
    }

    async toggleRow(row) {
        const rowElement = row.getElement();
        const data = row.getData();
        const isExpanded = data._expanded || false;
        
        if (!isExpanded) {
            // Expand row
            data._expanded = true;
            row.reformat();
            
            // Create subtable container
            const subrowContainer = document.createElement('div');
            subrowContainer.className = 'subrow-container';
            subrowContainer.style.display = 'block';
            
            // Fetch all required data if not cached
            if (!data._parkFactors || !data._pitcherStats || !data._batterMatchups || !data._bullpenMatchups) {
                const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                    this.fetchParkFactors(data["Matchup Game ID"]),
                    this.fetchPitcherStats(data["Matchup Game ID"]),
                    this.fetchBatterMatchups(data["Matchup Game ID"]),
                    this.fetchBullpenMatchups(data["Matchup Game ID"])
                ]);
                
                // Store fetched data
                data._parkFactors = parkFactors;
                data._pitcherStats = pitcherStats;
                data._batterMatchups = batterMatchups;
                data._bullpenMatchups = bullpenMatchups;
            }
            
            // Create subtable content
            this.createSubtableContent(subrowContainer, data);
            
            // Insert after current row
            rowElement.parentNode.insertBefore(subrowContainer, rowElement.nextSibling);
            rowElement.classList.add('row-expanded');
            
        } else {
            // Collapse row
            data._expanded = false;
            row.reformat();
            
            const existingSubrow = rowElement.nextSibling;
            if (existingSubrow && existingSubrow.classList.contains('subrow-container')) {
                existingSubrow.remove();
            }
            rowElement.classList.remove('row-expanded');
        }
        
        // Update expander icon
        const expander = rowElement.querySelector('.row-expander');
        if (expander) {
            expander.innerHTML = data._expanded ? '−' : '+';
        }
        
        // Normalize heights
        setTimeout(() => {
            row.normalizeHeight();
        }, 50);
    }

    createSubtableContent(container, data) {
        // Determine location for weather data
        const isAway = this.isTeamAway(data["Matchup Game"]);
        const opposingPitcherLocation = isAway ? "@" : "Home";
        
        // Create main container structure
        container.innerHTML = `
            <div style="display: flex; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 15px;">
                <div id="park-factors-container-${data["Matchup Game ID"]}" style="flex: 0 0 ${this.subtableConfig.parkFactorsContainerWidth}px;"></div>
                <div id="weather-container-${data["Matchup Game ID"]}" style="flex: 0 0 ${this.subtableConfig.weatherContainerWidth}px;"></div>
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
            this.createPitcherStatsTable(data, opposingPitcherLocation);
            this.createBatterMatchupsTable(data, opposingPitcherLocation);
            this.createBullpenMatchupsTable(data, opposingPitcherLocation);
        }, 10);
    }

    // FIXED: Correct API endpoint for pitcher stats
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

    // FIXED: Correct API endpoint for bullpen matchups
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
            return null;
        }
    }

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
                rowHeight: 28
            });
        }
    }

    createWeatherTable(data) {
        const containerId = `weather-container-${data["Matchup Game ID"]}`;
        const containerElement = document.getElementById(containerId);
        
        if (!containerElement) return;
        
        const weatherData = [
            { label: "Temperature", value: data["Temperature"] || "-" },
            { label: "Wind Speed", value: data["Wind Speed"] || "-" },
            { label: "Wind Direction", value: data["Wind Direction"] || "-" },
            { label: "Conditions", value: data["Weather Conditions"] || "-" },
            { label: "Ballpark", value: data["Matchup Ballpark"] || "-" }
        ];
        
        new Tabulator(`#${containerId}`, {
            layout: "fitData",
            data: weatherData,
            columns: [
                { title: "Weather", field: "label", width: 150, headerSort: false },
                { title: "Value", field: "value", width: 400, headerSort: false }
            ],
            height: false,
            headerHeight: 30,
            rowHeight: 28
        });
    }

    // FIXED: Create pitcher stats table with correct field mapping
    createPitcherStatsTable(data, opposingPitcherLocation) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const containerId = `pitcher-stats-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) {
                console.error(`Pitcher stats container not found: ${containerId}`);
                return;
            }
            
            // FIXED: Use correct field name from ModPitcherMatchups
            const nameField = data._pitcherStats[0]["Starter Name & Hand"] || 
                             data._pitcherStats[0]["Starter Name"] || 
                             "Unknown Pitcher";
            
            // Extract name and handedness if present
            let pitcherName = nameField;
            let handedness = "";
            const handMatch = nameField.match(/\s*\(([LR])\)\s*$/);
            if (handMatch) {
                pitcherName = nameField.replace(/\s*\([LR]\)\s*$/, "").trim();
                handedness = handMatch[1];
            }
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingPitcherLocation}`,
                "vs R @": `vs Righties ${opposingPitcherLocation}`,
                "vs L @": `vs Lefties ${opposingPitcherLocation}`
            };
            
            const sortedPitcherStats = data._pitcherStats.sort((a, b) => {
                return splitOrder.indexOf(a["Starter Split ID"]) - splitOrder.indexOf(b["Starter Split ID"]);
            });
            
            const fullSeasonData = sortedPitcherStats.find(s => s["Starter Split ID"] === "Full Season");
            
            if (fullSeasonData) {
                const tableData = [{
                    _id: `${data["Matchup Game ID"]}-main`,
                    _rowType: 'main',
                    _isExpanded: false,
                    name: pitcherName + (handedness ? ` (${handedness})` : ""),
                    split: "Full Season",
                    TBF: fullSeasonData["Starter TBF"],
                    "H/TBF": formatRatio(fullSeasonData["Starter H/TBF"], 3),
                    H: fullSeasonData["Starter H"],
                    "1B": fullSeasonData["Starter 1B"],
                    "2B": fullSeasonData["Starter 2B"],
                    "3B": fullSeasonData["Starter 3B"],
                    HR: fullSeasonData["Starter HR"],
                    R: fullSeasonData["Starter R"],
                    ERA: formatDecimal(fullSeasonData["Starter ERA"], 2),
                    BB: fullSeasonData["Starter BB"],
                    SO: fullSeasonData["Starter SO"]
                }];

                const pitcherTable = new Tabulator(`#${containerId}`, {
                    layout: "fitData",
                    data: tableData,
                    columns: [
                        {
                            title: "Name",
                            field: "name",
                            width: this.subtableConfig.statTableColumns.name,
                            headerSort: false,
                            formatter: function(cell) {
                                const value = cell.getValue();
                                const rowData = cell.getRow().getData();
                                
                                if (rowData._rowType === 'main') {
                                    return `<div style="cursor: pointer;">
                                        <span class="subtable-expander" style="margin-right: 8px; font-weight: bold; color: #007bff;">
                                            ${rowData._isExpanded ? '−' : '+'}
                                        </span>
                                        <span>${value}</span>
                                    </div>`;
                                }
                                return `<div style="padding-left: 28px;">${value}</div>`;
                            }
                        },
                        {
                            title: "Split",
                            field: "split",
                            width: this.subtableConfig.statTableColumns.split,
                            headerSort: false
                        },
                        {
                            title: "TBF",
                            field: "TBF",
                            width: this.subtableConfig.statTableColumns.tbf_pa,
                            headerSort: false
                        },
                        {
                            title: "H/TBF",
                            field: "H/TBF",
                            width: this.subtableConfig.statTableColumns.ratio,
                            headerSort: false
                        },
                        {
                            title: "H",
                            field: "H",
                            width: this.subtableConfig.statTableColumns.stat,
                            headerSort: false
                        },
                        {
                            title: "1B",
                            field: "1B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "2B",
                            field: "2B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "3B",
                            field: "3B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "HR",
                            field: "HR",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "R",
                            field: "R",
                            width: this.subtableConfig.statTableColumns.stat,
                            headerSort: false
                        },
                        {
                            title: "ERA",
                            field: "ERA",
                            width: this.subtableConfig.statTableColumns.era_rbi,
                            headerSort: false
                        },
                        {
                            title: "BB",
                            field: "BB",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "SO",
                            field: "SO",
                            width: this.subtableConfig.statTableColumns.so,
                            headerSort: false
                        }
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });

                // Add click handler for expanding/collapsing
                pitcherTable.on("cellClick", function(e, cell) {
                    const field = cell.getField();
                    const rowData = cell.getRow().getData();
                    
                    if (field === "name" && rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        cell.getRow().reformat();
                        
                        if (rowData._isExpanded) {
                            const allData = pitcherTable.getData();
                            const childRows = [];
                            
                            ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                const statData = sortedPitcherStats.find(s => s["Starter Split ID"] === splitId);
                                if (statData) {
                                    childRows.push({
                                        _id: `${data["Matchup Game ID"]}-child-${index}`,
                                        _rowType: 'child',
                                        _parentId: rowData._id,
                                        _sortOrder: index + 1,
                                        name: pitcherName,
                                        split: splitMap[splitId],
                                        TBF: statData["Starter TBF"],
                                        "H/TBF": formatRatio(statData["Starter H/TBF"], 3),
                                        H: statData["Starter H"],
                                        "1B": statData["Starter 1B"],
                                        "2B": statData["Starter 2B"],
                                        "3B": statData["Starter 3B"],
                                        HR: statData["Starter HR"],
                                        R: statData["Starter R"],
                                        ERA: formatDecimal(statData["Starter ERA"], 2),
                                        BB: statData["Starter BB"],
                                        SO: statData["Starter SO"]
                                    });
                                }
                            });
                            
                            const parentIndex = allData.findIndex(d => d._id === rowData._id);
                            allData.splice(parentIndex + 1, 0, ...childRows);
                            pitcherTable.replaceData(allData);
                        } else {
                            const filteredData = pitcherTable.getData().filter(d => 
                                !(d._rowType === 'child' && d._parentId === rowData._id)
                            );
                            pitcherTable.replaceData(filteredData);
                        }
                    }
                });
            }
        }
    }

    createBatterMatchupsTable(data, opposingPitcherLocation) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            const containerId = `batter-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) {
                console.error(`Batter matchups container not found: ${containerId}`);
                return;
            }
            
            // Group batter matchups by player
            const batterGroups = {};
            data._batterMatchups.forEach(batter => {
                const nameField = batter["Batter Name"] || "Unknown Batter";
                if (!batterGroups[nameField]) {
                    batterGroups[nameField] = {
                        name: nameField,
                        splits: []
                    };
                }
                batterGroups[nameField].splits.push(batter);
            });
            
            // Create table data
            const tableData = [];
            Object.keys(batterGroups).forEach((batterName, index) => {
                const batterData = batterGroups[batterName];
                const fullSeasonData = batterData.splits.find(s => s["Batter Split ID"] === "Full Season");
                
                if (fullSeasonData) {
                    tableData.push({
                        _id: `${data["Matchup Game ID"]}-batter-${index}`,
                        _rowType: 'main',
                        _isExpanded: false,
                        name: batterData.name,
                        split: "Full Season",
                        PA: fullSeasonData["Batter PA"],
                        "H/PA": formatRatio(fullSeasonData["Batter H/PA"], 3),
                        H: fullSeasonData["Batter H"],
                        "1B": fullSeasonData["Batter 1B"],
                        "2B": fullSeasonData["Batter 2B"],
                        "3B": fullSeasonData["Batter 3B"],
                        HR: fullSeasonData["Batter HR"],
                        R: fullSeasonData["Batter R"],
                        RBI: fullSeasonData["Batter RBI"],
                        BB: fullSeasonData["Batter BB"],
                        SO: fullSeasonData["Batter SO"]
                    });
                }
            });
            
            if (tableData.length > 0) {
                new Tabulator(`#${containerId}`, {
                    layout: "fitData",
                    data: tableData,
                    columns: [
                        {
                            title: "Name",
                            field: "name",
                            width: 200,
                            headerSort: false
                        },
                        {
                            title: "Split",
                            field: "split",
                            width: 160,
                            headerSort: false
                        },
                        {
                            title: "PA",
                            field: "PA",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "H/PA",
                            field: "H/PA",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "H",
                            field: "H",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "1B",
                            field: "1B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "2B",
                            field: "2B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "3B",
                            field: "3B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "HR",
                            field: "HR",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "R",
                            field: "R",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "RBI",
                            field: "RBI",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "BB",
                            field: "BB",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "SO",
                            field: "SO",
                            width: 60,
                            headerSort: false
                        }
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });
            }
        }
    }

    // FIXED: Create bullpen matchups table with correct field mapping
    createBullpenMatchupsTable(data, opposingPitcherLocation) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const containerId = `bullpen-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) {
                console.error(`Bullpen container not found: ${containerId}`);
                return;
            }
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingPitcherLocation}`,
                "vs R @": `vs Righties ${opposingPitcherLocation}`,
                "vs L @": `vs Lefties ${opposingPitcherLocation}`
            };
            
            const bullpenPitchers = {};
            
            data._bullpenMatchups.forEach(pitcher => {
                // FIXED: Use correct field name from ModBullpenMatchups
                const nameField = pitcher["Bullpen Hand & Number"] || 
                                 pitcher["Bullpen Name"] || 
                                 "Unknown Pitcher";
                
                if (!bullpenPitchers[nameField]) {
                    bullpenPitchers[nameField] = {
                        name: nameField,
                        splits: []
                    };
                }
                bullpenPitchers[nameField].splits.push(pitcher);
            });
            
            const tableData = [];
            Object.keys(bullpenPitchers).forEach((pitcherName, index) => {
                const pitcherData = bullpenPitchers[pitcherName];
                const fullSeasonData = pitcherData.splits.find(s => s["Bullpen Split ID"] === "Full Season");
                
                if (fullSeasonData) {
                    tableData.push({
                        _id: `${data["Matchup Game ID"]}-bullpen-${index}`,
                        _rowType: 'main',
                        _isExpanded: false,
                        _sortOrder: index,
                        name: pitcherData.name,
                        split: "Full Season",
                        TBF: fullSeasonData["Bullpen TBF"],
                        "H/TBF": formatRatio(fullSeasonData["Bullpen H/TBF"], 3),
                        H: fullSeasonData["Bullpen H"],
                        "1B": fullSeasonData["Bullpen 1B"],
                        "2B": fullSeasonData["Bullpen 2B"],
                        "3B": fullSeasonData["Bullpen 3B"],
                        HR: fullSeasonData["Bullpen HR"],
                        R: fullSeasonData["Bullpen R"],
                        ERA: formatDecimal(fullSeasonData["Bullpen ERA"], 2),
                        BB: fullSeasonData["Bullpen BB"],
                        SO: fullSeasonData["Bullpen SO"]
                    });
                }
            });

            if (tableData.length > 0) {
                const bullpenTable = new Tabulator(`#${containerId}`, {
                    layout: "fitData",
                    data: tableData,
                    columns: [
                        {
                            title: "Name",
                            field: "name",
                            width: 200,
                            headerSort: false,
                            formatter: function(cell) {
                                const value = cell.getValue();
                                const rowData = cell.getRow().getData();
                                
                                if (rowData._rowType === 'main') {
                                    return `<div style="cursor: pointer;">
                                        <span class="subtable-expander" style="margin-right: 8px; font-weight: bold; color: #007bff;">
                                            ${rowData._isExpanded ? '−' : '+'}
                                        </span>
                                        <span>${value}</span>
                                    </div>`;
                                }
                                return `<div style="padding-left: 28px;">${value}</div>`;
                            }
                        },
                        {
                            title: "Split",
                            field: "split",
                            width: 160,
                            headerSort: false
                        },
                        {
                            title: "TBF",
                            field: "TBF",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "H/TBF",
                            field: "H/TBF",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "H",
                            field: "H",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "1B",
                            field: "1B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "2B",
                            field: "2B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "3B",
                            field: "3B",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "HR",
                            field: "HR",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "R",
                            field: "R",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "ERA",
                            field: "ERA",
                            width: 60,
                            headerSort: false
                        },
                        {
                            title: "BB",
                            field: "BB",
                            width: 45,
                            headerSort: false
                        },
                        {
                            title: "SO",
                            field: "SO",
                            width: 60,
                            headerSort: false
                        }
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });

                // Add click handler for expanding/collapsing
                bullpenTable.on("cellClick", function(e, cell) {
                    const field = cell.getField();
                    const rowData = cell.getRow().getData();
                    
                    if (field === "name" && rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        cell.getRow().reformat();
                        
                        if (rowData._isExpanded) {
                            const allData = bullpenTable.getData();
                            const pitcherInfo = bullpenPitchers[rowData.name];
                            
                            if (pitcherInfo) {
                                const childRows = [];
                                splitOrder.slice(1).forEach((splitId, index) => {
                                    const statData = pitcherInfo.splits.find(s => s["Bullpen Split ID"] === splitId);
                                    if (statData) {
                                        childRows.push({
                                            _id: `${data["Matchup Game ID"]}-bullpen-child-${index}`,
                                            _rowType: 'child',
                                            _parentId: rowData._id,
                                            _sortOrder: rowData._sortOrder + (index + 1) * 0.1,
                                            name: pitcherInfo.name,
                                            split: splitMap[splitId],
                                            TBF: statData["Bullpen TBF"],
                                            "H/TBF": formatRatio(statData["Bullpen H/TBF"], 3),
                                            H: statData["Bullpen H"],
                                            "1B": statData["Bullpen 1B"],
                                            "2B": statData["Bullpen 2B"],
                                            "3B": statData["Bullpen 3B"],
                                            HR: statData["Bullpen HR"],
                                            R: statData["Bullpen R"],
                                            ERA: formatDecimal(statData["Bullpen ERA"], 2),
                                            BB: statData["Bullpen BB"],
                                            SO: statData["Bullpen SO"]
                                        });
                                    }
                                });
                                
                                const parentIndex = allData.findIndex(d => d._id === rowData._id);
                                allData.splice(parentIndex + 1, 0, ...childRows);
                                bullpenTable.replaceData(allData);
                            }
                        } else {
                            const filteredData = bullpenTable.getData().filter(d => 
                                !(d._rowType === 'child' && d._parentId === rowData._id)
                            );
                            bullpenTable.replaceData(filteredData);
                        }
                    }
                });
            }
        }
    }

    // Helper methods
    isTeamAway(gameString) {
        if (!gameString) return false;
        const parts = gameString.split(' ');
        return parts.length >= 3 && parts[1] === '@';
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

    // State management methods
    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        // Save scroll position
        this.lastScrollPosition = this.getTableScrollPosition();
        
        // Save expanded rows
        this.expandedRows.clear();
        const rows = this.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                this.expandedRows.add(id);
                this.expandedRowsCache.set(id, true);
            }
        });
        
        console.log(`State saved: ${this.expandedRows.size} expanded rows`);
    }

    restoreState() {
        if (!this.table) return;
        
        console.log(`Restoring state for ${this.elementId}`);
        
        // Restore scroll position
        if (this.lastScrollPosition) {
            this.setTableScrollPosition(this.lastScrollPosition);
        }
        
        // Restore expanded rows
        if (this.expandedRows.size > 0 || this.expandedRowsCache.size > 0) {
            const rowsToExpand = new Set([...this.expandedRows, ...this.expandedRowsCache.keys()]);
            console.log(`Restoring ${rowsToExpand.size} expanded rows`);
            
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                const id = this.generateRowId(data);
                
                if (rowsToExpand.has(id) && !data._expanded) {
                    data._expanded = true;
                    row.update(data);
                    row.reformat();
                }
            });
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
    }

    restoreTemporaryExpandedState() {
        if (this.temporaryExpandedRows.size > 0 && this.table) {
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

    executePendingRestoration() {
        if (this.pendingRestoration && this.table) {
            this.pendingRestoration();
            this.pendingRestoration = null;
        }
    }

    generateRowId(data) {
        // Generate unique ID for each row
        if (data["Matchup Game ID"]) {
            return `matchup_${data["Matchup Game ID"]}`;
        }
        return JSON.stringify(data);
    }

    attachEventHandlers() {
        // Add any additional event handlers specific to matchups table
        console.log('Matchups table event handlers attached');
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.table) {
                this.table.redraw();
            }
        });
    }

    // Override parent's redraw method to preserve state
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
        this.pendingStateRestore = false;
        this.isRestoringState = false;
        
        // Clear all caches
        this.parkFactorsCache.clear();
        this.pitcherStatsCache.clear();
        this.batterMatchupsCache.clear();
        this.bullpenMatchupsCache.clear();
        this.expandedRows.clear();
        this.temporaryExpandedRows.clear();
        this.expandedRowsCache.clear();
    }
}
