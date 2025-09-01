// ./tables/combinedMatchupsTable.js
// Class-based table wrapper with initialize(), matching your other modules.
// Supports: import { MatchupsTable } ... AND import MatchupsTable ...

export default class MatchupsTable {
  constructor({
    elementId = '#matchups-table',
    baseUrl = (typeof window !== 'undefined' && window.SUPABASE_REST_URL) || 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/',
    supabaseAnonKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || ''
  } = {}) {
    this.elementId = elementId;
    this.BASE_URL = baseUrl;
    this.SUPABASE_ANON_KEY = supabaseAnonKey;

    this.ENDPOINTS = {
      MATCHUPS: 'ModMatchupsData',
      PITCHERS: 'ModPitcherMatchups',
      BATTERS:  'ModBatterMatchups',
      BULLPEN:  'ModBullpenMatchups',
      PARK:     'ModParkFactors',
    };

    this.F = {
      MATCH_ID: 'Matchup Game ID',
      TEAM: 'Matchup Team',
      GAME: 'Matchup Game',
      PARK: 'Matchup Ballpark',
      SPREAD: 'Matchup Spread',
      TOTAL: 'Matchup Total',
      LINEUP: 'Matchup Lineup Status',
      WX1: 'Matchup Weather 1',
      WX2: 'Matchup Weather 2',
      WX3: 'Matchup Weather 3',
      WX4: 'Matchup Weather 4',

      P_GAME_ID: 'Starter Game ID',
      P_NAME: 'Starter Name & Hand',
      P_SPLIT: 'Starter Split ID',
      P_TBF: 'Starter TBF',
      P_H_TBF: 'Starter H/TBF',
      P_H: 'Starter H',
      P_1B: 'Starter 1B',
      P_2B: 'Starter 2B',
      P_3B: 'Starter 3B',
      P_HR: 'Starter HR',
      P_R: 'Starter R',
      P_ERA: 'Starter ERA',
      P_BB: 'Starter BB',
      P_SO: 'Starter SO',

      B_GAME_ID: 'Batter Game ID',
      B_NAME: 'Batter Name & Hand & Spot',
      B_SPLIT: 'Batter Split ID',
      B_PA: 'Batter PA',
      B_H_PA: 'Batter H/PA',
      B_H: 'Batter H',
      B_1B: 'Batter 1B',
      B_2B: 'Batter 2B',
      B_3B: 'Batter 3B',
      B_HR: 'Batter HR',
      B_R: 'Batter R',
      B_RBI: 'Batter RBI',
      B_BB: 'Batter BB',
      B_SO: 'Batter SO',

      BP_GAME_ID: 'Bullpen Game ID',
      BP_HAND_CNT: 'Bullpen Hand & Number',
      BP_SPLIT: 'Bullpen Split ID',
      BP_TBF: 'Bullpen TBF',
      BP_H_TBF: 'Bullpen H/TBF',
      BP_H: 'Bullpen H',
      BP_1B: 'Bullpen 1B',
      BP_2B: 'Bullpen 2B',
      BP_3B: 'Bullpen 3B',
      BP_HR: 'Bullpen HR',
      BP_R: 'Bullpen R',
      BP_ERA: 'Bullpen ERA',
      BP_BB: 'Bullpen BB',
      BP_SO: 'Bullpen SO',

      PF_GAME_ID: 'Park Factor Game ID',
      PF_STADIUM: 'Park Factor Stadium',
      PF_SPLIT: 'Park Factor Split ID',
      PF_H: 'Park Factor H',
      PF_1B: 'Park Factor 1B',
      PF_2B: 'Park Factor 2B',
      PF_3B: 'Park Factor 3B',
      PF_HR: 'Park Factor HR',
      PF_R: 'Park Factor R',
      PF_BB: 'Park Factor BB',
      PF_SO: 'Park Factor SO',
    };

    // persisted state
    this.LS_EXPANDED = 'matchups_expanded_row_ids_v3';
    this.LS_SUBTAB   = 'matchups_active_subtab_v2';
    this.expandedRowIds = new Set(this._loadLS(this.LS_EXPANDED, []));
    this.activeSubtabByRow = new Map(Object.entries(this._loadLS(this.LS_SUBTAB, {})));
    this.subtableCache = new Map(); // gameId -> payload

    this._injectStylesOnce();
  }

  // ---------- API expected by main.js / tabManager ----------
  getTableConfig(/* BaseTable */) {
    const F = this.F;
    return {
      index: (data) => this._rowIdFromData(data),
      layout: 'fitColumns',
      height: '650px',
      ajaxURL: `${this.BASE_URL}${this.ENDPOINTS.MATCHUPS}?select=*`,
      ajaxConfig: { headers: this._headers() },
      columns: [
        {
          title: '', width: 36, hozAlign: 'center', headerSort: false,
          formatter: (cell) => {
            const row = cell.getRow();
            const isOpen = row.getElement().classList.contains('is-expanded');
            return `<button class="mf-toggle">${isOpen ? '−' : '+'}</button>`;
          },
          cellClick: (_e, cell) =>
            this._toggleRowExpansion(cell.getTable(), cell.getRow(), cell.getTable()._BaseTableRef),
        },
        { title: 'Team', field: F.TEAM, widthGrow: 1 },
        { title: 'Game', field: F.GAME, widthGrow: 2 },
        { title: 'Ballpark', field: F.PARK, widthGrow: 1 },
        { title: 'Spread', field: F.SPREAD, widthGrow: 0.7 },
        { title: 'Total',  field: F.TOTAL,  widthGrow: 0.7 },
        { title: 'Lineup', field: F.LINEUP, widthGrow: 0.8 },
        { title: 'Time',   field: F.WX1,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX2,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX3,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX4,    widthGrow: 1.6 },
      ],
    };
  }

  initialize(BaseTable) {
    const el = document.querySelector(this.elementId);
    if (!el || typeof Tabulator === 'undefined') return null;

    const cfg = this.getTableConfig(BaseTable);
    // let BaseTable create or reuse (to keep caching/logging consistent)
    const table = BaseTable?.createOrGet
      ? BaseTable.createOrGet(this.elementId, cfg)
      : new Tabulator(el, cfg);

    // expose BaseTable to subtable fetches for caching
    table._BaseTableRef = BaseTable || null;

    // keep +/- icon synced on redraw
    table.setOption('rowFormatter', (row) => {
      const btn = row.getCell(0)?.getElement()?.querySelector?.('.mf-toggle');
      if (btn) btn.textContent = row.getElement().classList.contains('is-expanded') ? '−' : '+';
    });

    const reapply = () => this._reapplyExpandedState(table);
    table.on('dataLoaded', reapply);
    table.on('dataProcessed', reapply);

    return table;
  }

  // ---------- internals ----------
  _headers() {
    const h = { Accept: 'application/json' };
    if (this.SUPABASE_ANON_KEY) h['apikey'] = this.SUPABASE_ANON_KEY;
    return h;
  }

  _rowIdFromData(data) {
    const id = data?.[this.F.MATCH_ID];
    return id != null ? `matchup_${id}` : undefined;
  }

  _saveExpanded() { this._saveLS(this.LS_EXPANDED, [...this.expandedRowIds]); }
  _saveSubtabs()   { this._saveLS(this.LS_SUBTAB,   Object.fromEntries(this.activeSubtabByRow)); }
  _saveLS(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  _loadLS(k,fallback){ try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }

  _reapplyExpandedState(table) {
    const ids = [...this.expandedRowIds];
    if (!ids.length) return;
    requestAnimationFrame(() => {
      ids.forEach(id => {
        const row = table.getRow(id);
        if (row && !row.getElement().classList.contains('is-expanded')) {
          this._openSubtableRow(table, row, table._BaseTableRef);
        }
      });
    });
  }

  async _toggleRowExpansion(table, row, BaseTable) {
    const rowKey = row.getIndex();
    const rowEl = row.getElement();

    if (rowEl.classList.contains('is-expanded')) {
      const next = rowEl.nextElementSibling;
      if (next && next.classList.contains('wf-subtable-wrapper')) next.remove();
      rowEl.classList.remove('is-expanded');
      this.expandedRowIds.delete(rowKey);
      this._saveExpanded();
      row.normalizeHeight();
      return;
    }

    await this._openSubtableRow(table, row, BaseTable);
    this.expandedRowIds.add(rowKey);
    this._saveExpanded();
  }

  async _openSubtableRow(table, row, BaseTable) {
    const gameId = row.getData()?.[this.F.MATCH_ID];
    if (gameId == null) return;

    // insert AFTER row => expand downward
    const wrapper = document.createElement('div');
    wrapper.className = 'wf-subtable-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.margin = '0';
    wrapper.innerHTML = this._subtableSkeleton();

    const rowEl = row.getElement();
    rowEl.insertAdjacentElement('afterend', wrapper);
    rowEl.classList.add('is-expanded');
    row.normalizeHeight();

    const payload = await this._loadAllSubtableData(gameId, BaseTable);

    this._renderPitchers(wrapper.querySelector('[data-sec="pitchers"]'), payload.pitchers);
    this._renderBatters (wrapper.querySelector('[data-sec="batters"]'),  payload.batters);
    this._renderBullpen (wrapper.querySelector('[data-sec="bullpen"]'),  payload.bullpen);
    this._renderPark    (wrapper.querySelector('[data-sec="park"]'),     payload.park);

    const rowKey = row.getIndex();
    const defaultTab = this.activeSubtabByRow.get(rowKey) || 'pitchers';
    this._switchSubtab(wrapper, defaultTab);
    wrapper.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-subtab');
        this._switchSubtab(wrapper, name);
        this.activeSubtabByRow.set(rowKey, name);
        this._saveSubtabs();
      });
    });
  }

  _subtableSkeleton() {
    return `
      <div class="wf-subtable">
        <div class="wf-subtable-tabs">
          <button class="wf-tab" data-subtab="pitchers">Pitchers</button>
          <button class="wf-tab" data-subtab="batters">Batters</button>
          <button class="wf-tab" data-subtab="bullpen">Bullpen</button>
          <button class="wf-tab" data-subtab="park">Park</button>
        </div>
        <div class="wf-subtable-body">
          <div class="wf-subsec" data-sec="pitchers"></div>
          <div class="wf-subsec" data-sec="batters"></div>
          <div class="wf-subsec" data-sec="bullpen"></div>
          <div class="wf-subsec" data-sec="park"></div>
        </div>
      </div>
    `;
  }

  _switchSubtab(wrapper, name) {
    wrapper.querySelectorAll('.wf-tab').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-subtab') === name);
    });
    wrapper.querySelectorAll('.wf-subsec').forEach(sec => {
      sec.style.display = (sec.getAttribute('data-sec') === name) ? 'block' : 'none';
    });
  }

  // ---------- data loading (BaseTable-aware) ----------
  _urlPitchers(g){ return `${this.BASE_URL}${this.ENDPOINTS.PITCHERS}?${encodeURIComponent(this.F.P_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlBatters(g){  return `${this.BASE_URL}${this.ENDPOINTS.BATTERS }?${encodeURIComponent(this.F.B_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlBullpen(g){  return `${this.BASE_URL}${this.ENDPOINTS.BULLPEN }?${encodeURIComponent(this.F.BP_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlPark(g){     return `${this.BASE_URL}${this.ENDPOINTS.PARK    }?${encodeURIComponent(this.F.PF_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }

  async _fetchJSON(url, cacheKey, BaseTable) {
    const headers = this._headers();
    try {
      if (BaseTable?.getJSON) return await BaseTable.getJSON(url, { headers, cacheKey });
      if (BaseTable?.fetchJSON) return await BaseTable.fetchJSON(url, { headers, cacheKey });
      if (BaseTable?.getCachedOrFetch) {
        return await BaseTable.getCachedOrFetch(cacheKey, () =>
          fetch(url, { headers }).then(r => (r.ok ? r.json() : []))
        );
      }
    } catch (e) {
      console.warn('[MatchupsTable] BaseTable adapter failed; falling back to fetch()', e);
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    try { return await res.json(); } catch { return []; }
  }

  async _loadAllSubtableData(gameId, BaseTable) {
    if (this.subtableCache.has(gameId)) return this.subtableCache.get(gameId);
    const [park, pitchers, batters, bullpen] = await Promise.all([
      this._fetchJSON(this._urlPark(gameId),    `${this.ENDPOINTS.PARK}:${gameId}`,    BaseTable),
      this._fetchJSON(this._urlPitchers(gameId),`${this.ENDPOINTS.PITCHERS}:${gameId}`,BaseTable),
      this._fetchJSON(this._urlBatters(gameId), `${this.ENDPOINTS.BATTERS}:${gameId}`, BaseTable),
      this._fetchJSON(this._urlBullpen(gameId), `${this.ENDPOINTS.BULLPEN}:${gameId}`, BaseTable),
    ]);
    const payload = {
      park:     Array.isArray(park) ? park : [],
      pitchers: Array.isArray(pitchers) ? pitchers : [],
      batters:  Array.isArray(batters) ? batters : [],
      bullpen:  Array.isArray(bullpen) ? bullpen : [],
    };
    this.subtableCache.set(gameId, payload);
    return payload;
  }

  // ---------- renderers (schema-accurate) ----------
  _buildGridTable(rows, columns) {
    const esc = (v) => (v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
    const cols = columns.length;
    const style = `style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));"`;

    const header = `<div class="wf-grid wf-header" ${style}>` +
      columns.map(c => `<div class="wf-cell">${esc(c.label)}</div>`).join('') +
      `</div>`;

    const body = (rows && rows.length)
      ? rows.map(r => `<div class="wf-grid wf-row" ${style}>${
          columns.map(c => `<div class="wf-cell">${esc(r?.[c.key] ?? '')}</div>`).join('')
        }</div>`).join('')
      : `<div class="wf-grid wf-row" ${style}><div class="wf-cell" style="grid-column:1/-1;opacity:.7;">No data</div></div>`;

    return `<div class="wf-subtable-section wf-table">${header}${body}</div>`;
  }

  _renderPitchers(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.P_NAME,  label: 'Name' },
      { key: F.P_SPLIT, label: 'Split' },
      { key: F.P_TBF,   label: 'TBF' },
      { key: F.P_H_TBF, label: 'H/TBF' },
      { key: F.P_H,     label: 'H' },
      { key: F.P_ERA,   label: 'ERA' },
      { key: F.P_SO,    label: 'SO' },
      { key: F.P_BB,    label: 'BB' },
      { key: F.P_R,     label: 'R' },
    ]);
  }

  _renderBatters(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.B_NAME,  label: 'Name' },
      { key: F.B_SPLIT, label: 'Split' },
      { key: F.B_PA,    label: 'PA' },
      { key: F.B_H_PA,  label: 'H/PA' },
      { key: F.B_H,     label: 'H' },
      { key: F.B_RBI,   label: 'RBI' },
      { key: F.B_SO,    label: 'SO' },
      { key: F.B_BB,    label: 'BB' },
      { key: F.B_R,     label: 'R' },
    ]);
  }

  _renderPark(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.PF_STADIUM, label: 'Stadium' },
      { key: F.PF_SPLIT,   label: 'Split'   },
      { key: F.PF_R,       label: 'Runs PF' },
      { key: F.PF_H,       label: 'Hits PF' },
      { key: F.PF_HR,      label: 'HR PF'   },
      { key: F.PF_BB,      label: 'BB PF'   },
      { key: F.PF_SO,      label: 'SO PF'   },
      { key: F.PF_1B,      label: '1B PF'   },
      { key: F.PF_2B,      label: '2B PF'   },
    ]);
  }

  _renderBullpen(container, rows) {
    const F = this.F;
    const toNum = (v) => (Number.isFinite(+v) ? +v : 0);
    const normalized = rows.map(r => ({
      [F.BP_HAND_CNT]: r[F.BP_HAND_CNT],
      [F.BP_SPLIT]:    r[F.BP_SPLIT],
      [F.BP_TBF]:      toNum(r[F.BP_TBF]),
      [F.BP_H_TBF]:    toNum(r[F.BP_H_TBF]),
      [F.BP_H]:        toNum(r[F.BP_H]),
      [F.BP_1B]:       toNum(r[F.BP_1B]),
      [F.BP_2B]:       toNum(r[F.BP_2B]),
      [F.BP_3B]:       toNum(r[F.BP_3B]),
      [F.BP_HR]:       toNum(r[F.BP_HR]),
      [F.BP_R]:        toNum(r[F.BP_R]),
      [F.BP_ERA]:      r[F.BP_ERA], // leave rate as-is
      [F.BP_BB]:       toNum(r[F.BP_BB]),
      [F.BP_SO]:       toNum(r[F.BP_SO]),
    }));

    const totals = normalized.reduce((acc, r) => {
      acc[F.BP_TBF] += r[F.BP_TBF];
      acc[F.BP_H]   += r[F.BP_H];
      acc[F.BP_1B]  += r[F.BP_1B];
      acc[F.BP_2B]  += r[F.BP_2B];
      acc[F.BP_3B]  += r[F.BP_3B];
      acc[F.BP_HR]  += r[F.BP_HR];
      acc[F.BP_R]   += r[F.BP_R];
      acc[F.BP_BB]  += r[F.BP_BB];
      acc[F.BP_SO]  += r[F.BP_SO];
      return acc;
    }, {
      [F.BP_HAND_CNT]: 'All Bullpen (Total)',
      [F.BP_SPLIT]: '—',
      [F.BP_TBF]: 0, [F.BP_H_TBF]: 0, [F.BP_H]: 0,
      [F.BP_1B]: 0, [F.BP_2B]: 0, [F.BP_3B]: 0, [F.BP_HR]: 0,
      [F.BP_R]: 0, [F.BP_ERA]: '', [F.BP_BB]: 0, [F.BP_SO]: 0,
    });

    if (totals[F.BP_TBF] > 0) {
      const weighted = normalized.reduce((s, r) => s + (r[F.BP_H_TBF] * r[F.BP_TBF]), 0) / totals[F.BP_TBF];
      totals[F.BP_H_TBF] = Number.isFinite(weighted) ? +weighted.toFixed(3) : 0;
    }

    container.innerHTML = this._buildGridTable([...normalized, totals], [
      { key: F.BP_HAND_CNT, label: 'Group'  },
      { key: F.BP_SPLIT,    label: 'Split'  },
      { key: F.BP_TBF,      label: 'TBF'    },// ./tables/combinedMatchupsTable.js
// Class-based wrapper with initialize(BaseTable) and getTableConfig(BaseTable).
// Exports BOTH named and default so either import style works:
//   import MatchupsTable from './tables/combinedMatchupsTable.js'
//   import { MatchupsTable } from './tables/combinedMatchupsTable.js'

class MatchupsTable {
  constructor({
    elementId = '#matchups-table',
    baseUrl = (typeof window !== 'undefined' && window.SUPABASE_REST_URL) || 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/',
    supabaseAnonKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || ''
  } = {}) {
    this.elementId = elementId;
    this.BASE_URL = baseUrl;
    this.SUPABASE_ANON_KEY = supabaseAnonKey;

    this.ENDPOINTS = {
      MATCHUPS: 'ModMatchupsData',
      PITCHERS: 'ModPitcherMatchups',
      BATTERS:  'ModBatterMatchups',
      BULLPEN:  'ModBullpenMatchups',
      PARK:     'ModParkFactors',
    };

    this.F = {
      MATCH_ID: 'Matchup Game ID',
      TEAM: 'Matchup Team',
      GAME: 'Matchup Game',
      PARK: 'Matchup Ballpark',
      SPREAD: 'Matchup Spread',
      TOTAL: 'Matchup Total',
      LINEUP: 'Matchup Lineup Status',
      WX1: 'Matchup Weather 1',
      WX2: 'Matchup Weather 2',
      WX3: 'Matchup Weather 3',
      WX4: 'Matchup Weather 4',

      P_GAME_ID: 'Starter Game ID',
      P_NAME: 'Starter Name & Hand',
      P_SPLIT: 'Starter Split ID',
      P_TBF: 'Starter TBF',
      P_H_TBF: 'Starter H/TBF',
      P_H: 'Starter H',
      P_1B: 'Starter 1B',
      P_2B: 'Starter 2B',
      P_3B: 'Starter 3B',
      P_HR: 'Starter HR',
      P_R: 'Starter R',
      P_ERA: 'Starter ERA',
      P_BB: 'Starter BB',
      P_SO: 'Starter SO',

      B_GAME_ID: 'Batter Game ID',
      B_NAME: 'Batter Name & Hand & Spot',
      B_SPLIT: 'Batter Split ID',
      B_PA: 'Batter PA',
      B_H_PA: 'Batter H/PA',
      B_H: 'Batter H',
      B_1B: 'Batter 1B',
      B_2B: 'Batter 2B',
      B_3B: 'Batter 3B',
      B_HR: 'Batter HR',
      B_R: 'Batter R',
      B_RBI: 'Batter RBI',
      B_BB: 'Batter BB',
      B_SO: 'Batter SO',

      BP_GAME_ID: 'Bullpen Game ID',
      BP_HAND_CNT: 'Bullpen Hand & Number',
      BP_SPLIT: 'Bullpen Split ID',
      BP_TBF: 'Bullpen TBF',
      BP_H_TBF: 'Bullpen H/TBF',
      BP_H: 'Bullpen H',
      BP_1B: 'Bullpen 1B',
      BP_2B: 'Bullpen 2B',
      BP_3B: 'Bullpen 3B',
      BP_HR: 'Bullpen HR',
      BP_R: 'Bullpen R',
      BP_ERA: 'Bullpen ERA',
      BP_BB: 'Bullpen BB',
      BP_SO: 'Bullpen SO',

      PF_GAME_ID: 'Park Factor Game ID',
      PF_STADIUM: 'Park Factor Stadium',
      PF_SPLIT: 'Park Factor Split ID',
      PF_H: 'Park Factor H',
      PF_1B: 'Park Factor 1B',
      PF_2B: 'Park Factor 2B',
      PF_3B: 'Park Factor 3B',
      PF_HR: 'Park Factor HR',
      PF_R: 'Park Factor R',
      PF_BB: 'Park Factor BB',
      PF_SO: 'Park Factor SO',
    };

    // persisted state
    this.LS_EXPANDED = 'matchups_expanded_row_ids_v3';
    this.LS_SUBTAB   = 'matchups_active_subtab_v2';
    this.expandedRowIds   = new Set(this._loadLS(this.LS_EXPANDED, []));
    this.activeSubtabByRow= new Map(Object.entries(this._loadLS(this.LS_SUBTAB, {})));
    this.subtableCache    = new Map(); // gameId -> payload

    this._injectStylesOnce();
  }

  // ---------- API expected by main.js / tabManager ----------
  getTableConfig(/* BaseTable */) {
    const F = this.F;
    return {
      index: (data) => this._rowIdFromData(data),
      layout: 'fitColumns',
      height: '650px',
      ajaxURL: `${this.BASE_URL}${this.ENDPOINTS.MATCHUPS}?select=*`,
      ajaxConfig: { headers: this._headers() },
      columns: [
        {
          title: '', width: 36, hozAlign: 'center', headerSort: false,
          formatter: (cell) => {
            const row = cell.getRow();
            const isOpen = row.getElement().classList.contains('is-expanded');
            return `<button class="mf-toggle">${isOpen ? '−' : '+'}</button>`;
          },
          cellClick: (_e, cell) =>
            this._toggleRowExpansion(cell.getTable(), cell.getRow(), cell.getTable()._BaseTableRef),
        },
        { title: 'Team', field: F.TEAM, widthGrow: 1 },
        { title: 'Game', field: F.GAME, widthGrow: 2 },
        { title: 'Ballpark', field: F.PARK, widthGrow: 1 },
        { title: 'Spread', field: F.SPREAD, widthGrow: 0.7 },
        { title: 'Total',  field: F.TOTAL,  widthGrow: 0.7 },
        { title: 'Lineup', field: F.LINEUP, widthGrow: 0.8 },
        { title: 'Time',   field: F.WX1,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX2,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX3,    widthGrow: 1.6 },
        { title: 'Cond.',  field: F.WX4,    widthGrow: 1.6 },
      ],
    };
  }

  initialize(BaseTable) {
    const el = document.querySelector(this.elementId);
    if (!el || typeof Tabulator === 'undefined') return null;

    const cfg = this.getTableConfig(BaseTable);
    const table = BaseTable?.createOrGet
      ? BaseTable.createOrGet(this.elementId, cfg)
      : new Tabulator(el, cfg);

    // pass BaseTable into subtable fetches for caching
    table._BaseTableRef = BaseTable || null;

    // keep +/- icon synced
    table.setOption('rowFormatter', (row) => {
      const btn = row.getCell(0)?.getElement()?.querySelector?.('.mf-toggle');
      if (btn) btn.textContent = row.getElement().classList.contains('is-expanded') ? '−' : '+';
    });

    const reapply = () => this._reapplyExpandedState(table);
    table.on('dataLoaded', reapply);
    table.on('dataProcessed', reapply);

    return table;
  }

  // ---------- internals ----------
  _headers() {
    const h = { Accept: 'application/json' };
    if (this.SUPABASE_ANON_KEY) h['apikey'] = this.SUPABASE_ANON_KEY;
    return h;
  }
  _rowIdFromData(data) {
    const id = data?.[this.F.MATCH_ID];
    return id != null ? `matchup_${id}` : undefined;
  }
  _saveExpanded() { this._saveLS(this.LS_EXPANDED, [...this.expandedRowIds]); }
  _saveSubtabs()   { this._saveLS(this.LS_SUBTAB,   Object.fromEntries(this.activeSubtabByRow)); }
  _saveLS(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  _loadLS(k,fallback){ try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }

  _reapplyExpandedState(table) {
    const ids = [...this.expandedRowIds];
    if (!ids.length) return;
    requestAnimationFrame(() => {
      ids.forEach(id => {
        const row = table.getRow(id);
        if (row && !row.getElement().classList.contains('is-expanded')) {
          this._openSubtableRow(table, row, table._BaseTableRef);
        }
      });
    });
  }

  async _toggleRowExpansion(table, row, BaseTable) {
    const rowKey = row.getIndex();
    const rowEl = row.getElement();

    if (rowEl.classList.contains('is-expanded')) {
      const next = rowEl.nextElementSibling;
      if (next && next.classList.contains('wf-subtable-wrapper')) next.remove();
      rowEl.classList.remove('is-expanded');
      this.expandedRowIds.delete(rowKey);
      this._saveExpanded();
      row.normalizeHeight();
      return;
    }

    await this._openSubtableRow(table, row, BaseTable);
    this.expandedRowIds.add(rowKey);
    this._saveExpanded();
  }

  async _openSubtableRow(table, row, BaseTable) {
    const gameId = row.getData()?.[this.F.MATCH_ID];
    if (gameId == null) return;

    // Insert AFTER row => expand downward
    const wrapper = document.createElement('div');
    wrapper.className = 'wf-subtable-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.margin = '0';
    wrapper.innerHTML = this._subtableSkeleton();

    const rowEl = row.getElement();
    rowEl.insertAdjacentElement('afterend', wrapper);
    rowEl.classList.add('is-expanded');
    row.normalizeHeight();

    const payload = await this._loadAllSubtableData(gameId, BaseTable);

    this._renderPitchers(wrapper.querySelector('[data-sec="pitchers"]'), payload.pitchers);
    this._renderBatters (wrapper.querySelector('[data-sec="batters"]'),  payload.batters);
    this._renderBullpen (wrapper.querySelector('[data-sec="bullpen"]'),  payload.bullpen);
    this._renderPark    (wrapper.querySelector('[data-sec="park"]'),     payload.park);

    const rowKey = row.getIndex();
    const defaultTab = this.activeSubtabByRow.get(rowKey) || 'pitchers';
    this._switchSubtab(wrapper, defaultTab);
    wrapper.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-subtab');
        this._switchSubtab(wrapper, name);
        this.activeSubtabByRow.set(rowKey, name);
        this._saveSubtabs();
      });
    });
  }

  _subtableSkeleton() {
    return `
      <div class="wf-subtable">
        <div class="wf-subtable-tabs">
          <button class="wf-tab" data-subtab="pitchers">Pitchers</button>
          <button class="wf-tab" data-subtab="batters">Batters</button>
          <button class="wf-tab" data-subtab="bullpen">Bullpen</button>
          <button class="wf-tab" data-subtab="park">Park</button>
        </div>
        <div class="wf-subtable-body">
          <div class="wf-subsec" data-sec="pitchers"></div>
          <div class="wf-subsec" data-sec="batters"></div>
          <div class="wf-subsec" data-sec="bullpen"></div>
          <div class="wf-subsec" data-sec="park"></div>
        </div>
      </div>
    `;
  }

  _switchSubtab(wrapper, name) {
    wrapper.querySelectorAll('.wf-tab').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-subtab') === name);
    });
    wrapper.querySelectorAll('.wf-subsec').forEach(sec => {
      sec.style.display = (sec.getAttribute('data-sec') === name) ? 'block' : 'none';
    });
  }

  // ---------- data loading (BaseTable-aware) ----------
  _urlPitchers(g){ return `${this.BASE_URL}${this.ENDPOINTS.PITCHERS}?${encodeURIComponent(this.F.P_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlBatters(g){  return `${this.BASE_URL}${this.ENDPOINTS.BATTERS }?${encodeURIComponent(this.F.B_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlBullpen(g){  return `${this.BASE_URL}${this.ENDPOINTS.BULLPEN }?${encodeURIComponent(this.F.BP_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }
  _urlPark(g){     return `${this.BASE_URL}${this.ENDPOINTS.PARK    }?${encodeURIComponent(this.F.PF_GAME_ID)}=eq.${encodeURIComponent(g)}&select=*`; }

  async _fetchJSON(url, cacheKey, BaseTable) {
    const headers = this._headers();
    try {
      if (BaseTable?.getJSON)   return await BaseTable.getJSON(url,   { headers, cacheKey });
      if (BaseTable?.fetchJSON) return await BaseTable.fetchJSON(url, { headers, cacheKey });
      if (BaseTable?.getCachedOrFetch) {
        return await BaseTable.getCachedOrFetch(cacheKey, () =>
          fetch(url, { headers }).then(r => (r.ok ? r.json() : []))
        );
      }
    } catch (e) {
      console.warn('[MatchupsTable] BaseTable adapter failed; falling back to fetch()', e);
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    try { return await res.json(); } catch { return []; }
  }

  async _loadAllSubtableData(gameId, BaseTable) {
    if (this.subtableCache.has(gameId)) return this.subtableCache.get(gameId);
    const [park, pitchers, batters, bullpen] = await Promise.all([
      this._fetchJSON(this._urlPark(gameId),     `${this.ENDPOINTS.PARK}:${gameId}`,     BaseTable),
      this._fetchJSON(this._urlPitchers(gameId), `${this.ENDPOINTS.PITCHERS}:${gameId}`, BaseTable),
      this._fetchJSON(this._urlBatters(gameId),  `${this.ENDPOINTS.BATTERS}:${gameId}`,  BaseTable),
      this._fetchJSON(this._urlBullpen(gameId),  `${this.ENDPOINTS.BULLPEN}:${gameId}`,  BaseTable),
    ]);
    const payload = {
      park:     Array.isArray(park) ? park : [],
      pitchers: Array.isArray(pitchers) ? pitchers : [],
      batters:  Array.isArray(batters) ? batters : [],
      bullpen:  Array.isArray(bullpen) ? bullpen : [],
    };
    this.subtableCache.set(gameId, payload);
    return payload;
  }

  // ---------- renderers ----------
  _buildGridTable(rows, columns) {
    const esc = (v) => (v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
    const cols = columns.length;
    const style = `style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));"`;

    const header = `<div class="wf-grid wf-header" ${style}>` +
      columns.map(c => `<div class="wf-cell">${esc(c.label)}</div>`).join('') +
      `</div>`;

    const body = (rows && rows.length)
      ? rows.map(r => `<div class="wf-grid wf-row" ${style}>${
          columns.map(c => `<div class="wf-cell">${esc(r?.[c.key] ?? '')}</div>`).join('')
        }</div>`).join('')
      : `<div class="wf-grid wf-row" ${style}><div class="wf-cell" style="grid-column:1/-1;opacity:.7;">No data</div></div>`;

    return `<div class="wf-subtable-section wf-table">${header}${body}</div>`;
  }

  _renderPitchers(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.P_NAME,  label: 'Name' },
      { key: F.P_SPLIT, label: 'Split' },
      { key: F.P_TBF,   label: 'TBF' },
      { key: F.P_H_TBF, label: 'H/TBF' },
      { key: F.P_H,     label: 'H' },
      { key: F.P_ERA,   label: 'ERA' },
      { key: F.P_SO,    label: 'SO' },
      { key: F.P_BB,    label: 'BB' },
      { key: F.P_R,     label: 'R' },
    ]);
  }

  _renderBatters(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.B_NAME,  label: 'Name' },
      { key: F.B_SPLIT, label: 'Split' },
      { key: F.B_PA,    label: 'PA' },
      { key: F.B_H_PA,  label: 'H/PA' },
      { key: F.B_H,     label: 'H' },
      { key: F.B_RBI,   label: 'RBI' },
      { key: F.B_SO,    label: 'SO' },
      { key: F.B_BB,    label: 'BB' },
      { key: F.B_R,     label: 'R' },
    ]);
  }

  _renderPark(container, rows) {
    const F = this.F;
    container.innerHTML = this._buildGridTable(rows, [
      { key: F.PF_STADIUM, label: 'Stadium' },
      { key: F.PF_SPLIT,   label: 'Split'   },
      { key: F.PF_R,       label: 'Runs PF' },
      { key: F.PF_H,       label: 'Hits PF' },
      { key: F.PF_HR,      label: 'HR PF'   },
      { key: F.PF_BB,      label: 'BB PF'   },
      { key: F.PF_SO,      label: 'SO PF'   },
      { key: F.PF_1B,      label: '1B PF'   },
      { key: F.PF_2B,      label: '2B PF'   },
    ]);
  }

  _renderBullpen(container, rows) {
    const F = this.F;
    const toNum = (v) => (Number.isFinite(+v) ? +v : 0);
    const normalized = rows.map(r => ({
      [F.BP_HAND_CNT]: r[F.BP_HAND_CNT],
      [F.BP_SPLIT]:    r[F.BP_SPLIT],
      [F.BP_TBF]:      toNum(r[F.BP_TBF]),
      [F.BP_H_TBF]:    toNum(r[F.BP_H_TBF]),
      [F.BP_H]:        toNum(r[F.BP_H]),
      [F.BP_1B]:       toNum(r[F.BP_1B]),
      [F.BP_2B]:       toNum(r[F.BP_2B]),
      [F.BP_3B]:       toNum(r[F.BP_3B]),
      [F.BP_HR]:       toNum(r[F.BP_HR]),
      [F.BP_R]:        toNum(r[F.BP_R]),
      [F.BP_ERA]:      r[F.BP_ERA], // leave rate as-is
      [F.BP_BB]:       toNum(r[F.BP_BB]),
      [F.BP_SO]:       toNum(r[F.BP_SO]),
    }));

    const totals = normalized.reduce((acc, r) => {
      acc[F.BP_TBF] += r[F.BP_TBF];
      acc[F.BP_H]   += r[F.BP_H];
      acc[F.BP_1B]  += r[F.BP_1B];
      acc[F.BP_2B]  += r[F.BP_2B];
      acc[F.BP_3B]  += r[F.BP_3B];
      acc[F.BP_HR]  += r[F.BP_HR];
      acc[F.BP_R]   += r[F.BP_R];
      acc[F.BP_BB]  += r[F.BP_BB];
      acc[F.BP_SO]  += r[F.BP_SO];
      return acc;
    }, {
      [F.BP_HAND_CNT]: 'All Bullpen (Total)',
      [F.BP_SPLIT]: '—',
      [F.BP_TBF]: 0, [F.BP_H_TBF]: 0, [F.BP_H]: 0,
      [F.BP_1B]: 0, [F.BP_2B]: 0, [F.BP_3B]: 0, [F.BP_HR]: 0,
      [F.BP_R]: 0, [F.BP_ERA]: '', [F.BP_BB]: 0, [F.BP_SO]: 0,
    });

    if (totals[F.BP_TBF] > 0) {
      const weighted = normalized.reduce((s, r) => s + (r[F.BP_H_TBF] * r[F.BP_TBF]), 0) / totals[F.BP_TBF];
      totals[F.BP_H_TBF] = Number.isFinite(weighted) ? +weighted.toFixed(3) : 0;
    }

    container.innerHTML = this._buildGridTable([...normalized, totals], [
      { key: F.BP_HAND_CNT, label: 'Group'  },
      { key: F.BP_SPLIT,    label: 'Split'  },
      { key: F.BP_TBF,      label: 'TBF'    },
      { key: F.BP_H_TBF,    label: 'H/TBF'  },
      { key: F.BP_H,        label: 'H'      },
      { key: F.BP_R,        label: 'R'      },
      { key: F.BP_ERA,      label: 'ERA'    },
      { key: F.BP_BB,       label: 'BB'     },
      { key: F.BP_SO,       label: 'SO'     },
      { key: F.BP_HR,       label: 'HR'     },
      { key: F.BP_1B,       label: '1B'     },
      { key: F.BP_2B,       label: '2B'     },
      { key: F.BP_3B,       label: '3B'     },
    ]);
  }

  // ---------- styles ----------
  _injectStylesOnce() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('combinedMatchupsTableStyles')) return;
    const css = `
      .wf-subtable-wrapper { padding:.5rem 0 .75rem; }
      .wf-subtable-tabs { display:flex; gap:.5rem; margin:.25rem 0 .5rem; }
      .wf-tab { font:inherit; padding:.25rem .5rem; border-radius:6px; border:1px solid var(--wf-border,#333); background:transparent; color:inherit; cursor:pointer; }
      .wf-tab.is-active { background: var(--wf-active, rgba(255,255,255,.06)); }
      .wf-subtable-body { width:100%; }
      .wf-subsec { display:none; }
      .wf-table { width:100%; }
      .wf-grid { display:grid; gap:8px; align-items:center; }
      .wf-header { font-weight:600; opacity:.9; }
      .wf-row { border-top:1px solid var(--wf-border,#333); padding:6px 0; }
      .wf-cell { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .mf-toggle { width:24px; height:24px; line-height:22px; border-radius:50%; border:1px solid var(--wf-border,#333); background:transparent; color:inherit; cursor:pointer; }
    `;
    const s = document.createElement('style');
    s.id = 'combinedMatchupsTableStyles';
    s.textContent = css;
    document.head.appendChild(s);
  }
}

// Export both ways so whichever import style main.js uses, `new MatchupsTable()` is valid.
export { MatchupsTable };
export default MatchupsTable;


