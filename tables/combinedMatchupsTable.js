// tables/combinedMatchupsTable.js - COMPLETE FIXED VERSION WITH WIDTH AND OVERFLOW CORRECTIONS
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
        this.expandedRows = new Set();
        
        // FIXED CONFIGURATION - Properly sized to prevent overflow
        this.subtableConfig = {
            // Main container configuration - total should be less than 1200px
            parkFactorsContainerWidth: 550,  // Reduced to prevent overflow
            weatherContainerWidth: 550,      // Reduced to prevent overflow
            containerGap: 20,                 // Gap between containers
            maxTotalWidth: 1120,             // Max width for subtable content (1200px - padding)
            
            // Park Factors table - exact column widths that sum correctly
            parkFactorsColumns: {
                split: 90,     // "Split" column
                H: 50,         // "H" column
                "1B": 50,      // "1B" column
                "2B": 50,      // "2B" column
                "3B": 50,      // "3B" column
                HR: 50,        // "HR" column
                R: 50,         // "R" column
                BB: 50,        // "BB" column
                SO: 50         // "SO" column
            },
            // Total park factors columns: 490px (fits within 550px container)
            
            // Weather configuration
            weatherAsTable: false,
            
            // Standardized column widths for stat tables
            statTableColumns: {
                name: 200,      // Name column
                split: 140,     // Split column
                tbf_pa: 60,     // TBF/PA column
                ratio: 70,      // H/TBF, H/PA column
                stat: 50,       // H, 1B, 2B, 3B, HR, R, BB column
                era_rbi: 60,    // ERA/RBI column
                so: 60          // SO column
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
                width: 340,  // Slightly reduced
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
                width: 340,  // Slightly reduced
                headerFilter: createCustomMultiSelect,
                headerSort: false
            },
            {
                title: "Spread", 
                field: "Matchup Spread",
                width: 110,  // Slightly reduced
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Total", 
                field: "Matchup Total",
                width: 110,  // Slightly reduced
                hozAlign: "center",
                headerSort: false
            },
            {
                title: "Lineup Status",
                field: "Matchup Lineup Status",
                width: 250,  // Slightly reduced
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
        
        // Use the configured max width
        const totalWidth = this.subtableConfig.maxTotalWidth;

        // Create the two-column layout with fixed widths
        let tableHTML = `
            <div style="display: flex; justify-content: flex-start; gap: ${this.subtableConfig.containerGap}px; margin-bottom: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden;">
                <!-- Park Factors Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.parkFactorsContainerWidth}px; flex-shrink: 0;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${ballparkName} Park Factors</h5>
                    <div id="park-factors-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>

                <!-- Weather Section -->
                <div style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 10px; width: ${this.subtableConfig.weatherContainerWidth}px; flex-shrink: 0;">
                    <h5 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Weather</h5>
                    <div style="font-size: 12px; color: #333; text-align: center;">
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">${weatherData[0]}</div>
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">${weatherData[1]}</div>
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">${weatherData[2]}</div>
                        <div style="padding: 8px 0;">${weatherData[3]}</div>
                    </div>
                </div>
            </div>
        `;

        // Add sections for the other data with controlled widths
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Starting Pitcher</h4>
                    <div id="pitcher-stats-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._batterMatchups && data._batterMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Starting Lineup</h4>
                    <div id="batter-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; width: ${totalWidth}px; max-width: 100%; overflow: hidden;">
                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">Opposing Bullpen</h4>
                    <div id="bullpen-matchups-subtable-${data["Matchup Game ID"]}" style="width: 100%; overflow: hidden;"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        // Create subtables with proper configurations
        setTimeout(() => {
            this.createParkFactorsTable(data);
            if (this.subtableConfig.weatherAsTable) {
                this.createWeatherTable(data, weatherData);
            }
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

            // Calculate total width needed
            const totalColumnsWidth = Object.values(this.subtableConfig.parkFactorsColumns)
                .reduce((sum, width) => sum + width, 0);

            const columns = [
                {
                    title: "Split", 
                    field: "split", 
                    width: this.subtableConfig.parkFactorsColumns.split, 
                    headerSort: false, 
                    hozAlign: "center"
                },
                {
                    title: "H", 
                    field: "H", 
                    width: this.subtableConfig.parkFactorsColumns.H, 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "1B", 
                    field: "1B", 
                    width: this.subtableConfig.parkFactorsColumns["1B"], 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "2B", 
                    field: "2B", 
                    width: this.subtableConfig.parkFactorsColumns["2B"], 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "3B", 
                    field: "3B", 
                    width: this.subtableConfig.parkFactorsColumns["3B"], 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "HR", 
                    field: "HR", 
                    width: this.subtableConfig.parkFactorsColumns.HR, 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "R", 
                    field: "R", 
                    width: this.subtableConfig.parkFactorsColumns.R, 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "BB", 
                    field: "BB", 
                    width: this.subtableConfig.parkFactorsColumns.BB, 
                    hozAlign: "center", 
                    headerSort: false
                },
                {
                    title: "SO", 
                    field: "SO", 
                    width: this.subtableConfig.parkFactorsColumns.SO, 
                    hozAlign: "center", 
                    headerSort: false
                }
            ];

            new Tabulator(`#park-factors-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitDataFixed",  // Changed to prevent column stretching
                width: totalColumnsWidth,  // Set exact width
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
                rowHeight: 26,
                resizableColumns: false
            });
        }
    }

    createWeatherTable(data, weatherData) {
        // Only create if weatherAsTable is true (currently false)
        if (this.subtableConfig.weatherAsTable) {
            new Tabulator(`#weather-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitData",
                data: weatherData.map((weather, index) => ({
                    description: weather
                })),
                columns: [
                    {
                        title: "Weather Description", 
                        field: "description", 
                        width: this.subtableConfig.weatherColumns.description, 
                        headerSort: false
                    }
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 30,
                resizableColumns: false
            });
        }
    }

    createPitcherStatsTable(data, opposingLocationText) {
        if (data._pitcherStats && data._pitcherStats.length > 0) {
            const pitcherName = data._pitcherStats[0]["Starter Name & Hand"] || "Unknown Pitcher";
            
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingLocationText}`,
                "vs R @": `vs Righties ${opposingLocationText}`,
                "vs L @": `vs Lefties ${opposingLocationText}`
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
                    _sortOrder: 0,
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
                    layout: "fitDataFixed",  // Changed to prevent stretching
                    data: tableData,
                    columns: [
                        {
                            title: "Name", 
                            field: "name", 
                            width: this.subtableConfig.statTableColumns.name, 
                            headerSort: false,
                            formatter: function(cell) {
                                const rowData = cell.getRow().getData();
                                const value = cell.getValue();
                                
                                if (rowData._rowType === 'main') {
                                    const expanded = rowData._isExpanded || false;
                                    return `<div style="cursor: pointer; display: flex; align-items: center;">
                                        <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
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

                // Add click handler for expansion
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
            
            // Group batters by batting order
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
            
            // Create table data with main rows (Full Season) for each batter
            const tableData = [];
            Object.keys(battersByOrder)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach((order, orderIndex) => {
                    const batterData = battersByOrder[order];
                    const fullSeasonData = batterData.splits.find(s => s["Batter Split ID"] === "Full Season");
                    
                    if (fullSeasonData) {
                        tableData.push({
                            _id: `${data["Matchup Game ID"]}-batter-${order}`,
                            _isExpanded: false,
                            _rowType: 'main',
                            _batterOrder: order,
                            _sortOrder: orderIndex * 10,
                            name: `${batterData.name} ${order}`,
                            split: "Full Season",
                            PA: fullSeasonData["Batter PA"],
                            "H/PA": parseFloat(fullSeasonData["Batter H/PA"]).toFixed(3),
                            H: fullSeasonData["Batter H"],
                            "1B": fullSeasonData["Batter 1B"],
                            "2B": fullSeasonData["Batter 2B"],
                            "3B": fullSeasonData["Batter 3B"],
                            HR: fullSeasonData["Batter HR"],
                            R: fullSeasonData["Batter R"],
                            RBI: fullSeasonData["Batter RBI"],
                            BB: fullSeasonData["Batter BB"],
                            SO: fullSeasonData["Batter SO"],
                            _childData: batterData.splits
                        });
                    }
                });

            const batterTable = new Tabulator(`#batter-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitDataFixed",  // Changed to prevent stretching
                data: tableData,
                columns: [
                    {
                        title: "Name", 
                        field: "name", 
                        width: this.subtableConfig.statTableColumns.name, 
                        headerSort: false,
                        formatter: function(cell) {
                            const rowData = cell.getRow().getData();
                            const value = cell.getValue();
                            
                            if (rowData._rowType === 'main') {
                                const expanded = rowData._isExpanded || false;
                                return `<div style="cursor: pointer; display: flex; align-items: center;">
                                    <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
                                    <span>${value}</span>
                                </div>`;
                            }
                            return `<div style="margin-left: 30px;">${value}</div>`;
                        }
                    },
                    {title: "Split", field: "split", width: this.subtableConfig.statTableColumns.split, headerSort: false},
                    {title: "PA", field: "PA", width: 50, hozAlign: "center", headerSort: false},
                    {title: "H/PA", field: "H/PA", width: 60, hozAlign: "center", headerSort: false},
                    {title: "H", field: "H", width: 50, hozAlign: "center", headerSort: false},
                    {title: "1B", field: "1B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "2B", field: "2B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "3B", field: "3B", width: 50, hozAlign: "center", headerSort: false},
                    {title: "HR", field: "HR", width: 50, hozAlign: "center", headerSort: false},
                    {title: "R", field: "R", width: 50, hozAlign: "center", headerSort: false},
                    {title: "RBI", field: "RBI", width: 50, hozAlign: "center", headerSort: false},
                    {title: "BB", field: "BB", width: 50, hozAlign: "center", headerSort: false},
                    {title: "SO", field: "SO", width: 70, hozAlign: "center", headerSort: false}
                ],
                height: false,
                headerHeight: 30,
                rowHeight: 28
            });

            // Add click handler
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
                            
                            const childRows = [];
                            ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                const statData = rowData._childData.find(s => s["Batter Split ID"] === splitId);
                                if (statData) {
                                    childRows.push({
                                        _id: `${data["Matchup Game ID"]}-batter-child-${rowData._batterOrder}-${index}`,
                                        _rowType: 'child',
                                        _parentId: rowData._id,
                                        _sortOrder: rowData._sortOrder + index + 1,
                                        name: `${rowData.name.replace(/ \d+$/, '')} ${rowData._batterOrder}`,
                                        split: splitMap[splitId],
                                        PA: statData["Batter PA"],
                                        "H/PA": parseFloat(statData["Batter H/PA"]).toFixed(3),
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

    createBullpenMatchupsTable(data, opposingLocationText) {
        if (data._bullpenMatchups && data._bullpenMatchups.length > 0) {
            const splitOrder = ["Full Season", "vs R", "vs L", "Full Season@", "vs R @", "vs L @"];
            const splitMap = {
                "Full Season": "Full Season",
                "vs R": "vs Righties",
                "vs L": "vs Lefties",
                "Full Season@": `Full Season ${opposingLocationText}`,
                "vs R @": `vs Righties ${opposingLocationText}`,
                "vs L @": `vs Lefties ${opposingLocationText}`
            };
            
            // Group by hand type (Righties/Lefties)
            const groupedData = {
                "Righties": [],
                "Lefties": []
            };
            
            data._bullpenMatchups.forEach(bullpen => {
                const handNumber = bullpen["Bullpen Hand & Number"];
                const match = handNumber.match(/(\d+)\s+(Righties|Lefties)/);
                if (match) {
                    const handType = match[2];
                    groupedData[handType].push(bullpen);
                }
            });

            // Create table data with Full Season as main rows
            const tableData = [];
            const handOrder = ["Righties", "Lefties"];
            
            handOrder.forEach((handType, handIndex) => {
                const handData = groupedData[handType];
                if (handData && handData.length > 0) {
                    const fullSeasonData = handData.find(d => d["Bullpen Split ID"] === "Full Season");
                    
                    if (fullSeasonData) {
                        tableData.push({
                            _id: `${data["Matchup Game ID"]}-bullpen-${handType}`,
                            _isExpanded: false,
                            _rowType: 'main',
                            _handType: handType,
                            _sortOrder: handIndex * 10,
                            name: fullSeasonData["Bullpen Hand & Number"],
                            split: "Full Season",
                            TBF: fullSeasonData["Bullpen TBF"],
                            "H/TBF": parseFloat(fullSeasonData["Bullpen H/TBF"]).toFixed(3),
                            H: fullSeasonData["Bullpen H"],
                            "1B": fullSeasonData["Bullpen 1B"],
                            "2B": fullSeasonData["Bullpen 2B"],
                            "3B": fullSeasonData["Bullpen 3B"],
                            HR: fullSeasonData["Bullpen HR"],
                            R: fullSeasonData["Bullpen R"],
                            ERA: parseFloat(fullSeasonData["Bullpen ERA"]).toFixed(2),
                            BB: fullSeasonData["Bullpen BB"],
                            SO: fullSeasonData["Bullpen SO"],
                            _childData: handData
                        });
                    }
                }
            });

            const bullpenTable = new Tabulator(`#bullpen-matchups-subtable-${data["Matchup Game ID"]}`, {
                layout: "fitDataFixed",  // Changed to prevent stretching
                data: tableData,
                columns: [
                    {
                        title: "Type", 
                        field: "name", 
                        width: this.subtableConfig.statTableColumns.name, 
                        headerSort: false,
                        formatter: function(cell) {
                            const rowData = cell.getRow().getData();
                            const value = cell.getValue();
                            
                            if (rowData._rowType === 'main') {
                                const expanded = rowData._isExpanded || false;
                                return `<div style="cursor: pointer; display: flex; align-items: center;">
                                    <span style="color: #007bff; font-weight: bold; margin-right: 8px; font-size: 14px;" class="subtable-expander">${expanded ? '−' : '+'}</span>
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

            // Add click handler
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
                            
                            const childRows = [];
                            ["vs R", "vs L", "Full Season@", "vs R @", "vs L @"].forEach((splitId, index) => {
                                const statData = rowData._childData.find(s => s["Bullpen Split ID"] === splitId);
                                if (statData) {
                                    childRows.push({
                                        _id: `${data["Matchup Game ID"]}-bullpen-child-${rowData._handType}-${index}`,
                                        _rowType: 'child',
                                        _parentId: rowData._id,
                                        _sortOrder: rowData._sortOrder + index + 1,
                                        name: statData["Bullpen Hand & Number"],
                                        split: splitMap[splitId],
                                        TBF: statData["Bullpen TBF"],
                                        "H/TBF": parseFloat(statData["Bullpen H/TBF"]).toFixed(3),
                                        H: statData["Bullpen H"],
                                        "1B": statData["Bullpen 1B"],
                                        "2B": statData["Bullpen 2B"],
                                        "3B": statData["Bullpen 3B"],
                                        HR: statData["Bullpen HR"],
                                        R: statData["Bullpen R"],
                                        ERA: parseFloat(statData["Bullpen ERA"]).toFixed(2),
                                        BB: statData["Bullpen BB"],
                                        SO: statData["Bullpen SO"]
                                    });
                                }
                            });
                            
                            const parentIndex = allData.findIndex(d => d._id === rowData._id);
                            allData.splice(parentIndex + 1, 0, ...childRows);
                            
                            bullpenTable.replaceData(allData);
                            
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

    // Initialize method with overflow fixes
    initialize() {
        console.log('Initializing enhanced matchups table with overflow fixes...');
        
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            width: "1200px",  // Fixed width
            maxWidth: "1200px",  // Prevent expansion
            height: "600px",  // Fixed height
            layout: "fitDataFixed",  // Prevent column stretching
            placeholder: "Loading matchups data...",
            headerVisible: true,
            headerHozAlign: "center",
            renderVertical: "basic",
            renderHorizontal: "basic",
            layoutColumnsOnNewData: false,
            virtualDomBuffer: 100,
            initialSort: [
                {column: "Matchup Game ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter(),
            dataLoaded: (data) => {
                console.log(`✅ Matchups data successfully loaded: ${data.length} rows`);
                data.forEach(row => {
                    row._expanded = false;
                    row._dataFetched = false;
                    
                    if (this.expandedRows.has(row["Matchup Game ID"])) {
                        row._expanded = true;
                    }
                });
                this.matchupsData = data;
            }
        };

        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Enhanced matchups table built successfully");
            
            // Apply overflow fix to the table element
            const tableElement = document.querySelector(this.elementId);
            if (tableElement) {
                tableElement.style.overflow = "hidden";
                tableElement.style.maxWidth = "1200px";
                
                // Fix the table holder overflow
                const tableHolder = tableElement.querySelector('.tabulator-tableHolder');
                if (tableHolder) {
                    tableHolder.style.overflowX = "hidden";
                    tableHolder.style.maxWidth = "100%";
                }
            }
        });
    }

    // Helper methods
    isTeamAway(matchupGame) {
        return matchupGame.includes(" @ ");
    }

    getOpposingMatchupId(matchupId) {
        const id = parseInt(matchupId);
        return id % 2 === 1 ? id + 1 : id - 1;
    }

    async fetchMatchupData(matchupId) {
        try {
            console.log(`Fetching all data for matchup ${matchupId}...`);
            
            const opposingMatchupId = this.getOpposingMatchupId(matchupId);
            console.log(`Using opposing matchup ID ${opposingMatchupId} for pitcher/bullpen data`);
            
            const [parkFactors, pitcherStats, batterMatchups, bullpenMatchups] = await Promise.all([
                this.fetchParkFactors(matchupId),
                this.fetchPitcherStats(opposingMatchupId),
                this.fetchBatterMatchups(matchupId),
                this.fetchBullpenMatchups(opposingMatchupId)
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
            console.log(`Fetching opposing pitcher stats for matchup ID: ${matchupId}`);
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
            console.log(`Fetching opposing bullpen matchups for matchup ID: ${matchupId}`);
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
                e.preventDefault();
                e.stopPropagation();
                
                const row = cell.getRow();
                const data = row.getData();
                const matchupId = data["Matchup Game ID"];
                
                const scrollPos = this.getTableScrollPosition();
                
                if (!data._expanded && !data._dataFetched) {
                    const cellElement = cell.getElement();
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳';
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
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
                
                if (data._expanded) {
                    this.expandedRows.add(matchupId);
                } else {
                    this.expandedRows.delete(matchupId);
                }
                
                row.update(data);
                
                requestAnimationFrame(() => {
                    row.reformat();
                    
                    requestAnimationFrame(() => {
                        this.setTableScrollPosition(scrollPos);
                        
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
                        }, 50);
                    });
                });
            }
        });
    }

    // Create row formatter with overflow control
    createRowFormatter() {
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            // Ensure row doesn't exceed table width
            rowElement.style.maxWidth = "100%";
            rowElement.style.overflow = "hidden";
            
            if (data._expanded && !rowElement.querySelector('.subrow-container')) {
                const holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                holderEl.style.maxWidth = "100%";
                holderEl.style.overflow = "hidden";  // Prevent horizontal scroll
                
                const subtableEl = document.createElement("div");
                subtableEl.style.maxWidth = "100%";
                subtableEl.style.overflow = "hidden";
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

    createSubtable1(container, data) {
        // Not used for matchups table
    }

    createSubtable2(container, data) {
        // Not used for matchups table
    }

    redraw() {
        if (this.table) {
            const scrollPos = this.getTableScrollPosition();
            
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    this.expandedRows.add(data["Matchup Game ID"]);
                } else {
                    this.expandedRows.delete(data["Matchup Game ID"]);
                }
            });
            
            this.table.redraw(true);
            
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(async (row) => {
                    const data = row.getData();
                    const matchupId = data["Matchup Game ID"];
                    const shouldBeExpanded = this.expandedRows.has(matchupId);
                    
                    if (shouldBeExpanded && !data._expanded) {
                        if (!data._dataFetched) {
                            const matchupData = await this.fetchMatchupData(matchupId);
                            Object.assign(data, {
                                _parkFactors: matchupData.parkFactors,
                                _pitcherStats: matchupData.pitcherStats,
                                _batterMatchups: matchupData.batterMatchups,
                                _bullpenMatchups: matchupData.bullpenMatchups,
                                _dataFetched: true
                            });
                        }
                        
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                        
                        setTimeout(() => {
                            const cells = row.getCells();
                            const teamCell = cells.find(cell => cell.getField() === "Matchup Team");
                            if (teamCell) {
                                const cellElement = teamCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "−";
                                }
                            }
                        }, 50);
                    } else if (!shouldBeExpanded && data._expanded) {
                        data._expanded = false;
                        row.update(data);
                        row.reformat();
                        
                        setTimeout(() => {
                            const cells = row.getCells();
                            const teamCell = cells.find(cell => cell.getField() === "Matchup Team");
                            if (teamCell) {
                                const cellElement = teamCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "+";
                                }
                            }
                        }, 50);
                    }
                });
                
                this.setTableScrollPosition(scrollPos);
            }, 100);
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
    
    getTabulator() {
        return this.table;
    }
    
    getExpandedRows() {
        return Array.from(this.expandedRows);
    }
    
    setExpandedRows(expandedRowIds) {
        this.expandedRows = new Set(expandedRowIds);
    }
}
