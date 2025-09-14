// tables/combinedMatchupsTable.js - COMPLETE FIXED VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        
        // Wait for BaseTable to initialize, then copy its config
        setTimeout(() => {
            if (this.getBaseConfig) {
                const config = this.getBaseConfig();
                console.log('BaseTable config available:', config);
                if (config.ajaxConfig?.headers) {
                    this.HEADERS = config.ajaxConfig.headers;
                    console.log('Copied headers from BaseTable:', this.HEADERS);
                }
            }
        }, 0);
        
        // Hardcode the working API base URL
        this.BASE_URL = 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
        
        // Initialize empty headers - will be populated from BaseTable
        this.HEADERS = null;
        
        console.log('MatchupsTable initialized with BASE_URL:', this.BASE_URL);
        
        // Define endpoints for subtable data
        this.ENDPOINTS = {
            MATCHUPS: 'ModMatchupsData',
            PITCHERS: 'ModPitcherMatchups',
            BATTERS: 'ModBatterMatchups',
            BULLPEN: 'ModBullpenMatchups',
            PARK: 'ModParkFactors'
        };
        
        // Field mappings
        this.F = {
            // Main matchup fields
            MATCH_ID: 'Matchup Game ID',
            TEAM: 'Matchup Team',
            GAME: 'Matchup Game',
            PARK: 'Matchup Ballpark',
            SPREAD: 'Matchup Spread',
            TOTAL: 'Matchup Total',
            LINEUP: 'Matchup Lineup Status',
            WX1: 'Matchup Weather 1',
            WX2: 'Matchup Weather 2',
            WX3: 'Matchup Weather 3',
            WX4: 'Matchup Weather 4',
            
            // Pitcher fields
            P_GAME_ID: 'Starter Game ID',
            P_NAME: 'Starter Name & Hand',
            P_SPLIT: 'Starter Split ID',
            P_TBF: 'Starter TBF',
            P_H_TBF: 'Starter H/TBF',
            P_H: 'Starter H',
            P_1B: 'Starter 1B',
            P_2B: 'Starter 2B',
            P_3B: 'Starter 3B',
            P_HR: 'Starter HR',
            P_R: 'Starter R',
            P_ERA: 'Starter ERA',
            P_BB: 'Starter BB',
            P_SO: 'Starter SO',
            
            // Batter fields
            B_GAME_ID: 'Batter Game ID',
            B_NAME: 'Batter Name & Hand & Spot',
            B_SPLIT: 'Batter Split ID',
            B_PA: 'Batter PA',
            B_H_PA: 'Batter H/PA',
            B_H: 'Batter H',
            B_1B: 'Batter 1B',
            B_2B: 'Batter 2B',
            B_3B: 'Batter 3B',
            B_HR: 'Batter HR',
            B_R: 'Batter R',
            B_RBI: 'Batter RBI',
            B_BB: 'Batter BB',
            B_SO: 'Batter SO',
            
            // Bullpen fields
            BP_GAME_ID: 'Bullpen Game ID',
            BP_HAND_CNT: 'Bullpen Hand & Number',
            BP_SPLIT: 'Bullpen Split ID',
            BP_TBF: 'Bullpen TBF',
            BP_H_TBF: 'Bullpen H/TBF',
            BP_H: 'Bullpen H',
            BP_1B: 'Bullpen 1B',
            BP_2B: 'Bullpen 2B',
            BP_3B: 'Bullpen 3B',
            BP_HR: 'Bullpen HR',
            BP_R: 'Bullpen R',
            BP_ERA: 'Bullpen ERA',
            BP_BB: 'Bullpen BB',
            BP_SO: 'Bullpen SO',
            
            // Park factor fields
            PF_GAME_ID: 'Park Factor Game ID',
            PF_STADIUM: 'Park Factor Stadium',
            PF_SPLIT: 'Park Factor Split ID',
            PF_H: 'Park Factor H',
            PF_1B: 'Park Factor 1B',
            PF_2B: 'Park Factor 2B',
            PF_3B: 'Park Factor 3B',
            PF_HR: 'Park Factor HR',
            PF_R: 'Park Factor R',
            PF_BB: 'Park Factor BB',
            PF_SO: 'Park Factor SO'
        };
        
        // Cache for subtable data
        this.subtableDataCache = new Map();
        
        // Track expanded player rows within subtables
        this.expandedSubtableRows = new Map();
    }
    
    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading matchups data...",
            resizableColumns: false,
            columns: this.getColumns(),
            initialSort: [
                {column: this.F.MATCH_ID, dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };
        
        this.table = new Tabulator(this.elementId, config);
        
        // Override setupRowExpansion to handle Team field clicks properly
        this.setupMatchupsRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
        });
    }
    
    // Custom row expansion for matchups table
    setupMatchupsRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            // Handle clicks on the Team field
            if (field === "Matchup Team") {
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
                    
                    // Update global state
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
                    
                    console.log(`Row ${rowId} ${data._expanded ? 'expanded' : 'collapsed'}. Global state now has ${globalState.size} expanded rows.`);
                    
                    // Update row
                    row.update(data);
                    
                    // Update expander icon
                    var cellElement = cell.getElement();
                    var expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = data._expanded ? "−" : "+";
                    }
                    
                    // Reformat row
                    requestAnimationFrame(() => {
                        row.reformat();
                        
                        // Ensure icon stays correct after reformat
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
    
    getColumns() {
        const F = this.F;
        
        return [
            {
                title: "Team",
                field: "Matchup Team",  // Use exact field name for BaseTable compatibility
                widthGrow: 1,
                resizable: false,
                formatter: function(cell) {
                    const value = cell.getValue();
                    const row = cell.getRow();
                    const data = row.getData();
                    const expanded = data._expanded || false;
                    
                    // Return HTML string directly instead of DOM manipulation
                    return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                        <span class="row-expander" style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px;">${expanded ? '−' : '+'}</span>
                        <span>${value || ''}</span>
                    </div>`;
                },
                headerFilter: createCustomMultiSelect  // Add filter
            },
            {
                title: "Game", 
                field: F.GAME, 
                widthGrow: 2,
                resizable: false
            },
            {
                title: "Spread",
                field: F.SPREAD,
                widthGrow: 0.7,
                hozAlign: "center",
                resizable: false
            },
            {
                title: "Total",
                field: F.TOTAL,
                widthGrow: 0.7,
                hozAlign: "center",
                resizable: false
            },
            {
                title: "Lineup",
                field: F.LINEUP,
                widthGrow: 1,
                resizable: false
            }
        ];
    }
    
    // FIX: Better scroll preservation with placeholder
    createRowFormatter() {
        const self = this;
        
        return (row) => {
            const data = row.getData();
            const rowElement = row.getElement();
            
            // Initialize _expanded if undefined
            if (data._expanded === undefined) {
                data._expanded = false;
            }
            
            // Apply expanded class
            if (data._expanded) {
                rowElement.classList.add('row-expanded');
            } else {
                rowElement.classList.remove('row-expanded');
            }
            
            // Create subtables if expanded and not already present
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                if (!existingSubrow) {
                    // FIX: Synchronous scroll position preservation
                    const tableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                    const scrollPosition = tableHolder ? tableHolder.scrollTop : 0;
                    
                    // Create placeholder to maintain height
                    const placeholder = document.createElement('div');
                    placeholder.style.height = '400px'; // Approximate height of subtables
                    placeholder.className = 'subrow-placeholder';
                    rowElement.appendChild(placeholder);
                    
                    // Create subtables asynchronously
                    requestAnimationFrame(() => {
                        // Remove placeholder
                        const placeholderEl = rowElement.querySelector('.subrow-placeholder');
                        if (placeholderEl) {
                            placeholderEl.remove();
                        }
                        
                        // Create actual subtables
                        self.createMatchupSubtables(row, data).then(() => {
                            // Restore scroll position after a micro-task
                            Promise.resolve().then(() => {
                                if (tableHolder) {
                                    tableHolder.scrollTop = scrollPosition;
                                }
                            });
                        });
                    });
                }
            } else {
                // Remove subtables if collapsed
                const existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    // FIX: Preserve scroll during removal
                    const tableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                    const scrollPosition = tableHolder ? tableHolder.scrollTop : 0;
                    
                    existingSubrow.remove();
                    
                    // Restore scroll position
                    Promise.resolve().then(() => {
                        if (tableHolder) {
                            tableHolder.scrollTop = scrollPosition;
                        }
                    });
                }
            }
        };
    }
    
    // Override from BaseTable for proper ID generation
    generateRowId(data) {
        if (data[this.F.MATCH_ID]) {
            return `matchup_${data[this.F.MATCH_ID]}`;
        }
        return super.generateRowId(data);
    }
    
    // Required override from BaseTable
    createSubtable2(container, data) {
        // Not used for matchups table
        return;
    }
    
    getOpponentGameId(gameId) {
        const id = parseInt(gameId);
        if (id % 10 === 1) {
            return id + 1; // 11 -> 12, 21 -> 22
        } else {
            return id - 1; // 12 -> 11, 22 -> 21
        }
    }
    
    determineLocation(gameId) {
        // Game IDs ending in 1 are home games, ending in 2 are away games
        const id = parseInt(gameId);
        return (id % 10 === 1) ? 'At Home' : 'Away';
    }
    
    determineOpposingLocation(gameId) {
        // Opposite of regular location
        const id = parseInt(gameId);
        return (id % 10 === 1) ? 'Away' : 'At Home';
    }
    
    async createMatchupSubtables(row, data) {
        const rowElement = row.getElement();
        const gameId = data[this.F.MATCH_ID];
        const opponentGameId = this.getOpponentGameId(gameId);
        
        // Create main container
        const holderEl = document.createElement("div");
        holderEl.classList.add('subrow-container');
        holderEl.style.cssText = `
            padding: 10px;
            background: #f8f9fa;
            margin: 10px 0;
            border-radius: 4px;
            display: block;
            width: 100%;
            position: relative;
            z-index: 1;
        `;
        
        // Load all subtable data (use opponent ID for pitcher/bullpen)
        const subtableData = await this.loadSubtableData(gameId, opponentGameId);
        
        // Create layout structure
        // Row 1: Park Factors and Weather (side by side)
        const topRow = document.createElement("div");
        topRow.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px;";
        
        const parkContainer = document.createElement("div");
        parkContainer.style.cssText = "flex: 1;";
        
        const weatherContainer = document.createElement("div");
        weatherContainer.style.cssText = "flex: 1;";
        
        topRow.appendChild(parkContainer);
        topRow.appendChild(weatherContainer);
        holderEl.appendChild(topRow);
        
        // Row 2: Starting Pitchers (opponent's)
        const pitchersContainer = document.createElement("div");
        pitchersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(pitchersContainer);
        
        // Row 3: Batters
        const battersContainer = document.createElement("div");
        battersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(battersContainer);
        
        // Row 4: Bullpen (opponent's)
        const bullpenContainer = document.createElement("div");
        bullpenContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(bullpenContainer);
        
        // Append to row
        rowElement.appendChild(holderEl);
        
        // Create all subtables
        this.createParkFactorsTable(parkContainer, subtableData.park, data);
        this.createWeatherTable(weatherContainer, data);
        this.createPitchersTable(pitchersContainer, subtableData.pitchers, gameId);
        this.createBattersTable(battersContainer, subtableData.batters, gameId);
        this.createBullpenTable(bullpenContainer, subtableData.bullpen, gameId);
        
        // Restore expanded state for subtables
        this.restoreSubtableExpandedState(gameId);
    }
    
    async loadSubtableData(gameId, opponentGameId) {
        // Check cache first
        const cacheKey = `${gameId}_${opponentGameId}`;
        if (this.subtableDataCache.has(cacheKey)) {
            return this.subtableDataCache.get(cacheKey);
        }
        
        console.log(`Loading subtable data for game ID: ${gameId}, opponent: ${opponentGameId}`);
        
        // Load all data in parallel (use opponent ID for pitcher/bullpen)
        const [park, pitchers, batters, bullpen] = await Promise.all([
            this.fetchSubtableData(this.ENDPOINTS.PARK, this.F.PF_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.PITCHERS, this.F.P_GAME_ID, opponentGameId),
            this.fetchSubtableData(this.ENDPOINTS.BATTERS, this.F.B_GAME_ID, gameId),
            this.fetchSubtableData(this.ENDPOINTS.BULLPEN, this.F.BP_GAME_ID, opponentGameId)
        ]);
        
        console.log(`Loaded data for game ${gameId}:`, {
            park: park?.length || 0,
            pitchers: pitchers?.length || 0,
            batters: batters?.length || 0,
            bullpen: bullpen?.length || 0
        });
        
        const data = { park, pitchers, batters, bullpen };
        this.subtableDataCache.set(cacheKey, data);
        return data;
    }
    
    async fetchSubtableData(endpoint, fieldName, gameId) {
        const url = `${this.BASE_URL}${endpoint}?${encodeURIComponent(fieldName)}=eq.${encodeURIComponent(gameId)}&select=*`;
        
        // Use the headers we copied from BaseTable in the constructor
        let headers = this.HEADERS;
        
        if (!headers || !headers.apikey) {
            // Try to get headers from BaseTable config
            if (this.getBaseConfig) {
                const config = this.getBaseConfig();
                if (config.ajaxConfig?.headers) {
                    headers = config.ajaxConfig.headers;
                    console.log('Using headers from BaseTable config');
                }
            }
        }
        
        if (!headers) {
            console.error('No headers available!');
            return [];
        }
        
        console.log(`Fetching from: ${url}`);
        
        try {
            const response = await fetch(url, { 
                method: 'GET',
                headers: headers 
            });
            
            if (!response.ok) {
                console.error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
                try {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                } catch (e) {
                    console.error('Could not read error response');
                }
                return [];
            }
            
            const data = await response.json();
            console.log(`Successfully fetched ${data.length} records from ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint} data:`, error);
            return [];
        }
    }
    
    // Helper method to process player data
    processPlayerData(data, type, gameId) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        const nameField = type === 'pitcher' ? F.P_NAME : F.B_NAME;
        const splitField = type === 'pitcher' ? F.P_SPLIT : F.B_SPLIT;
        
        // Determine location for proper formatting
        const location = type === 'pitcher' ? 
                        this.determineOpposingLocation(gameId) : 
                        this.determineLocation(gameId);
        
        // Group by player name
        const grouped = {};
        
        data.forEach(row => {
            const name = row[nameField];
            if (!grouped[name]) {
                grouped[name] = {
                    parent: null,
                    children: []
                };
            }
            
            // Check split type
            const splitId = row[splitField];
            if (splitId === 'Season' || splitId === 'Full Season' || 
                (!splitId.includes('vs') && !splitId.includes('@') && !splitId.includes('R') && !splitId.includes('L'))) {
                // This is the parent row (full season)
                grouped[name].parent = { ...row, _isParent: true };
            } else {
                grouped[name].children.push(row);
            }
        });
        
        // Build final data structure with correct ordering
        const result = [];
        
        Object.values(grouped).forEach(group => {
            if (group.parent) {
                // Sort children in correct order: vs R, vs L, Season @, vs R @, vs L @
                group.children.sort((a, b) => {
                    const splitA = a[splitField] || '';
                    const splitB = b[splitField] || '';
                    
                    const getPriority = (split) => {
                        // Check for basic patterns
                        if (split === 'R' || split === 'vs R') return 1;
                        if (split === 'L' || split === 'vs L') return 2;
                        if (split === '@' || split === 'Season @') return 3;
                        if (split === 'R @' || split === 'vs R @') return 4;
                        if (split === 'L @' || split === 'vs L @') return 5;
                        
                        // Check for patterns with 'vs' and '@'
                        const hasAt = split.includes('@');
                        const hasR = split.includes('R') || split.includes('Right');
                        const hasL = split.includes('L') || split.includes('Left');
                        
                        if (!hasAt) {
                            if (hasR) return 1;
                            if (hasL) return 2;
                        } else {
                            if (!hasR && !hasL) return 3; // Season @
                            if (hasR) return 4;
                            if (hasL) return 5;
                        }
                        
                        return 6;
                    };
                    
                    return getPriority(splitA) - getPriority(splitB);
                });
                
                // Format split names for children
                group.children = group.children.map(child => ({
                    ...child,
                    [splitField]: this.formatSplitName(child[splitField], location)
                }));
                
                group.parent._children = group.children;
                result.push(group.parent);
            } else if (group.children.length > 0) {
                // No clear parent, use first child as parent
                const parent = { ...group.children[0], _isParent: true };
                parent._children = group.children.slice(1).map(child => ({
                    ...child,
                    [splitField]: this.formatSplitName(child[splitField], location)
                }));
                result.push(parent);
            }
        });
        
        return result;
    }
    
    processBullpenDataGrouped(data, location) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        
        // Separate into righties and lefties
        const righties = [];
        const lefties = [];
        
        data.forEach(row => {
            const handCnt = row[F.BP_HAND_CNT] || '';
            if (handCnt.includes('R')) {
                righties.push(row);
            } else if (handCnt.includes('L')) {
                lefties.push(row);
            }
        });
        
        const result = [];
        
        // Create Righties group with actual pitcher count
        if (righties.length > 0) {
            // Extract the actual number from the BP_HAND_CNT field
            let rightCount = 0;
            righties.forEach(r => {
                const handCnt = r[F.BP_HAND_CNT] || '';
                // Extract number from format like "R (3)"
                const match = handCnt.match(/\((\d+)\)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > rightCount) {
                        rightCount = num;
                    }
                }
            });
            
            // If no number found, default to 1
            if (rightCount === 0) {
                rightCount = 1;
            }
            
            const rightGroup = {
                [F.BP_HAND_CNT]: `Righties (${rightCount})`,
                _isGroup: true,
                _children: righties.map(r => ({
                    ...r,
                    [F.BP_SPLIT]: this.formatSplitName(r[F.BP_SPLIT] || '', location)
                }))
            };
            
            // Calculate totals for the group
            this.calculateGroupTotals(rightGroup, righties, F);
            result.push(rightGroup);
        }
        
        // Create Lefties group with actual pitcher count
        if (lefties.length > 0) {
            let leftCount = 0;
            lefties.forEach(l => {
                const handCnt = l[F.BP_HAND_CNT] || '';
                // Extract number from format like "L (2)"
                const match = handCnt.match(/\((\d+)\)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > leftCount) {
                        leftCount = num;
                    }
                }
            });
            
            // If no number found, default to 1
            if (leftCount === 0) {
                leftCount = 1;
            }
            
            const leftGroup = {
                [F.BP_HAND_CNT]: `Lefties (${leftCount})`,
                _isGroup: true,
                _children: lefties.map(l => ({
                    ...l,
                    [F.BP_SPLIT]: this.formatSplitName(l[F.BP_SPLIT] || '', location)
                }))
            };
            
            // Calculate totals for the group
            this.calculateGroupTotals(leftGroup, lefties, F);
            result.push(leftGroup);
        }
        
        return result;
    }
    
    calculateGroupTotals(group, rows, F) {
        // Calculate totals for numeric fields
        const totals = {
            [F.BP_TBF]: 0,
            [F.BP_H]: 0,
            [F.BP_1B]: 0,
            [F.BP_2B]: 0,
            [F.BP_3B]: 0,
            [F.BP_HR]: 0,
            [F.BP_R]: 0,
            [F.BP_BB]: 0,
            [F.BP_SO]: 0
        };
        
        rows.forEach(row => {
            Object.keys(totals).forEach(field => {
                totals[field] += parseFloat(row[field] || 0);
            });
        });
        
        // Calculate derived fields
        if (totals[F.BP_TBF] > 0) {
            totals[F.BP_H_TBF] = (totals[F.BP_H] / totals[F.BP_TBF]).toFixed(3);
        }
        
        // Calculate weighted ERA
        const earnedRuns = rows.reduce((sum, row) => {
            const era = parseFloat(row[F.BP_ERA] || 0);
            const tbf = parseFloat(row[F.BP_TBF] || 0);
            const innings = tbf / 3;
            const earnedRuns = (era * innings) / 9;
            return sum + earnedRuns;
        }, 0);
        
        if (totals[F.BP_TBF] > 0) {
            const totalInnings = totals[F.BP_TBF] / 3;
            const weightedERA = (earnedRuns * 9) / totalInnings;
            totals[F.BP_ERA] = weightedERA.toFixed(2);
        }
        
        // Apply totals to group
        Object.assign(group, totals);
    }
    
    // Create park factors table
    createParkFactorsTable(container, parkData, matchupData) {
        const F = this.F;
        
        // Get stadium name from matchup data, removing "(Retractable Roof)" if present
        let stadiumName = matchupData[F.PARK] || "Stadium";
        stadiumName = stadiumName.replace(/\s*\(Retractable Roof\)\s*/gi, '').trim();
        
        // Add title with stadium name
        const title = document.createElement("h4");
        title.textContent = `${stadiumName} Park Factors`;
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process and sort park data - Ensure correct order (All, Right, Left)
        const processedData = (parkData || []).map(row => ({
            ...row,
            [F.PF_SPLIT]: row[F.PF_SPLIT] === 'A' ? 'All' : 
                         row[F.PF_SPLIT] === 'R' ? 'Right' : 
                         row[F.PF_SPLIT] === 'L' ? 'Left' : row[F.PF_SPLIT]
        })).sort((a, b) => {
            const order = ['All', 'Right', 'Left'];
            return order.indexOf(a[F.PF_SPLIT]) - order.indexOf(b[F.PF_SPLIT]);
        });
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            headerSort: false,
            data: processedData,
            columns: [
                { title: "Split", field: F.PF_SPLIT, widthGrow: 1, resizable: false, headerSort: false },
                { title: "H", field: F.PF_H, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "1B", field: F.PF_1B, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "2B", field: F.PF_2B, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "3B", field: F.PF_3B, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "HR", field: F.PF_HR, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "R", field: F.PF_R, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "BB", field: F.PF_BB, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.PF_SO, width: 50, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
    }
    
    // Create weather conditions table
    createWeatherTable(container, data) {
        const F = this.F;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Weather Conditions";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Helper function to parse weather data
        const parseWeatherData = (weatherString) => {
            if (!weatherString || weatherString === "N/A") {
                return { time: "N/A", conditions: "N/A" };
            }
            
            // Split by the dash character (–)
            const parts = weatherString.split('–');
            
            if (parts.length >= 2) {
                // Extract time (before the dash) and conditions (after the dash)
                const time = parts[0].trim();
                const conditions = parts.slice(1).join('–').trim(); // Join back in case there are multiple dashes
                return { time, conditions };
            } else {
                // If no dash found, return the whole string as conditions
                return { time: "N/A", conditions: weatherString };
            }
        };
        
        // Prepare weather data by parsing each weather field
        const weatherData = [
            parseWeatherData(data[F.WX1]),
            parseWeatherData(data[F.WX2]),
            parseWeatherData(data[F.WX3]),
            parseWeatherData(data[F.WX4])
        ];
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            headerSort: false,
            data: weatherData,
            columns: [
                { title: "Time", field: "time", widthGrow: 1, resizable: false, headerSort: false },
                { title: "Weather Conditions", field: "conditions", widthGrow: 2, resizable: false, headerSort: false }
            ]
        });
    }
    
    // FIXED: Pitcher table with properly styled single row display
    createPitchersTable(container, pitchersData, gameId) {
        const F = this.F;
        const self = this;
        const location = this.determineOpposingLocation(gameId);
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Opposing Starting Pitcher";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process pitcher data with proper ordering and location
        const processedData = this.processPlayerData(pitchersData, 'pitcher', gameId);
        
        const pitchersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            headerSort: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            dataTreeElementColumn: false,  // Keep false to use custom formatter
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.P_NAME, 
                    widthGrow: 1.8,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        const row = cell.getRow();
                        const value = data[F.P_NAME] || data[F.P_SPLIT] || '';
                        
                        if (!row.getTreeParent()) {
                            // Parent row - return HTML string with expander and name
                            const isExpanded = row.isTreeExpanded();
                            return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                <span style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px; display: inline-block;">${isExpanded ? '−' : '+'}</span>
                                <strong style="display: inline;">${value}</strong>
                            </div>`;
                        } else {
                            // Child row - indented split
                            return `<div style="margin-left: 28px; display: inline;">${data[F.P_SPLIT] || ''}</div>`;
                        }
                    }
                },
                { title: "TBF", field: F.P_TBF, width: 60, hozAlign: "center", resizable: false, headerSort: false },
                { 
                    title: "H/TBF", 
                    field: F.P_H_TBF, 
                    width: 70, 
                    hozAlign: "center", 
                    resizable: false,
                    headerSort: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.P_H, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "1B", field: F.P_1B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "2B", field: F.P_2B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "3B", field: F.P_3B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "HR", field: F.P_HR, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "R", field: F.P_R, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { 
                    title: "ERA", 
                    field: F.P_ERA, 
                    width: 60, 
                    hozAlign: "center", 
                    resizable: false,
                    headerSort: false,
                    formatter: (cell) => this.formatERA(cell.getValue())
                },
                { title: "BB", field: F.P_BB, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.P_SO, width: 45, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
        
        // Add click handler for expanding/collapsing rows
        pitchersTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.P_NAME) {
                const row = cell.getRow();
                if (!row.getTreeParent()) {
                    row.treeToggle();
                }
            }
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'pitchers', pitchersTable);
    }
    
    // FIXED: Batter table with properly styled single row display
    createBattersTable(container, battersData, gameId) {
        const F = this.F;
        const self = this;
        const location = this.determineLocation(gameId);
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Batters";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process batter data with proper ordering and location
        const processedData = this.processPlayerData(battersData, 'batter', gameId);
        
        const battersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            headerSort: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            dataTreeElementColumn: false,  // Keep false to use custom formatter
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.B_NAME, 
                    widthGrow: 1.8,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        const row = cell.getRow();
                        const value = data[F.B_NAME] || data[F.B_SPLIT] || '';
                        
                        if (!row.getTreeParent()) {
                            // Parent row - return HTML string with expander and name
                            const isExpanded = row.isTreeExpanded();
                            return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                <span style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px; display: inline-block;">${isExpanded ? '−' : '+'}</span>
                                <strong style="display: inline;">${value}</strong>
                            </div>`;
                        } else {
                            // Child row - indented split
                            return `<div style="margin-left: 28px; display: inline;">${data[F.B_SPLIT] || ''}</div>`;
                        }
                    }
                },
                { title: "PA", field: F.B_PA, width: 60, hozAlign: "center", resizable: false, headerSort: false },
                { 
                    title: "H/PA", 
                    field: F.B_H_PA, 
                    width: 70, 
                    hozAlign: "center", 
                    resizable: false,
                    headerSort: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.B_H, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "1B", field: F.B_1B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "2B", field: F.B_2B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "3B", field: F.B_3B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "HR", field: F.B_HR, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "R", field: F.B_R, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "RBI", field: F.B_RBI, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "BB", field: F.B_BB, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.B_SO, width: 45, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
        
        // Add click handler for expanding/collapsing rows
        battersTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.B_NAME) {
                const row = cell.getRow();
                if (!row.getTreeParent()) {
                    row.treeToggle();
                }
            }
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'batters', battersTable);
    }
    
    // FIXED: Bullpen table with properly styled single row display
    createBullpenTable(container, bullpenData, gameId) {
        const F = this.F;
        const self = this;
        const location = this.determineOpposingLocation(gameId);
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Opposing Bullpen";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Handle empty bullpen data gracefully
        if (!bullpenData || bullpenData.length === 0) {
            const noDataMsg = document.createElement("div");
            noDataMsg.textContent = "No bullpen data available";
            noDataMsg.style.cssText = "text-align: center; padding: 20px; color: #666;";
            tableContainer.appendChild(noDataMsg);
            return;
        }
        
        // Process bullpen data into groups with correct pitcher counts
        const processedData = this.processBullpenDataGrouped(bullpenData, location);
        
        const bullpenTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            headerSort: false,
            data: processedData,
            dataTree: true,
            dataTreeChildField: "_children",
            dataTreeStartExpanded: false,
            dataTreeElementColumn: false,  // Keep false to use custom formatter
            columns: [
                { 
                    title: "Bullpen Group", 
                    field: F.BP_HAND_CNT, 
                    widthGrow: 1.8,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        const row = cell.getRow();
                        const value = data[F.BP_HAND_CNT] || data[F.BP_SPLIT] || '';
                        
                        if (!row.getTreeParent()) {
                            // Parent row - return HTML string with expander and group name
                            const isExpanded = row.isTreeExpanded();
                            return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                <span style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px; display: inline-block;">${isExpanded ? '−' : '+'}</span>
                                <strong style="display: inline;">${value}</strong>
                            </div>`;
                        } else {
                            // Child row - indented split
                            return `<div style="margin-left: 28px; display: inline;">${data[F.BP_SPLIT] || ''}</div>`;
                        }
                    }
                },
                { title: "TBF", field: F.BP_TBF, width: 60, hozAlign: "center", resizable: false, headerSort: false },
                { 
                    title: "H/TBF", 
                    field: F.BP_H_TBF, 
                    width: 70, 
                    hozAlign: "center", 
                    resizable: false,
                    headerSort: false,
                    formatter: (cell) => this.formatRatio(cell.getValue())
                },
                { title: "H", field: F.BP_H, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "1B", field: F.BP_1B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "2B", field: F.BP_2B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "3B", field: F.BP_3B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "HR", field: F.BP_HR, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "R", field: F.BP_R, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { 
                    title: "ERA", 
                    field: F.BP_ERA, 
                    width: 60, 
                    hozAlign: "center", 
                    resizable: false,
                    headerSort: false,
                    formatter: (cell) => this.formatERA(cell.getValue())
                },
                { title: "BB", field: F.BP_BB, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.BP_SO, width: 45, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
        
        // Add click handler for expanding/collapsing rows
        bullpenTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.BP_HAND_CNT) {
                const row = cell.getRow();
                if (!row.getTreeParent()) {
                    row.treeToggle();
                }
            }
        });
        
        // Track expansion state
        this.trackSubtableExpansion(gameId, 'bullpen', bullpenTable);
    }
    
    // Utility formatting methods
    formatRatio(value) {
        // Format to 3 decimal places, no leading zero
        if (value == null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        const formatted = num.toFixed(3);
        return formatted.startsWith('0.') ? formatted.substring(1) : formatted;
    }
    
    formatERA(value) {
        if (value == null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num.toFixed(2);
    }
    
    formatSplitName(split, location) {
        if (!split) return '';
        
        let formatted = split;
        
        // Replace single letters with full words
        if (formatted === 'R' || formatted === 'L') {
            formatted = `vs ${formatted}`;
        }
        
        // Replace vs R/L with full words
        formatted = formatted.replace(/\bvs R\b/g, 'vs Righties');
        formatted = formatted.replace(/\bvs L\b/g, 'vs Lefties');
        
        // Handle @ replacements with location
        if (formatted.includes('@')) {
            // Replace @ with the actual location
            formatted = formatted.replace(/@/g, location || 'Away');
            
            // Clean up any resulting duplicates
            if (formatted === 'Season Away' || formatted === 'Season At Home') {
                formatted = `Full Season ${location}`;
            } else if (formatted === 'vs Righties Away' || formatted === 'vs Righties At Home') {
                formatted = `vs Righties ${location}`;
            } else if (formatted === 'vs Lefties Away' || formatted === 'vs Lefties At Home') {
                formatted = `vs Lefties ${location}`;
            }
        }
        
        // Map common base values
        if (formatted === 'Season') {
            formatted = 'Full Season';
        } else if (formatted === 'Last 30') {
            formatted = 'Last 30 Days';
        } else if (formatted === 'Last 14') {
            formatted = 'Last 14 Days';
        } else if (formatted === 'Last 7') {
            formatted = 'Last 7 Days';
        }
        
        return formatted;
    }
    
    // Track subtable expansion state
    trackSubtableExpansion(gameId, tableType, table) {
        const key = `${gameId}_${tableType}`;
        
        // Restore expanded state if exists
        if (this.expandedSubtableRows.has(key)) {
            const expandedRows = this.expandedSubtableRows.get(key);
            setTimeout(() => {
                const rows = table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    if ((data._isParent || data._isGroup) && expandedRows.has(JSON.stringify(data))) {
                        row.treeExpand();
                    }
                });
            }, 100);
        }
        
        // Track expansion changes
        table.on("dataTreeRowExpanded", (row) => {
            const data = row.getData();
            if (!this.expandedSubtableRows.has(key)) {
                this.expandedSubtableRows.set(key, new Set());
            }
            this.expandedSubtableRows.get(key).add(JSON.stringify(data));
        });
        
        table.on("dataTreeRowCollapsed", (row) => {
            const data = row.getData();
            if (this.expandedSubtableRows.has(key)) {
                this.expandedSubtableRows.get(key).delete(JSON.stringify(data));
            }
        });
    }
    
    restoreSubtableExpandedState(gameId) {
        // Subtable expansion state is handled in trackSubtableExpansion
    }
    
    // Override destroy to clean up subtable cache
    destroy() {
        this.subtableDataCache.clear();
        this.expandedSubtableRows.clear();
        super.destroy();
    }
}
