// tables/gameOdds.js - Baseball Game Odds Table
// Modeled on NBA basketGameOdds.js
// Supabase: BaseballGameOdds
// No Name column - Game Matchup is the frozen/primary column

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';

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
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const config = {
            ...this.tableConfig,
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",
            pagination: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
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
            
            if (!isSmallScreen) {
                setTimeout(() => {
                    const data = this.table ? this.table.getData() : [];
                    if (data.length > 0) {
                        this.scanDataForMaxWidths(data);
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                }, 200);
            }
        });
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
            const num = parseFloat(String(val).replace('%', '').trim());
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
            {
                title: "Matchup", 
                field: "Game Matchup", 
                frozen: true,
                widthGrow: 0,
                minWidth: isSmallScreen ? 95 : 135,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "left",
                formatter: matchupFormatter
            },
            { title: "Prop", field: "Game Prop Type", widthGrow: 0, minWidth: 70, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Label", field: "Game Label", widthGrow: 0, minWidth: 70, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Line", field: "Game Line", widthGrow: 0, minWidth: 55, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, hozAlign: "center", formatter: lineFormatter },
            { title: "Book", field: "Game Book", widthGrow: 0, minWidth: 70, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Book Odds", field: "Game Odds", widthGrow: 0, minWidth: 85, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Median Odds", field: "Game Median Odds", widthGrow: 0, minWidth: 85, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Odds", field: "Game Best Odds", widthGrow: 0, minWidth: 100, sorter: function(a, b) { return self.oddsSorter(a, b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Books", field: "Game Best Odds Books", widthGrow: 0, minWidth: 90, sorter: "string", resizable: false, hozAlign: "center" },
            { title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a, b) { return self.percentSorter(a, b); }, resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a, b) { return self.percentSorter(a, b); }, headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction, headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'Game Quarter Kelly %' }, resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Link", field: "Link", width: 50, widthGrow: 0, minWidth: 40, maxWidth: 50, sorter: "string", resizable: false, hozAlign: "center", formatter: linkFormatter, headerSort: false }
        ];
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '600 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
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
        let maxEvWidth = 0;
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
        
        ctx.font = '600 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const fieldToTitle = { "Game Matchup": "Matchup", "Game Prop Type": "Prop", "Game Label": "Label", "Game Book": "Book", "Game Best Odds Books": "Best Books" };
        
        Object.keys(maxWidths).forEach(field => {
            maxWidths[field] = ctx.measureText(fieldToTitle[field] || field).width + 32;
        });
        
        ctx.font = '500 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value) {
                    let dv = String(value);
                    if (field === 'Game Matchup') dv = this.abbreviateMatchup(value);
                    const tw = ctx.measureText(dv).width;
                    if (tw > maxWidths[field]) maxWidths[field] = tw;
                }
            });
        });
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const col = this.table.getColumn(field);
                if (col) {
                    const req = maxWidths[field] + 24;
                    if (req > col.getWidth()) col.setWidth(Math.ceil(req));
                }
            }
        });
    }

    calculateAndApplyWidths() {
        if (!this.table) return;
        const el = this.table.element;
        if (!el) return;
        
        if (isMobile() || isTablet()) {
            el.style.width = ''; el.style.minWidth = ''; el.style.maxWidth = '';
            const tc = el.closest('.table-container');
            if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; }
            return;
        }
        
        el.style.width = 'auto'; el.style.minWidth = 'auto'; el.style.maxWidth = 'none';
        const th = el.querySelector('.tabulator-tableholder');
        if (th) { th.style.width = 'auto'; th.style.maxWidth = 'none'; }
        void el.offsetWidth;
        
        try {
            let total = 0;
            this.table.getColumns().forEach(c => { total += c.getWidth(); });
            const w = total + 17;
            el.style.width = w + 'px'; el.style.minWidth = w + 'px'; el.style.maxWidth = w + 'px';
            if (th) { th.style.width = w + 'px'; th.style.maxWidth = w + 'px'; }
            const hdr = el.querySelector('.tabulator-header');
            if (hdr) hdr.style.width = w + 'px';
            const tc = el.closest('.table-container');
            if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
        } catch (e) { console.error('Error in calculateAndApplyWidths:', e); }
    }
}
