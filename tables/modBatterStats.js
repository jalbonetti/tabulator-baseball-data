// tables/modBatterStats.js - FIXED VERSION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { TEAM_NAME_MAP } from '../shared/config.js';

export class ModBatterStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterStats');
    }

    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading all batter stats records...",
            columns: this.getColumns(),
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Team", dir: "asc"},
                {column: "Batter Stat Type", dir: "asc"},
                {column: "Batter Prop Split ID", dir: "asc"}
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
                            console.error("Error creating stats subtable1:", error);
                            subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1: ' + error.message + '</div>';
                        }
                        
                        try {
                            self.createSubtable2(subtable2, data);
                        } catch (error) {
                            console.error("Error creating stats subtable2:", error);
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
            if (cell.getField() === "Batter Name") {
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
            console.log("Mod Batter Stats table built successfully");
        });
    }

    getColumns() {
        const simpleNumberFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            return parseFloat(value).toFixed(0);
        };

        const ratioFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            var formatted = parseFloat(value).toFixed(3);
            
            if (formatted.startsWith("0.") && formatted !== "0.000") {
                return formatted.substring(1);
            }
            
            return formatted;
        };

        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,
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
                    field: "Batter Team", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
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
                    field: "Batter Stat Type", 
                    width: 160, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {
                    title: "Split", 
                    field: "Batter Prop Split ID", 
                    width: 220, 
                    minWidth: 180,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
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
            {title: "Batter Stats", columns: [
                {
                    title: "V. R", 
                    field: "Batter Total vs R", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "V. L", 
                    field: "Batter Total vs L", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Total", 
                    field: "Batter Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Batter Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Starter", columns: [
                {
                    title: "Total", 
                    field: "SP Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "SP Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Batter + SP", columns: [
                {
                    title: "Total", 
                    field: "Batter + SP Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Batter + SP Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Relievers", columns: [
                {
                    title: "R.", 
                    field: "RR Stat Total", 
                    width: 55, 
                    minWidth: 45,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "L.", 
                    field: "LR Stat Total", 
                    width: 55, 
                    minWidth: 45,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Bullpen", columns: [
                {
                    title: "Total", 
                    field: "Bullpen Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Bullpen Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Opposing Pitching", columns: [
                {
                    title: "Total", 
                    field: "Opposing Pitching Stat Total", 
                    width: 65, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Ratio", 
                    field: "Opposing Pitching Ratio", 
                    width: 70, 
                    minWidth: 55,
                    sorter: "number",
                    resizable: false,
                    formatter: ratioFormatter
                }
            ]},
            {title: "Matchup", columns: [
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

    createSubtable1(container, data) {
        var bullpenInfo = (data["R Relievers"] || "0") + " R / " + (data["L Relievers"] || "0") + " L";
        
        var spInfo = data["SP"] || "";
        var spHand = data["SP Handedness"];
        
        if (!spHand && spInfo.includes("(") && spInfo.includes(")")) {
            var match = spInfo.match(/\(([RL])\)/);
            if (match) {
                spHand = match[1];
            }
        }
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"] || "-",
                lineupStatus: (data["Lineup Status"] || "") + ": " + (data["Batting Position"] || ""),
                handedness: data["Handedness"] || "-",
                matchup: data["Matchup"] || "-",
                opposingPitcher: data["SP"] || "-",
                bullpen: bullpenInfo
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 130},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 150},
                {title: "Hand", field: "handedness", headerSort: false, width: 80},
                {title: "Matchup", field: "matchup", headerSort: false, width: 200},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 150},
                {title: "Bullpen", field: "bullpen", headerSort: false, width: 120}
            ]
        });
    }

    createSubtable2(container, data) {
        try {
            var statType = data["Batter Stat Type"] || "Stats";
            var batterHand = data["Handedness"] || "?";
            var spInfo = data["SP"] || "";
            var spHand = data["SP Handedness"];
            
            if (!spHand && spInfo.includes("(") && spInfo.includes(")")) {
                var match = spInfo.match(/\(([RL])\)/);
                if (match) {
                    spHand = match[1];
                }
            }
            
            if (spHand) {
                spHand = spHand.toString().trim().toUpperCase();
                if (spHand !== "R" && spHand !== "L") {
                    spHand = null;
                }
            }
            
            var spName = spInfo;
            if (spInfo.includes("(")) {
                spName = spInfo.substring(0, spInfo.indexOf("(")).trim();
            }
            
            var spVersusText;
            if (batterHand === "S") {
                if (spHand === "R") {
                    spVersusText = "Lefties";
                } else if (spHand === "L") {
                    spVersusText = "Righties";
                } else {
                    spVersusText = "Unknown";
                }
            } else {
                spVersusText = batterHand === "L" ? "Lefties" : "Righties";
            }
            
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
            var rrVersusText, lrVersusText;
            if (batterHand === "S") {
                rrVersusText = "Lefties";
                lrVersusText = "Righties";
            } else {
                rrVersusText = batterHand === "L" ? "Lefties" : "Righties";
                lrVersusText = batterHand === "L" ? "Lefties" : "Righties";
            }
            
            const formatRatio = (value) => {
                if (value === null || value === undefined || value === "") return "-";
                var num = parseFloat(value);
                if (isNaN(num)) return "-";
                return num.toFixed(3);
            };
            
            const calculateRatio = (total, pa) => {
                const totalNum = parseFloat(total);
                const paNum = parseFloat(pa);
                if (isNaN(totalNum) || isNaN(paNum) || paNum === 0) return "-";
                return formatRatio(totalNum / paNum);
            };
            
            const safeNum = (value, fallback = "0") => {
                if (value === null || value === undefined || value === "") return fallback;
                return value.toString();
            };
            
            var tableData = [
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Versus Righties",
                    stat: safeNum(data["Batter Total vs R"]) + " " + statType,
                    pa: safeNum(data["Batter PA vs R"]) + " PA",
                    ratio: calculateRatio(data["Batter Total vs R"], data["Batter PA vs R"])
                },
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Versus Lefties",
                    stat: safeNum(data["Batter Total vs L"]) + " " + statType,
                    pa: safeNum(data["Batter PA vs L"]) + " PA",
                    ratio: calculateRatio(data["Batter Total vs L"], data["Batter PA vs L"])
                },
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Total",
                    stat: safeNum(data["Batter Total"]) + " " + statType,
                    pa: safeNum(data["Batter PA"]) + " PA",
                    ratio: formatRatio(data["Batter Ratio"])
                },
                {
                    player: spName + " (" + (spHand || "?") + ") Versus " + spVersusText,
                    stat: safeNum(data["SP Stat Total"]) + " " + statType,
                    pa: safeNum(data["SP TBF"]) + " TBF",
                    ratio: formatRatio(data["SP Ratio"])
                },
                {
                    player: "Batter + SP Total",
                    stat: safeNum(data["Batter + SP Stat Total"]) + " " + statType,
                    pa: safeNum(data["Batter PA"]) + " PA / " + safeNum(data["SP TBF"]) + " TBF",
                    ratio: formatRatio(data["Batter + SP Ratio"])
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + safeNum(data["R Relievers"], "0") + ") Versus " + rrVersusText,
                    stat: safeNum(data["RR Stat Total"]) + " " + statType,
                    pa: safeNum(data["RR TBF"]) + " TBF",
                    ratio: calculateRatio(data["RR Stat Total"], data["RR TBF"])
                },
                {
                    player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + safeNum(data["L Relievers"], "0") + ") Versus " + lrVersusText,
                    stat: safeNum(data["LR Stat Total"]) + " " + statType,
                    pa: safeNum(data["LR TBF"]) + " TBF",
                    ratio: calculateRatio(data["LR Stat Total"], data["LR TBF"])
                },
                {
                    player: "Bullpen Total",
                    stat: safeNum(data["Bullpen Stat Total"]) + " " + statType,
                    pa: (parseFloat(safeNum(data["RR TBF"], "0")) + parseFloat(safeNum(data["LR TBF"], "0"))) + " TBF",
                    ratio: formatRatio(data["Bullpen Ratio"])
                },
                {
                    player: "Opposing Pitching Total",
                    stat: safeNum(data["Opposing Pitching Stat Total"]) + " " + statType,
                    pa: safeNum(data["Opposing Pitching TBF"]) + " TBF",
                    ratio: formatRatio(data["Opposing Pitching Ratio"])
                },
                {
                    player: "Matchup Total",
                    stat: safeNum(data["Matchup Stat Total"]) + " " + statType,
                    pa: safeNum(data["Batter PA"]) + " PA / " + safeNum(data["Opposing Pitching TBF"]) + " TBF",
                    ratio: formatRatio(data["Matchup Rate"])
                }
            ];
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                resizableColumns: false,
                resizableRows: false,
                movableColumns: false,
                data: tableData,
                columns: [
                    {title: "Players", field: "player", headerSort: false, width: 320},
                    {title: statType + " Total", field: "stat", headerSort: false, width: 140},
                    {title: "PA / TBF", field: "pa", headerSort: false, width: 150},
                    {title: "Ratio/Rate", field: "ratio", headerSort: false, width: 90}
                ]
            });
        } catch (error) {
            console.error("Error creating batter stats subtable2:", error, data);
            container.innerHTML = '<div style="padding: 10px; color: red;">Error loading data: ' + error.message + '</div>';
        }
    }
}
