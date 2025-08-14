// tables/baseTable.js - COMPLETE FIXED VERSION WITH PROPER STATE RESTORATION
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';
import { getOpponentTeam, getSwitchHitterVersus, formatPercentage } from '../shared/utils.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes to match Supabase update interval

// IndexedDB for persistent cross-user caching
const DB_NAME = 'TabulatorCache';
const DB_VERSION = 1;
const STORE_NAME = 'tableData';

class CacheManager {
    constructor() {
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async getCachedData(key) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result && Date.now() - result.timestamp < CACHE_DURATION) {
                    console.log(`IndexedDB cache hit for ${key}`);
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('Failed to read from IndexedDB');
                resolve(null);
            };
        });
    }

    async setCachedData(key, data) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({
                key: key,
                data: data,
                timestamp: Date.now()
            });
            
            request.onsuccess = () => {
                console.log(`Data cached in IndexedDB for ${key}`);
                resolve();
            };
            
            request.onerror = () => {
                console.error('Failed to write to IndexedDB');
                reject(request.error);
            };
        });
    }

    async clearOldCache() {
        if (!this.db) await this.initDB();
        
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const cutoffTime = Date.now() - CACHE_DURATION;
        
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
    }
}

// Global cache manager instance
const cacheManager = new CacheManager();

// CRITICAL FIX: Make GLOBAL_EXPANDED_STATE globally accessible
window.GLOBAL_EXPANDED_STATE = window.GLOBAL_EXPANDED_STATE || new Map();
const GLOBAL_EXPANDED_STATE = window.GLOBAL_EXPANDED_STATE;

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.isInitialized = false;
        this.dataLoaded = false;
        this.pendingStateRestore = false;  // Track if we need to restore after data loads
        this.expandedRowsCache = new Set();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.tableConfig = this.getBaseConfig();
        this.isRestoringState = false; // Flag to prevent loops
        
        // Initialize global state for this table if not exists
        if (!GLOBAL_EXPANDED_STATE.has(elementId)) {
            GLOBAL_EXPANDED_STATE.set(elementId, new Map());
        }
    }

    // Helper methods to access global state
    getGlobalState() {
        if (GLOBAL_EXPANDED_STATE.has(this.elementId)) {
            return GLOBAL_EXPANDED_STATE.get(this.elementId);
        }
        const newState = new Map();
        GLOBAL_EXPANDED_STATE.set(this.elementId, newState);
        return newState;
    }
    
    setGlobalState(state) {
        GLOBAL_EXPANDED_STATE.set(this.elementId, state);
    }

    getBaseConfig() {
        const self = this;
        const config = {
            layout: "fitColumns",
            responsiveLayout: false,
            persistence: false,
            paginationSize: false,
            height: "1000px",
            minWidth: 1000,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            placeholder: "Loading data...",
            virtualDom: true,
            virtualDomBuffer: 300,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            progressiveRender: true,
            progressiveRenderSize: 20,
            progressiveRenderMargin: 100,
            blockHozScrollKeyboard: true,
            layoutColumnsOnNewData: false,
            columnVertAlign: "center",
            dataLoaded: (data) => {
                console.log(`Table loaded ${data.length} total records`);
                self.dataLoaded = true;
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                
                // Check if we need to restore state after data load
                if (self.pendingStateRestore) {
                    console.log(`Data loaded, now restoring pending state for ${self.elementId}`);
                    setTimeout(() => {
                        self.restoreState();
                        self.pendingStateRestore = false;
                    }, 100);
                }
            },
            renderComplete: function() {
                // Only apply expanded state if we're restoring, not during normal renders
                if (self.isRestoringState) {
                    setTimeout(() => {
                        // Only apply if still in restoring state
                        if (self.isRestoringState) {
                            self.applyGlobalExpandedState();
                        }
                    }, 50);
                }
            }
        };

        if (this.endpoint) {
            config.ajaxURL = API_CONFIG.baseURL + this.endpoint;
            config.ajaxConfig = {
                method: "GET",
                headers: {
                    ...API_CONFIG.headers,
                    "Prefer": "count=exact"
                }
            };
            config.ajaxContentType = "json";
            
            config.ajaxRequestFunc = async (url, config, params) => {
                const cacheKey = `${this.endpoint}_data`;
                
                const memoryCached = this.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Memory cache hit for ${this.endpoint}`);
                    // Set dataLoaded flag when returning cached data
                    self.dataLoaded = true;
                    return memoryCached;
                }
                
                const dbCached = await cacheManager.getCachedData(cacheKey);
                if (dbCached) {
                    console.log(`IndexedDB cache hit for ${this.endpoint}`);
                    this.setCachedData(cacheKey, dbCached);
                    // Set dataLoaded flag when returning cached data
                    self.dataLoaded = true;
                    return dbCached;
                }
                
                console.log(`No cache found for ${this.endpoint}, fetching from API...`);
                const allRecords = await this.fetchAllRecords(url, config);
                
                this.setCachedData(cacheKey, allRecords);
                await cacheManager.setCachedData(cacheKey, allRecords);
                
                // Set dataLoaded flag when returning fresh data
                self.dataLoaded = true;
                return allRecords;
            };
        }

        return config;
    }

    async fetchAllRecords(url, config) {
        const allRecords = [];
        const pageSize = 1000;
        let offset = 0;
        let hasMore = true;
        let totalExpected = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        console.log(`Starting comprehensive data fetch from ${url}...`);
        
        if (this.elementId) {
            const element = document.querySelector(this.elementId);
            if (element) {
                const progressDiv = document.createElement('div');
                progressDiv.id = 'loading-progress';
                progressDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px;';
                progressDiv.innerHTML = '<div>Loading data...</div><div id="progress-text">0%</div>';
                element.appendChild(progressDiv);
            }
        }
        
        while (hasMore) {
            try {
                const requestUrl = `${url}?limit=${pageSize}&offset=${offset}`;
                
                const response = await fetch(requestUrl, {
                    ...config,
                    headers: {
                        ...config.headers,
                        'Range': `${offset}-${offset + pageSize - 1}`,
                        'Range-Unit': 'items',
                        'Prefer': 'count=exact'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 416) {
                        console.log('Reached end of data');
                        hasMore = false;
                        break;
                    }
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                
                const contentRange = response.headers.get('content-range');
                if (contentRange && totalExpected === null) {
                    const match = contentRange.match(/\d+-\d+\/(\d+|\*)/);
                    if (match && match[1] !== '*') {
                        totalExpected = parseInt(match[1]);
                        console.log(`Total records to fetch: ${totalExpected}`);
                    }
                }
                
                const data = await response.json();
                
                if (data.length === 0) {
                    hasMore = false;
                    break;
                }
                
                allRecords.push(...data);
                
                if (totalExpected) {
                    const progress = ((allRecords.length / totalExpected) * 100).toFixed(1);
                    console.log(`Loading progress: ${allRecords.length}/${totalExpected} (${progress}%)`);
                    
                    const progressText = document.getElementById('progress-text');
                    if (progressText) {
                        progressText.textContent = `${progress}% - ${allRecords.length.toLocaleString()} / ${totalExpected.toLocaleString()} records`;
                    }
                }
                
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    offset += pageSize;
                }
                
                retryCount = 0;
                
                if (hasMore && offset % 5000 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                console.error(`Error loading batch at offset ${offset}:`, error);
                
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error(`Failed after ${maxRetries} retries at offset ${offset}`);
                    hasMore = false;
                } else {
                    console.log(`Retrying (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        }
        
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`✅ Data loading complete: ${allRecords.length} total records`);
        
        if (Math.random() < 0.1) {
            cacheManager.clearOldCache();
        }
        
        return allRecords;
    }

    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        const cacheKey = `${this.endpoint}_data`;
        dataCache.delete(cacheKey);
    }

    async refreshData() {
        const cacheKey = `${this.endpoint}_data`;
        dataCache.delete(cacheKey);
        await cacheManager.setCachedData(cacheKey, null);
        
        if (this.table) {
            this.table.setData();
        }
    }

    initialize() {
        if (this.isInitialized) {
            console.log(`Table ${this.elementId} already initialized`);
            return;
        }
        
        console.log(`Lazy initializing table ${this.elementId}`);
        this.isInitialized = true;
        
        throw new Error("initialize must be implemented by child class");
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
        return Array.from(this.expandedRowsSet);
    }
    
    setExpandedRows(expandedRowIds) {
        this.expandedRowsSet = new Set(expandedRowIds);
    }

    generateRowId(data) {
        // Create a unique identifier based on the most identifying fields
        const fields = [];
        
        // For Matchups
        if (data["Matchup Game ID"] !== undefined) {
            return `matchup_${data["Matchup Game ID"]}`;
        }
        
        // For Batter tables
        if (data["Batter Name"]) {
            fields.push(data["Batter Name"]);
            if (data["Batter Team"]) fields.push(data["Batter Team"]);
            if (data["Batter Prop Type"]) fields.push(data["Batter Prop Type"]);
            if (data["Batter Prop Value"]) fields.push(data["Batter Prop Value"]);
            if (data["Batter Prop Split ID"]) fields.push(data["Batter Prop Split ID"]);
            if (data["Batter Stat Type"]) fields.push(data["Batter Stat Type"]);
            return `batter_${fields.join('_')}`;
        }
        
        // For Pitcher tables
        if (data["Pitcher Name"]) {
            fields.push(data["Pitcher Name"]);
            if (data["Pitcher Team"]) fields.push(data["Pitcher Team"]);
            if (data["Pitcher Prop Type"]) fields.push(data["Pitcher Prop Type"]);
            if (data["Pitcher Prop Value"]) fields.push(data["Pitcher Prop Value"]);
            if (data["Pitcher Prop Split ID"]) fields.push(data["Pitcher Prop Split ID"]);
            if (data["Pitcher Stat Type"]) fields.push(data["Pitcher Stat Type"]);
            return `pitcher_${fields.join('_')}`;
        }
        
        // Fallback - use first few non-null values
        const keys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] != null);
        return keys.slice(0, 5).map(k => `${k}:${data[k]}`).join('|');
    }

    applyGlobalExpandedState() {
        if (!this.table || !this.isRestoringState) return;
        
        const globalState = this.getGlobalState();
        if (!globalState || globalState.size === 0) return;
        
        console.log(`Applying ${globalState.size} globally stored expanded rows to ${this.elementId} during restoration`);
        
        const rows = this.table.getRows();
        let expandedCount = 0;
        
        rows.forEach(row => {
            const data = row.getData();
            const rowId = this.generateRowId(data);
            
            if (globalState.has(rowId)) {
                if (!data._expanded) {
                    data._expanded = true;
                    row.update(data);
                    expandedCount++;
                    
                    // Force reformat after a delay to ensure subtables are created
                    setTimeout(() => {
                        // Check we're still in restoration mode
                        if (this.isRestoringState) {
                            row.reformat();
                            
                            // Update expander icon
                            setTimeout(() => {
                                const cells = row.getCells();
                                const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                                
                                for (let field of nameFields) {
                                    const nameCell = cells.find(cell => cell.getField() === field);
                                    if (nameCell) {
                                        const cellElement = nameCell.getElement();
                                        const expander = cellElement.querySelector('.row-expander');
                                        if (expander) {
                                            expander.innerHTML = "−";
                                        }
                                        break;
                                    }
                                }
                            }, 50);
                        }
                    }, 100);
                }
            }
        });
        
        if (expandedCount > 0) {
            console.log(`Successfully expanded ${expandedCount} rows during restoration`);
        }
    }

    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        // Save scroll position
        const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.lastScrollPosition = tableHolder.scrollTop;
        }
        
        // Get or create global state for this table using helper method
        const globalState = this.getGlobalState();
        
        // Clear and rebuild global expanded state
        globalState.clear();
        
        const rows = this.table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                globalState.set(id, { 
                    timestamp: Date.now(),
                    data: data 
                });
            }
        });
        
        // Update global state using helper method
        this.setGlobalState(globalState);
        
        console.log(`Saved ${globalState.size} expanded rows for ${this.elementId}`);
    }

    // FIXED: Enhanced restoreState with proper timing and row queuing
    restoreState() {
        if (!this.table) return;
        
        // Check if table has data by looking at row count
        const hasData = this.table.getData && this.table.getData().length > 0;
        
        // If data isn't loaded yet, mark that we need to restore after load
        if (!this.dataLoaded && !hasData) {
            console.log(`Data not yet loaded for ${this.elementId}, deferring state restore`);
            this.pendingStateRestore = true;
            return;
        }
        
        const globalState = this.getGlobalState();
        
        if (!globalState || globalState.size === 0) {
            // Just restore scroll position
            if (this.lastScrollPosition > 0) {
                setTimeout(() => {
                    const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                    if (tableHolder) {
                        tableHolder.scrollTop = this.lastScrollPosition;
                    }
                }, 500);
            }
            return;
        }
        
        console.log(`Restoring ${globalState.size} expanded rows for ${this.elementId}`);
        
        // Set restoration flag
        this.isRestoringState = true;
        
        // Create a promise-based restoration
        const restoreExpandedRows = () => {
            return new Promise((resolve) => {
                const rows = this.table.getRows();
                const rowsToExpand = [];
                
                console.log(`Checking ${rows.length} rows for restoration`);
                
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    
                    if (globalState.has(rowId)) {
                        console.log(`Found matching row to restore: ${rowId}`);
                        // FIXED: Actually add the row to expansion queue
                        if (!data._expanded) {
                            data._expanded = true;
                            row.update(data);
                            rowsToExpand.push(row);
                        }
                    }
                });
                
                console.log(`Found ${rowsToExpand.length} rows to restore`);
                
                // Process each row sequentially with proper timing
                let processIndex = 0;
                
                const processNextRow = () => {
                    if (processIndex >= rowsToExpand.length) {
                        resolve();
                        return;
                    }
                    
                    const row = rowsToExpand[processIndex];
                    const rowElement = row.getElement();
                    
                    // Remove any existing subtables first
                    const existingSubrow = rowElement.querySelector('.subrow-container');
                    if (existingSubrow) {
                        existingSubrow.remove();
                    }
                    
                    // Force reformat to recreate subtables
                    row.reformat();
                    
                    // Update expander icon
                    setTimeout(() => {
                        const cells = row.getCells();
                        const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                        
                        for (let field of nameFields) {
                            const nameCell = cells.find(cell => cell.getField() === field);
                            if (nameCell) {
                                const cellElement = nameCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "−";
                                }
                                break;
                            }
                        }
                        
                        processIndex++;
                        // Small delay between rows to prevent blocking
                        setTimeout(processNextRow, 20);
                    }, 20);
                };
                
                if (rowsToExpand.length > 0) {
                    setTimeout(processNextRow, 100);
                } else {
                    resolve();
                }
            });
        };
        
        // Start restoration
        restoreExpandedRows().then(() => {
            console.log(`Restoration complete for ${this.elementId}`);
            
            // Clear restoration flag with a small delay to ensure everything is settled
            setTimeout(() => {
                this.isRestoringState = false;
                console.log(`Cleared restoration flag for ${this.elementId}`);
                
                // Force a final redraw to ensure everything is displayed correctly
                this.table.redraw(false);
                
                // Restore scroll position
                if (this.lastScrollPosition > 0) {
                    const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                    if (tableHolder) {
                        tableHolder.scrollTop = this.lastScrollPosition;
                    }
                }
            }, 200);
        });
    }

    destroy() {
        if (this.table) {
            this.saveState();
            this.table.destroy();
            this.table = null;
        }
        this.isInitialized = false;
        this.dataLoaded = false;
        this.pendingStateRestore = false;
        this.isRestoringState = false;
    }

    getTable() {
        return this.table;
    }

    createNameFormatter() {
        return function(cell, formatterParams, onRendered) {
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
        };
    }

    createTeamFormatter() {
        return function(cell) {
            var value = cell.getValue();
            return value;
        };
    }

    // Enhanced setupRowExpansion with better restoration handling and proper global state update
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        let expansionTimeout;
        
        this.table.on("cellClick", (e, cell) => {
            const field = cell.getField();
            
            const expandableFields = [
                "Batter Name", 
                "Pitcher Name", 
                "Matchup Team"
            ];
            
            if (expandableFields.includes(field)) {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if we're in restoration mode
                if (self.isRestoringState) {
                    console.log("Click during restoration - queueing for later");
                    // Queue the click to be processed after restoration
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
                    // Double-check restoration flag
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
                    
                    // Update global state using helper methods
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
                    
                    // Update icon immediately
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

    createSubtable1(container, data) {
        new Tabulator(container, {
            layout: "fitColumns",
            columnHeaderSortMulti: false,
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            height: false,
            virtualDom: false,
            data: [{
                propFactor: data["Batter Prop Park Factor"] || data["Pitcher Prop Park Factor"],
                lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                matchup: data["Matchup"],
                opposingPitcher: data["SP"]
            }],
            columns: [
                {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 300},
                {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 200},
                {title: "Matchup", field: "matchup", headerSort: false, width: 300},
                {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 400}
            ]
        });
    }

    createSubtable2(container, data) {
        console.log("createSubtable2 should be overridden by child class");
    }

    // Enhanced createRowFormatter with better subtable recreation
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
            
            // Handle expansion
            if (data._expanded) {
                let existingSubrow = rowElement.querySelector('.subrow-container');
                
                // Always recreate subtables during restoration or if they don't exist
                if (!existingSubrow || self.isRestoringState) {
                    // Remove old subtable if it exists during restoration
                    if (existingSubrow && self.isRestoringState) {
                        existingSubrow.remove();
                        existingSubrow = null;
                    }
                    
                    if (!existingSubrow) {
                        requestAnimationFrame(() => {
                            var holderEl = document.createElement("div");
                            holderEl.classList.add('subrow-container');
                            holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%; position: relative; z-index: 1;';
                            
                            if (data["Matchup Team"] !== undefined) {
                                var subtableEl = document.createElement("div");
                                holderEl.appendChild(subtableEl);
                                rowElement.appendChild(holderEl);
                                
                                if (self.createMatchupsSubtable) {
                                    self.createMatchupsSubtable(subtableEl, data);
                                }
                            } else {
                                var subtable1 = document.createElement("div");
                                subtable1.style.marginBottom = "15px";
                                var subtable2 = document.createElement("div");
                                
                                holderEl.appendChild(subtable1);
                                holderEl.appendChild(subtable2);
                                rowElement.appendChild(holderEl);
                                
                                try {
                                    self.createSubtable1(subtable1, data);
                                } catch (error) {
                                    console.error("Error creating subtable1:", error);
                                    subtable1.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 1: ' + error.message + '</div>';
                                }
                                
                                try {
                                    self.createSubtable2(subtable2, data);
                                } catch (error) {
                                    console.error("Error creating subtable2:", error);
                                    subtable2.innerHTML = '<div style="padding: 10px; color: red;">Error loading subtable 2: ' + error.message + '</div>';
                                }
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
}
