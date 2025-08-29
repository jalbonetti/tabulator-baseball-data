// tables/combinedMatchupsTable.js - COMPLETE FIXED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { formatRatio, formatDecimal } from '../shared/utils.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.parkFactorsCache = new Map();
        this.pitcherStatsCache = new Map();
        this.batterMatchupsCache = new Map();
        this.bullpenMatchupsCache = new Map();
        
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
        console.log('Initializing enhanced matchups table...');
        
        // Add loading indicator
        const element = document.querySelector(this.elementId);
        if (element && !element.querySelector('.loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);';
            loadingDiv.innerHTML = `
                <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>Loading matchups data...</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Please wait while data loads...</div>
            `;
            element.appendChild(loadingDiv);
            
            // Add spinner animation if not already present
            if (!document.querySelector('#matchups-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'matchups-spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* FIXED: Add visible scrollbars for main table */
                    #matchups-table .tabulator-tableHolder {
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        scrollbar-width: thin !important;
                        -ms-overflow-style: auto !important;
                    }
                    
                    #matchups-table .tabulator-tableHolder::-webkit-scrollbar {
                        width: 8px !important;
                        display: block !important;
                    }
                    
                    #matchups-table .tabulator-tableHolder::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 4px !important;
                    }
                    
                    #matchups-table .tabulator-tableHolder::-webkit-scrollbar-thumb {
                        background: #888 !important;
                        border-radius: 4px !important;
                    }
                    
                    #matchups-table .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
                        background: #555 !important;
                    }
                    
                    /* FIXED: Remove grey background overflow from subtables */
                    .subrow-container {
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            width: "1200px",
            maxWidth: "1200px",
            height: "600px",
            layout: "fitData",
            placeholder: "Loading matchups data...",
            headerVisible: true,
            headerHozAlign: "center",
            renderVertical: "basic",
            renderHorizontal: "basic",
            layoutColumnsOnNewData: false,
            virtualDom: true,
            virtualDomBuffer: 200,
            initialSort: [
                {column: "Matchup Team", dir: "asc"},
                {column: "Matchup Game", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            ajaxRequestFunc: this.customAjaxRequest.bind(this),
            ajaxURL: `${API_CONFIG.baseURL}${this.endpoint}`,
            ajaxConfig: {
                method: "GET",
                headers: API_CONFIG.headers
            },
            ajaxResponse: async (url, params, response) => {
                try {
                    console.log('Processing matchups data...');
                    const data = await response.json();
                    this.matchupsData = data;
                    
                    console.log(`Fetching additional data for ${data.length} matchups...`);
                    await this.fetchAllAdditionalData(data);
                    
                    // Remove loading indicator
                    const loadingDiv = document.querySelector(`${this.elementId} .loading-indicator`);
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                    
                    console.log('All matchups data loaded successfully');
                    return data;
                } catch (error) {
                    console.error('Error processing matchups data:', error);
                    
                    // Remove loading indicator on error
                    const loadingDiv = document.querySelector(`${this.elementId} .loading-indicator`);
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                    
                    throw error;
                }
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
            
            const tableElement = document.querySelector(this.elementId);
            if (tableElement) {
                tableElement.style.overflow = "hidden";
                tableElement.style.maxWidth = "1200px";
                
                const tableHolder = tableElement.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    // FIXED: Enable scrolling with visible scrollbar
                    tableHolder.style.overflowY = "auto";
                    tableHolder.style.overflowX = "hidden";
                    tableHolder.style.maxWidth = "100%";
                }
            }
        });
    }

    async fetchAllAdditionalData(data) {
        const fetchPromises = data.map(async (row) => {
            const matchupId = row["Matchup Game ID"];
            
            try {
                const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                    this.fetchParkFactors(matchupId),
                    this.fetchPitcherStats(matchupId),
                    this.fetchBatterMatchups(matchupId),
                    this.fetchBullpenMatchups(matchupId)
                ]);
                
                row._parkFactors = parkFactors;
                row._pitcherStats = pitcherStats;
                row._batterMatchups = batterMatchups;
                row._bullpenMatchups = bullpenMatchups;
            } catch (error) {
                console.error(`Error fetching data for matchup ${matchupId}:`, error);
                row._parkFactors = null;
                row._pitcherStats = null;
                row._batterMatchups = null;
                row._bullpenMatchups = null;
            }
        });
        
        await Promise.all(fetchPromises);
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

    getColumns() {
        return [
            {
                title: "ID",
                field: "Matchup Game ID",
                visible: false,
                sorter: "number",
                resizable: false
            },
            {
                title: "Team", 
                field: "Matchup Team",
                width: 340,
                headerFilter: true,
                headerFilterPlaceholder: "Search teams...",
                sorter: "string",
                resizable: false,
                formatter: (cell, formatterParams, onRendered) => {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const expanded = row.getData()._expanded || false;
                    
                    const teamName = value;
                    
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
                width: 340,
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                resizable: false
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 110,
                hozAlign: "center",
                headerSort: false,
                resizable: false
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 110,
                hozAlign: "center",
                headerSort: false,
                resizable: false
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 250,
                hozAlign: "center",
                headerFilter: createCustomMultiSelect,
                headerSort: false,
                resizable: false,
                formatter: (cell) => {
                    const value = cell.getValue();
                    if (!value) return "";
                    
                    const color = value.toLowerCase().includes('confirmed') ? '#28a745' : '#6c757d';
                    return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${value}</span>`;
                }
            }
        ];
    }

    createRowFormatter() {
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            rowElement.style.maxWidth = "100%";
            rowElement.style.overflow = "hidden";
            
            if (data._expanded && !rowElement.querySelector('.subrow-container')) {
                const holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                // FIXED: Removed grey background and reduced padding
                holderEl.style.padding = "0";
                holderEl.style.background = "transparent";
                holderEl.style.maxWidth = "100%";
                holderEl.style.overflow = "hidden";
                
                const subtableEl = document.createElement("div");
                subtableEl.style.maxWidth = "100%";
                subtableEl.style.overflow = "hidden";
                subtableEl.style.padding = "10px";
                subtableEl.style.background = "#ffffff";
                holderEl.appendChild(subtableEl);
                rowElement.appendChild(holderEl);
                
                this.createMatchupsSubtable(subtableEl, data);
            } else if (!data._expanded) {
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        };
    }

    createMatchupsSubtable(container, data) {
        const weatherData = [
            data["Matchup Weather 1"] || "No weather data",
            data["Matchup Weather 2"] || "",
            data["Matchup Weather 3"] || "",
            data["Matchup Weather 4"] || ""
        ].filter(d => d);

        const isTeamAway = this.isTeamAway(data["Matchup Game"]);
        const opposingPitcherLocation = isTeamAway ? "at Home" : "Away";
        
        let ballparkName = data["Matchup Ballpark"] || "Unknown Ballpark";
        let hasRetractableRoof = false;
        
        if (ballparkName.includes("(Retractable Roof)")) {
            hasRetractableRoof = true;
            ballparkName = ballparkName.replace("(Retractable Roof)", "").trim();
        }
        
        const weatherTitle = hasRetractableRoof ? "Weather (Retractable Roof)" : "Weather";
        const totalWidth = this.subtableConfig.maxTotalWidth;

        // FIXED: Ensure weather section is always displayed properly
        let tableHTML = `
            <div style="display: flex; justify-content: center; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 20px; width: ${totalWidth}px; max-width: 100%; margin-left: auto; margin-right: auto; clear: both;">
                <!-- Park Factors Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.parkFactorsContainerWidth}px; min-width: ${this.subtableConfig.parkFactorsContainerWidth}px; max-width: ${this.subtableConfig.parkFactorsContainerWidth}px; flex: 0 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${ballparkName} Park Factors</h5>
                    <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>

                <!-- Weather Section - FIXED visibility -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.weatherContainerWidth}px; min-width: ${this.subtableConfig.weatherContainerWidth}px; max-width: ${this.subtableConfig.weatherContainerWidth}px; flex: 0 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; display: block;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${weatherTitle}</h5>
                    <div style="font-size: 12px; color: #333; display: block;">
                        ${weatherData.map(w => `<div style="padding: 8px 12px; border-bottom: 1px solid #eee; word-wrap: break-word;">${w}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;

        if (data._pitcherStats && data._pitcherStats.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Starting Pitcher</h4>
                    <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._batterMatchups && data._batterMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Starting Lineup</h4>
                    <div id="batter-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden; margin-left: auto; margin-right: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Bullpen</h4>
                    <div id="bullpen-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        setTimeout(() => {
            this.createParkFactorsTable(data);
            this.createPitcherStatsTable(data, opposingPitcherLocation);
            this.createBatterMatchupsTable(data);
            this.createBullpenMatchupsTable(data, opposingPitcherLocation);
        }, 50);
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

            const columns = [
                {title: "Split", field: "split", width: this.subtableConfig.parkFactorsColumns.split, headerSort: false, hozAlign: "center"},
                {title: "H", field: "H", width: this.subtableConfig.parkFactorsColumns.H, hozAlign: "center", headerSort: false},
                {title: "1B", field: "1B", width: this.subtableConfig.parkFactorsColumns["1B"], hozAlign: "center", headerSort: false},
                {title: "2B", field: "2B", width: this.subtableConfig.parkFactorsColumns["2B"], hozAlign: "center", headerSort: false},
                {title: "3B", field: "3B", width: this.subtableConfig.parkFactorsColumns["3B"], hozAlign: "center", headerSort: false},
                {title: "HR", field: "HR", width: this.subtableConfig.parkFactorsColumns.HR, hozAlign: "center", headerSort: false},
                {title: "R", field: "R", width: this.subtableConfig.parkFactorsColumns.R, hozAlign: "center", headerSort: false},
                {title: "BB", field: "BB", width: this.subtableConfig.parkFactorsColumns.BB, hozAlign: "center", headerSort: false},
                {title: "SO", field: "SO", width: this.subtableConfig.parkFactorsColumns.SO, hozAlign: "center", headerSort: false}
            ];

            new Tabulator(`#park-factors-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitColumns",
                width: "100%",
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
                columns: columns,
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });
        }
    }

    createPitcherStatsTable(data, opposingPitcherLocation) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const containerId = `pitcher-stats-subtable-${data["Matchup Game ID"]}`;
            const pitcherName = data._pitcherStats[0]["Starter Name"];
            
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
                    name: pitcherName,
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
                                        <span class="subtable-expander" style="margin-right: 8px; font-weight: bold; color: #007bff;">${rowData._isExpanded ? '−' : '+'}</span>
                                        <span>${value}</span>
                                    </div>`;
                                }
                                return `<div style="margin-left: 30px;">${value}</div>`;
                            }
                        },
                        {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                        {title: "TBF", field: "TBF", width: this.subtableConfig.statTableColumns.tbf_pa, hozAlign: "center", headerSort: false},
                        {title: "H/TBF", field: "H/TBF", width: this.subtableConfig.statTableColumns.ratio, hozAlign: "center", headerSort: false},
                        {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "ERA", field: "ERA", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                        {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                        {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
                    ],
                    height: false,
                    headerHeight: 30,
                    rowHeight: 28
                });

                pitcherTable.on("cellClick", function(e, cell) {
                    if (cell.getField() === "name") {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const row = cell.getRow();
                        const rowData = row.getData();
                        
                        if (rowData._rowType === 'main') {
                            rowData._isExpanded = !rowData._isExpanded;
                            row.update(rowData);
                            
                            const cellElement = cell.getElement();
                            const expander = cellElement.querySelector('.subtable-expander');
                            if (expander) {
                                expander.innerHTML = rowData._isExpanded ? '−' : '+';
                            }
                            
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
                    }
                });
            }
        }
    }

    createBatterMatchupsTable(data) {
        if (data._batterMatchups && data._batterMatchups.length > 0) {
            const containerId = `batter-matchups-subtable-${data["Matchup Game ID"]}`;
            const containerElement = document.getElementById(containerId);
            
            if (!containerElement) {
                console.error(`Container element not found: ${containerId}`);
                return;
            }
            
            const isTeamAway = this.isTeamAway(data["Matchup Game"]);
            const batterLocationText = isTeamAway ? "Away" : "at Home";
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${batterLocationText}`,
                "vs R @": `vs Righties ${batterLocationText}`,
                "vs L @": `vs Lefties ${batterLocationText}`
            };
            
            const battersByOrder = {};
            data._batterMatchups.forEach(batter => {
                const nameHandSpot = batter["Batter Name & Hand & Spot"];
                const match = nameHandSpot.match(/(.+?)\s+(\d+)$/);
                if (match) {
                    const batterName = match[1];
                    const battingOrder = parseInt(match[2]);
                    
                    if (!battersByOrder[battingOrder]) {
                        battersByOrder[battingOrder] = {
                            name: batterName,
                            order: battingOrder,
                            splits: []
                        };
                    }
                    battersByOrder[battingOrder].splits.push(batter);
                }
            });
            
            const tableData = [];
            Object.keys(battersByOrder)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach((order, orderIndex) => {
                    const batterData = battersByOrder[order];
                    const fullSeasonData = batterData.splits.find(s => s["Batter Split ID"] === "Full Season");
                    
                    if (fullSeasonData) {
                        tableData.push({
                            _id: `${data["Matchup Game ID"]}-batter-${order}`,
                            _rowType: 'main',
                            _isExpanded: false,
                            _sortOrder: orderIndex,
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

            const batterTable = new Tabulator(`#${containerId}`, {
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
                                    <span class="subtable-expander" style="margin-right: 8px; font-weight: bold; color: #007bff;">${rowData._isExpanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                    {title: "PA", field: "PA", width: this.subtableConfig.statTableColumns.pa, hozAlign: "center", headerSort: false},
                    {title: "H/PA", field: "H/PA", width: this.subtableConfig.statTableColumns.h_pa, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "RBI", field: "RBI", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });

            batterTable.on("cellClick", function(e, cell) {
                if (cell.getField() === "name") {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = cell.getRow();
                    const rowData = row.getData();
                    
                    if (rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        row.update(rowData);
                        
                        const cellElement = cell.getElement();
                        const expander = cellElement.querySelector('.subtable-expander');
                        if (expander) {
                            expander.innerHTML = rowData._isExpanded ? '−' : '+';
                        }
                        
                        if (rowData._isExpanded) {
                            const allData = batterTable.getData();
                            const batterInfo = battersByOrder[Object.keys(battersByOrder).find(o => 
                                battersByOrder[o].name === rowData.name
                            )];
                            
                            if (batterInfo) {
                                const childRows = [];
                                splitOrder.slice(1).forEach((splitId, index) => {
                                    const statData = batterInfo.splits.find(s => s["Batter Split ID"] === splitId);
                                    if (statData) {
                                        childRows.push({
                                            _id: `${data["Matchup Game ID"]}-batter-child-${index}`,
                                            _rowType: 'child',
                                            _parentId: rowData._id,
                                            _sortOrder: rowData._sortOrder + (index + 1) * 0.1,
                                            name: batterInfo.name,
                                            split: splitMap[splitId],
                                            PA: statData["Batter PA"],
                                            "H/PA": formatRatio(statData["Batter H/PA"], 3),
                                            H: statData["Batter H"],
                                            "1B": statData["Batter 1B"],
                                            "2B": statData["Batter 2B"],
                                            "3B": statData["Batter 3B"],
                                            HR: statData["Batter HR"],
                                            R: statData["Batter R"],
                                            RBI: statData["Batter RBI"],
                                            BB: statData["Batter BB"],
                                            SO: statData["Batter SO"]
                                        });
                                    }
                                });
                                
                                const parentIndex = allData.findIndex(d => d._id === rowData._id);
                                allData.splice(parentIndex + 1, 0, ...childRows);
                                
                                batterTable.replaceData(allData);
                            }
                        } else {
                            const filteredData = batterTable.getData().filter(d => 
                                !(d._rowType === 'child' && d._parentId === rowData._id)
                            );
                            batterTable.replaceData(filteredData);
                        }
                    }
                }
            });
        }
    }

    createBullpenMatchupsTable(data, opposingPitcherLocation) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const containerId = `bullpen-matchups-subtable-${data["Matchup Game ID"]}`;
            
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
                const pitcherName = pitcher["Bullpen Name"];
                
                if (!bullpenPitchers[pitcherName]) {
                    bullpenPitchers[pitcherName] = {
                        name: pitcherName,
                        splits: []
                    };
                }
                bullpenPitchers[pitcherName].splits.push(pitcher);
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

            const bullpenTable = new Tabulator(`#${containerId}`, {
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
                                    <span class="subtable-expander" style="margin-right: 8px; font-weight: bold; color: #007bff;">${rowData._isExpanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                    {title: "TBF", field: "TBF", width: this.subtableConfig.statTableColumns.tbf_pa, hozAlign: "center", headerSort: false},
                    {title: "H/TBF", field: "H/TBF", width: this.subtableConfig.statTableColumns.ratio, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "ERA", field: "ERA", width: this.subtableConfig.statTableColumns.era_rbi, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: this.subtableConfig.statTableColumns.stat, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: this.subtableConfig.statTableColumns.so, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });

            bullpenTable.on("cellClick", function(e, cell) {
                if (cell.getField() === "name") {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = cell.getRow();
                    const rowData = row.getData();
                    
                    if (rowData._rowType === 'main') {
                        rowData._isExpanded = !rowData._isExpanded;
                        row.update(rowData);
                        
                        const cellElement = cell.getElement();
                        const expander = cellElement.querySelector('.subtable-expander');
                        if (expander) {
                            expander.innerHTML = rowData._isExpanded ? '−' : '+';
                        }
                        
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
                }
            });
        }
    }

    // Override destroy method to properly clean up
    destroy() {
        // Remove any loading indicators
        const element = document.querySelector(this.elementId);
        if (element) {
            const loadingDiv = element.querySelector('.loading-indicator');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
        
        // Call parent destroy
        super.destroy();
    }

    // Not used for matchups table but required by parent class
    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }
}
