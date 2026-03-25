// tables/gameOdds.js - Baseball Game Odds Table
// Modeled exactly on CBB cbbGameOdds.js

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';

const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class GameOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BaseballGameOdds');
        this.teamAbbrevMap = TEAM_NAME_MAP;
    }

    abbreviateMatchup(matchup) {
        if (!matchup) return '-';
        let abbreviated = matchup;
        Object.entries(this.teamAbbrevMap).forEach(([fullName, abbrev]) => {
            abbreviated = abbreviated.replace(new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), abbrev);
        });
        return abbreviated;
    }

    initialize() {
        const isSmallScreen = isMobile() || isTablet();
        const baseConfig = this.getBaseConfig();
        const config = {
            ...baseConfig,
            placeholder: "Loading game odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [{column: "EV %", dir: "desc"}],
            dataLoaded: (data) => {
                console.log(`Game Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => { console.error("Error loading game odds:", error); }
        };
        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Game Odds table built");
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); }
                }
            }, 200);
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) { this.calculateAndApplyWidths(); }
            }, 250));
        });
        this.table.on("dataLoaded", () => { setTimeout(() => { const data = this.table ? this.table.getData() : []; if (data.length > 0) { this.scanDataForMaxWidths(data); if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); } } }, 100); });
        this.table.on("renderComplete", () => { if (!isMobile() && !isTablet()) { setTimeout(() => this.calculateAndApplyWidths(), 100); } });
    }

    debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
    forceRecalculateWidths() { if (!this.table) return; const data = this.table.getData() || []; if (data.length > 0) { this.scanDataForMaxWidths(data); if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); } } this.calculateAndApplyWidths(); }
    oddsSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseInt(String(v).trim(), 10) || -99999; }; return g(a) - g(b); }
    percentSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseFloat(String(v).replace('%','').trim()) || -99999; }; return g(a) - g(b); }

    getColumns(isSmallScreen = false) {
        const self = this;
        const oddsFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseInt(v, 10); if (isNaN(n)) return '-'; return n > 0 ? `+${n}` : `${n}`; };
        const lineFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '') return ''; const n = parseFloat(v); if (isNaN(n)) return ''; return n.toFixed(1); };
        const evFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; return n.toFixed(1) + '%'; };
        const kellyFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; const b = getBankrollValue('Game Quarter Kelly %'); if (b > 0) return '$' + (n / 100 * b).toFixed(2); return n.toFixed(1) + '%'; };
        const matchupFormatter = (cell) => { const v = cell.getValue(); return v ? self.abbreviateMatchup(v) : '-'; };
        const linkFormatter = (cell) => { const v = cell.getValue(); if (!v || v === '-' || v === '') return '-'; const a = document.createElement('a'); a.href = v; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Bet'; a.style.cssText = 'color:#b91c1c;text-decoration:underline;font-weight:500;'; return a; };

        return [
            { title: "Matchup", field: "Game Matchup", frozen: true, widthGrow: 0, minWidth: isSmallScreen ? 120 : 180, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "left" },
            { title: "Prop", field: "Game Prop Type", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Label", field: "Game Label", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Line", field: "Game Line", widthGrow: 0, minWidth: 50, sorter: "number", headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, hozAlign: "center", formatter: lineFormatter },
            { title: "Book", field: "Game Book", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Book Odds", field: "Game Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Median Odds", field: "Game Median Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Odds", field: "Game Best Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Books", field: "Game Best Odds Books", widthGrow: 0, minWidth: 70, sorter: "string", resizable: false, hozAlign: "center" },
            { title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction, headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'Game Quarter Kelly %' }, resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Link", field: "Link", width: 50, widthGrow: 0, minWidth: 40, maxWidth: 50, sorter: "string", resizable: false, hozAlign: "center", formatter: linkFormatter, headerSort: false }
        ];
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16; const SORT_ICON_WIDTH = 20;
        const oddsCluster = ['Game Odds', 'Game Median Odds', 'Game Best Odds']; let maxOddsWidth = 0;
        oddsCluster.forEach(field => { const col = this.table.getColumn(field); if (col) { if (col.getWidth() > maxOddsWidth) maxOddsWidth = col.getWidth(); const t = col.getDefinition().title; if (t) { const hw = ctx.measureText(t).width + CELL_PADDING + SORT_ICON_WIDTH; if (hw > maxOddsWidth) maxOddsWidth = hw; } } });
        if (maxOddsWidth > 0) oddsCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxOddsWidth)); });
        const evCluster = ['EV %', 'Quarter Kelly %']; let maxEvWidth = EV_KELLY_COLUMN_MIN_WIDTH;
        evCluster.forEach(field => { const col = this.table.getColumn(field); if (col) { if (col.getWidth() > maxEvWidth) maxEvWidth = col.getWidth(); const t = col.getDefinition().title; if (t) { const hw = ctx.measureText(t).width + CELL_PADDING + SORT_ICON_WIDTH; if (hw > maxEvWidth) maxEvWidth = hw; } } });
        if (maxEvWidth > 0) evCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxEvWidth)); });
    }

    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        if (isMobile() || isTablet()) return;
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const maxWidths = { "Game Matchup": 0, "Game Prop Type": 0, "Game Label": 0, "Game Book": 0, "Game Odds": 0, "Game Median Odds": 0, "Game Best Odds": 0, "Game Best Odds Books": 0, "EV %": 0, "Quarter Kelly %": 0, "Link": 0 };
        data.forEach(row => { Object.keys(maxWidths).forEach(field => { const value = row[field]; if (value != null && value !== '') { let dv = String(value); if (field.includes('Odds') && field !== 'Game Best Odds Books') { const n = parseInt(value, 10); if (!isNaN(n)) dv = n > 0 ? `+${n}` : `${n}`; } if (field === 'EV %' || field === 'Quarter Kelly %') { const n = parseFloat(value); if (!isNaN(n)) dv = n.toFixed(1)+'%'; } if (field === 'Link') dv = 'Bet'; const w = ctx.measureText(dv).width; if (w > maxWidths[field]) maxWidths[field] = w; } }); });
        const CELL_PADDING = 16; const BUFFER = 8;
        Object.keys(maxWidths).forEach(field => { if (maxWidths[field] > 0) { const col = this.table.getColumn(field); if (col) { const req = maxWidths[field] + CELL_PADDING + BUFFER; if (req > col.getWidth()) col.setWidth(Math.ceil(req)); } } });
    }

    calculateAndApplyWidths() {
        if (!this.table) return; const el = this.table.element; if (!el) return;
        if (isMobile() || isTablet()) { el.style.width = ''; el.style.minWidth = ''; el.style.maxWidth = ''; const tc = el.closest('.table-container'); if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; } return; }
        try {
            const th = el.querySelector('.tabulator-tableholder'); if (th) th.style.overflowY = 'scroll';
            let totalColWidth = 0; this.table.getColumns().forEach(col => { if (col.isVisible()) totalColWidth += col.getWidth(); });
            const totalWidth = totalColWidth + 17;
            el.style.width = totalWidth + 'px'; el.style.minWidth = totalWidth + 'px'; el.style.maxWidth = totalWidth + 'px';
            if (th) { th.style.width = totalWidth + 'px'; th.style.maxWidth = totalWidth + 'px'; }
            const header = el.querySelector('.tabulator-header'); if (header) header.style.width = totalWidth + 'px';
            const tc = el.closest('.table-container'); if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
        } catch (e) { console.error('Game Odds calculateAndApplyWidths error:', e); }
    }
}
