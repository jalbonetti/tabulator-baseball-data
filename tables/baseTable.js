// tables/baseTable.js - ENHANCED VERSION WITH BETTER CACHING AND PAGINATION
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
        this.lastScrollPosition = 0;
        this.tableConfig = this.getBaseConfig();
        this.expandedRowsSet = new Set(); // Track expanded rows like Matchups table
    }

    getBaseConfig() {
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
            // ENABLE virtual rendering for performance
            virtualDom: true,
            virtualDomBuffer: 300,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            // Progressive rendering
            progressiveRender: true,
            progressiveRenderSize: 20,
            progressiveRenderMargin: 100,
            // Block rendering during scrolling for performance
            blockHozScrollKeyboard: true,
            // Optimize rendering
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
            }
        };

        // Only add AJAX config if endpoint is provided
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
            
            // Enhanced pagination function with multi-level caching
            config.ajaxRequestFunc = async (url, config, params) => {
                const cacheKey = `${this.endpoint}_data`;
                
                // Check memory cache first
                const memoryCached = this.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Memory cache hit for ${this.endpoint}`);
                    return memoryCached;
                }
                
                // Check IndexedDB cache
                const dbCached = await cacheManager.getCachedData(cacheKey);
                if (dbCached) {
                    console.log(`IndexedDB cache hit for ${this.endpoint}`);
                    // Also store in memory cache
                    this.setCachedData(cacheKey, dbCached);
                    return dbCached;
                }
                
                // If no cache, fetch all data
                console.log(`No cache found for ${this.endpoint}, fetching from API...`);
                const allRecords = await this.fetchAllRecords(url, config);
                
                // Cache in both memory and IndexedDB
                this.setCachedData(cacheKey, allRecords);
                await cacheManager.setCachedData(cacheKey, allRecords);
                
                return allRecords;
            };
        }

        return config;
    }

    async fetchAllRecords(url, config) {
        const allRecords = [];
        const pageSize = 1000; // Supabase max
        let offset = 0;
        let hasMore = true;
        let totalExpected = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        console.log(`Starting comprehensive data fetch from ${url}...`);
        
        // Show loading progress
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
                // For large datasets, use range headers properly
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
                        // Range not satisfiable - we've reached the end
                        console.log('Reached end of data');
                        hasMore = false;
                        break;
                    }
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                
                // Parse content range header to get total count
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
                    // No more data
                    hasMore = false;
                    break;
                }
                
                allRecords.push(...data);
                
                // Update progress
                if (totalExpected) {
                    const progress = ((allRecords.length / totalExpected) * 100).toFixed(1);
                    console.log(`Loading progress: ${allRecords.length}/${totalExpected} (${progress}%)`);
                    
                    const progressText = document.getElementById('progress-text');
                    if (progressText) {
                        progressText.textContent = `${progress}% - ${allRecords.length.toLocaleString()} / ${totalExpected.toLocaleString()} records`;
                    }
                }
                
                // Check if we got less than pageSize records
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    offset += pageSize;
                }
                
                // Reset retry count on successful fetch
                retryCount = 0;
                
                // Add small delay to avoid rate limiting
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
        
        // Remove progress indicator
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`✅ Data loading complete: ${allRecords.length} total records`);
        
        // Clear old cache entries periodically
        if (Math.random() < 0.1) { // 10% chance
            cacheManager.clearOldCache();
        }
        
        return allRecords;
    }

    // Memory cache management methods
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

    // Force refresh data (bypasses cache)
    async refreshData() {
        const cacheKey = `${this.endpoint}_data`;
        
        // Clear both caches
        dataCache.delete(cacheKey);
        await cacheManager.setCachedData(cacheKey, null);
        
        // Reload table
        if (this.table) {
            this.table.setData();
        }
    }

    // Lazy initialization
    initialize() {
        if (this.isInitialized) {
            console.log(`Table ${this.elementId} already initialized`);
            return;
        }
        
        console.log(`Lazy initializing table ${this.elementId}`);
        this.isInitialized = true;
        
        // Child classes should implement their specific initialization
        throw new Error("initialize must be implemented by child class");
    }

    // Helper methods for scroll position (like Matchups table)
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
    
    // Get the internal Tabulator instance
    getTabulator() {
        return this.table;
    }
    
    // Get current expanded rows
    getExpandedRows() {
        return Array.from(this.expandedRowsSet);
    }
    
    // Set expanded rows (useful for state restoration)
    setExpandedRows(expandedRowIds) {
        this.expandedRowsSet = new Set(expandedRowIds);
    }

    // Generate unique ID for a row
    generateRowId(data) {
        // For Matchups table
        if (data["Matchup Game ID"]) {
            return data["Matchup Game ID"];
        } 
        // For Clearances tables (Batter or Pitcher)
        else if (data["Batter Name"] && data["Batter Prop Type"] && data["Batter Prop Value"]) {
            let id = `${data["Batter Name"]}_${data["Batter Team"]}_${data["Batter Prop Type"]}_${data["Batter Prop Value"]}`;
            if (data["Batter Prop Split ID"]) {
                id += `_${data["Batter Prop Split ID"]}`;
            }
            return id;
        } else if (data["Pitcher Name"] && data["Pitcher Prop Type"] && data["Pitcher Prop Value"]) {
            let id = `${data["Pitcher Name"]}_${data["Pitcher Team"]}_${data["Pitcher Prop Type"]}_${data["Pitcher Prop Value"]}`;
            if (data["Pitcher Prop Split ID"]) {
                id += `_${data["Pitcher Prop Split ID"]}`;
            }
            return id;
        }
        // For Stats tables
        else if (data["Batter Name"] && data["Batter Stat Type"]) {
            return `${data["Batter Name"]}_${data["Batter Team"]}_${data["Batter Stat Type"]}_${data["Batter Prop Split ID"]}`;
        } else if (data["Pitcher Name"] && data["Pitcher Stat Type"]) {
            return `${data["Pitcher Name"]}_${data["Pitcher Team"]}_${data["Pitcher Stat Type"]}_${data["Pitcher Prop Split ID"]}`;
        }
        // Fallback
        else {
            return JSON.stringify(data);
        }
    }

    // Override redraw with state preservation (like Matchups table)
    redraw() {
        if (this.table) {
            // Store current scroll position
            const scrollPos = this.getTableScrollPosition();
            
            // Store current expanded rows before redraw
            const rows = this.table.getRows();
            this.expandedRowsSet.clear();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const rowId = this.generateRowId(data);
                    this.expandedRowsSet.add(rowId);
                }
            });
            
            this.table.redraw(true); // Force full redraw
            
            // Restore expanded state and data after redraw
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const rowId = this.generateRowId(data);
                    const shouldBeExpanded = this.expandedRowsSet.has(rowId);
                    
                    if (shouldBeExpanded && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                        
                        // Update expander icon
                        setTimeout(() => {
                            const cells = row.getCells();
                            const nameField = data["Batter Name"] ? "Batter Name" : 
                                            data["Pitcher Name"] ? "Pitcher Name" : 
                                            "Matchup Team";
                            const nameCell = cells.find(cell => cell.getField() === nameField);
                            if (nameCell) {
                                const cellElement = nameCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "−";
                                }
                            }
                        }, 50);
                    } else if (!shouldBeExpanded && data._expanded) {
                        data._expanded = false;
                        row.update(data);
                        row.reformat();
                        
                        // Update expander icon
                        setTimeout(() => {
                            const cells = row.getCells();
                            const nameField = data["Batter Name"] ? "Batter Name" : 
                                            data["Pitcher Name"] ? "Pitcher Name" : 
                                            "Matchup Team";
                            const nameCell = cells.find(cell => cell.getField() === nameField);
                            if (nameCell) {
                                const cellElement = nameCell.getElement();
                                const expander = cellElement.querySelector('.row-expander');
                                if (expander) {
                                    expander.innerHTML = "+";
                                }
                            }
                        }, 50);
                    }
                });
                
                // Restore scroll position
                this.setTableScrollPosition(scrollPos);
            }, 100);
        }
    }

  // Save table state before switching away
    saveState() {
        if (!this.table) return;
        
        // Save scroll position
        const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
        if (tableHolder) {
            this.lastScrollPosition = tableHolder.scrollTop;
        }
        
        // Clear and rebuild expanded rows cache
        this.expandedRowsCache.clear();
        this.expandedRowsSet.clear();
        const rows = this.table.getRows();
        
        // Initialize metadata map if it doesn't exist
        if (!this.expandedRowsMetadata) {
            this.expandedRowsMetadata = new Map();
        }
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                const id = this.generateRowId(data);
                this.expandedRowsCache.add(id);
                this.expandedRowsSet.add(id);
                
                // Store whether this row has a visible subrow
                const rowElement = row.getElement();
                const hasSubrow = rowElement.querySelector('.subrow-container') !== null;
                
                // Store additional metadata
                this.expandedRowsMetadata.set(id, {
                    hasSubrow: hasSubrow,
                    data: data
                });
            }
        });
        
        console.log(`Saved ${this.expandedRowsCache.size} expanded rows for ${this.elementId}`);
    }

    // Restore table state when switching back
    restoreState() {
        if (!this.table) return;
        
        console.log(`Restoring ${this.expandedRowsCache.size} expanded rows for ${this.elementId}`);
        
        // Use requestAnimationFrame for smooth restoration
        requestAnimationFrame(() => {
            // Restore expanded rows
            if (this.expandedRowsCache.size > 0) {
                const rows = this.table.getRows();
                const rowsToReformat = [];
                
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId(data);
                    
                    if (this.expandedRowsCache.has(id)) {
                        // Get metadata for this row
                        const metadata = this.expandedRowsMetadata ? this.expandedRowsMetadata.get(id) : null;
                        
                        console.log(`Restoring expanded row: ${id}`);
                        
                        // Set expanded state
                        data._expanded = true;
                        row.update(data);
                        
                        // Store row for reformatting
                        rowsToReformat.push({
                            row: row,
                            hadSubrow: metadata ? metadata.hasSubrow : true
                        });
                        
                        // Update the expander icon immediately
                        const cells = row.getCells();
                        const nameField = data["Batter Name"] ? "Batter Name" : 
                                        data["Pitcher Name"] ? "Pitcher Name" : 
                                        "Matchup Team";
                        const nameCell = cells.find(cell => cell.getField() === nameField);
                        
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.row-expander');
                            if (expander) {
                                expander.innerHTML = "−";
                            }
                        }
                    } else if (data._expanded) {
                        // If marked as expanded but not in saved list, collapse it
                        data._expanded = false;
                        row.update(data);
                        
                        // Update the expander icon
                        const cells = row.getCells();
                        const nameField = data["Batter Name"] ? "Batter Name" : 
                                        data["Pitcher Name"] ? "Pitcher Name" : 
                                        "Matchup Team";
                        const nameCell = cells.find(cell => cell.getField() === nameField);
                        
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.row-expander');
                            if (expander) {
                                expander.innerHTML = "+";
                            }
                        }
                    }
                });
                
                // Reformat all expanded rows to recreate their subrows
                setTimeout(() => {
                    rowsToReformat.forEach(({row, hadSubrow}) => {
                        // Force remove any existing subrow to ensure clean recreation
                        const rowElement = row.getElement();
                        const existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                        
                        // Now reformat to recreate the subrow
                        row.reformat();
                        
                        // If the row should have had a subrow, try again if it's not there
                        if (hadSubrow) {
                            setTimeout(() => {
                                const newSubrow = rowElement.querySelector('.subrow-container');
                                if (!newSubrow) {
                                    console.log('Forcing second reformat for row');
                                    row.reformat();
                                }
                            }, 100);
                        }
                    });
                    
                    // After all rows are reformatted, normalize their heights
                    setTimeout(() => {
                        rowsToReformat.forEach(({row}) => {
                            row.normalizeHeight();
                        });
                        
                        // Force a partial redraw to ensure everything is visible
                        this.table.redraw(false);
                    }, 200);
                }, 100);
            }
            
            // Restore scroll position after everything is rendered
            setTimeout(() => {
                const tableHolder = this.table.element.querySelector('.tabulator-tableHolder');
                if (tableHolder && this.lastScrollPosition > 0) {
                    tableHolder.scrollTop = this.lastScrollPosition;
                }
            }, 400);
        });
    }

    // Cleanup method to free memory
    destroy() {
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

    // Optimized row expansion with debouncing
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
                
                // Clear any pending expansion
                if (expansionTimeout) {
                    clearTimeout(expansionTimeout);
                }
                
                // Debounce expansion to prevent rapid clicks
                expansionTimeout = setTimeout(() => {
                    var row = cell.getRow();
                    var data = row.getData();
                    var rowElement = row.getElement();
                    
                    // Initialize if undefined
                    if (data._expanded === undefined) {
                        data._expanded = false;
                    }
                    
                    // Check if the visual state matches the data state
                    var hasSubrow = rowElement.querySelector('.subrow-container') !== null;
                    
                    // If states don't match, sync them
                    if (data._expanded && !hasSubrow) {
                        // Data says expanded but no subrow visible - reformat to show it
                        row.reformat();
                    } else if (!data._expanded && hasSubrow) {
                        // Data says collapsed but subrow is visible - remove it
                        var existingSubrow = rowElement.querySelector('.subrow-container');
                        if (existingSubrow) {
                            existingSubrow.remove();
                        }
                    } else {
                        // States match, perform normal toggle
                        data._expanded = !data._expanded;
                        
                        // Update expanded rows tracking
                        const rowId = this.generateRowId(data);
                        if (data._expanded) {
                            this.expandedRowsSet.add(rowId);
                        } else {
                            this.expandedRowsSet.delete(rowId);
                        }
                        
                        // Update the row data
                        row.update(data);
                        
                        // Use requestAnimationFrame for smooth updates
                        requestAnimationFrame(() => {
                            // Reformat the row to trigger the rowFormatter
                            row.reformat();
                            
                            // Update expander icon
                            requestAnimationFrame(() => {
                                try {
                                    var cellElement = cell.getElement();
                                    if (cellElement) {
                                        var expanderIcon = cellElement.querySelector('.row-expander');
                                        if (expanderIcon) {
                                            expanderIcon.innerHTML = data._expanded ? "−" : "+";
                                        }
                                    }
                                } catch (error) {
                                    console.error("Error updating expander icon:", error);
                                }
                            });
                        });
                    }
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
            virtualDom: false, // Disable for small subtables
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

    // Optimized row formatter with lazy subtable creation
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
                
                if (!existingSubrow) {
                    // Defer subtable creation to avoid blocking
                    requestAnimationFrame(() => {
                        // Create container for subtables
                        var holderEl = document.createElement("div");
                        holderEl.classList.add('subrow-container');
                        holderEl.style.cssText = 'padding: 10px; background: #f8f9fa; margin: 10px 0; border-radius: 4px; display: block; width: 100%;';
                        
                        // Check if this is the matchups table
                        if (data["Matchup Team"] !== undefined) {
                            var subtableEl = document.createElement("div");
                            holderEl.appendChild(subtableEl);
                            rowElement.appendChild(holderEl);
                            
                            if (self.createMatchupsSubtable) {
                                self.createMatchupsSubtable(subtableEl, data);
                            }
                        } else {
                            // For other tables, create two subtables
                            var subtable1 = document.createElement("div");
                            subtable1.style.marginBottom = "15px";
                            var subtable2 = document.createElement("div");
                            
                            holderEl.appendChild(subtable1);
                            holderEl.appendChild(subtable2);
                            rowElement.appendChild(holderEl);
                            
                            // Create subtables with error handling
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
                        
                        // Force row height recalculation without redraw
                        setTimeout(() => {
                            row.normalizeHeight();
                        }, 100);
                    });
                }
            } else {
                // Handle contraction
                var existingSubrow = rowElement.querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                    rowElement.classList.remove('row-expanded');
                    
                    // Force row height recalculation
                    setTimeout(() => {
                        row.normalizeHeight();
                    }, 50);
                }
            }
        };
    }
}
