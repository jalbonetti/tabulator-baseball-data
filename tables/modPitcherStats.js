// tables/modPitcherStats.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { TEAM_NAME_MAP } from '../shared/config.js';

export class ModPitcherStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherStats');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            columns: this.getColumns(),
            initialSort: [
                {column: "Pitcher Name", dir: "asc"},
                {column: "Pitcher Team", dir: "asc"},
                {column: "Pitcher Stat Type", dir: "asc"},
                {column: "Pitcher Prop Split ID", dir: "asc"}
            ],
            rowFormatter: ((self) => {
                return (row) => {
                    var data = row.getData();
                    
                    // Initialize _expanded if undefined
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                        var holderEl = document.createElement("div");
                        holderEl.classList.add('subrow-container');
                        holderEl.style.padding = "10px";
                        holderEl.style.background = "#f8f9fa";
                        
                        var subtable1 = document.createElement("div");
                        var subtable2 = document.createElement("div");
                        
                        holderEl.appendChild(subtable1);
                        holderEl.appendChild(subtable2);
                        row.getElement().appendChild(holderEl);
                        
                        // Create subtables immediately with proper context
                        try {
                            self.createSubtable1(subtable1, data);
                        } catch (error) {
                            console.error("Error creating pitcher stats subtable1:", error);
                            subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1: ' + error.message + '</div>';
                        }
                        
                        try {
                            self.createSubtable2(subtable2, data);
                        } catch (error) {
                            console.error("Error creating pitcher stats subtable2:", error);
                            subtable2.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 2: ' + error.message + '</div>';
                        }
                    } else if (!data._expanded) {
                        var existingSubrow = row.getElement().querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                    }
                };
            })(this)
        };

        this.table = new Tabulator(this.elementId, config);
        
        // Setup click handler for row expansion
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Pitcher Name") {
                e.preventDefault();
                e.stopPropagation();
                
                var row = cell.getRow();
                var data = row.getData();
                
                data._expanded = !data._expanded;
                
                requestAnimationFrame(() => {
                    row.update(data);
                    
                    requestAnimationFrame(() => {
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
                        }, 50);
                    });
                });
            }
        });
        
        this.table.on("tableBuilt", () => {
            console.log("Mod Pitcher Stats table built successfully");
        });
    }

    getColumns() {
        // Simple number formatter function
        const simpleNumberFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            return parseFloat(value).toFixed(0);
        };

        // Ratio formatter function (3 decimal places) - removes leading 0 except for 0.000
        const ratioFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            var formatted = parseFloat(value).toFixed(3);
            
            // If the value starts with "0." and is not exactly "0.000", remove the leading "0"
            if (formatted.startsWith("0.") && formatted !== "0.000") {
                return formatted.substring(1);
            }
            
            return formatted;
        };

        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Pitcher Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,  // Text filter for name
                    resizable: false,
                    formatter: function(cell, formatterParams, onRendered) {
                        var value = cell.getValue();
                        var row = cell.getRow();
                        var expanded = row.getData()._expanded || false;
                        
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
                                    textSpan.textContent = value || "";
                                    
                                    container.appendChild(expander);
                                    container.appendChild(textSpan);
                                    
                                    cellElement.appendChild(container);
                                }
                            } catch (error) {
                                console.error("Error in formatter onRendered:", error);
                            }
                        });
                        
                        return (expanded ? "− " : "+ ") + (value || "");
                    }
                },
                {
                    title: "Team", 
                    field: "Pitcher Team", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        return TEAM_NAME_MAP[value] || value;
                    }
                }
            ]},
            {title: "Stat Info", columns: [
                {
                    title: "Stat", 
                    field: "Pitcher Stat Type", 
                    width: 160, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false
                },
                {
                    title: "Split", 
                    field: "Pitcher Prop Split ID", 
                    width: 220, 
                    minWidth: 180,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (Home/Away)",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (Home/Away)"
                        };
                        return mapping[value] || value;
                    }
                }
            ]},
            {title: "Pitcher Stats", columns: [
                {
                    title: "V. R", 
                    field: "Pitcher Total vs R", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "V. L", 
                    field: "Pitcher Total vs L", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Total", 
                    field: "Pitcher Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Pitcher Total Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Lineup", columns: [
                {
                    title: "R.", 
                    field: "RB Stat Total", 
                    width: 55, 
                    minWidth: 45,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "L.", 
                    field: "LB Stat Total", 
                    width: 55, 
                    minWidth: 45,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Opposing Batting", columns: [
                {
                    title: "Total", 
                    field: "Opposing Batting Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Opposing Batting Total Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Matchup V. R", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs R", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs R", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Matchup V. L", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs L", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs L", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Matchup Total", columns: [
                {
                    title: "Total", 
                    field: "Matchup Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]}
        ];
    }

    // Create first subtable for the expanded row
    createSubtable1(container, data) {
        // Format batting lineup info
        var lineupInfo = (data["R Batters"] || "0") + " R / " + (data["L Batters"] || "0") + " L";
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: data["Pitcher Prop Park Factor"] || "-",
                handedness: data["Handedness"] || "-",
                matchup: data["Matchup"] || "-",
                opposingLineup: lineupInfo
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 150},
                {title: "Hand", field: "handedness", headerSort: false, width: 80},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Lineup", field: "opposingLineup", headerSort: false, width: 150}
            ]
        });
    }

    // Create second subtable for TBF/PA data
    createSubtable2(container, data) {
        try {
            var statType = data["Pitcher Stat Type"] || "Stats";
            var pitcherHand = data["Handedness"] || "?";
            
            // Get opponent team
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Pitcher Team"]);
            
            // Determine handedness matchups for batters
            var rbVersusText = pitcherHand === "L" ? "Lefties" : "Righties";
            var lbVersusText = pitcherHand === "R" ? "Righties" : "Lefties";
            
            // Format ratio values
            const formatRatio = (value) => {
                if (value === null || value === undefined || value === "") return "-";
                return parseFloat(value).toFixed(3);
            };
            
            // Calculate ratios for vs R and vs L
            const calculateRatio = (total, tbf) => {
                const totalNum = parseFloat(total);
                const tbfNum = parseFloat(tbf);
                if (isNaN(totalNum) || isNaN(tbfNum) || tbfNum === 0) return "-";
                return formatRatio(totalNum / tbfNum);
            };
            
            const safeNum = (value, fallback = "0") => {
                if (value === null || value === undefined || value === "") return fallback;
                return value.toString();
            };
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                resizableColumns: false,
                resizableRows: false,
                movableColumns: false,
                data: [
                    {
                        player: data["Pitcher Name"] + " (" + pitcherHand + ") Versus Righties",
                        stat: safeNum(data["Pitcher Total vs R"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs R"]) + " TBF",
                        ratio: calculateRatio(data["Pitcher Total vs R"], data["Pitcher TBF vs R"])
                    },
                    {
                        player: data["Pitcher Name"] + " (" + pitcherHand + ") Versus Lefties",
                        stat: safeNum(data["Pitcher Total vs L"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs L"]) + " TBF",
                        ratio: calculateRatio(data["Pitcher Total vs L"], data["Pitcher TBF vs L"])
                    },
                    {
                        player: data["Pitcher Name"] + " (" + pitcherHand + ") Total",
                        stat: safeNum(data["Pitcher Total"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF"]) + " TBF",
                        ratio: formatRatio(data["Pitcher Total Ratio"])
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Righty Batters (" + safeNum(data["R Batters"], "0") + ") Versus " + rbVersusText,
                        stat: safeNum(data["RB Stat Total"]) + " " + statType,
                        tbf: safeNum(data["RB PA"]) + " PA",
                        ratio: calculateRatio(data["RB Stat Total"], data["RB PA"])
                    },
                    {
                        player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Batters (" + safeNum(data["L Batters"], "0") + ") Versus " + lbVersusText,
                        stat: safeNum(data["LB Stat Total"]) + " " + statType,
                        tbf: safeNum(data["LB PA"]) + " PA",
                        ratio: calculateRatio(data["LB Stat Total"], data["LB PA"])
                    },
                    {
                        player: "Opposing Batting Total",
                        stat: safeNum(data["Opposing Batting Stat Total"]) + " " + statType,
                        tbf: safeNum(data["Opposing Batting PA"]) + " PA",
                        ratio: formatRatio(data["Opposing Batting Total Ratio"])
                    },
                    {
                        player: "Matchup Total V. Righties",
                        stat: safeNum(data["Matchup Total vs R"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs R"]) + " TBF / " + safeNum(data["RB PA"]) + " PA",
                        ratio: formatRatio(data["Matchup Rate vs R"])
                    },
                    {
                        player: "Matchup Total V. Lefties",
                        stat: safeNum(data["Matchup Total vs L"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs L"]) + " TBF / " + safeNum(data["LB PA"]) + " PA",
                        ratio: formatRatio(data["Matchup Rate vs L"])
                    },
                    {
                        player: "Matchup Total",
                        stat: safeNum(data["Matchup Stat Total"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF"]) + " TBF / " + safeNum(data["Opposing Batting PA"]) + " PA",
                        ratio: formatRatio(data["Matchup Rate"])
                    }
                ],
                columns: [
                    {title: "Players", field: "player", headerSort: false, width: 320},
                    {title: statType + " Total", field: "stat", headerSort: false, width: 140},
                    {title: "TBF / PA", field: "tbf", headerSort: false, width: 150},
                    {title: "Ratio/Rate", field: "ratio", headerSort: false, width: 90}
                ]
            });
        } catch (error) {
            console.error("Error creating pitcher stats subtable2:", error, data);
            container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
        }
    }
}
