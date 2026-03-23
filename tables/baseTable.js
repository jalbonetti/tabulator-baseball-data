// tables/baseTable.js - Base Table Class for Baseball Props
// Ported from NBA version with MLB-specific identifier fields and caching
import { API_CONFIG, TEAM_NAME_MAP, isMobile, isTablet, getDeviceType } from '../shared/config.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// IndexedDB for persistent caching
const DB_NAME = 'BaseballTabulatorCache';
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
            
            request.onerror = () => reject(request.error);
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
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const cacheManager = new CacheManager();

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.dataLoaded = false;
        this.filterState = [];
        this.sortState = [];
        this.expandedRowsCache = new Set();
        this.expandedRowsSet = new Set();
        this.expandedRowsMetadata = new Map();
        this.temporaryExpandedRows = new Set();
        this.lastScrollPosition = 0;
        this.isRestoringState = false;
        this.pendingStateRestore = false;
        this.pendingRestoration = false;
        this.restorationAttempts = 0;
        this.maxRestorationAttempts = 3;
        
        this.tableConfig = this.getBaseConfig();
    }
    
    // Filter out NULL/empty rows from Supabase
    filterNullRows(records) {
        if (!records || !Array.isArray(records)) {
            return records;
        }
        
        const originalCount = records.length;
        
        // Primary identifier fields - a row is valid if ANY of these has a value
        const primaryIdentifierFields = [
            "Batter Name",       // Batter odds table
            "Pitcher Name",      // Pitcher odds table
            "Game Matchup",      // Game odds table
            "Game Label",        // Game odds table
            "Batter Matchup",    // Batter odds table
            "Pitcher Matchup",   // Pitcher odds table
        ];
        
        const filtered = records.filter(row => {
            // Check if any primary identifier has a value
            const hasPrimaryId = primaryIdentifierFields.some(field => {
                const value = row[field];
                return value !== null && value !== undefined && value !== '';
            });
            
            if (hasPrimaryId) return true;
            
            // Fallback: check if ALL values are null/empty
            const values = Object.entries(row)
                .filter(([key]) => !key.startsWith('_'))
                .map(([, value]) => value);
            
            const allNullOrEmpty = values.every(v => 
                v === null || v === undefined || v === ''
            );
            
            if (allNullOrEmpty) return false;
            
            return true;
        });
        
        if (originalCount !== filtered.length) {
            console.warn(`⚠️ Filtered out ${originalCount - filtered.length} NULL/empty rows from ${this.endpoint}`);
        }
        
        return filtered;
    }
    
    getBaseConfig() {
        const self = this;
        const url = API_CONFIG.baseURL + this.endpoint;
        const cacheKey = `baseball_${this.endpoint}`;
        
        return {
            height: "600px",
            maxHeight: "600px",
            layout: "fitDataFill",
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "virtual",
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            pagination: false,
            columnHeaderSortMulti: true,
            headerSortClickElement: "header",
            resizableColumns: false,
            resizableRows: false,
            movableColumns: false,
            placeholder: "Loading data...",
            
            ajaxURL: url,
            ajaxConfig: {
                method: "GET",
                headers: API_CONFIG.headers
            },
            
            ajaxRequestFunc: async function(url, config, params) {
                try {
                    // Check in-memory cache first
                    if (dataCache.has(cacheKey)) {
                        const cached = dataCache.get(cacheKey);
                        if (Date.now() - cached.timestamp < CACHE_DURATION) {
                            console.log(`Memory cache hit for ${cacheKey}`);
                            return self.filterNullRows(cached.data);
                        }
                    }
                    
                    // Check IndexedDB cache
                    try {
                        const idbData = await cacheManager.getCachedData(cacheKey);
                        if (idbData) {
                            dataCache.set(cacheKey, { data: idbData, timestamp: Date.now() });
                            return self.filterNullRows(idbData);
                        }
                    } catch (e) {
                        console.warn('IndexedDB cache miss:', e);
                    }
                    
                    // Fetch from Supabase with pagination
                    let allRecords = [];
                    let page = 0;
                    const pageSize = API_CONFIG.fetchConfig.pageSize;
                    let hasMore = true;
                    
                    while (hasMore) {
                        const offset = page * pageSize;
                        const separator = url.includes('?') ? '&' : '?';
                        const paginatedUrl = `${url}${separator}select=*&offset=${offset}&limit=${pageSize}`;
                        
                        const response = await fetch(paginatedUrl, {
                            method: config.method || "GET",
                            headers: config.headers
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const records = await response.json();
                        allRecords = allRecords.concat(records);
                        
                        hasMore = records.length === pageSize;
                        page++;
                        
                        console.log(`Fetched page ${page}: ${records.length} records (total: ${allRecords.length})`);
                    }
                    
                    // Cache the results
                    dataCache.set(cacheKey, { data: allRecords, timestamp: Date.now() });
                    
                    try {
                        await cacheManager.setCachedData(cacheKey, allRecords);
                    } catch (e) {
                        console.warn('Failed to cache to IndexedDB:', e);
                    }
                    
                    return self.filterNullRows(allRecords);
                    
                } catch (error) {
                    console.error(`Error fetching data for ${self.endpoint}:`, error);
                    throw error;
                }
            }
        };
    }

    // Generate a unique row ID for state tracking
    generateRowId(data) {
        // Batter odds
        if (data["Batter Name"]) {
            let id = `batter_${data["Batter Name"]}_${data["Batter Team"] || ''}`;
            if (data["Batter Prop Type"]) id += `_${data["Batter Prop Type"]}`;
            if (data["Batter Prop Line"]) id += `_${data["Batter Prop Line"]}`;
            if (data["Batter Over/Under"]) id += `_${data["Batter Over/Under"]}`;
            if (data["Batter Book"]) id += `_${data["Batter Book"]}`;
            return id;
        }
        // Pitcher odds
        if (data["Pitcher Name"]) {
            let id = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"] || ''}`;
            if (data["Pitcher Prop Type"]) id += `_${data["Pitcher Prop Type"]}`;
            if (data["Pitcher Prop Line"]) id += `_${data["Pitcher Prop Line"]}`;
            if (data["Pitcher Over/Under"]) id += `_${data["Pitcher Over/Under"]}`;
            if (data["Pitcher Book"]) id += `_${data["Pitcher Book"]}`;
            return id;
        }
        // Game odds
        if (data["Game Matchup"]) {
            let id = `game_${data["Game Matchup"]}`;
            if (data["Game Prop Type"]) id += `_${data["Game Prop Type"]}`;
            if (data["Game Label"]) id += `_${data["Game Label"]}`;
            if (data["Game Line"]) id += `_${data["Game Line"]}`;
            if (data["Game Book"]) id += `_${data["Game Book"]}`;
            return id;
        }
        return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create name formatter with expand icon
    createNameFormatter() {
        return (cell) => {
            const value = cell.getValue();
            if (!value) return '-';
            
            const data = cell.getRow().getData();
            const expanded = data._expanded;
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center; cursor: pointer;';
            
            const icon = document.createElement('span');
            icon.className = 'expand-icon';
            icon.style.cssText = 'margin-right: 10px; font-size: 10px; transition: transform 0.2s; color: #b91c1c; display: inline-flex; width: 12px;';
            icon.innerHTML = '▶';
            
            if (expanded) {
                icon.style.transform = 'rotate(90deg)';
            }
            
            const text = document.createElement('span');
            text.textContent = value;
            text.style.cssText = 'font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            
            container.appendChild(icon);
            container.appendChild(text);
            
            return container;
        };
    }

    // Setup row expansion/collapse on click
    setupRowExpansion() {
        if (!this.table) return;
        
        const self = this;
        
        this.table.on("rowClick", function(e, row) {
            const data = row.getData();
            const wasExpanded = data._expanded;
            
            data._expanded = !wasExpanded;
            
            const cells = row.getCells();
            const nameFields = ["Batter Name", "Pitcher Name", "Game Matchup"];
            
            for (let nameField of nameFields) {
                const nameCell = cells.find(c => c.getField() === nameField);
                if (nameCell) {
                    const cellElement = nameCell.getElement();
                    const icon = cellElement.querySelector('.expand-icon');
                    if (icon) {
                        icon.style.transform = data._expanded ? 'rotate(90deg)' : '';
                    }
                    break;
                }
            }
            
            row.update(data);
            row.reformat();
            
            const rowId = self.generateRowId(data);
            if (data._expanded) {
                self.expandedRowsCache.add(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.set(`${self.elementId}_${rowId}`, true);
                }
            } else {
                self.expandedRowsCache.delete(rowId);
                if (window.globalExpandedState) {
                    window.globalExpandedState.delete(`${self.elementId}_${rowId}`);
                }
            }
            
            console.log(`Row ${data._expanded ? 'expanded' : 'collapsed'}: ${rowId}`);
        });
    }

    // Save current state
    saveState() {
        if (!this.table) return;
        this.filterState = this.table.getHeaderFilters();
        this.sortState = this.table.getSorters();
    }

    // Restore saved state
    restoreState() {
        if (!this.table) return;
        
        if (this.filterState && this.filterState.length > 0) {
            this.filterState.forEach(filter => {
                this.table.setHeaderFilterValue(filter.field, filter.value);
            });
        }
        
        if (this.sortState && this.sortState.length > 0) {
            this.table.setSort(this.sortState);
        }
    }

    // Save temporary expanded state (before filter/sort operations)
    saveTemporaryExpandedState() {
        this.temporaryExpandedRows.clear();
        
        if (this.table) {
            const rows = this.table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                if (data._expanded) {
                    const id = this.generateRowId(data);
                    this.temporaryExpandedRows.add(id);
                }
            });
        }
        console.log(`Temporarily saved ${this.temporaryExpandedRows.size} expanded rows for ${this.elementId}`);
    }
    
    // Restore temporary expanded state
    restoreTemporaryExpandedState() {
        if (this.temporaryExpandedRows.size > 0 && this.table) {
            console.log(`Restoring ${this.temporaryExpandedRows.size} temporarily expanded rows for ${this.elementId}`);
            
            setTimeout(() => {
                const rows = this.table.getRows();
                rows.forEach(row => {
                    const data = row.getData();
                    const id = this.generateRowId(data);
                    
                    if (this.temporaryExpandedRows.has(id) && !data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                });
            }, 100);
        }
    }

    // Apply global expanded state
    applyGlobalExpandedState() {
        if (!this.table || !window.globalExpandedState) return;
        
        const rows = this.table.getRows();
        rows.forEach(row => {
            const data = row.getData();
            const rowId = this.generateRowId(data);
            const stateKey = `${this.elementId}_${rowId}`;
            
            if (window.globalExpandedState.has(stateKey)) {
                data._expanded = true;
                row.update(data);
                row.reformat();
            }
        });
    }
}
