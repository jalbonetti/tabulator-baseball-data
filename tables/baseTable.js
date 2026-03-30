// tables/baseTable.js - Base Table Class for Baseball Props
// EXACT copy of CBB baseTable.js pattern: no IndexedDB, memory cache only

import { API_CONFIG, isMobile, isTablet } from '../shared/config.js';

const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export class BaseTable {
    constructor(elementId, endpoint) {
        this.elementId = elementId;
        this.endpoint = endpoint;
        this.table = null;
        this.dataLoaded = false;
        this.filterState = [];
        this.sortState = [];
    }
    
    filterNullRows(records) {
        if (!records || !Array.isArray(records)) return records;
        const originalCount = records.length;
        const primaryIdentifierFields = [
            "Batter Name", "Pitcher Name", "Game Matchup",
            "Batter Matchup", "Pitcher Matchup", "Game Label"
        ];
        const filtered = records.filter(row => {
            const hasPrimaryId = primaryIdentifierFields.some(field => {
                const value = row[field];
                return value !== null && value !== undefined && value !== '';
            });
            if (hasPrimaryId) return true;
            const values = Object.entries(row).filter(([key]) => !key.startsWith('_')).map(([, value]) => value);
            return !values.every(v => v === null || v === undefined || v === '');
        });
        if (originalCount !== filtered.length) {
            console.warn(`Filtered out ${originalCount - filtered.length} NULL/empty rows from ${this.endpoint}`);
        }
        return filtered;
    }

    getCachedData(key) {
        const cached = dataCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
        dataCache.delete(key);
        return null;
    }
    
    setCachedData(key, data) {
        dataCache.set(key, { data, timestamp: Date.now() });
    }
    
    // Fetch all records with pagination and loading progress indicator
    async fetchAllRecords(url, config) {
        const pageSize = API_CONFIG.fetchConfig.pageSize;
        let allRecords = [];
        let page = 0;
        let hasMore = true;
        let retries = 0;
        const maxRetries = API_CONFIG.fetchConfig.maxRetries || 3;
        
        console.log(`Starting data fetch from ${url}...`);
        
        // Show loading indicator
        if (this.elementId) {
            const element = document.querySelector(this.elementId);
            if (element) {
                const progressDiv = document.createElement('div');
                progressDiv.id = 'loading-progress';
                progressDiv.className = 'loading-indicator';
                progressDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
                progressDiv.innerHTML = '<div style="text-align: center;"><div>Loading data...</div><div id="progress-text" style="margin-top: 10px; font-weight: bold;">0 records</div></div>';
                element.style.position = 'relative';
                element.appendChild(progressDiv);
            }
        }
        
        while (hasMore) {
            try {
                const offset = page * pageSize;
                const separator = url.includes('?') ? '&' : '?';
                const paginatedUrl = `${url}${separator}select=*&offset=${offset}&limit=${pageSize}`;
                
                const response = await fetch(paginatedUrl, {
                    method: config.method || "GET",
                    headers: config.headers
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
                const records = await response.json();
                allRecords = allRecords.concat(records);
                hasMore = records.length === pageSize;
                page++;
                
                // Update progress
                const progressText = document.getElementById('progress-text');
                if (progressText) {
                    progressText.textContent = `${allRecords.length} records loaded...`;
                }
                
                console.log(`Fetched page ${page}: ${records.length} records (total: ${allRecords.length})`);
                retries = 0;
                
            } catch (error) {
                retries++;
                console.error(`Fetch error (attempt ${retries}/${maxRetries}):`, error);
                
                if (retries >= maxRetries) {
                    console.error(`Max retries reached for ${this.endpoint}`);
                    hasMore = false;
                } else {
                    await new Promise(r => setTimeout(r, 1000 * retries));
                }
            }
        }
        
        // Remove loading indicator
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        console.log(`Fetch complete: ${allRecords.length} total records`);
        return allRecords;
    }
    
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
            ajaxConfig: { method: "GET", headers: API_CONFIG.headers },
            ajaxRequestFunc: async function(url, config, params) {
                const memoryCached = self.getCachedData(cacheKey);
                if (memoryCached) {
                    console.log(`Cache hit for ${cacheKey}`);
                    return self.filterNullRows(memoryCached);
                }
                try {
                    let allRecords = await self.fetchAllRecords(url, config);
                    self.setCachedData(cacheKey, allRecords);
                    return self.filterNullRows(allRecords);
                } catch (error) {
                    console.error(`Error fetching data for ${self.endpoint}:`, error);
                    throw error;
                }
            }
        };
    }
}
