// tables/modBatterStats.js
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
            columns: this.getColumns(),
            initialSort: [
                {column: "Batter Name", dir: "asc"},
                {column: "Batter Team", dir: "asc"},
                {column: "Batter Stat Type", dir: "asc"},
                {column: "Batter Prop Split ID", dir: "asc"}
            ],
            rowFormatter: (row) => {
                var data = row.getData();
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
                    
                    this.createSubtable1(subtable1, data);
                    this.createSubtable2(subtable2, data);
                } else if (!data._expanded) {
                    var existingSubrow = row.getElement().querySelector('.subrow-container');
                    if (existingSubrow) {
                        existingSubrow.remove();
                    }
                }
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        // Setup click handler for row expansion
        this.table.on("cellClick", (e, cell) => {
            if (cell.getField() === "Batter Name") {
                var row = cell.getRow();
                var data = row.getData();
                data._expanded = !data._expanded;
                row.update(data);
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
                }, 100);
            }
        });
        
        this.table.on("tableBuilt", () => {
            console.log("Mod Batter Stats table built successfully");
        });
    }

    getColumns() {
        // Simple number formatter function
        const simpleNumberFormatter = function(cell) {
            var value = cell.getValue();
            if (value === null || value === undefined) return "-";
            return parseFloat(value).toFixed(0);
        };

        return [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 180, 
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
                    field: "Batter Team", 
                    width: 180, 
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
                    field: "Batter Stat Type", 
                    width: 120, 
                    minWidth: 100,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,  // Dropdown filter
                    resizable: false
                },
                {
                    title: "Time/Location Split", 
                    field: "Batter Prop Split ID", 
                    width: 180, 
                    minWidth: 150,
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
            {title: "Batter Stats", columns: [
                {
                    title: "V. R", 
                    field: "Batter Total vs R", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "V. L", 
                    field: "Batter Total vs L", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Total", 
                    field: "Batter Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Starter", columns: [
                {
                    title: "Total", 
                    field: "SP Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Relievers", columns: [
                {
                    title: "R.", 
                    field: "RR Stat Total", 
                    width: 70, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "L.", 
                    field: "LR Stat Total", 
                    width: 70, 
                    minWidth: 50,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Total", columns: [
                {
                    title: "Total", 
                    field: "Opposing Pitching Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                }
            ]},
            {title: "Righties Matchup", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs R", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs R", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]},
            {title: "Lefties Matchup", columns: [
                {
                    title: "Total", 
                    field: "Matchup Total vs L", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate vs L", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]},
            {title: "Matchup Total", columns: [
                {
                    title: "Total", 
                    field: "Matchup Stat Total", 
                    width: 80, 
                    minWidth: 60,
                    sorter: "number",
                    resizable: false,
                    formatter: simpleNumberFormatter
                },
                {
                    title: "Rate", 
                    field: "Matchup Rate", 
                    width: 85, 
                    minWidth: 70,
                    sorter: "number",
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "-";
                        return parseFloat(value).toFixed(3);
                    }
                }
            ]}
        ];
    }

    // Create first subtable for the expanded row
    createSubtable1(container, data) {
        // Format bullpen info
        var bullpenInfo = data["R Relievers"] + " R / " + data["L Relievers"] + " L";
        
        // Extract SP handedness from the "Opposing Pitcher" field if not in SP Handedness
        var spInfo = data["SP"] || "";
        var spHand = data["SP Handedness"];
        
        // If SP Handedness is not available, try to extract from SP info
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
                propFactor: data["Batter Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                handedness: data["Handedness"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"],
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

    // Create second subtable for PA/TBF data
    createSubtable2(container, data) {
        var statType = data["Batter Stat Type"];
        var batterHand = data["Handedness"];
        var spInfo = data["SP"] || "";
        var spHand = data["SP Handedness"];
        
        // If SP Handedness field is not available, extract from SP name
        if (!spHand && spInfo.includes("(") && spInfo.includes(")")) {
            var match = spInfo.match(/\(([RL])\)/);
            if (match) {
                spHand = match[1];
            }
        }
        
        // Clean up SP handedness - ensure it's just R or L
        if (spHand) {
            spHand = spHand.toString().trim().toUpperCase();
            if (spHand !== "R" && spHand !== "L") {
                spHand = null;
            }
        }
        
        // Extract SP name without handedness
        var spName = spInfo;
        if (spInfo.includes("(")) {
            spName = spInfo.substring(0, spInfo.indexOf("(")).trim();
        }
        
        // Determine handedness matchups
        var spVersusText;
        if (batterHand === "S") {
            // Switch hitter faces opposite of pitcher's hand
            if (spHand === "R") {
                spVersusText = "Lefties";
            } else if (spHand === "L") {
                spVersusText = "Righties";
            } else {
                spVersusText = "Unknown";
            }
        } else {
            // Regular hitter
            spVersusText = batterHand === "L" ? "Lefties" : "Righties";
        }
        
        // For relievers vs switch hitters
        var rrVersusText, lrVersusText;
        if (batterHand === "S") {
            // Switch hitter faces opposite hand
            rrVersusText = "Lefties";
            lrVersusText = "Righties";
        } else {
            // Regular hitter faces same as their batting hand
            rrVersusText = batterHand === "L" ? "Lefties" : "Righties";
            lrVersusText = batterHand === "L" ? "Lefties" : "Righties";
        }
        
        // Calculate combined PA/TBF for matchups
        var spTBF = parseFloat(data["SP TBF"]) || 0;
        var rrTBF = parseFloat(data["RR TBF"]) || 0;
        var lrTBF = parseFloat(data["LR TBF"]) || 0;
        
        // Add SP to appropriate side based on their handedness
        var rightiesTBF = rrTBF + (spHand === "R" ? spTBF : 0);
        var leftiesTBF = lrTBF + (spHand === "L" ? spTBF : 0);
        
        var rightiesMatchupPA = (parseFloat(data["Batter PA vs R"]) || 0) + " PA / " + rightiesTBF + " TBF";
        var leftiesMatchupPA = (parseFloat(data["Batter PA vs L"]) || 0) + " PA / " + leftiesTBF + " TBF";
        var totalMatchupPA = (parseFloat(data["Batter PA"]) || 0) + " PA / " + (parseFloat(data["Opposing Pitching TBF"]) || 0) + " TBF";
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            data: [
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Versus Righties",
                    stat: data["Batter Total vs R"] + " " + statType,
                    pa: data["Batter PA vs R"] + " PA"
                },
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Versus Lefties",
                    stat: data["Batter Total vs L"] + " " + statType,
                    pa: data["Batter PA vs L"] + " PA"
                },
                {
                    player: data["Batter Name"] + " (" + batterHand + ") Total",
                    stat: data["Batter Total"] + " " + statType,
                    pa: data["Batter PA"] + " PA"
                },
                {
                    player: spName + " (" + (spHand || "?") + ") Versus " + spVersusText,
                    stat: data["SP Stat Total"] + " " + statType,
                    pa: data["SP TBF"] + " TBF"
                },
                {
                    player: "Righty Relievers (" + data["R Relievers"] + ") Versus " + rrVersusText,
                    stat: data["RR Stat Total"] + " " + statType,
                    pa: data["RR TBF"] + " TBF"
                },
                {
                    player: "Lefty Relievers (" + data["L Relievers"] + ") Versus " + lrVersusText,
                    stat: data["LR Stat Total"] + " " + statType,
                    pa: data["LR TBF"] + " TBF"
                },
                {
                    player: "Opposing Pitching Total",
                    stat: data["Opposing Pitching Stat Total"] + " " + statType,
                    pa: data["Opposing Pitching TBF"] + " TBF"
                },
                {
                    player: "Righties Matchup Total",
                    stat: data["Matchup Total vs R"] + " " + statType,
                    pa: rightiesMatchupPA
                },
                {
                    player: "Lefties Matchup Total",
                    stat: data["Matchup Total vs L"] + " " + statType,
                    pa: leftiesMatchupPA
                },
                {
                    player: "Matchup Total",
                    stat: data["Matchup Stat Total"] + " " + statType,
                    pa: totalMatchupPA
                }
            ],
            columns: [
                {title: "Players", field: "player", headerSort: false, width: 350},
                {title: statType + " Total", field: "stat", headerSort: false, width: 150},
                {title: "Plate Appearances / Total Batters Faced", field: "pa", headerSort: false, width: 200}
            ]
        });
    }
}
