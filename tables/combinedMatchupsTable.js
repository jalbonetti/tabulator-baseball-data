// ./tables/combinedMatchupsTable.js
// Exports BOTH a named and default wrapper that has { elementId, getTableConfig, initialize }.
// This matches how your other tables are integrated by tabManager.js.

const MatchupsWrapper = (function () {
  // ---------- Config ----------
  const elementId = '#matchups-table';
  const BASE_URL =
    (typeof window !== 'undefined' && window.SUPABASE_REST_URL) ||
    'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
  const SUPABASE_ANON_KEY =
    (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || '';

  const ENDPOINTS = {
    MATCHUPS: 'ModMatchupsData',
    PITCHERS: 'ModPitcherMatchups',
    BATTERS:  'ModBatterMatchups',
    BULLPEN:  'ModBullpenMatchups',
    PARK:     'ModParkFactors',
  };

  // Field names
  const F = {
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

  // ---------- State ----------
  const LS_EXPANDED = 'matchups_expanded_row_ids_v3';
  const LS_SUBTAB   = 'matchups_active_subtab_v2';
  const expandedRowIds = new Set(loadLS(LS_EXPANDED, []));
  const activeSubtabByRow = new Map(Object.entries(loadLS(LS_SUBTAB, {})));
  const subtableCache = new Map(); // gameId -> { park, pitchers, batters, bullpen }

  // ---------- Utils ----------
  const esc = v => (v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
  const toNum = v => (Number.isFinite(+v) ? +v : 0);
  const headers = () => {
    const h = { Accept: 'application/json' };
    if (SUPABASE_ANON_KEY) h.apikey = SUPABASE_ANON_KEY;
    return h;
  };
  function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  function loadLS(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }
  function rowIndexFromData(d) {
    const id = d?.[F.MATCH_ID];
    return id != null ? `matchup_${id}` : undefined;
  }
  function getRowKey(row) { return row.getIndex(); }

  // BaseTable-aware JSON fetch
  async function fetchJSON(url, cacheKey, BaseTable) {
    try {
      if (BaseTable?.getJSON) return await BaseTable.getJSON(url, { headers: headers(), cacheKey });
      if (BaseTable?.fetchJSON) return await BaseTable.fetchJSON(url, { headers: headers(), cacheKey });
      if (BaseTable?.getCachedOrFetch) {
        return await BaseTable.getCachedOrFetch(cacheKey, () =>
          fetch(url, { headers: headers() }).then(r => (r.ok ? r.json() : []))
        );
      }
    } catch (e) {
      console.warn('[Matchups] BaseTable adapter failed; fallback to fetch()', e);
    }
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return [];
    try { return await res.json(); } catch { return []; }
  }

  const URLS = {
    matchups: () => `${BASE_URL}${ENDPOINTS.MATCHUPS}?select=*`,
    pitchers: (gameId) => `${BASE_URL}${ENDPOINTS.PITCHERS}?${encodeURIComponent(F.P_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
    batters:  (gameId) => `${BASE_URL}${ENDPOINTS.BATTERS }?${encodeURIComponent(F.B_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
    bullpen:  (gameId) => `${BASE_URL}${ENDPOINTS.BULLPEN }?${encodeURIComponent(F.BP_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
    park:     (gameId) => `${BASE_URL}${ENDPOINTS.PARK    }?${encodeURIComponent(F.PF_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
  };

  // ---------- Public: getTableConfig ----------
  function getTableConfig(/* BaseTable */) {
    return {
      index: rowIndexFromData,
      layout: 'fitColumns',
      height: '650px',
      ajaxURL: URLS.matchups(),
      ajaxConfig: { headers: headers() },
      columns: [
        {
          title: '', width: 36, hozAlign: 'center', headerSort: false,
          formatter: (cell) => {
            const row = cell.getRow();
            const isOpen = row.getElement().classList.contains('is-expanded');
            return `<button class="mf-toggle">${isOpen ? '−' : '+'}</button>`;
          },
          cellClick: (_e, cell) => toggleRowExpansion(cell.getTable(), cell.getRow(), cell.getTable()._BaseTableRef),
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

  // ---------- Public: initialize(BaseTable) ----------
  function initialize(BaseTable) {
    const el = document.querySelector(elementId);
    if (!el || typeof Tabulator === 'undefined') return null;

    const cfg = getTableConfig(BaseTable);

    // Let BaseTable create or get (mirrors other tables). Fallback to direct Tabulator.
    const table = BaseTable?.createOrGet
      ? BaseTable.createOrGet(elementId, cfg)
      : new Tabulator(el, cfg);

    // Keep BaseTable ref for cached subtable fetches
    table._BaseTableRef = BaseTable || null;

    // Keep +/- icon synced
    table.setOption('rowFormatter', (row) => {
      const btn = row.getCell(0)?.getElement()?.querySelector?.('.mf-toggle');
      if (btn) btn.textContent = row.getElement().classList.contains('is-expanded') ? '−' : '+';
    });

    // Re-apply expanded state after loads & processing
    const reapply = () => reapplyExpandedState(table);
    table.on('dataLoaded', reapply);
    table.on('dataProcessed', reapply);

    injectStylesOnce();
    console.log('Matchups table built successfully');
    return table;
  }

  // ---------- Expansion / Subtables ----------
  function reapplyExpandedState(table) {
    const ids = [...expandedRowIds];
    if (!ids.length) return;
    requestAnimationFrame(() => {
      ids.forEach(id => {
        const row = table.getRow(id);
        if (row && !row.getElement().classList.contains('is-expanded')) {
          openSubtableRow(table, row, table._BaseTableRef);
        }
      });
    });
  }

  async function toggleRowExpansion(table, row, BaseTable) {
    const rowKey = getRowKey(row);
    const rowEl = row.getElement();

    if (rowEl.classList.contains('is-expanded')) {
      const next = rowEl.nextElementSibling;
      if (next && next.classList.contains('wf-subtable-wrapper')) next.remove();
      rowEl.classList.remove('is-expanded');
      expandedRowIds.delete(rowKey);
      saveLS(LS_EXPANDED, [...expandedRowIds]);
      row.normalizeHeight();
      return;
    }

    await openSubtableRow(table, row, BaseTable);
    expandedRowIds.add(rowKey);
    saveLS(LS_EXPANDED, [...expandedRowIds]);
  }

  async function openSubtableRow(table, row, BaseTable) {
    const gameId = row.getData()?.[F.MATCH_ID];
    if (gameId == null) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'wf-subtable-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.margin = '0';
    wrapper.innerHTML = buildSubtableSkeleton();

    const rowEl = row.getElement();
    rowEl.insertAdjacentElement('afterend', wrapper); // expand downward
    rowEl.classList.add('is-expanded');
    row.normalizeHeight();

    const data = await loadAllSubtableData(gameId, BaseTable);

    renderPitchers(wrapper.querySelector('[data-sec="pitchers"]'), data.pitchers);
    renderBatters (wrapper.querySelector('[data-sec="batters"]'),  data.batters);
    renderBullpen (wrapper.querySelector('[data-sec="bullpen"]'),  data.bullpen);
    renderPark    (wrapper.querySelector('[data-sec="park"]'),     data.park);

    const rowKey = getRowKey(row);
    const defaultTab = activeSubtabByRow.get(rowKey) || 'pitchers';
    switchSubtab(wrapper, defaultTab);
    wrapper.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-subtab');
        switchSubtab(wrapper, name);
        activeSubtabByRow.set(rowKey, name);
        saveLS(LS_SUBTAB, Object.fromEntries(activeSubtabByRow));
      });
    });
  }

  function buildSubtableSkeleton() {
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

  function switchSubtab(wrapper, name) {
    wrapper.querySelectorAll('.wf-tab').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-subtab') === name);
    });
    wrapper.querySelectorAll('.wf-subsec').forEach(sec => {
      sec.style.display = (sec.getAttribute('data-sec') === name) ? 'block' : 'none';
    });
  }

  // ---------- Subtable Data ----------
  async function loadAllSubtableData(gameId, BaseTable) {
    if (subtableCache.has(gameId)) return subtableCache.get(gameId);

    const [park, pitchers, batters, bullpen] = await Promise.all([
      fetchJSON(URLS.park(gameId),    `${ENDPOINTS.PARK}:${gameId}`,    BaseTable),
      fetchJSON(URLS.pitchers(gameId),`${ENDPOINTS.PITCHERS}:${gameId}`,BaseTable),
      fetchJSON(URLS.batters(gameId), `${ENDPOINTS.BATTERS}:${gameId}`, BaseTable),
      fetchJSON(URLS.bullpen(gameId), `${ENDPOINTS.BULLPEN}:${gameId}`, BaseTable),
    ]);

    const payload = {
      park:     Array.isArray(park) ? park : [],
      pitchers: Array.isArray(pitchers) ? pitchers : [],
      batters:  Array.isArray(batters) ? batters : [],
      bullpen:  Array.isArray(bullpen) ? bullpen : [],
    };
    subtableCache.set(gameId, payload);
    return payload;
  }

  // ---------- Renderers ----------
  function buildGridTable(rows, columns) {
    const cols = columns.length;
    const style = `style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));"`;
    const header = `<div class="wf-grid wf-header" ${style}>${
      columns.map(c => `<div class="wf-cell">${esc(c.label)}</div>`).join('')
    }</div>`;
    const body = (rows && rows.length)
      ? rows.map(r => `<div class="wf-grid wf-row" ${style}>${
          columns.map(c => `<div class="wf-cell">${esc(r?.[c.key] ?? '')}</div>`).join('')
        }</div>`).join('')
      : `<div class="wf-grid wf-row" ${style}><div class="wf-cell" style="grid-column:1/-1;opacity:.7;">No data</div></div>`;
    return `<div class="wf-subtable-section wf-table">${header}${body}</div>`;
  }

  function renderPitchers(container, rows) {
    container.innerHTML = buildGridTable(rows, [
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

  function renderBatters(container, rows) {
    container.innerHTML = buildGridTable(rows, [
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

  function renderPark(container, rows) {
    container.innerHTML = buildGridTable(rows, [
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

  function renderBullpen(container, rows) {
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
      [F.BP_ERA]:      r[F.BP_ERA], // rate; not summed
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
      const weightedHOverTBF = normalized.reduce((s, r) => s + (r[F.BP_H_TBF] * r[F.BP_TBF]), 0) / totals[F.BP_TBF];
      totals[F.BP_H_TBF] = Number.isFinite(weightedHOverTBF) ? +weightedHOverTBF.toFixed(3) : 0;
    }

    const combined = [...normalized, totals];

    container.innerHTML = buildGridTable(combined, [
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

  // ---------- Styles ----------
  function injectStylesOnce() {
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

  // ---------- Public API ----------
  return {
    elementId,
    getTableConfig,
    initialize,
  };
})();

// Export both ways so either import style in main.js works
export const MatchupsTable = MatchupsWrapper;
export default MatchupsWrapper;
