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
                    let allRecords = [];
                    let page = 0;
                    const pageSize = API_CONFIG.fetchConfig.pageSize;
                    let hasMore = true;
                    while (hasMore) {
                        const offset = page * pageSize;
                        const separator = url.includes('?') ? '&' : '?';
                        const paginatedUrl = `${url}${separator}select=*&offset=${offset}&limit=${pageSize}`;
                        const response = await fetch(paginatedUrl, { method: config.method || "GET", headers: config.headers });
                        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        const records = await response.json();
                        allRecords = allRecords.concat(records);
                        hasMore = records.length === pageSize;
                        page++;
                        console.log(`Fetched page ${page}: ${records.length} records (total: ${allRecords.length})`);
                    }
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
