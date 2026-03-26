// tables/batterOdds.js - Baseball Batter Prop Odds Table
// Modeled exactly on CBB cbbPlayerPropOdds.js

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';

const NAME_COLUMN_MIN_WIDTH = 180;
const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class BatterOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BaseballBatterPropOdds');
        this.teamAbbrevMap = TEAM_NAME_MAP;
        this.propAbbrevMap = { 'Runs Scored': 'Runs', 'Hits + Runs + RBIs': 'H+R+RBI', 'Total Bases': 'TB', 'Strikeouts': 'K', 'Walks': 'BB', 'Stolen Bases': 'SB', 'Singles': '1B', 'Doubles': '2B', 'Triples': '3B', 'Home Runs': 'HR' };
    }

    abbreviateMatchup(matchup) {
        if (!matchup) return '-';
        let abbreviated = matchup;
        Object.entries(this.teamAbbrevMap).forEach(([fullName, abbrev]) => {
            abbreviated = abbreviated.replace(new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), abbrev);
        });
        return abbreviated;
    }
    abbreviateProp(prop) { if (!prop) return '-'; return this.propAbbrevMap[prop] || prop; }

    initialize() {
        const isSmallScreen = isMobile() || isTablet();
        const baseConfig = this.getBaseConfig();
        const config = {
            ...baseConfig,
            placeholder: "Loading batter prop odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [{column: "EV %", dir: "desc"}],
            dataLoaded: (data) => {
                console.log(`Batter Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => { console.error("Error loading batter odds:", error); }
        };
        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Batter Odds table built");
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); }
                }
                this.ensureNameColumnWidth();
            }, 200);
            window.addEventListener('resize', this.debounce(() => {
                if (this.table && this.table.getDataCount() > 0 && !isMobile() && !isTablet()) { this.calculateAndApplyWidths(); this.ensureNameColumnWidth(); }
            }, 250));
        });
        
        this.table.on("dataLoaded", () => {
            setTimeout(() => {
                const data = this.table ? this.table.getData() : [];
                if (data.length > 0) {
                    this.scanDataForMaxWidths(data);
                    if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); }
                    this.ensureNameColumnWidth();
                }
            }, 100);
        });
        
        this.table.on("renderComplete", () => {
            if (!isMobile() && !isTablet()) { setTimeout(() => this.calculateAndApplyWidths(), 100); }
            setTimeout(() => this.ensureNameColumnWidth(), 50);
        });
    }

    debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
    ensureNameColumnWidth() { if (!this.table) return; const c = this.table.getColumn("Batter Name"); if (c && c.getWidth() < NAME_COLUMN_MIN_WIDTH) c.setWidth(NAME_COLUMN_MIN_WIDTH); }
    forceRecalculateWidths() { if (!this.table) return; const data = this.table.getData() || []; if (data.length > 0) { this.scanDataForMaxWidths(data); if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); } } this.ensureNameColumnWidth(); }

    oddsSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseInt(String(v).trim(), 10) || -99999; }; return g(a) - g(b); }
    percentSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseFloat(String(v).replace('%','').trim()) || -99999; }; return g(a) - g(b); }

    getColumns(isSmallScreen = false) {
        const self = this;
        const oddsFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseInt(v, 10); if (isNaN(n)) return '-'; return n > 0 ? `+${n}` : `${n}`; };
        const lineFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; return n.toFixed(1); };
        const matchupFormatter = (cell) => { const v = cell.getValue(); return v ? self.abbreviateMatchup(v) : '-'; };
        const propFormatter = (cell) => { const v = cell.getValue(); return v ? self.abbreviateProp(v) : '-'; };
        const evFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; return n.toFixed(1) + '%'; };
        const kellyFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; const b = getBankrollValue('Batter Quarter Kelly %'); if (b > 0) return '$' + (n / 100 * b).toFixed(2); return n.toFixed(1) + '%'; };
        const linkFormatter = (cell) => { const v = cell.getValue(); if (!v || v === '-' || v === '') return '-'; const a = document.createElement('a'); a.href = v; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Bet'; a.style.cssText = 'color:#b91c1c;text-decoration:underline;font-weight:500;'; return a; };

        return [
            { title: "Name", field: "Batter Name", frozen: true, widthGrow: 0, minWidth: isSmallScreen ? 120 : NAME_COLUMN_MIN_WIDTH, sorter: "string", headerFilter: true, resizable: false, hozAlign: "left" },
            { title: "Matchup", field: "Batter Matchup", widthGrow: 0, minWidth: 90, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: matchupFormatter },
            { title: "Team", field: "Batter Team", widthGrow: 0, minWidth: 55, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Prop", field: "Batter Prop Type", widthGrow: 0, minWidth: 65, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: propFormatter },
            { title: "Label", field: "Batter Over/Under", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Line", field: "Batter Prop Line", widthGrow: 0, minWidth: 60, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: lineFormatter },
            { title: "Book", field: "Batter Book", widthGrow: 0, minWidth: 70, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Book Odds", field: "Batter Prop Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Median Odds", field: "Batter Median Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Odds", field: "Batter Best Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Books", field: "Batter Best Odds Books", widthGrow: 0, minWidth: 70, sorter: "string", resizable: false, hozAlign: "center" },
            { title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction, headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'Batter Quarter Kelly %' }, resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Link", field: "Link", width: 50, widthGrow: 0, minWidth: 40, maxWidth: 50, sorter: "string", resizable: false, hozAlign: "center", formatter: linkFormatter, headerSort: false }
        ];
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16; const SORT_ICON_WIDTH = 20;
        const oddsCluster = ['Batter Prop Odds', 'Batter Median Odds', 'Batter Best Odds'];
        let maxOddsWidth = 0;
        oddsCluster.forEach(field => { const col = this.table.getColumn(field); if (col) { if (col.getWidth() > maxOddsWidth) maxOddsWidth = col.getWidth(); const t = col.getDefinition().title; if (t) { const hw = ctx.measureText(t).width + CELL_PADDING + SORT_ICON_WIDTH; if (hw > maxOddsWidth) maxOddsWidth = hw; } } });
        if (maxOddsWidth > 0) oddsCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxOddsWidth)); });
        const evCluster = ['EV %', 'Quarter Kelly %']; let maxEvWidth = EV_KELLY_COLUMN_MIN_WIDTH;
        evCluster.forEach(field => { const col = this.table.getColumn(field); if (col) { if (col.getWidth() > maxEvWidth) maxEvWidth = col.getWidth(); const t = col.getDefinition().title; if (t) { const hw = ctx.measureText(t).width + CELL_PADDING + SORT_ICON_WIDTH; if (hw > maxEvWidth) maxEvWidth = hw; } } });
        if (maxEvWidth > 0) evCluster.forEach(f => { const c = this.table.getColumn(f); if (c) c.setWidth(Math.ceil(maxEvWidth)); });
    }

    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        const isSmallScreen = isMobile() || isTablet();
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const maxWidths = { "Batter Best Odds Books": 0 };
        if (!isSmallScreen) Object.assign(maxWidths, { "Batter Matchup": 0, "Batter Prop Type": 0, "Batter Over/Under": 0, "Batter Book": 0, "Batter Prop Odds": 0, "Batter Median Odds": 0, "Batter Best Odds": 0, "EV %": 0, "Quarter Kelly %": 0, "Link": 0 });
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16; const SORT_ICON_WIDTH = 16;
        const fieldToTitle = { "Batter Matchup": "Matchup", "Batter Prop Type": "Prop", "Batter Over/Under": "Label", "Batter Book": "Book", "Batter Prop Odds": "Book Odds", "Batter Median Odds": "Median Odds", "Batter Best Odds": "Best Odds", "Batter Best Odds Books": "Best Books", "EV %": "EV %", "Quarter Kelly %": "Bet Size", "Link": "Link" };
        Object.keys(maxWidths).forEach(field => { const title = fieldToTitle[field] || field; maxWidths[field] = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH; });
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        data.forEach(row => { Object.keys(maxWidths).forEach(field => { const value = row[field]; if (value != null && value !== '') { let dv = String(value); if (field === 'Batter Prop Type') dv = this.abbreviateProp(value); if (field === 'Batter Matchup') dv = this.abbreviateMatchup(value); if (field.includes('Odds') && field !== 'Batter Best Odds Books') { const n = parseInt(value, 10); if (!isNaN(n)) dv = n > 0 ? `+${n}` : `${n}`; } if (field === 'EV %' || field === 'Quarter Kelly %') { const n = parseFloat(value); if (!isNaN(n)) dv = n.toFixed(1)+'%'; } if (field === 'Link') dv = 'Bet'; const w = ctx.measureText(dv).width; if (w > maxWidths[field]) maxWidths[field] = w; } }); });
        const CELL_PADDING = 16; const BUFFER = 8;
        Object.keys(maxWidths).forEach(field => { if (maxWidths[field] > 0) { const col = this.table.getColumn(field); if (col) { const req = maxWidths[field] + CELL_PADDING + BUFFER; if (req > col.getWidth()) col.setWidth(Math.ceil(req)); } } });
        this.ensureNameColumnWidth();
    }

    calculateAndApplyWidths() {
        if (!this.table) return; const el = this.table.element; if (!el) return;
        if (isMobile() || isTablet()) { el.style.width = ''; el.style.minWidth = ''; el.style.maxWidth = ''; const tc = el.closest('.table-container'); if (tc) { tc.style.width = ''; tc.style.minWidth = ''; tc.style.maxWidth = ''; } this.ensureNameColumnWidth(); return; }
        try {
            const th = el.querySelector('.tabulator-tableholder'); if (th) th.style.overflowY = 'scroll';
            let totalColWidth = 0; this.table.getColumns().forEach(col => { if (col.isVisible()) totalColWidth += col.getWidth(); });
            const SCROLLBAR_WIDTH = 17; const totalWidth = totalColWidth + SCROLLBAR_WIDTH;
            el.style.width = totalWidth + 'px'; el.style.minWidth = totalWidth + 'px'; el.style.maxWidth = totalWidth + 'px';
            if (th) { th.style.width = totalWidth + 'px'; th.style.maxWidth = totalWidth + 'px'; }
            const header = el.querySelector('.tabulator-header'); if (header) header.style.width = totalWidth + 'px';
            const tc = el.closest('.table-container'); if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
        } catch (e) { console.error('Batter Odds calculateAndApplyWidths error:', e); }
    }
}
