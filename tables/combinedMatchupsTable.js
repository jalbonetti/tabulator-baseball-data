// tables/combinedMatchupsTable.js - FIXED VERSION WITH PROPER SUBTABLE STATE PRESERVATION
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

        // NEW: Subtable state management integrated with global state
        this.subtableInstances = new Map(); // Track active subtable instances
        this.pendingSubtableRestores = new Map();

        // Initialize global subtable state if not exists
        if (!window.GLOBAL_SUBTABLE_STATE) {
            window.GLOBAL_SUBTABLE_STATE = new Map();
        }
        this.GLOBAL_SUBTABLE_STATE = window.GLOBAL_SUBTABLE_STATE;
    }
    
    initialize() {
        const config = {
            ...this.tableConfig,
            placeholder: "Loading matchups data...",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            columns: this.getColumns(),
            initialSort: [
                {column: this.F.MATCH_ID, dir: "asc"}
            ],
            rowFormatter: this.createRowFormatter()
        };
        
        this.table = new Tabulator(this.elementId, config);
        
        // CRITICAL: Use the base class setupRowExpansion which has proper global state management
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
                formatter: this.createNameFormatter(), // Use the base class formatter
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
    
    // Override saveState to include subtable state
    saveState() {
        // Call parent saveState first
        super.saveState();
        
        // Save subtable expansion state
        this.saveSubtableState();
    }
    
    // Override restoreState to include subtable state
    restoreState() {
        // Call parent restoreState first
        super.restoreState();
        
        // Restore subtable state after a delay to ensure main table is ready
        setTimeout(() => {
            this.restoreSubtableState();
        }, 300);
    }
    
    // NEW: Save subtable expansion state to global state
    saveSubtableState() {
        console.log(`Saving subtable state for ${this.elementId}`);

        const container = this.getSubtableStateContainer();
        let activeCount = 0;

        this.subtableInstances.forEach((instanceInfo, key) => {
            if (!instanceInfo || !instanceInfo.table || !instanceInfo.type) {
                return;
            }

            if (!instanceInfo.built || !instanceInfo.table._matchupsBuilt) {
                return;
            }

            const { table: tableInstance, type: tableType } = instanceInfo;

            if (!tableInstance.getRows) {
                return;
            }

            const expandedRows = new Set();

            try {
                const rows = tableInstance.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    if (data && data._isParent && data._expanded) {
                        const rowId = this.generateSubtableRowId(data, tableType);
                        expandedRows.add(rowId);
                    }
                });

                if (expandedRows.size > 0) {
                    let state = container.get(key);
                    if (!state) {
                        state = { expandedRows: new Set(), timestamp: Date.now() };
                        container.set(key, state);
                    }

                    state.expandedRows = expandedRows;
                    state.timestamp = Date.now();
                    activeCount++;
                } else {
                    container.delete(key);
                }
            } catch (error) {
                console.error(`Error saving state for subtable ${key}:`, error);
            }
        });

        console.log(`Saved subtable state for ${this.elementId}: ${activeCount} subtables with expanded rows`);
    }

    // NEW: Restore subtable expansion state from global state
    restoreSubtableState() {
        console.log(`Restoring subtable state for ${this.elementId}`);

        const container = this.getSubtableStateContainer();

        if (!container || container.size === 0) {
            console.log(`No subtable state to restore for ${this.elementId}`);
            return;
        }

        console.log(`Found saved subtable state for ${container.size} subtables`);

        container.forEach((subtableState, key) => {
            if (!subtableState || !subtableState.expandedRows) {
                return;
            }

            const expandedRows = subtableState.expandedRows instanceof Set
                ? subtableState.expandedRows
                : new Set(subtableState.expandedRows || []);

            if (expandedRows.size === 0) {
                return;
            }

            const instanceInfo = this.subtableInstances.get(key);

            if (instanceInfo && instanceInfo.table) {
                if (instanceInfo.built && instanceInfo.table._matchupsBuilt) {
                    console.log(`Restoring ${expandedRows.size} expanded rows for subtable ${key}`);
                    this.restoreSubtableRowsForInstance(key, expandedRows);
                } else {
                    this.queuePendingSubtableRestore(key, expandedRows);
                }
            } else {
                this.queuePendingSubtableRestore(key, expandedRows);
            }
        });
    }

    // NEW: Generate stable ID for subtable rows
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

    // NEW: Helpers for managing subtable state keys and containers
    buildSubtableKey(gameId, tableType) {
        return `${gameId}_${tableType}`;
    }

    parseSubtableKey(key) {
        const lastIndex = key.lastIndexOf('_');
        if (lastIndex === -1) {
            return { gameId: key, tableType: '' };
        }
        return {
            gameId: key.substring(0, lastIndex),
            tableType: key.substring(lastIndex + 1)
        };
    }

    queuePendingSubtableRestore(subtableKey, expandedRows) {
        if (!expandedRows || expandedRows.size === 0) {
            this.pendingSubtableRestores.delete(subtableKey);
            return;
        }

        const rowsSet = expandedRows instanceof Set ? expandedRows : new Set(expandedRows);
        this.pendingSubtableRestores.set(subtableKey, new Set(rowsSet));
    }

    getSubtableElement(tableInstance) {
        if (!tableInstance) {
            return null;
        }

        if (tableInstance.element) {
            return tableInstance.element;
        }

        if (tableInstance.table && tableInstance.table.element) {
            return tableInstance.table.element;
        }

        return null;
    }

    isSubtableElementReady(tableInstance) {
        const element = this.getSubtableElement(tableInstance);
        return Boolean(element && element.isConnected);
    }

    getSubtableStateContainer() {
        const subtableStateKey = `${this.elementId}_subtables`;
        let state = this.GLOBAL_SUBTABLE_STATE.get(subtableStateKey);

        if (!state) {
            state = new Map();
            this.GLOBAL_SUBTABLE_STATE.set(subtableStateKey, state);
        }

        return state;
    }

    getSavedExpandedRows(subtableKey) {
        const container = this.getSubtableStateContainer();
        const subtableState = container.get(subtableKey);

        if (!subtableState || !subtableState.expandedRows) {
            return null;
        }

        if (subtableState.expandedRows instanceof Set) {
            return subtableState.expandedRows;
        }

        if (Array.isArray(subtableState.expandedRows)) {
            const expandedRows = new Set(subtableState.expandedRows);
            subtableState.expandedRows = expandedRows;
            return expandedRows;
        }

        return null;
    }

    updateSubtableExpansionState(gameId, tableType, rowId, isExpanded) {
        const container = this.getSubtableStateContainer();
        const subtableKey = this.buildSubtableKey(gameId, tableType);
        let subtableState = container.get(subtableKey);

        if (!subtableState) {
            subtableState = { expandedRows: new Set(), timestamp: Date.now() };
            container.set(subtableKey, subtableState);
        }

        if (!(subtableState.expandedRows instanceof Set)) {
            subtableState.expandedRows = new Set(subtableState.expandedRows || []);
        }

        if (isExpanded) {
            subtableState.expandedRows.add(rowId);
        } else {
            subtableState.expandedRows.delete(rowId);
        }

        subtableState.timestamp = Date.now();

        if (subtableState.expandedRows.size === 0) {
            container.delete(subtableKey);
        }
    }

    registerSubtableInstance(gameId, tableType, tableInstance) {
        const subtableKey = this.buildSubtableKey(gameId, tableType);
        const instanceInfo = {
            table: tableInstance,
            type: tableType,
            gameId: gameId,
            built: false
        };

        tableInstance._matchupsKey = subtableKey;
        tableInstance._matchupsBuilt = false;

        this.subtableInstances.set(subtableKey, instanceInfo);

        const handleBuilt = () => {
            if (instanceInfo.built) {
                return;
            }

            instanceInfo.built = true;
            tableInstance._matchupsBuilt = true;

            const pending = this.pendingSubtableRestores.get(subtableKey);
            if (pending && pending.size > 0) {
                this.restoreSubtableRowsForInstance(subtableKey, pending);
                this.pendingSubtableRestores.delete(subtableKey);
            } else {
                this.restoreSubtableRowsForInstance(subtableKey);
            }

            this.refreshSubtableLayout(tableInstance);
        };

        if (typeof tableInstance.on === 'function') {
            tableInstance.on('tableBuilt', handleBuilt);
        }

        // Fallback in case tableBuilt fired synchronously
        const scheduleBuiltCheck = () => {
            if (!instanceInfo.built && this.isSubtableElementReady(tableInstance)) {
                handleBuilt();
            }
        };

        if (typeof queueMicrotask === 'function') {
            queueMicrotask(scheduleBuiltCheck);
        } else {
            Promise.resolve().then(scheduleBuiltCheck);
        }
    }

    restoreSubtableRowsForInstance(subtableKey, expandedRowIds = null) {
        const instanceInfo = this.subtableInstances.get(subtableKey);

        if (!instanceInfo || !instanceInfo.table) {
            return;
        }

        const { table: tableInstance, type: tableType, gameId, built } = instanceInfo;
        const targetExpandedRows = expandedRowIds
            ? (expandedRowIds instanceof Set ? expandedRowIds : new Set(expandedRowIds))
            : this.getSavedExpandedRows(subtableKey);

        if (!targetExpandedRows || targetExpandedRows.size === 0) {
            return;
        }

        if (!built || !tableInstance._matchupsBuilt) {
            this.queuePendingSubtableRestore(subtableKey, targetExpandedRows);
            return;
        }

        requestAnimationFrame(() => {
            try {
                const rows = tableInstance.getRows();

                rows.forEach(row => {
                    const data = row.getData();
                    if (data && data._isParent && data._hasChildren) {
                        const rowId = this.generateSubtableRowId(data, tableType);

                        if (targetExpandedRows.has(rowId)) {
                            this.toggleSubtableParentRow(tableInstance, row, tableType, gameId, true, { updateState: false });
                        }
                    }
                });
            } catch (error) {
                console.error(`Error restoring subtable rows for ${subtableKey}:`, error);
            }
        });
    }

    toggleSubtableParentRow(tableInstance, rowComponent, tableType, gameId, desiredState = null, options = {}) {
        if (!rowComponent || !tableInstance) {
            return;
        }

        const data = rowComponent.getData();
        if (!data || !data._isParent || !data._hasChildren) {
            return;
        }

        const shouldExpand = desiredState !== null ? desiredState : !Boolean(data._expanded);

        if (data._expanded === shouldExpand && desiredState !== null) {
            return;
        }

        const { updateState = true } = options;
        const parentIdentifier = this.getParentIdentifier(data, tableType);

        // Update parent data
        data._expanded = shouldExpand;
        rowComponent.update({ _expanded: shouldExpand });

        // Update children visibility
        try {
            const rows = tableInstance.getRows();
            rows.forEach(childRow => {
                const childData = childRow.getData();

                if (childData && childData._isChild && this.getParentIdentifier(childData, tableType) === parentIdentifier) {
                    childData._visible = shouldExpand;
                    childRow.update({ _visible: shouldExpand });

                    const childElement = childRow.getElement();
                    if (childElement) {
                        childElement.style.display = shouldExpand ? '' : 'none';
                    }
                }
            });
        } catch (error) {
            console.error('Error updating child rows for subtable toggle:', error);
        }

        // Update expander icon
        const field = tableType === 'pitchers'
            ? this.F.P_NAME
            : tableType === 'batters'
                ? this.F.B_NAME
                : this.F.BP_HAND_CNT;

        try {
            const cell = rowComponent.getCell(field);
            if (cell) {
                const cellElement = cell.getElement();
                if (cellElement) {
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.textContent = shouldExpand ? '−' : '+';
                    }
                }
            }
        } catch (error) {
            console.error('Error updating subtable expander icon:', error);
        }

        rowComponent.reformat();

        // Ensure the subtable recalculates its layout after children visibility changes
        this.refreshSubtableLayout(tableInstance);

        if (updateState) {
            const rowId = this.generateSubtableRowId(data, tableType);
            this.updateSubtableExpansionState(gameId, tableType, rowId, shouldExpand);
            this.saveSubtableState();
        }
    }

    refreshSubtableLayout(tableInstance) {
        if (!tableInstance || !tableInstance.getRows) {
            return;
        }

        if (!tableInstance._matchupsBuilt) {
            return;
        }

        const tableElement = this.getSubtableElement(tableInstance);
        if (!tableElement || !tableElement.isConnected) {
            return;
        }

        try {
            const rows = tableInstance.getRows();
            rows.forEach(row => {
                if (row && typeof row.normalizeHeight === 'function') {
                    row.normalizeHeight();
                }
            });
        } catch (error) {
            console.error('Error normalizing subtable row heights:', error);
        }

        requestAnimationFrame(() => {
            try {
                const currentElement = this.getSubtableElement(tableInstance);
                if (!currentElement || !currentElement.isConnected) {
                    return;
                }

                if (tableInstance.rowManager && typeof tableInstance.rowManager.adjustTableHeight === 'function') {
                    tableInstance.rowManager.adjustTableHeight();
                }
                tableInstance.redraw(true);
            } catch (error) {
                console.error('Error refreshing subtable layout:', error);
            }
        });
    }

    // NEW: Restore expanded rows for a specific subtable
    restoreSubtableExpandedRows(tableInstance, expandedRowIds, subtableKey) {
        this.restoreSubtableRowsForInstance(subtableKey, expandedRowIds);
    }
    
    // NEW: Get parent identifier for matching child rows
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
    
    // FIXED: Use the standard BaseTable createRowFormatter with matchups-specific logic
    createRowFormatter() {
        const self = this;
        
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
                
                // During restoration or if doesn't exist, create subtables
                if (!existingSubrow || self.isRestoringState) {
                    // Remove old subtable if it exists during restoration
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        // Create subtables asynchronously to avoid blocking
                        self.createMatchupSubtables(row, data).then(() => {
                            // Normalize height once subtables have rendered
                            setTimeout(() => {
                                row.normalizeHeight();
                            }, 100);
                        });
                    }
                }
            } else {
                // Handle contraction
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    // Clean up subtable instances
                    const gameId = data[self.F.MATCH_ID];
                    self.cleanupSubtableInstances(gameId);

                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');

                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }
    
    // NEW: Clean up subtable instances when main row is collapsed
    cleanupSubtableInstances(gameId) {
        const keysToRemove = [];

        this.subtableInstances.forEach((instance, key) => {
            if (key.startsWith(`${gameId}_`)) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => {
            this.subtableInstances.delete(key);
            this.pendingSubtableRestores.delete(key);
        });
    }
    
    // Override from BaseTable for proper ID generation
    generateRowId(data) {
        if (data[this.F.MATCH_ID]) {
            return `matchup_${data[this.F.MATCH_ID]}`;
        }
        return super.generateRowId(data);
    }
    
    // FIXED: Custom subtable method that integrates with main table functionality
    async createMatchupsSubtable(container, data) {
        // This method is called from the base class createSubtable2
        await this.createMatchupSubtables_Internal(container, data);
    }
    
    // Required override from BaseTable - now properly implemented
    createSubtable2(container, data) {
        // For matchups table, delegate to our custom matchup subtable creation
        return this.createMatchupsSubtable(container, data);
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
        return this.createMatchupSubtables_Internal(rowElement, data);
    }
    
    async createMatchupSubtables_Internal(container, data) {
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
        
        // Append to container
        if (container.appendChild) {
            // If container is a row element
            container.appendChild(holderEl);
        } else {
            // If container is just a div
            container.appendChild(holderEl);
        }
        
        // Create all subtables
        this.createParkFactorsTable(parkContainer, subtableData.park, data);
        this.createWeatherTable(weatherContainer, data);
        this.createPitchersTable(pitchersContainer, subtableData.pitchers, gameId);
        this.createBattersTable(battersContainer, subtableData.batters, gameId);
        this.createBullpenTable(bullpenContainer, subtableData.bullpen, gameId);
        
        // FIXED: Restore subtable state after creation
        setTimeout(() => {
            this.restoreSubtableState();
        }, 200);
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
                        if (split === '@' || split === 'Season @' || split === 'Full Season@') return 3;
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
            // Handle formats like "5 Righties", "4 Lefties"
            if (handCnt.match(/\d+\s+Right/i)) {
                righties.push(row);
            } else if (handCnt.match(/\d+\s+Left/i)) {
                lefties.push(row);
            }
        });
        
        const result = [];
        
        // Create Righties group
        if (righties.length > 0) {
            // Extract the number from "5 Righties" format
            let rightCount = 0;
            righties.forEach(r => {
                const handCnt = r[F.BP_HAND_CNT] || '';
                const match = handCnt.match(/^(\d+)\s+/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > rightCount) rightCount = num;
                }
            });
            
            // Find the Full Season data for the parent row
            const rightFullSeason = righties.find(r => {
                const split = r[F.BP_SPLIT] || '';
                return split === 'Season' || split === 'Full Season';
            });
            
            // Sort splits and exclude Full Season from children
            const sortedRighties = this.sortBullpenSplits(
                righties.filter(r => {
                    const split = r[F.BP_SPLIT] || '';
                    return split !== 'Season' && split !== 'Full Season';
                }), 
                location
            );
            
            const rightGroup = {
                [F.BP_HAND_CNT]: `Righties (${rightCount})`,
                _isGroup: true,
                _children: sortedRighties,
                // Copy Full Season stats to parent row
                ...(rightFullSeason || {})
            };
            
            // Override the name field to ensure correct display
            rightGroup[F.BP_HAND_CNT] = `Righties (${rightCount})`;
            
            result.push(rightGroup);
        }
        
        // Create Lefties group
        if (lefties.length > 0) {
            // Extract the number from "4 Lefties" format
            let leftCount = 0;
            lefties.forEach(l => {
                const handCnt = l[F.BP_HAND_CNT] || '';
                const match = handCnt.match(/^(\d+)\s+/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > leftCount) leftCount = num;
                }
            });
            
            // Find the Full Season data for the parent row
            const leftFullSeason = lefties.find(l => {
                const split = l[F.BP_SPLIT] || '';
                return split === 'Season' || split === 'Full Season';
            });
            
            // Sort splits and exclude Full Season from children
            const sortedLefties = this.sortBullpenSplits(
                lefties.filter(l => {
                    const split = l[F.BP_SPLIT] || '';
                    return split !== 'Season' && split !== 'Full Season';
                }), 
                location
            );
            
            const leftGroup = {
                [F.BP_HAND_CNT]: `Lefties (${leftCount})`,
                _isGroup: true,
                _children: sortedLefties,
                // Copy Full Season stats to parent row
                ...(leftFullSeason || {})
            };
            
            // Override the name field to ensure correct display
            leftGroup[F.BP_HAND_CNT] = `Lefties (${leftCount})`;
            
            result.push(leftGroup);
        }
        
        return result;
    }
    
    sortBullpenSplits(splits, location) {
        const F = this.F;
        
        // Create a map of splits by their type
        const splitMap = new Map();
        
        splits.forEach(split => {
            const splitId = split[F.BP_SPLIT] || '';
            let splitType = 'unknown';
            
            // Determine split type (Full Season is already excluded)
            if (splitId === 'vs R' || splitId === 'R') {
                if (splitId.includes('@')) {
                    splitType = 'rightiesAway';
                } else {
                    splitType = 'righties';
                }
            } else if (splitId === 'vs L' || splitId === 'L') {
                if (splitId.includes('@')) {
                    splitType = 'leftiesAway';
                } else {
                    splitType = 'lefties';
                }
            } else if (splitId.includes('@') || splitId === 'Full Season@' || splitId === 'Season @' || splitId === '@') {
                if (splitId.includes('R')) {
                    splitType = 'rightiesAway';
                } else if (splitId.includes('L')) {
                    splitType = 'leftiesAway';
                } else {
                    splitType = 'fullSeasonAway';
                }
            }
            
            // Store the split with formatted name
            splitMap.set(splitType, {
                ...split,
                [F.BP_SPLIT]: this.formatSplitName(splitId, location)
            });
        });
        
        // Return splits in the correct order (5 splits, excluding Full Season)
        const orderedSplits = [];
        const typeOrder = ['righties', 'lefties', 'fullSeasonAway', 'rightiesAway', 'leftiesAway'];
        
        typeOrder.forEach(type => {
            if (splitMap.has(type)) {
                orderedSplits.push(splitMap.get(type));
            }
        });
        
        return orderedSplits;
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
        
        // Handle "Full Season@" or "Season @" - just show location
        if (formatted === 'Full Season@' || formatted === 'Season @' || formatted === '@') {
            return location || 'Away';
        }
        
        // Replace single letters with full words
        if (formatted === 'R') {
            formatted = 'vs Righties';
        } else if (formatted === 'L') {
            formatted = 'vs Lefties';
        }
        
        // Replace vs R/L with full words
        formatted = formatted.replace(/\bvs R\b/g, 'vs Righties');
        formatted = formatted.replace(/\bvs L\b/g, 'vs Lefties');
        
        // Handle @ replacements with location
        if (formatted.includes('@')) {
            // Special handling for splits with @
            if (formatted === 'R @' || formatted === 'vs R @') {
                formatted = `vs Righties ${location}`;
            } else if (formatted === 'L @' || formatted === 'vs L @') {
                formatted = `vs Lefties ${location}`;
            } else {
                // General @ replacement
                formatted = formatted.replace(/@/g, location || 'Away');
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
    
    // ✅ FIXED: Park Factors Table - Disabled sorting and resizing
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
    
    // ✅ FIXED: Weather Table - Disabled sorting and resizing
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
            resizableRows: false,
            headerSort: false,
            movableColumns: false,
            data: weatherData,
            columns: [
                { 
                    title: "Time", 
                    field: "time", 
                    widthGrow: 1,
                    resizable: false,
                    headerSort: false
                },
                { 
                    title: "Conditions", 
                    field: "conditions", 
                    widthGrow: 3,
                    resizable: false,
                    headerSort: false
                }
            ]
        });
    }
    
    // ✅ FIXED: Starting Pitchers Table - Properly integrated with subtable state management
    createPitchersTable(container, pitchersData, gameId) {
        const F = this.F;
        const self = this;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Opposing Starting Pitcher";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process pitcher data
        const processedData = this.processPlayerData(pitchersData, 'pitcher', gameId);
        
        // Create flat data structure with all rows (parent and children)
        const flattenedData = [];
        processedData.forEach(player => {
            // Add parent row
            flattenedData.push({
                ...player,
                _expanded: false,
                _isParent: true,
                _hasChildren: player._children && player._children.length > 0
            });
            
            // Add child rows (initially hidden)
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
                
                // Hide/show rows based on parent expansion
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                // Style child rows
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
        
        // NEW: Enhanced click handler leveraging shared toggle logic
        pitchersTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.P_NAME) {
                const row = cell.getRow();
                self.toggleSubtableParentRow(pitchersTable, row, 'pitchers', gameId);
            }
        });

        this.refreshSubtableLayout(pitchersTable);

        // Register this subtable instance for state management
        this.registerSubtableInstance(gameId, 'pitchers', pitchersTable);
    }
    
    // ✅ FIXED: Batters Table - Properly integrated with subtable state management
    createBattersTable(container, battersData, gameId) {
        const F = this.F;
        const self = this;
        
        // Add title
        const title = document.createElement("h4");
        title.textContent = "Batters";
        title.style.cssText = "margin: 0 0 10px 0; font-weight: bold; text-align: center; font-size: 14px;";
        container.appendChild(title);
        
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        
        // Process batter data
        const processedData = this.processPlayerData(battersData, 'batter', gameId);
        
        // Create flat data structure with all rows (parent and children)
        const flattenedData = [];
        processedData.forEach(player => {
            // Add parent row
            flattenedData.push({
                ...player,
                _expanded: false,
                _isParent: true,
                _hasChildren: player._children && player._children.length > 0
            });
            
            // Add child rows (initially hidden)
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
                
                // Hide/show rows based on parent expansion
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                // Style child rows
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
        
        // NEW: Enhanced click handler leveraging shared toggle logic
        battersTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.B_NAME) {
                const row = cell.getRow();
                self.toggleSubtableParentRow(battersTable, row, 'batters', gameId);
            }
        });

        this.refreshSubtableLayout(battersTable);

        // Register this subtable instance for state management
        this.registerSubtableInstance(gameId, 'batters', battersTable);
    }
    
    // ✅ FIXED: Bullpen Table - Properly integrated with subtable state management
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
        
        // Process bullpen data into groups
        const processedData = this.processBullpenDataGrouped(bullpenData, location);
        
        // Create flat data structure with all rows (parent and children)
        const flattenedData = [];
        processedData.forEach(group => {
            // Add parent row
            const parentRow = {
                ...group,
                _isParent: true,
                _expanded: false,
                _hasChildren: group._children && group._children.length > 0,
                _parentId: group[F.BP_HAND_CNT] || 'unknown'
            };
            flattenedData.push(parentRow);
            
            // Add child rows (initially hidden)
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
                
                // Hide/show rows based on parent expansion
                if (data._isChild && !data._visible) {
                    rowElement.style.display = 'none';
                } else {
                    rowElement.style.display = '';
                }
                
                // Style child rows
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
        
        // NEW: Enhanced click handler leveraging shared toggle logic
        bullpenTable.on("cellClick", function(e, cell) {
            if (cell.getField() === F.BP_HAND_CNT) {
                const row = cell.getRow();
                self.toggleSubtableParentRow(bullpenTable, row, 'bullpen', gameId);
            }
        });

        this.refreshSubtableLayout(bullpenTable);

        // Register this subtable instance for state management
        this.registerSubtableInstance(gameId, 'bullpen', bullpenTable);
    }
}
