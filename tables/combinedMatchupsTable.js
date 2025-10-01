// tables/combinedMatchupsTable.js - FIXED VERSION WITH PROPER REFORMAT CALLS
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        
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
        
        this.BASE_URL = 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
        this.HEADERS = null;
        
        console.log('MatchupsTable initialized with BASE_URL:', this.BASE_URL);
        
        this.ENDPOINTS = {
            MATCHUPS: 'ModMatchupsData',
            PITCHERS: 'ModPitcherMatchups',
            BATTERS: 'ModBatterMatchups',
            BULLPEN: 'ModBullpenMatchups',
            PARK: 'ModParkFactors'
        };
        
        this.F = {
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
        
        this.subtableDataCache = new Map();
        this.subtableInstances = new Map();
        
        if (!window.GLOBAL_SUBTABLE_STATE) {
            window.GLOBAL_SUBTABLE_STATE = new Map();
        }
        this.GLOBAL_SUBTABLE_STATE = window.GLOBAL_SUBTABLE_STATE;
        
        this.isRestoringSubtableState = false;
        this.scrollLocked = false;
    }
    
    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading matchups data...",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            columns: this.getColumns(),
            initialSort: [{column: this.F.MATCH_ID, dir: "asc"}],
            rowFormatter: this.createRowFormatter()
        };
        
        this.table = new Tabulator(this.elementId, config);
        this.setupRowExpansion();
        
        this.table.on("tableBuilt", () => {
            console.log("Matchups table built successfully");
        });
    }
    
    getColumns() {
        const F = this.F;
        
        return [
            {
                title: "Team", 
                field: F.TEAM, 
                widthGrow: 1.2,
                resizable: false,
                headerSort: true,
                formatter: this.createNameFormatter(),
                headerFilter: createCustomMultiSelect
            },
            {
                title: "Game", 
                field: F.GAME, 
                widthGrow: 1.5,
                resizable: false,
                headerSort: false,
                sorter: false
            },
            {
                title: "Spread",
                field: F.SPREAD,
                widthGrow: 0.7,
                hozAlign: "center",
                resizable: false,
                headerSort: false,
                sorter: false
            },
            {
                title: "Total",
                field: F.TOTAL,
                widthGrow: 0.7,
                hozAlign: "center",
                resizable: false,
                headerSort: false,
                sorter: false
            },
            {
                title: "Lineup",
                field: F.LINEUP,
                widthGrow: 1,
                resizable: false,
                headerSort: false,
                sorter: false,
                headerFilter: createCustomMultiSelect
            }
        ];
    }
    
    saveState() {
        super.saveState();
        this.saveSubtableState();
    }
    
    restoreState() {
        super.restoreState();
        setTimeout(() => {
            this.restoreSubtableState();
        }, 300);
    }
    
    saveSubtableState() {
        console.log(`Saving subtable state for ${this.elementId}`);
        
        const subtableStateKey = `${this.elementId}_subtables`;
        let allSubtableState = new Map();
        
        this.subtableInstances.forEach((tableInstance, key) => {
            const [gameId, tableType] = key.split('_');
            
            if (tableInstance && tableInstance.getRows) {
                const expandedRows = new Set();
                
                try {
                    const rows = tableInstance.getRows();
                    rows.forEach(row => {
                        const data = row.getData();
                        if (data._expanded && data._isParent) {
                            const rowId = this.generateSubtableRowId(data, tableType);
                            expandedRows.add(rowId);
                        }
                    });
                    
                    if (expandedRows.size > 0) {
                        allSubtableState.set(key, {
                            expandedRows: expandedRows,
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.error(`Error saving state for subtable ${key}:`, error);
                }
            }
        });
        
        this.GLOBAL_SUBTABLE_STATE.set(subtableStateKey, allSubtableState);
        console.log(`Saved subtable state for ${this.elementId}: ${allSubtableState.size} subtables with expanded rows`);
    }
    
    restoreSubtableState() {
        console.log(`Restoring subtable state for ${this.elementId}`);
        
        const subtableStateKey = `${this.elementId}_subtables`;
        const savedSubtableState = this.GLOBAL_SUBTABLE_STATE.get(subtableStateKey);
        
        if (!savedSubtableState || savedSubtableState.size === 0) {
            console.log(`No subtable state to restore for ${this.elementId}`);
            return;
        }
        
        console.log(`Found saved subtable state for ${savedSubtableState.size} subtables`);
        
        savedSubtableState.forEach((subtableState, key) => {
            const tableInstance = this.subtableInstances.get(key);
            
            if (tableInstance && subtableState.expandedRows && subtableState.expandedRows.size > 0) {
                console.log(`Restoring ${subtableState.expandedRows.size} expanded rows for subtable ${key}`);
                
                setTimeout(() => {
                    this.restoreSubtableExpandedRows(tableInstance, subtableState.expandedRows, key);
                }, 100);
            }
        });
    }
    
    generateSubtableRowId(data, tableType) {
        const F = this.F;
        
        switch (tableType) {
            case 'pitchers':
                return `pitcher_${data[F.P_NAME] || 'unknown'}_${data[F.P_SPLIT] || 'unknown'}`;
            case 'batters':
                return `batter_${data[F.B_NAME] || 'unknown'}_${data[F.B_SPLIT] || 'unknown'}`;
            case 'bullpen':
                return `bullpen_${data[F.BP_HAND_CNT] || 'unknown'}_${data[F.BP_SPLIT] || 'unknown'}`;
            default:
                return `unknown_${JSON.stringify(data).substring(0, 50)}`;
        }
    }
    
    restoreSubtableExpandedRows(tableInstance, expandedRowIds, subtableKey) {
        try {
            const [gameId, tableType] = subtableKey.split('_');
            const rows = tableInstance.getRows();
            let restoredCount = 0;
            
            this.isRestoringSubtableState = true;
            this.scrollLocked = true;
            
            const mainTableHolder = this.table.element.querySelector('.tabulator-tableHolder');
            const scrollTop = mainTableHolder ? mainTableHolder.scrollTop : 0;
            
            console.log(`[Restore] Starting restoration for ${subtableKey}, scroll at ${scrollTop}`);
            
            rows.forEach(row => {
                const data = row.getData();
                if (data._isParent && data._hasChildren) {
                    const rowId = this.generateSubtableRowId(data, tableType);
                    
                    if (expandedRowIds.has(rowId)) {
                        console.log(`[Restore] Expanding row: ${rowId}`);
                        
                        data._expanded = true;
                        
                        const parentIdentifier = this.getParentIdentifier(data, tableType);
                        const allRows = tableInstance.getRows();
                        
                        allRows.forEach(childRow => {
                            const childData = childRow.getData();
                            if (childData._isChild && 
                                this.getParentIdentifier(childData, tableType) === parentIdentifier) {
                                childData._visible = true;
                                // CRITICAL: Force Tabulator to re-render the row
                                childRow.reformat();
                            }
                        });
                        
                        const rowElement = row.getElement();
                        if (rowElement) {
                            rowElement.classList.add('row-expanded');
                            const expanderIcon = rowElement.querySelector('.row-expander');
                            if (expanderIcon) {
                                expanderIcon.innerHTML = "−";
                            }
                        }
                        
                        // Reformat parent row too
                        row.reformat();
                        
                        restoredCount++;
                    }
                }
            });
            
            const restoreScroll = () => {
                if (mainTableHolder && scrollTop > 0) {
                    mainTableHolder.scrollTop = scrollTop;
                }
            };
            
            restoreScroll();
            setTimeout(restoreScroll, 10);
            setTimeout(restoreScroll, 50);
            setTimeout(restoreScroll, 100);
            
            setTimeout(() => {
                this.isRestoringSubtableState = false;
                this.scrollLocked = false;
                console.log(`[Restore] Completed: ${restoredCount} rows expanded`);
            }, 150);
            
        } catch (error) {
            console.error(`[Restore] Error for ${subtableKey}:`, error);
            this.isRestoringSubtableState = false;
            this.scrollLocked = false;
        }
    }
    
    getParentIdentifier(data, tableType) {
        const F = this.F;
        
        switch (tableType) {
            case 'pitchers':
                return data._parentName || data[F.P_NAME];
            case 'batters':
                return data._parentName || data[F.B_NAME];
            case 'bullpen':
                return data._parentId || data[F.BP_HAND_CNT];
            default:
                return 'unknown';
        }
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
                        const tableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                        const scrollTop = tableHolder ? tableHolder.scrollTop : 0;
                        
                        self.createMatchupSubtables(row, data).then(() => {
                            if (tableHolder) {
                                tableHolder.scrollTop = scrollTop;
                            }
                        });
                    }
                }
            } else {
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    const tableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                    const scrollTop = tableHolder ? tableHolder.scrollTop : 0;
                    
                    const gameId = data[self.F.MATCH_ID];
                    self.cleanupSubtableInstances(gameId);
                    
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    setTimeout(() => {
                        if (tableHolder) {
                            tableHolder.scrollTop = scrollTop;
                        }
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }
    
    cleanupSubtableInstances(gameId) {
        const keysToRemove = [];
        
        this.subtableInstances.forEach((instance, key) => {
            if (key.startsWith(`${gameId}_`)) {
                keysToRemove.push(key);
            }
        });
        
        keysToRemove.forEach(key => {
            this.subtableInstances.delete(key);
        });
    }
    
    generateRowId(data) {
        if (data[this.F.MATCH_ID]) {
            return `matchup_${data[this.F.MATCH_ID]}`;
        }
        return super.generateRowId(data);
    }
    
    async createMatchupsSubtable(container, data) {
        await this.createMatchupSubtables_Internal(container, data);
    }
    
    createSubtable2(container, data) {
        return this.createMatchupsSubtable(container, data);
    }
    
    getOpponentGameId(gameId) {
        const id = parseInt(gameId);
        if (id % 10 === 1) {
            return id + 1;
        } else {
            return id - 1;
        }
    }
    
    determineLocation(gameId) {
        const id = parseInt(gameId);
        return (id % 10 === 1) ? 'At Home' : 'Away';
    }
    
    determineOpposingLocation(gameId) {
        const id = parseInt(gameId);
        return (id % 10 === 1) ? 'Away' : 'At Home';
    }
    
    async createMatchupSubtables(row, data) {
        const rowElement = row.getElement();
        return this.createMatchupSubtables_Internal(rowElement, data);
    }
    
    async createMatchupSubtables_Internal(container, data) {
        const gameId = data[this.F.MATCH_ID];
        const opponentGameId = this.getOpponentGameId(gameId);
        
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
        
        const subtableData = await this.loadSubtableData(gameId, opponentGameId);
        
        const topRow = document.createElement("div");
        topRow.style.cssText = "display: flex; gap: 20px; margin-bottom: 15px;";
        
        const parkContainer = document.createElement("div");
        parkContainer.style.cssText = "flex: 1;";
        
        const weatherContainer = document.createElement("div");
        weatherContainer.style.cssText = "flex: 1;";
        
        topRow.appendChild(parkContainer);
        topRow.appendChild(weatherContainer);
        holderEl.appendChild(topRow);
        
        const pitchersContainer = document.createElement("div");
        pitchersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(pitchersContainer);
        
        const battersContainer = document.createElement("div");
        battersContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(battersContainer);
        
        const bullpenContainer = document.createElement("div");
        bullpenContainer.style.cssText = "margin-bottom: 15px;";
        holderEl.appendChild(bullpenContainer);
        
        if (container.appendChild) {
            container.appendChild(holderEl);
        } else {
            container.appendChild(holderEl);
        }
        
        this.createParkFactorsTable(parkContainer, subtableData.park, data);
        this.createWeatherTable(weatherContainer, data);
        this.createPitchersTable(pitchersContainer, subtableData.pitchers, gameId);
        this.createBattersTable(battersContainer, subtableData.batters, gameId);
        this.createBullpenTable(bullpenContainer, subtableData.bullpen, gameId);
        
        setTimeout(() => {
            this.restoreSubtableState();
        }, 200);
    }
    
    async loadSubtableData(gameId, opponentGameId) {
        const cacheKey = `${gameId}_${opponentGameId}`;
        if (this.subtableDataCache.has(cacheKey)) {
            return this.subtableDataCache.get(cacheKey);
        }
        
        console.log(`Loading subtable data for game ID: ${gameId}, opponent: ${opponentGameId}`);
        
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
        
        let headers = this.HEADERS;
        
        if (!headers || !headers.apikey) {
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
    
    processPlayerData(data, type, gameId) {
        if (!data || !data.length) return [];
        
        const F = this.F;
        const nameField = type === 'pitcher' ? F.P_NAME : F.B_NAME;
        const splitField = type === 'pitcher' ? F.P_SPLIT : F.B_SPLIT;
        
        const location = type === 'pitcher' ? 
                        this.determineOpposingLocation(gameId) : 
                        this.determineLocation(gameId);
        
        const grouped = {};
        
        data.forEach(row => {
            const name = row[nameField];
            if (!grouped[name]) {
                grouped[name] = {
                    parent: null,
                    children: []
                };
            }
            
            const splitId = row[splitField];
            if (splitId === 'Season' || splitId === 'Full Season' || 
                (!splitId.includes('vs') && !splitId.includes('@') && !splitId.includes('R') && !splitId.includes('L'))) {
                grouped[name].parent = { ...row, _isParent: true };
            } else {
                grouped[name].children.push(row);
            }
        });
        
        const result = [];
        
        Object.values(grouped).forEach(group => {
            if (group.parent) {
                group.children.sort((a, b) => {
                    const splitA = a[splitField] || '';
                    const splitB = b[splitField] || '';
                    
                    const getPriority = (split) => {
                        if (split === 'R' || split === 'vs R') return 1;
                        if (split === 'L' || split === 'vs L') return 2;
                        if (split === '@' || split === 'Season @' || split === 'Full Season@') return 3;
                        if (split === 'R @' || split === 'vs R @') return 4;
                        if (split === 'L @' || split === 'vs L @') return 5;
                        
                        const hasAt = split.includes('@');
                        const hasR = split.includes('R') || split.includes('Right');
                        const hasL = split.includes('L') || split.includes('Left');
                        
                        if (!hasAt) {
                            if (hasR) return 1;
                            if (hasL) return 2;
                        } else {
                            if (!hasR && !hasL) return 3;
                            if (hasR) return 4;
                            if (hasL) return 5;
                        }
                        
                        return 6;
                    };
                    
                    return getPriority(splitA) - getPriority(splitB);
                });
                
                group.children = group.children.map(child => ({
                    ...child,
                    [splitField]: this.formatSplitName(child[splitField], location)
                }));
                
                group.parent._children = group.children;
                result.push(group.parent);
            } else if (group.children.length > 0) {
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
        
        const righties = [];
        const lefties = [];
        
        data.forEach(row => {
            const handCount = row[F.BP_HAND_CNT] || '';
            if (handCount.startsWith('R') || handCount.includes('Right')) {
                righties.push(row);
            } else if (handCount.startsWith('L') || handCount.includes('Left')) {
                lefties.push(row);
            }
        });
        
        const processGroup = (groupData, handLabel) => {
            if (groupData.length === 0) return null;
            
            let parent = groupData.find(row => {
                const split = row[F.BP_SPLIT];
                return split === 'Season' || split === 'Full Season' || 
                       (!split.includes('vs') && !split.includes('@'));
            });
            
            if (!parent) {
                parent = { ...groupData[0] };
            }
            
            const children = groupData.filter(row => {
                const split = row[F.BP_SPLIT];
                return split !== 'Season' && split !== 'Full Season' && 
                       (split.includes('vs') || split.includes('@'));
            });
            
            children.sort((a, b) => {
                const splitA = a[F.BP_SPLIT] || '';
                const splitB = b[F.BP_SPLIT] || '';
                
                const getPriority = (split) => {
                    if (split === 'R' || split === 'vs R') return 1;
                    if (split === 'L' || split === 'vs L') return 2;
                    if (split === '@' || split === 'Season @') return 3;
                    if (split === 'R @' || split === 'vs R @') return 4;
                    if (split === 'L @' || split === 'vs L @') return 5;
                    return 6;
                };
                
                return getPriority(splitA) - getPriority(splitB);
            });
            
            const formattedChildren = children.map(child => ({
                ...child,
                [F.BP_SPLIT]: this.formatSplitName(child[F.BP_SPLIT], location)
            }));
            
            return {
                ...parent,
                _children: formattedChildren,
                _isParent: true
            };
        };
        
        const result = [];
        
        const rightiesGroup = processGroup(righties, 'Righty Relievers');
        if (rightiesGroup) result.push(rightiesGroup);
        
        const leftiesGroup = processGroup(lefties, 'Lefty Relievers');
        if (leftiesGroup) result.push(leftiesGroup);
        
        return result;
    }
    
    formatRatio(value) {
        if (value == null || value === '') return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        
        let formatted = num.toFixed(3);
        return formatted.charAt(0) === '0' ? formatted.substring(1) : formatted;
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
        
        if (formatted === 'Full Season@' || formatted === 'Season @' || formatted === '@') {
            return location || 'Away';
        }
        
        if (formatted === 'R') {
            formatted = 'vs Righties';
        } else if (formatted === 'L') {
            formatted = 'vs Lefties';
        }
        
        formatted = formatted.replace(/\bvs R\b/g, 'vs Righties');
        formatted = formatted.replace(/\bvs L\b/g, 'vs Lefties');
        
        if (formatted.includes('@')) {
            if (formatted === 'R @' || formatted === 'vs R @') {
                formatted = `vs Righties ${location}`;
            } else if (formatted === 'L @' || formatted === 'vs L @') {
                formatted = `vs Lefties ${location}`;
            } else {
                formatted = formatted.replace(/@/g, location || 'Away');
            }
        }
        
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
    
    createParkFactorsTable(container, parkData, matchupData) {
        const F = this.F;
        
        let stadiumName = matchupData[F.PARK] || "Stadium";
        stadiumName = stadiumName.replace(/\s*\(Retractable Roof\)\s*/gi, '').trim();
        
        const title = document.createElement("h4");
        title.textContent = `${stadiumName} Park Factors`;
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        const processedData = (parkData || []).map(row => ({
            ...row,
            [F.PF_SPLIT]: row[F.PF_SPLIT] === 'A' ? 'All' : 
                         row[F.PF_SPLIT] === 'R' ? 'Right' : 
                         row[F.PF_SPLIT] === 'L' ? 'Left' : 
                         row[F.PF_SPLIT]
        })).sort((a, b) => {
            const order = { 'All': 0, 'Right': 1, 'Left': 2 };
            return (order[a[F.PF_SPLIT]] || 999) - (order[b[F.PF_SPLIT]] || 999);
        });
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: processedData,
            columns: [
                { title: "Split", field: F.PF_SPLIT, widthGrow: 1, resizable: false, headerSort: false },
                { title: "H", field: F.PF_H, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "1B", field: F.PF_1B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "2B", field: F.PF_2B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "3B", field: F.PF_3B, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "HR", field: F.PF_HR, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "R", field: F.PF_R, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "BB", field: F.PF_BB, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.PF_SO, width: 45, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
    }
    
    createWeatherTable(container, data) {
        const F = this.F;
        
        const title = document.createElement("h4");
        title.textContent = "Weather Conditions";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        const wx1 = data[F.WX1] || '';
        const wx2 = data[F.WX2] || '';
        const wx3 = data[F.WX3] || '';
        const wx4 = data[F.WX4] || '';
        
        const conditions = [wx1, wx2, wx3, wx4].filter(w => w).join(' | ');
        
        new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: [{ conditions: conditions || "No weather data available" }],
            columns: [
                { 
                    title: "Conditions", 
                    field: "conditions", 
                    widthGrow: 1,
                    resizable: false,
                    headerSort: false
                }
            ]
        });
    }
    
    createPitchersTable(container, pitchersData, gameId) {
        const F = this.F;
        const self = this;
        
        const title = document.createElement("h4");
        title.textContent = "Opposing Starting Pitcher";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        const processedData = this.processPlayerData(pitchersData, 'pitcher', gameId);
        
        const flattenedData = [];
        processedData.forEach(player => {
            flattenedData.push({
                ...player,
                _expanded: false,
                _isParent: true,
                _hasChildren: player._children && player._children.length > 0
            });
            
            if (player._children) {
                player._children.forEach(child => {
                    flattenedData.push({
                        ...child,
                        _isChild: true,
                        _parentName: player[F.P_NAME],
                        _visible: false
                    });
                });
            }
        });
        
        const pitchersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: flattenedData,
            rowFormatter: function(row) {
                const data = row.getData();
                const rowElement = row.getElement();
                
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                if (data._isChild) {
                    rowElement.style.backgroundColor = '#f8f9fa';
                }
            },
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.P_NAME, 
                    widthGrow: 1.8,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        
                        if (data._isParent) {
                            const value = data[F.P_NAME] || '';
                            if (data._hasChildren) {
                                const isExpanded = data._expanded || false;
                                return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                    <span class="row-expander" style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px;">${isExpanded ? '−' : '+'}</span>
                                    <strong>${value}</strong>
                                </div>`;
                            } else {
                                return `<strong>${value}</strong>`;
                            }
                        } else if (data._isChild) {
                            const splitValue = data[F.P_SPLIT] || '';
                            return `<div style="margin-left: 28px;">${splitValue}</div>`;
                        }
                        
                        return cell.getValue() || '';
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
        
        pitchersTable.on("cellClick", function(e, cell) {
            const data = cell.getData();
            if (data._isParent && data._hasChildren) {
                e.stopPropagation();
                
                const mainTableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                const scrollTop = mainTableHolder ? mainTableHolder.scrollTop : 0;
                self.scrollLocked = true;
                
                console.log(`[Pitchers Click] Before toggle, scroll at ${scrollTop}`);
                
                data._expanded = !data._expanded;
                
                const parentIdentifier = data[F.P_NAME];
                const allRows = pitchersTable.getRows();
                
                allRows.forEach(row => {
                    const rowData = row.getData();
                    if (rowData._isChild && rowData._parentName === parentIdentifier) {
                        rowData._visible = data._expanded;
                        // CRITICAL: Force Tabulator to re-render the row
                        row.reformat();
                    }
                });
                
                const rowElement = cell.getRow().getElement();
                if (rowElement) {
                    if (data._expanded) {
                        rowElement.classList.add('row-expanded');
                    } else {
                        rowElement.classList.remove('row-expanded');
                    }
                }
                
                const expanderIcon = cell.getElement().querySelector('.row-expander');
                if (expanderIcon) {
                    expanderIcon.innerHTML = data._expanded ? "−" : "+";
                }
                
                // Reformat parent row
                cell.getRow().reformat();
                
                const restoreScroll = () => {
                    if (mainTableHolder && scrollTop >= 0) {
                        mainTableHolder.scrollTop = scrollTop;
                    }
                };
                
                restoreScroll();
                requestAnimationFrame(() => {
                    restoreScroll();
                    setTimeout(restoreScroll, 10);
                    setTimeout(restoreScroll, 25);
                    setTimeout(restoreScroll, 50);
                    setTimeout(() => {
                        restoreScroll();
                        self.scrollLocked = false;
                        console.log(`[Pitchers Click] Scroll restored to ${scrollTop}`);
                    }, 100);
                });
                
                setTimeout(() => {
                    self.saveSubtableState();
                }, 150);
            }
        });
        
        const subtableKey = `${gameId}_pitchers`;
        this.subtableInstances.set(subtableKey, pitchersTable);
    }
    
    createBattersTable(container, battersData, gameId) {
        const F = this.F;
        const self = this;
        
        const title = document.createElement("h4");
        title.textContent = "Batters";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        const processedData = this.processPlayerData(battersData, 'batter', gameId);
        
        const flattenedData = [];
        processedData.forEach(player => {
            flattenedData.push({
                ...player,
                _expanded: false,
                _isParent: true,
                _hasChildren: player._children && player._children.length > 0
            });
            
            if (player._children) {
                player._children.forEach(child => {
                    flattenedData.push({
                        ...child,
                        _isChild: true,
                        _parentName: player[F.B_NAME],
                        _visible: false
                    });
                });
            }
        });
        
        const battersTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: flattenedData,
            rowFormatter: function(row) {
                const data = row.getData();
                const rowElement = row.getElement();
                
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                if (data._isChild) {
                    rowElement.style.backgroundColor = '#f8f9fa';
                }
            },
            columns: [
                { 
                    title: "Name/Split", 
                    field: F.B_NAME, 
                    widthGrow: 1.8,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        
                        if (data._isParent) {
                            const value = data[F.B_NAME] || '';
                            if (data._hasChildren) {
                                const isExpanded = data._expanded || false;
                                return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                    <span class="row-expander" style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px;">${isExpanded ? '−' : '+'}</span>
                                    <strong>${value}</strong>
                                </div>`;
                            } else {
                                return `<strong>${value}</strong>`;
                            }
                        } else if (data._isChild) {
                            const splitValue = data[F.B_SPLIT] || '';
                            return `<div style="margin-left: 28px;">${splitValue}</div>`;
                        }
                        
                        return cell.getValue() || '';
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
                { title: "RBI", field: F.B_RBI, width: 50, hozAlign: "center", resizable: false, headerSort: false },
                { title: "BB", field: F.B_BB, width: 45, hozAlign: "center", resizable: false, headerSort: false },
                { title: "SO", field: F.B_SO, width: 45, hozAlign: "center", resizable: false, headerSort: false }
            ]
        });
        
        battersTable.on("cellClick", function(e, cell) {
            const data = cell.getData();
            if (data._isParent && data._hasChildren) {
                e.stopPropagation();
                
                const mainTableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                const scrollTop = mainTableHolder ? mainTableHolder.scrollTop : 0;
                self.scrollLocked = true;
                
                console.log(`[Batters Click] Before toggle, scroll at ${scrollTop}`);
                
                data._expanded = !data._expanded;
                
                const parentIdentifier = data[F.B_NAME];
                const allRows = battersTable.getRows();
                
                allRows.forEach(row => {
                    const rowData = row.getData();
                    if (rowData._isChild && rowData._parentName === parentIdentifier) {
                        rowData._visible = data._expanded;
                        // CRITICAL: Force Tabulator to re-render the row
                        row.reformat();
                    }
                });
                
                const rowElement = cell.getRow().getElement();
                if (rowElement) {
                    if (data._expanded) {
                        rowElement.classList.add('row-expanded');
                    } else {
                        rowElement.classList.remove('row-expanded');
                    }
                }
                
                const expanderIcon = cell.getElement().querySelector('.row-expander');
                if (expanderIcon) {
                    expanderIcon.innerHTML = data._expanded ? "−" : "+";
                }
                
                // Reformat parent row
                cell.getRow().reformat();
                
                const restoreScroll = () => {
                    if (mainTableHolder && scrollTop >= 0) {
                        mainTableHolder.scrollTop = scrollTop;
                    }
                };
                
                restoreScroll();
                requestAnimationFrame(() => {
                    restoreScroll();
                    setTimeout(restoreScroll, 10);
                    setTimeout(restoreScroll, 25);
                    setTimeout(restoreScroll, 50);
                    setTimeout(() => {
                        restoreScroll();
                        self.scrollLocked = false;
                        console.log(`[Batters Click] Scroll restored to ${scrollTop}`);
                    }, 100);
                });
                
                setTimeout(() => {
                    self.saveSubtableState();
                }, 150);
            }
        });
        
        const subtableKey = `${gameId}_batters`;
        this.subtableInstances.set(subtableKey, battersTable);
    }
    
    createBullpenTable(container, bullpenData, gameId) {
        const F = this.F;
        const self = this;
        const location = this.determineOpposingLocation(gameId);
        
        const title = document.createElement("h4");
        title.textContent = "Opposing Bullpen";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        if (!bullpenData || bullpenData.length === 0) {
            const noDataMsg = document.createElement("div");
            noDataMsg.textContent = "No bullpen data available";
            noDataMsg.style.cssText = "text-align: center; padding: 20px; color: #666;";
            tableContainer.appendChild(noDataMsg);
            return;
        }
        
        const processedData = this.processBullpenDataGrouped(bullpenData, location);
        
        const flattenedData = [];
        processedData.forEach(group => {
            const parentRow = {
                ...group,
                _isParent: true,
                _expanded: false,
                _hasChildren: group._children && group._children.length > 0,
                _parentId: group[F.BP_HAND_CNT] || 'unknown'
            };
            flattenedData.push(parentRow);
            
            if (group._children) {
                group._children.forEach(child => {
                    flattenedData.push({
                        ...child,
                        _isChild: true,
                        _parentId: group[F.BP_HAND_CNT] || 'unknown',
                        _visible: false
                    });
                });
            }
        });
        
        const bullpenTable = new Tabulator(tableContainer, {
            layout: "fitColumns",
            height: false,
            resizableColumns: false,
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: flattenedData,
            rowFormatter: function(row) {
                const data = row.getData();
                const rowElement = row.getElement();
                
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                if (data._isChild) {
                    rowElement.style.backgroundColor = '#f8f9fa';
                }
            },
            columns: [
                { 
                    title: "Hand/Split", 
                    field: F.BP_HAND_CNT, 
                    widthGrow: 1.5,
                    resizable: false,
                    headerSort: false,
                    formatter: function(cell) {
                        const data = cell.getData();
                        
                        if (data._isParent) {
                            const value = data[F.BP_HAND_CNT] || '';
                            if (data._hasChildren) {
                                const isExpanded = data._expanded || false;
                                return `<div style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                                    <span class="row-expander" style="margin-right: 8px; font-weight: bold; color: #007bff; font-size: 14px; min-width: 12px;">${isExpanded ? '−' : '+'}</span>
                                    <strong>${value}</strong>
                                </div>`;
                            } else {
                                return `<strong>${value}</strong>`;
                            }
                        } else if (data._isChild) {
                            const splitValue = data[F.BP_SPLIT] || '';
                            return `<div style="margin-left: 28px;">${splitValue}</div>`;
                        }
                        
                        return cell.getValue() || '';
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
        
        bullpenTable.on("cellClick", function(e, cell) {
            const data = cell.getData();
            if (data._isParent && data._hasChildren) {
                e.stopPropagation();
                
                const mainTableHolder = self.table.element.querySelector('.tabulator-tableHolder');
                const scrollTop = mainTableHolder ? mainTableHolder.scrollTop : 0;
                self.scrollLocked = true;
                
                console.log(`[Bullpen Click] Before toggle, scroll at ${scrollTop}`);
                
                data._expanded = !data._expanded;
                
                const parentIdentifier = data._parentId;
                const allRows = bullpenTable.getRows();
                
                allRows.forEach(row => {
                    const rowData = row.getData();
                    if (rowData._isChild && rowData._parentId === parentIdentifier) {
                        rowData._visible = data._expanded;
                        // CRITICAL: Force Tabulator to re-render the row
                        row.reformat();
                    }
                });
                
                const rowElement = cell.getRow().getElement();
                if (rowElement) {
                    if (data._expanded) {
                        rowElement.classList.add('row-expanded');
                    } else {
                        rowElement.classList.remove('row-expanded');
                    }
                }
                
                const expanderIcon = cell.getElement().querySelector('.row-expander');
                if (expanderIcon) {
                    expanderIcon.innerHTML = data._expanded ? "−" : "+";
                }
                
                // Reformat parent row
                cell.getRow().reformat();
                
                const restoreScroll = () => {
                    if (mainTableHolder && scrollTop >= 0) {
                        mainTableHolder.scrollTop = scrollTop;
                    }
                };
                
                restoreScroll();
                requestAnimationFrame(() => {
                    restoreScroll();
                    setTimeout(restoreScroll, 10);
                    setTimeout(restoreScroll, 25);
                    setTimeout(restoreScroll, 50);
                    setTimeout(() => {
                        restoreScroll();
                        self.scrollLocked = false;
                        console.log(`[Bullpen Click] Scroll restored to ${scrollTop}`);
                    }, 100);
                });
                
                setTimeout(() => {
                    self.saveSubtableState();
                }, 150);
            }
        });
        
        const subtableKey = `${gameId}_bullpen`;
        this.subtableInstances.set(subtableKey, bullpenTable);
    }
}
