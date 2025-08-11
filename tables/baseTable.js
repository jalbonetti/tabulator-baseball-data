// tables/baseTable.js - FIXED VERSION WITH PERSISTENT STATE RESTORATION
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

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.isInitialized = false;
        this.dataLoaded = false;
        this.expandedRowsCache = new Set();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.persistentExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.tableConfig = this.getBaseConfig();
        this.stateListeners = [];
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
                this.dataLoaded = true;
                data.forEach(row => {
                    if (row._expanded === undefined) {
                        row._expanded = false;
                    }
                });
                // Restore persistent expanded rows after data load
                this.restorePersistentExpandedRows();
            },
            // CRITICAL: Preserve expanded state through ALL data operations
            dataProcessing: function() {
                if (!self.table) return;
                
                const rows = self.table.getRows();
                self.temporaryExpandedRows.clear();
                
                rows.forEach(row => {
                    const data = row.getData();
                    if (data._expanded) {
                        const id = self.generateRowId(data);
                        self.temporaryExpandedRows.add(id);
                        self.persistentExpandedRows.add(id); // Also add to persistent set
                    }
                });
                
                if (self.temporaryExpandedRows.size > 0) {
                    console.log(`Preserving ${self.temporaryExpandedRows.size} expanded rows during data operation`);
                }
            },
            dataProcessed: function() {
                if (!self.table) return;
                
                // Use both temporary and persistent sets
                const combinedSet = new Set([...self.temporaryExpandedRows, ...self.persistentExpandedRows]);
                if (combinedSet.size > 0) {
                    setTimeout(() => {
                        self.restoreExpandedStateFromSet(combinedSet);
                    }, 100);
                }
            },
            dataFiltered: function(filters, rows) {
                if (!self.table) return;
                
                console.log(`Filter complete, restoring expanded state`);
                const combinedSet = new Set([...self.temporaryExpandedRows, ...self.persistentExpandedRows]);
                if (combinedSet.size > 0) {
                    setTimeout(() => {
                        self.restoreExpandedStateFromSet(combinedSet);
                    }, 150);
                }
            },
            dataSorted: function(sorters, rows) {
                if (!self.table) return;
                
                const combinedSet = new Set([...self.temporaryExpandedRows, ...self.persistentExpandedRows]);
                if (combinedSet.size > 0) {
                    setTimeout(() => {
                        self.restoreExpandedStateFromSet(combinedSet);
                    }, 100);
                }
            },
            renderComplete: function() {
                // Final check to ensure expanded rows are restored
                if (self.persistentExpandedRows.size > 0) {
                    self.restoreExpandedStateFromSet(self.persistentExpandedRows);
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
                    return memoryCached;
                }
                
                const dbCached = await cacheManager.getCachedData(cacheKey);
                if (dbCached) {
                    console.log(`IndexedDB cache hit for ${this.endpoint}`);
                    this.setCachedData(cacheKey, dbCached);
                    return dbCached;
                }
                
                console.log(`No cache found for ${this.endpoint}, fetching from API...`);
                const allRecords = await this.fetchAllRecords(url, config);
                
                this.setCachedData(cacheKey, allRecords);
                await cacheManager.setCachedData(cacheKey, allRecords);
                
                return allRecords;
            };
        }

        return config;
    }

    // New method to restore expanded state from a set of row IDs
    restoreExpandedStateFromSet(expandedRowIds) {
        if (!this.table || expandedRowIds.size === 0) return;
        
        const rows = this.table.getRows();
        let restoredCount = 0;
        
        rows.forEach(row => {
            const data = row.getData();
            const id = this.generateRowId(data);
            
            if (expandedRowIds.has(id)) {
                if (!data._expanded) {
                    data._expanded = true;
                    row.update(data);
                    restoredCount++;
                }
                
                // Update expander icon
                const cells = row.getCells();
                const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                
                for (let field of nameFields) {
                    const nameCell = cells.find(cell => cell.getField() === field);
                    if (nameCell) {
                        const cellElement = nameCell.getElement();
                        const expander = cellElement.querySelector('.row-expander');
                        if (expander && expander.innerHTML !== "−") {
                            expander.innerHTML = "−";
                        }
                        break;
                    }
                }
            }
        });
        
        if (restoredCount > 0) {
            console.log(`Restored ${restoredCount} expanded rows`);
            
            // Trigger row reformatting for expanded rows
            setTimeout(() => {
                rows.forEach(row => {
                    const data = row.getData();
                    if (data._expanded) {
                        row.reformat();
                    }
                });
            }, 50);
        }
    }

    // New method to restore persistent expanded rows
    restorePersistentExpandedRows() {
        if (this.persistentExpandedRows.size > 0) {
            console.log(`Restoring ${this.persistentExpandedRows.size} persistent expanded rows`);
            this.restoreExpandedStateFromSet(this.persistentExpandedRows);
        }
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
        this.persistentExpandedRows = new Set(expandedRowIds);
    }

    generateRowId(data) {
        if (data["Matchup Game ID"]) {
            return `matchup_${data["Matchup Game ID"]}`;
        } 
        else if (data["Batter Name"]) {
            let id = `batter_${data["Batter Name"]}_${data["Batter Team"]}`;
            if (data["Batter Prop Type"]) {
                id += `_${data["Batter Prop Type"]}`;
                if (data["Batter Prop Value"]) id += `_${data["Batter Prop Value"]}`;
            }
            if (data["Batter Prop Split ID"]) {
                id += `_${data["Batter Prop Split ID"]}`;
            }
            if (data["Batter Stat Type"]) {
                id += `_${data["Batter Stat Type"]}`;
            }
            return id;
        }
        else if (data["Pitcher Name"]) {
            let id = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"]}`;
            if (data["Pitcher Prop Type"]) {
                id += `_${data["Pitcher Prop Type"]}`;
                if (data["Pitcher Prop Value"]) id += `_${data["Pitcher Prop Value"]}`;
            }
            if (data["Pitcher Prop Split ID"]) {
                id += `_${data["Pitcher Prop Split ID"]}`;
            }
            if (data["Pitcher Stat Type"]) {
                id += `_${data["Pitcher Stat Type"]}`;
            }
            return id;
        }
        else {
            const keyFields = Object.keys(data)
                .filter(key => !key.startsWith('_') && data[key] !== null && data[key] !== undefined)
                .slice(0, 5)
                .map(key => `${key}:${data[key]}`)
                .join('_');
            return `generic_${keyFields}`;
        }
    }

    // Enhanced saveState that maintains persistent expanded rows
    saveState() {
        if (!this.table) return;
        
        console.log(`Saving state for ${this.elementId}`);
        
        const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.lastScrollPosition = tableHolder.scrollTop;
        }
        
        this.expandedRowsCache.clear();
        this.expandedRowsSet.clear();
        this.persistentExpandedRows.clear();
        
        if (!this.expandedRowsMetadata) {
            this.expandedRowsMetadata = new Map();
        }
        
        const rows = this.table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                this.expandedRowsCache.add(id);
                this.expandedRowsSet.add(id);
                this.persistentExpandedRows.add(id);
                
                const rowElement = row.getElement();
                const hasSubrow = rowElement.querySelector('.subrow-container') !== null;
                
                const cells = row.getCells();
                const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                let expanderState = "-";
                
                for (let field of nameFields) {
                    const nameCell = cells.find(cell => cell.getField() === field);
                    if (nameCell) {
                        const cellElement = nameCell.getElement();
                        const expander = cellElement.querySelector('.row-expander');
                        if (expander) {
                            expanderState = expander.innerHTML;
                        }
                        break;
                    }
                }
                
                this.expandedRowsMetadata.set(id, {
                    hasSubrow: hasSubrow,
                    data: data,
                    expanderState: expanderState
                });
            }
        });
        
        console.log(`Saved ${this.expandedRowsCache.size} expanded rows for ${this.elementId}`);
    }

    // Enhanced restoreState with multiple restoration attempts
    restoreState() {
        if (!this.table) return;
        
        if (!this.expandedRowsCache || this.expandedRowsCache.size === 0) {
            const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder && this.lastScrollPosition > 0) {
                setTimeout(() => {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }, 500);
            }
            return;
        }
        
        console.log(`Restoring ${this.expandedRowsCache.size} expanded rows for ${this.elementId}`);
        
        // Copy to persistent set for continuous restoration
        this.persistentExpandedRows = new Set(this.expandedRowsCache);
        const persistentMetadata = new Map(this.expandedRowsMetadata || new Map());
        
        const applyExpansion = (skipReformat = false) => {
            const rows = this.table.getRows();
            const rowsToProcess = [];
            
            rows.forEach(row => {
                const data = row.getData();
                const id = this.generateRowId(data);
                
                if (this.persistentExpandedRows.has(id)) {
                    const metadata = persistentMetadata.get(id);
                    
                    if (!data._expanded) {
                        console.log(`Restoring expanded state for row: ${id}`);
                        data._expanded = true;
                        row.update(data);
                    }
                    
                    const cells = row.getCells();
                    const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                    
                    for (let field of nameFields) {
                        const nameCell = cells.find(cell => cell.getField() === field);
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.row-expander');
                            if (expander) {
                                expander.innerHTML = metadata ? metadata.expanderState : "−";
                            }
                            break;
                        }
                    }
                    
                    if (!skipReformat) {
                        rowsToProcess.push({
                            row: row,
                            hadSubrow: metadata ? metadata.hasSubrow : true,
                            metadata: metadata
                        });
                    }
                } else if (data._expanded) {
                    console.log(`Collapsing incorrectly expanded row: ${id}`);
                    data._expanded = false;
                    row.update(data);
                    
                    const cells = row.getCells();
                    const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                    
                    for (let field of nameFields) {
                        const nameCell = cells.find(cell => cell.getField() === field);
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.row-expander');
                            if (expander) {
                                expander.innerHTML = "+";
                            }
                            break;
                        }
                    }
                    
                    const rowElement = row.getElement();
                    const existingSubrow = rowElement.querySelector('.subrow-container');
                    if (existingSubrow) {
                        existingSubrow.remove();
                    }
                }
            });
            
            if (!skipReformat && rowsToProcess.length > 0) {
                setTimeout(() => {
                    rowsToProcess.forEach(({row, hadSubrow, metadata}) => {
                        const rowElement = row.getElement();
                        
                        const existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                        
                        row.reformat();
                        
                        setTimeout(() => {
                            const cells = row.getCells();
                            const nameFields = ["Batter Name", "Pitcher Name", "Matchup Team"];
                            
                            for (let field of nameFields) {
                                const nameCell = cells.find(cell => cell.getField() === field);
                                if (nameCell) {
                                    const cellElement = nameCell.getElement();
                                    const expander = cellElement.querySelector('.row-expander');
                                    if (expander && metadata) {
                                        expander.innerHTML = metadata.expanderState;
                                    }
                                    break;
                                }
                            }
                            
                            if (hadSubrow) {
                                const newSubrow = rowElement.querySelector('.subrow-container');
                                if (!newSubrow) {
                                    console.log('Forcing second reformat for row');
                                    row.reformat();
                                }
                            }
                        }, 100);
                    });
                    
                    setTimeout(() => {
                        rowsToProcess.forEach(({row}) => {
                            row.normalizeHeight();
                        });
                        
                        this.table.redraw(false);
                    }, 300);
                }, 100);
            }
        };
        
        // Store expanded rows in temporary set for filter preservation
        this.temporaryExpandedRows = new Set(this.expandedRowsCache);
        
        requestAnimationFrame(() => {
            applyExpansion();
            
            // Set up event listeners for persistent reapplication
            const events = ["dataFiltered", "dataLoaded", "renderComplete", "dataSorted"];
            const handlers = [];
            
            events.forEach(eventName => {
                const handler = () => {
                    if (this.persistentExpandedRows.size > 0) {
                        setTimeout(() => {
                            this.restoreExpandedStateFromSet(this.persistentExpandedRows);
                        }, 200);
                    }
                };
                handlers.push({event: eventName, handler: handler});
                this.table.on(eventName, handler);
                this.stateListeners.push({event: eventName, handler: handler});
            });
            
            // Multiple restoration attempts to ensure state is preserved
            const restoreAttempts = [500, 1000, 1500, 2000, 3000];
            restoreAttempts.forEach(delay => {
                setTimeout(() => {
                    if (this.persistentExpandedRows.size > 0) {
                        this.restoreExpandedStateFromSet(this.persistentExpandedRows);
                    }
                }, delay);
            });
            
            // Restore scroll position
            const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
            if (tableHolder && this.lastScrollPosition > 0) {
                setTimeout(() => {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }, 400);
            }
        });
    }

    destroy() {
        // Clean up event listeners
        if (this.table && this.stateListeners.length > 0) {
            this.stateListeners.forEach(({event, handler}) => {
                this.table.off(event, handler);
            });
            this.stateListeners = [];
        }
        
        if (this.table) {
            this.saveState();
            this.table.destroy();
            this.table = null;
        }
        this.isInitialized = false;
        this.dataLoaded = false;
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

    setupRowExpansion() {
        if (!this.table) return;
        
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
                
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                expansionTimeout = setTimeout(() => {
                    var row = cell.getRow();
                    var data = row.getData();
                    var rowElement = row.getElement();
                    
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    var hasSubrow = rowElement.querySelector('.subrow-container') !== null;
                    var cellElement = cell.getElement();
                    var expanderIcon = cellElement.querySelector('.row-expander');
                    var currentExpanderState = expanderIcon ? expanderIcon.innerHTML : "+";
                    
                    var shouldExpand = !data._expanded;
                    
                    data._expanded = shouldExpand;
                    
                    const rowId = this.generateRowId(data);
                    if (shouldExpand) {
                        this.expandedRowsSet.add(rowId);
                        this.persistentExpandedRows.add(rowId);
                    } else {
                        this.expandedRowsSet.delete(rowId);
                        this.persistentExpandedRows.delete(rowId);
                    }
                    
                    row.update(data);
                    
                    if (expanderIcon) {
                        expanderIcon.innerHTML = shouldExpand ? "−" : "+";
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
                }, 100);
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
                
                if (!existingSubrow) {
                    requestAnimationFrame(() => {
                        var holderEl = document.createElement("div");
                        holderEl.classList.add('subrow-container');
                        holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%;';
                        
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
