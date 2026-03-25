// tables/pitcherOdds.js - Baseball Pitcher Prop Odds Table
// Modeled exactly on CBB cbbPlayerPropOdds.js

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';

const NAME_COLUMN_MIN_WIDTH = 180;
const EV_KELLY_COLUMN_MIN_WIDTH = 65;

export class PitcherOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BaseballPitcherPropOdds');
        this.teamAbbrevMap = TEAM_NAME_MAP;
        this.propAbbrevMap = { 'Strikeouts': 'K', 'Hits Allowed': 'HA', 'Walks Allowed': 'BBA', 'Earned Runs': 'ER', 'Outs Recorded': 'Outs', 'Pitching Outs': 'Outs' };
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
            placeholder: "Loading pitcher prop odds...",
            layout: "fitData",
            columns: this.getColumns(isSmallScreen),
            initialSort: [{column: "EV %", dir: "desc"}],
            dataLoaded: (data) => {
                console.log(`Pitcher Odds loaded ${data.length} records`);
                this.dataLoaded = true;
                const element = document.querySelector(this.elementId);
                if (element) { const ld = element.querySelector('.loading-indicator'); if (ld) ld.remove(); }
            },
            ajaxError: (error) => { console.error("Error loading pitcher odds:", error); }
        };
        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Pitcher Odds table built");
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
        this.table.on("dataLoaded", () => { setTimeout(() => { const data = this.table ? this.table.getData() : []; if (data.length > 0) { this.scanDataForMaxWidths(data); if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); } this.ensureNameColumnWidth(); } }, 100); });
        this.table.on("renderComplete", () => { if (!isMobile() && !isTablet()) { setTimeout(() => this.calculateAndApplyWidths(), 100); } setTimeout(() => this.ensureNameColumnWidth(), 50); });
    }

    debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
    ensureNameColumnWidth() { if (!this.table) return; const c = this.table.getColumn("Pitcher Name"); if (c && c.getWidth() < NAME_COLUMN_MIN_WIDTH) c.setWidth(NAME_COLUMN_MIN_WIDTH); }
    forceRecalculateWidths() { if (!this.table) return; const data = this.table.getData() || []; if (data.length > 0) { this.scanDataForMaxWidths(data); if (!isMobile() && !isTablet()) { this.equalizeClusteredColumns(); this.calculateAndApplyWidths(); } } this.ensureNameColumnWidth(); }
    oddsSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseInt(String(v).trim(), 10) || -99999; }; return g(a) - g(b); }
    percentSorter(a, b) { const g = (v) => { if (v == null || v === '' || v === '-') return -99999; return parseFloat(String(v).replace('%','').trim()) || -99999; }; return g(a) - g(b); }

    getColumns(isSmallScreen = false) {
        const self = this;
        const oddsFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseInt(v, 10); if (isNaN(n)) return '-'; return n > 0 ? `+${n}` : `${n}`; };
        const lineFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; return n.toFixed(1); };
        const matchupFormatter = (cell) => { const v = cell.getValue(); return v ? self.abbreviateMatchup(v) : '-'; };
        const propFormatter = (cell) => { const v = cell.getValue(); return v ? self.abbreviateProp(v) : '-'; };
        const evFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; return (n * 100).toFixed(1) + '%'; };
        const kellyFormatter = (cell) => { const v = cell.getValue(); if (v == null || v === '' || v === '-') return '-'; const n = parseFloat(v); if (isNaN(n)) return '-'; const b = getBankrollValue('Pitcher Quarter Kelly %'); if (b > 0) return '$' + (n * b).toFixed(2); return (n * 100).toFixed(1) + '%'; };
        const linkFormatter = (cell) => { const v = cell.getValue(); if (!v || v === '-' || v === '') return '-'; const a = document.createElement('a'); a.href = v; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Bet'; a.style.cssText = 'color:#b91c1c;text-decoration:underline;font-weight:500;'; return a; };

        return [
            { title: "Name", field: "Pitcher Name", frozen: true, widthGrow: 0, minWidth: isSmallScreen ? 120 : NAME_COLUMN_MIN_WIDTH, sorter: "string", headerFilter: true, resizable: false, hozAlign: "left" },
            { title: "Matchup", field: "Pitcher Matchup", widthGrow: 0, minWidth: 90, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: matchupFormatter },
            { title: "Team", field: "Pitcher Team", widthGrow: 0, minWidth: 55, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Prop", field: "Pitcher Prop Type", widthGrow: 0, minWidth: 65, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: propFormatter },
            { title: "Label", field: "Pitcher Over/Under", widthGrow: 0, minWidth: 60, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Line", field: "Pitcher Prop Line", widthGrow: 0, minWidth: 60, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center", formatter: lineFormatter },
            { title: "Book", field: "Pitcher Book", widthGrow: 0, minWidth: 70, sorter: "string", headerFilter: createCustomMultiSelect, resizable: false, hozAlign: "center" },
            { title: "Book Odds", field: "Pitcher Prop Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Median Odds", field: "Pitcher Median Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Odds", field: "Pitcher Best Odds", widthGrow: 0, minWidth: 55, sorter: function(a,b) { return self.oddsSorter(a,b); }, headerFilter: createMinMaxFilter, headerFilterFunc: minMaxFilterFunction, headerFilterLiveFilter: false, resizable: false, formatter: oddsFormatter, hozAlign: "center", cssClass: "cluster-odds" },
            { title: "Best Books", field: "Pitcher Best Odds Books", widthGrow: 0, minWidth: 70, sorter: "string", resizable: false, hozAlign: "center" },
            { title: "EV %", field: "EV %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, resizable: false, formatter: evFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Bet Size", field: "Quarter Kelly %", widthGrow: 0, minWidth: EV_KELLY_COLUMN_MIN_WIDTH, sorter: function(a,b) { return self.percentSorter(a,b); }, headerFilter: createBankrollInput, headerFilterFunc: bankrollFilterFunction, headerFilterLiveFilter: false, headerFilterParams: { bankrollKey: 'Pitcher Quarter Kelly %' }, resizable: false, formatter: kellyFormatter, hozAlign: "center", cssClass: "cluster-ev-kelly" },
            { title: "Link", field: "Link", width: 50, widthGrow: 0, minWidth: 40, maxWidth: 50, sorter: "string", resizable: false, hozAlign: "center", formatter: linkFormatter, headerSort: false }
        ];
    }

    equalizeClusteredColumns() {
        if (!this.table || isMobile() || isTablet()) return;
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const CELL_PADDING = 16; const SORT_ICON_WIDTH = 20;
        const oddsCluster = ['Pitcher Prop Odds', 'Pitcher Median Odds', 'Pitcher Best Odds']; let maxOddsWidth = 0;
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
        const maxWidths = { "Pitcher Best Odds Books": 0 };
        if (!isSmallScreen) Object.assign(maxWidths, { "Pitcher Matchup": 0, "Pitcher Prop Type": 0, "Pitcher Over/Under": 0, "Pitcher Book": 0, "Pitcher Prop Odds": 0, "Pitcher Median Odds": 0, "Pitcher Best Odds": 0, "EV %": 0, "Quarter Kelly %": 0, "Link": 0 });
        ctx.font = '600 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16; const SORT_ICON_WIDTH = 16;
        const fieldToTitle = { "Pitcher Matchup": "Matchup", "Pitcher Prop Type": "Prop", "Pitcher Over/Under": "Label", "Pitcher Book": "Book", "Pitcher Prop Odds": "Book Odds", "Pitcher Median Odds": "Median Odds", "Pitcher Best Odds": "Best Odds", "Pitcher Best Odds Books": "Best Books", "EV %": "EV %", "Quarter Kelly %": "Bet Size", "Link": "Link" };
        Object.keys(maxWidths).forEach(field => { const title = fieldToTitle[field] || field; maxWidths[field] = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH; });
        ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        data.forEach(row => { Object.keys(maxWidths).forEach(field => { const value = row[field]; if (value != null && value !== '') { let dv = String(value); if (field === 'Pitcher Prop Type') dv = this.abbreviateProp(value); if (field === 'Pitcher Matchup') dv = this.abbreviateMatchup(value); if (field.includes('Odds') && field !== 'Pitcher Best Odds Books') { const n = parseInt(value, 10); if (!isNaN(n)) dv = n > 0 ? `+${n}` : `${n}`; } if (field === 'EV %' || field === 'Quarter Kelly %') { const n = parseFloat(value); if (!isNaN(n)) dv = (n*100).toFixed(1)+'%'; } if (field === 'Link') dv = 'Bet'; const w = ctx.measureText(dv).width; if (w > maxWidths[field]) maxWidths[field] = w; } }); });
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
            const totalWidth = totalColWidth + 17;
            el.style.width = totalWidth + 'px'; el.style.minWidth = totalWidth + 'px'; el.style.maxWidth = totalWidth + 'px';
            if (th) { th.style.width = totalWidth + 'px'; th.style.maxWidth = totalWidth + 'px'; }
            const header = el.querySelector('.tabulator-header'); if (header) header.style.width = totalWidth + 'px';
            const tc = el.closest('.table-container'); if (tc) { tc.style.width = 'fit-content'; tc.style.minWidth = 'auto'; tc.style.maxWidth = 'none'; }
        } catch (e) { console.error('Pitcher Odds calculateAndApplyWidths error:', e); }
    }
}
