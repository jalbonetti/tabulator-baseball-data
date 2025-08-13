// tables/modBatterStats.js - FIXED VERSION WITH PROPER STATE PRESERVATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage, formatRatio, formatDecimal } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class ModBatterStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModBatterStats');
    }

    // Helper method to determine if team is home or away
    getPlayerLocation(matchup, playerTeam) {
        if (!matchup || !playerTeam) return "Home/Away";
        
        if (matchup.includes(" @ ")) {
            // Format: Away @ Home
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
            // Format: Home vs Away
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
        
        return "Home/Away"; // Fallback if we can't determine
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
                    var rowElement = row.getElement();
                    
                    // Initialize _expanded if undefined
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
                        
                        if (!existingSubrow) {
                            var holderEl = document.createElement("div");
                            holderEl.classList.add('subrow-container');
                            holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%;';
                            
                            var subtable1 = document.createElement("div");
                            subtable1.style.cssText = 'margin-bottom: 15px; width: 100%;';
                            var subtable2 = document.createElement("div");
                            subtable2.style.cssText = 'width: 100%;';
                            
                            holderEl.appendChild(subtable1);
                            holderEl.appendChild(subtable2);
                            rowElement.appendChild(holderEl);
                            
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
                            
                            // Force height recalculation WITHOUT table redraw
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 100);
                        }
                    } else {
                        // Handle contraction
                        var existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                            rowElement.classList.remove('row-expanded');
                            
                            // Force height recalculation
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 50);
                        }
                    }
                };
            })(this)
        };

        this.table = new Tabulator(this.elementId, config);
        
        // FIXED: Setup click handler for row expansion with proper global state management
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Batter Name") {
                e.preventDefault();
                e.stopPropagation();
                
                // Don't process clicks during state restoration
                if (this.isRestoringState) {
                    console.log("Ignoring click during state restoration");
                    return;
                }
                
                var row = cell.getRow();
                var data = row.getData();
                
                // Initialize if undefined
                if (data._expanded === undefined) {
                    data._expanded = false;
                }
                
                // Toggle expansion
                data._expanded = !data._expanded;
                
                // Update global state using base class helper methods
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
                
                console.log(`Stats row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                
                // Update the row
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
        const self = this; // Reference to use in formatter
        const simpleNumberFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined || value === "") return "-";
            return parseFloat(value).toFixed(0);
        };

        const ratioFormatter = function(cell) {
            var value = cell.getValue();
            return formatRatio(value, 3);  // REMOVES leading zero
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
                    resizable: false
                    // REMOVED formatter - will now show abbreviations
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
                    formatter: ratioFormatter  // REMOVES leading zero
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
                    formatter: ratioFormatter  // REMOVES leading zero
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
                    formatter: ratioFormatter  // REMOVES leading zero
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
                    formatter: ratioFormatter  // REMOVES leading zero
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
                    formatter: ratioFormatter  // REMOVES leading zero
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
                    formatter: ratioFormatter  // REMOVES leading zero
                }
            ]}
        ];
    }

    // createSubtable1 and createSubtable2 methods remain the same
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
            
            const formatRatioValue = (value) => {
                if (value === null || value === undefined || value === "") return "-";
                return formatRatio(value, 3);  // REMOVES leading zero
            };
            
            const calculateRatio = (total, pa) => {
                const totalNum = parseFloat(total);
                const paNum = parseFloat(pa);
                if (isNaN(totalNum) || isNaN(paNum) || paNum === 0) return "-";
                return formatRatio(totalNum / paNum, 3);  // REMOVES leading zero
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
