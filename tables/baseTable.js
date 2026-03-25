// tables/baseTable.js - Base Table Class for Baseball Props
// Simplified to match CBB pattern: No IndexedDB, memory cache only
// FIXED: layout "fitData" (was "fitDataFill"), renderHorizontal "basic" (was "virtual")
import { API_CONFIG, TEAM_NAME_MAP, isMobile, isTablet, getDeviceType } from '../shared/config.js';

// Global data cache to persist between tab switches
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.dataLoaded = false;
        this.filterState = [];
        this.sortState = [];
    }
    
    // Filter out NULL/empty rows from Supabase
    filterNullRows(records) {
        if (!records || !Array.isArray(records)) return records;
        
        const originalCount = records.length;
        
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
            console.warn(`Filtered out ${originalCount - filtered.length} NULL/empty rows from ${this.endpoint}`);
        }
        
        return filtered;
    }

    // Memory cache helpers
    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        dataCache.delete(key);
        return null;
    }
    
    setCachedData(key, data) {
        dataCache.set(key, { data, timestamp: Date.now() });
    }
    
    // Get base table configuration with AJAX
    // FIXED: layout "fitData" (was "fitDataFill"), renderHorizontal "basic" (was "virtual")
    // FIXED: Removed IndexedDB caching — memory cache only (matches CBB pattern)
    getBaseConfig() {
        const self = this;
        const url = API_CONFIG.baseURL + this.endpoint;
        const cacheKey = `baseball_${this.endpoint}`;
        
        return {
            height: "600px",
            maxHeight: "600px",
            layout: "fitData",
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",
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
            
            // Custom request function with memory caching
            ajaxRequestFunc: async function(url, config, params) {
                // Check memory cache
                const memoryCached = self.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Cache hit for ${cacheKey}`);
                    return self.filterNullRows(memoryCached);
                }
                
                try {
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
                    
                    // Cache the results in memory
                    self.setCachedData(cacheKey, allRecords);
                    
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
            container.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
            
            const icon = document.createElement('span');
            icon.textContent = expanded ? '▼' : '▶';
            icon.style.cssText = 'font-size:8px;color:#b91c1c;flex-shrink:0;';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = value;
            nameSpan.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            
            container.appendChild(icon);
            container.appendChild(nameSpan);
            return container;
        };
    }

    // Setup row expansion (for clearance/alt tables that use expandable rows)
    setupRowExpansion() {
        if (!this.table) return;
        
        this.table.on("rowClick", (e, row) => {
            const data = row.getData();
            data._expanded = !data._expanded;
            
            const rowId = this.generateRowId(data);
            if (data._expanded) {
                window.globalExpandedState.set(rowId, true);
            } else {
                window.globalExpandedState.delete(rowId);
            }
            
            row.reformat();
        });
    }

    // Refresh data from Supabase
    async refreshData() {
        if (!this.table) return;
        
        const cacheKey = `baseball_${this.endpoint}`;
        dataCache.delete(cacheKey);
        
        try {
            await this.table.setData();
            console.log(`Refreshed data for ${this.endpoint}`);
        } catch (error) {
            console.error(`Error refreshing data for ${this.endpoint}:`, error);
        }
    }
}
