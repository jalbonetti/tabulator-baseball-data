// tables/modBatterStats.js - COMPLETE VERSION WITH STATE PRESERVATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage, formatRatio, formatDecimal } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class ModBatterStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterStats');
    }

    getPlayerLocation(matchup, playerTeam) {
        if (!matchup || !playerTeam) return "Home/Away";
        
        if (matchup.includes(" @ ")) {
            const teams = matchup.split(" @ ");
            if (teams.length === 2) {
                const awayTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const homeTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                } else if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                }
            }
        } else if (matchup.includes(" vs ")) {
            const teams = matchup.split(" vs ");
            if (teams.length === 2) {
                const homeTeam = teams[0].trim().match(/\b[A-Z]{2,4}\b/);
                const awayTeam = teams[1].trim().match(/\b[A-Z]{2,4}\b/);
                
                if (homeTeam && homeTeam[0] === playerTeam) {
                    return "Home";
                } else if (awayTeam && awayTeam[0] === playerTeam) {
                    return "Away";
                }
            }
        }
        
        return "Home/Away";
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
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        
        // CRITICAL: Use the base class setupRowExpansion which has proper global state management
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Mod Batter Stats table built successfully");
        });
    }

    getColumns() {
        const self = this;
        const simpleNumberFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            return parseFloat(value).toFixed(0);
        };

        const ratioFormatter = function(cell) {
            var value = cell.getValue();
            return formatRatio(value, 3);
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
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Batter Team", 
                    width: 100, 
                    minWidth: 60,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                }
            ]},
            {title: "Stat Info", columns: [
                {
                    title: "Stat", 
                    field: "Batter Stat Type", 
                    width: 100, 
                    minWidth: 80,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {
                    title: "Split", 
                    field: "Batter Prop Split ID", 
                    width: 180, 
                    minWidth: 140,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var rowData = cell.getRow().getData();
                        var location = self.getPlayerLocation(rowData["Matchup"], rowData["Batter Team"]);
                        
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (" + location + ")",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (" + location + ")"
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

    createRowFormatter() {
        const self = this;
        
        return (row) => {
            var data = row.getData();
            var rowElement = row.getElement();
            
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow || self.isRestoringState) {
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        requestAnimationFrame(() => {
                            var holderEl = document.createElement("div");
                            holderEl.classList.add('subrow-container');
                            holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%; position: relative; z-index: 1;';
                            
                            var subtable1 = document.createElement("div");
                            subtable1.style.cssText = 'margin-bottom: 15px; width: 100%;';
                            var subtable2 = document.createElement("div");
                            subtable2.style.cssText = 'width: 100%;';
                            
                            holderEl.appendChild(subtable1);
                            holderEl.appendChild(subtable2);
                            rowElement.appendChild(holderEl);
                            
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
                            
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 100);
                        });
                    }
                }
            } else {
                var existingSubrow = rowElement.querySelector('.subrow-container');
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
            height: false,
            virtualDom: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"] || "-",
                lineupStatus: (data["Lineup Status"] || "") + ": " + (data["Batting Position"] || ""),
                handedness: data["Handedness"] || "-",
                matchup: data["Matchup"] || "-",
                opposingPitcher: data["SP"] || "-",
                bullpen: bullpenInfo
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 300},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 150},
                {title: "Hand", field: "handedness", headerSort: false, width: 100},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 400},
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
            
            const formatRatioValue = (value) => {
                if (value === null || value === undefined || value === "") return "-";
                return formatRatio(value, 3);
            };
            
            const calculateRatio = (total, pa) => {
                const totalNum = parseFloat(total);
                const paNum = parseFloat(pa);
                if (isNaN(totalNum) || isNaN(paNum) || paNum === 0) return "-";
                return formatRatio(totalNum / paNum, 3);
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
                    ratio: formatRatioValue(data["Batter Ratio"])
                },
                {
                    player: spName + " (" + (spHand || "?") + ") Versus " + spVersusText,
                    stat: safeNum(data["SP Stat Total"]) + " " + statType,
                    pa: safeNum(data["SP TBF"]) + " TBF",
                    ratio: formatRatioValue(data["SP Ratio"])
                },
                {
                    player: "Batter + SP Total",
                    stat: safeNum(data["Batter + SP Stat Total"]) + " " + statType,
                    pa: safeNum(data["Batter PA"]) + " PA / " + safeNum(data["SP TBF"]) + " TBF",
                    ratio: formatRatioValue(data["Batter + SP Ratio"])
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
                    ratio: formatRatioValue(data["Bullpen Ratio"])
                },
                {
                    player: "Opposing Pitching Total",
                    stat: safeNum(data["Opposing Pitching Stat Total"]) + " " + statType,
                    pa: safeNum(data["Opposing Pitching TBF"]) + " TBF",
                    ratio: formatRatioValue(data["Opposing Pitching Ratio"])
                },
                {
                    player: "Matchup Total",
                    stat: safeNum(data["Matchup Stat Total"]) + " " + statType,
                    pa: safeNum(data["Batter PA"]) + " PA / " + safeNum(data["Opposing Pitching TBF"]) + " TBF",
                    ratio: formatRatioValue(data["Matchup Rate"])
                }
            ];
            
            new Tabulator(container, {
                layout: "fitColumns",
                columnHeaderSortMulti: false,
                resizableColumns: false,
                resizableRows: false,
                movableColumns: false,
                virtualDom: false,
                height: false,
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
