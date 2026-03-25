// tables/gameOdds.js - Baseball Game Odds Table
// Modeled on NBA basketGameOdds.js / CBB cbbGameOdds.js
// Supabase: BaseballGameOdds
// No Name column - Game Matchup is the frozen/primary column
//
// FIXES APPLIED:
//   1. ...this.tableConfig → ...this.getBaseConfig()  (provides AJAX config so data loads)
//   2. Added injectContainerStyles('table2-container') in initialize()
//   3. Font measurement 14px → 12px in scanDataForMaxWidths/equalizeClusteredColumns

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';
import { injectContainerStyles } from '../styles/tableStyles.js';

const EV_KELLY_COLUMN_MIN_WIDTH = 75;

export class GameOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BaseballGameOdds');
        this.teamAbbrevMap = TEAM_NAME_MAP;
    }

    abbreviateMatchup(matchup) {
        if (!matchup) return '-';
        let abbreviated = matchup;
        Object.entries(this.teamAbbrevMap).forEach(([fullName, abbrev]) => {
            const regex = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            abbreviated = abbreviated.replace(regex, abbrev);
        });
        return abbreviated;
    }

    initialize() {
        // FIXED: Inject ID-scoped container styles for scrollbar, placeholder, filter fonts
        injectContainerStyles('table2-container');
        
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        // FIXED: Use this.getBaseConfig() instead of this.tableConfig
        const baseConfig = this.getBaseConfig();
        
        const config = {
            ...baseConfig,
            placeholder: "Loading game odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "EV %", dir: "desc"}
            ],
            dataLoaded: (data) => {
                console.log(`Game Odds table loaded ${data.length} records`);
                this.dataLoaded = true;
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) loadingDiv.remove();
                }
            },
            ajaxError: (error) => {
                console.error("Error loading game odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Game Odds table built");
            
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                } else {
                    if (!isMobile() && !isTablet()) {
                        this.calculateAndApplyWidths();
                    }
                }
            }, 200);
            
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) {
                    this.calculateAndApplyWidths();
                }
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) {
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                }
            }, 100);
        });
        
        this.table.on("renderComplete", () => {
            if (!isMobile() && !isTablet()) {
                setTimeout(() => this.calculateAndApplyWidths(), 100);
            }
        });
    }

    forceRecalculateWidths() {
        if (!this.table) return;
        const data = this.table ? this.table.getData() : [];
        if (data.length > 0) {
            this.scanDataForMaxWidths(data);
            this.equalizeClusteredColumns();
            this.calculateAndApplyWidths();
        }
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    oddsSorter(a, b) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseInt(String(val).trim(), 10);
            return isNaN(num) ? -99999 : num;
        };
        return getNum(a) - getNum(b);
    }

    percentSorter(a, b) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const str = String(val).replace('%', '').trim();
            const num = parseFloat(str);
            return isNaN(num) ? -99999 : num;
        };
        return getNum(a) - getNum(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        const matchupFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return self.abbreviateMatchup(value);
        };

        const evFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return (num * 100).toFixed(1) + '%';
        };

        const kellyFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            
            const bankroll = getBankrollValue('Game Quarter Kelly %');
            
            if (bankroll > 0) {
                const amount = num * bankroll;
                return '$' + amount.toFixed(2);
            } else {
                return (num * 100).toFixed(1) + '%';
            }
        };

        const linkFormatter = (cell) => {
            const value = cell.getValue();
            if (!value || value === '-' || value === '') return '-';
            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Bet';
            link.style.cssText = 'color: #b91c1c; text-decoration: underline; font-weight: 500;';
            return link;
        };

        return [
            { title: "Matchup", field: "Game Matchup", frozen: true, widthGrow: 0, minWidth: isSmallScreen ? 120 : 180, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "left", formatter: matchupFormatter },
            { title: "Prop", field: "Game Prop Type", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Label", field: "Game Label", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Line", field: "Game Line", widthGrow: 0, minWidth: 50, sorter: "number", headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, hozAlign: "center", formatter: lineFormatter },
            { title: "Book", field: "Game Book", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Book Odds", field: "Game Odds", widthGrow: 0, minWidth: 55, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Median Odds", field: "Game Median Odds", widthGrow: 0, minWidth: 55, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Odds", field: "Game Best Odds", widthGrow: 0, minWidth: 55, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Books", field: "Game Best Odds Books", widthGrow: 0, minWidth: 70, sorter: "string", resizable: false, hozAlign: "center" },
            { title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a, b) { return self.percentSorter(a, b); }, resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a, b) { return self.percentSorter(a, b); }, headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction, headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'Game Quarter Kelly %' }, resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Link", field: "Link", width: 50, widthGrow: 0, minWidth: 40, maxWidth: 50, sorter: "string", resizable: false, hozAlign: "center", formatter: linkFormatter, headerSort: false }
        ];
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // FIXED: 14px → 12px to match actual display font size
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16;
        const SORT_ICON_WIDTH = 20;
        
        const oddsCluster = ['Game Odds', 'Game Median Odds', 'Game Best Odds'];
        let maxOddsWidth = 0;
        oddsCluster.forEach(field => {
            const col = this.table.getColumn(field);
            if (col) {
                if (col.getWidth() > maxOddsWidth) maxOddsWidth = col.getWidth();
                const title = col.getDefinition().title;
                if (title) {
                    const hw = ctx.measureText(title).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (hw > maxOddsWidth) maxOddsWidth = hw;
                }
            }
        });
        if (maxOddsWidth > 0) {
            oddsCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxOddsWidth)); });
        }
        
        const evCluster = ['EV %', 'Quarter Kelly %'];
        let maxEvWidth = EV_KELLY_COLUMN_MIN_WIDTH;
        evCluster.forEach(field => {
            const col = this.table.getColumn(field);
            if (col) {
                if (col.getWidth() > maxEvWidth) maxEvWidth = col.getWidth();
                const title = col.getDefinition().title;
                if (title) {
                    const hw = ctx.measureText(title).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (hw > maxEvWidth) maxEvWidth = hw;
                }
            }
        });
        if (maxEvWidth > 0) {
            evCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxEvWidth)); });
        }
    }

    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidths = { "Game Matchup": 0, "Game Prop Type": 0, "Game Label": 0, "Game Book": 0, "Game Best Odds Books": 0 };
        
        // FIXED: 14px → 12px to match actual display font size
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const fieldToTitle = { "Game Matchup": "Matchup", "Game Prop Type": "Prop", "Game Label": "Label", "Game Book": "Book", "Game Best Odds Books": "Best Books" };
        
        Object.keys(maxWidths).forEach(field => {
            maxWidths[field] = ctx.measureText(fieldToTitle[field] || field).width + 32;
        });
        
        // FIXED: 14px → 12px to match actual display font size
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value) {
                    let dv = String(value);
                    if (field === 'Game Matchup') dv = this.abbreviateMatchup(value);
                    const w = ctx.measureText(dv).width;
                    if (w > maxWidths[field]) maxWidths[field] = w;
                }
            });
        });
        
        const CELL_PADDING = 16;
        const BUFFER = 8;
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    if (requiredWidth > column.getWidth()) column.setWidth(Math.ceil(requiredWidth));
                }
            }
        });
        
        console.log('Game Odds max width scan complete');
    }

    calculateAndApplyWidths() {
        if (!this.table) return;
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        if (isMobile() || isTablet()) {
            tableElement.style.width = '';
            tableElement.style.minWidth = '';
            tableElement.style.maxWidth = '';
            const tc = tableElement.closest('.table-container');
            if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; }
            return;
        }
        
        try {
            const tableHolder = tableElement.querySelector('.tabulator-tableholder');
            if (tableHolder) tableHolder.style.overflowY = 'scroll';
            
            let totalColumnWidth = 0;
            this.table.getColumns().forEach(col => { if (col.isVisible()) totalColumnWidth += col.getWidth(); });
            
            const SCROLLBAR_WIDTH = 17;
            const totalWidth = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = totalWidth + 'px';
            tableElement.style.minWidth = totalWidth + 'px';
            tableElement.style.maxWidth = totalWidth + 'px';
            
            if (tableHolder) { tableHolder.style.width = totalWidth + 'px'; tableHolder.style.maxWidth = totalWidth + 'px'; }
            const header = tableElement.querySelector('.tabulator-header');
            if (header) header.style.width = totalWidth + 'px';
            
            const tc = tableElement.closest('.table-container');
            if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
            
            console.log(`Game Odds: Set width to ${totalWidth}px`);
        } catch (error) {
            console.error('Game Odds calculateAndApplyWidths error:', error);
        }
    }

    forceRecalculateWidths() {
        if (!this.table) return;
        const data = this.table.getData() || [];
        if (data.length > 0) {
            this.scanDataForMaxWidths(data);
            this.equalizeClusteredColumns();
        }
        this.calculateAndApplyWidths();
    }
}
