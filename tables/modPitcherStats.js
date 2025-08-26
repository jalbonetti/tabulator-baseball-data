// tables/modPitcherStats.js - COMPLETE VERSION WITH STATE PRESERVATION
import { BaseTable } from './baseTable.js';
import { getOpponentTeam, formatPercentage, formatRatio, formatDecimal } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class ModPitcherStatsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModPitcherStats');
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
            placeholder: "Loading all pitcher stats records...",
            columns: this.getColumns(),
            initialSort: [
                {column: "Pitcher Name", dir: "asc"},
                {column: "Pitcher Team", dir: "asc"},
                {column: "Pitcher Stat Type", dir: "asc"},
                {column: "Pitcher Prop Split ID", dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };

        this.table = new Tabulator(this.elementId, config);
        
        // CRITICAL: Use the base class setupRowExpansion which has proper global state management
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Mod Pitcher Stats table built successfully");
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
                    field: "Pitcher Name", 
                    width: 200, 
                    minWidth: 150,
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: this.createNameFormatter()
                },
                {
                    title: "Team", 
                    field: "Pitcher Team", 
                    width: 100, 
                    minWidth: 80,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                }
            ]},
            {title: "Stat Info", columns: [
                {
                    title: "Stat", 
                    field: "Pitcher Stat Type", 
                    width: 100, 
                    minWidth: 80,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {
                    title: "Split", 
                    field: "Pitcher Prop Split ID", 
                    width: 220, 
                    minWidth: 180,
                    sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var rowData = cell.getRow().getData();
                        var location = self.getPlayerLocation(rowData["Matchup"], rowData["Pitcher Team"]);
                        
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

    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            if (field === "Pitcher Name") {
                e.preventDefault();
                e.stopPropagation();
                
                if (self.isRestoringState) {
                    console.log("Click during restoration - queueing for later");
                    setTimeout(() => {
                        if (!self.isRestoringState) {
                            cell.getElement().click();
                        }
                    }, 500);
                    return;
                }
                
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    if (self.isRestoringState) {
                        console.log("Still restoring, ignoring click");
                        return;
                    }
                    
                    var row = cell.getRow();
                    var data = row.getData();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    // Toggle expansion
                    data._expanded = !data._expanded;
                    
                    // CRITICAL: Update global state immediately
                    const rowId = self.generateRowId(data);
                    const globalState = self.getGlobalState();
                    
                    if (data._expanded) {
                        globalState.set(rowId, {
                            timestamp: Date.now(),
                            data: data
                        });
                    } else {
                        globalState.delete(rowId);
                    }
                    
                    self.setGlobalState(globalState);
                    
                    console.log(`Pitcher stats row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                    
                    row.update(data);
                    
                    var cellElement = cell.getElement();
                    var expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                    }
                    
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        requestAnimationFrame(() => {
                            try {
                                var updatedCellElement = cell.getElement();
                                if (updatedCellElement) {
                                    var updatedExpanderIcon = updatedCellElement.querySelector('.row-expander');
                                    if (updatedExpanderIcon) {
                                        updatedExpanderIcon.innerHTML = data._expanded ? "−" : "+";
                                    }
                                }
                            } catch (error) {
                                console.error("Error updating expander icon:", error);
                            }
                        });
                    });
                }, 50);
            }
        });
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
        var lineupInfo = (data["R Batters"] || "0") + " R / " + (data["L Batters"] || "0") + " L";
        
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            virtualDom: false,
            data: [{
                propFactor: data["Pitcher Prop Park Factor"] || "-",
                handedness: data["Handedness"] || "-",
                matchup: data["Matchup"] || "-",
                opposingLineup: lineupInfo
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 600},
                {title: "Hand", field: "handedness", headerSort: false, width: 100},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Lineup", field: "opposingLineup", headerSort: false, width: 90}
            ]
        });
    }

    createSubtable2(container, data) {
        try {
            var statType = data["Pitcher Stat Type"] || "Stats";
            var pitcherHand = data["Handedness"] || "?";
            
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Pitcher Team"]);
            
            var rbVersusText = pitcherHand === "L" ? "Lefties" : "Righties";
            var lbVersusText = pitcherHand === "R" ? "Righties" : "Lefties";
            
            const formatRatioValue = (value) => {
                if (value === null || value === undefined || value === "") return "-";
                return formatRatio(value, 3);
            };
            
            const calculateRatio = (total, tbf) => {
                const totalNum = parseFloat(total);
                const tbfNum = parseFloat(tbf);
                if (isNaN(totalNum) || isNaN(tbfNum) || tbfNum === 0) return "-";
                return formatRatio(totalNum / tbfNum, 3);
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
                virtualDom: false,
                height: false,
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
                        ratio: formatRatioValue(data["Pitcher Total Ratio"])
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
                        ratio: formatRatioValue(data["Opposing Batting Total Ratio"])
                    },
                    {
                        player: "Matchup Total V. Righties",
                        stat: safeNum(data["Matchup Total vs R"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs R"]) + " TBF / " + safeNum(data["RB PA"]) + " PA",
                        ratio: formatRatioValue(data["Matchup Rate vs R"])
                    },
                    {
                        player: "Matchup Total V. Lefties",
                        stat: safeNum(data["Matchup Total vs L"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF vs L"]) + " TBF / " + safeNum(data["LB PA"]) + " PA",
                        ratio: formatRatioValue(data["Matchup Rate vs L"])
                    },
                    {
                        player: "Matchup Total",
                        stat: safeNum(data["Matchup Stat Total"]) + " " + statType,
                        tbf: safeNum(data["Pitcher TBF"]) + " TBF / " + safeNum(data["Opposing Batting PA"]) + " PA",
                        ratio: formatRatioValue(data["Matchup Rate"])
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
