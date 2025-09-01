/* =========================================================================
   combinedMatchupsTable.js  (BaseTable-aware)
   =========================================================================
   - Expands downward; consistent styling
   - Persists expanded rows + active subtab per row (localStorage)
   - Loads all 4 subtables (Pitchers, Batters, Bullpen, Park)
   - Uses BaseTable/IndexedDB cache if available; else fetch()
   ========================================================================= */

(function () {
  // -----------------------------
  // CONFIG
  // -----------------------------
  const TABLE_EL = '#matchups-table';
  const BASE_URL = 'https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

  const ENDPOINTS = {
    MATCHUPS: 'ModMatchupsData',
    PITCHERS: 'ModPitcherMatchups',
    BATTERS:  'ModBatterMatchups',
    BULLPEN:  'ModBullpenMatchups',
    PARK:     'ModParkFactors',
  };

  // Column labels (exactly as in your schemas)
  const FLDS = {
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

  // -----------------------------
  // FETCH ADAPTER (BaseTable-aware)
  // -----------------------------
  function supaHeaders() {
    const h = { 'Accept': 'application/json' };
    if (SUPABASE_ANON_KEY) h['apikey'] = SUPABASE_ANON_KEY;
    return h;
  }

  async function fetchViaBaseTable(url, cacheKey) {
    // Use any of these if present
    const BT = window.BaseTable || {};
    try {
      if (typeof BT.getJSON === 'function') {
        return await BT.getJSON(url, { headers: supaHeaders(), cacheKey });
      }
      if (typeof BT.fetchJSON === 'function') {
        return await BT.fetchJSON(url, { headers: supaHeaders(), cacheKey });
      }
      if (typeof BT.getCachedOrFetch === 'function') {
        return await BT.getCachedOrFetch(cacheKey, () => fetch(url, { headers: supaHeaders() }).then(r => r.json()));
      }
    } catch (e) {
      console.warn('[combinedMatchupsTable] BaseTable call failed, falling back to fetch()', e);
    }
    // Fallback – direct fetch
    const res = await fetch(url, { headers: supaHeaders() });
    if (!res.ok) return [];
    try { return await res.json(); } catch { return []; }
  }

  function u(endpoint, params) {
    const q = new URLSearchParams(params);
    return `${BASE_URL}${endpoint}?${q.toString()}`;
  }

  const api = {
    matchups: () => fetchViaBaseTable(
      u(ENDPOINTS.MATCHUPS, { select: '*' }),
      `${ENDPOINTS.MATCHUPS}`
    ),
    pitchers: (gameId) => fetchViaBaseTable(
      `${BASE_URL}${ENDPOINTS.PITCHERS}?${encodeURIComponent(FLDS.P_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
      `${ENDPOINTS.PITCHERS}:${gameId}`
    ),
    batters: (gameId) => fetchViaBaseTable(
      `${BASE_URL}${ENDPOINTS.BATTERS}?${encodeURIComponent(FLDS.B_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
      `${ENDPOINTS.BATTERS}:${gameId}`
    ),
    bullpen: (gameId) => fetchViaBaseTable(
      `${BASE_URL}${ENDPOINTS.BULLPEN}?${encodeURIComponent(FLDS.BP_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
      `${ENDPOINTS.BULLPEN}:${gameId}`
    ),
    park: (gameId) => fetchViaBaseTable(
      `${BASE_URL}${ENDPOINTS.PARK}?${encodeURIComponent(FLDS.PF_GAME_ID)}=eq.${encodeURIComponent(gameId)}&select=*`,
      `${ENDPOINTS.PARK}:${gameId}`
    ),
  };

  // -----------------------------
  // STATE
  // -----------------------------
  const LS_EXPANDED = 'matchups_expanded_row_ids_v3';
  const LS_SUBTAB   = 'matchups_active_subtab_v2';
  const expandedRowIds = new Set(loadExpanded());
  const activeSubtabByRow = new Map(loadSubtabs());
  const subtableCache = new Map(); // gameId -> {park,pitchers,batters,bullpen}

  function loadExpanded() {
    try { return JSON.parse(localStorage.getItem(LS_EXPANDED) || '[]'); } catch { return []; }
  }
  function saveExpanded() {
    try { localStorage.setItem(LS_EXPANDED, JSON.stringify([...expandedRowIds])); } catch {}
  }
  function loadSubtabs() {
    try { return Object.entries(JSON.parse(localStorage.getItem(LS_SUBTAB) || '{}')); } catch { return []; }
  }
  function getSavedSubtab(rowKey) { return activeSubtabByRow.get(rowKey); }
  function setSavedSubtab(rowKey, tab) {
    activeSubtabByRow.set(rowKey, tab);
    try { localStorage.setItem(LS_SUBTAB, JSON.stringify(Object.fromEntries(activeSubtabByRow))); } catch {}
  }

  // -----------------------------
  // UTIL
  // -----------------------------
  const toNum = v => (Number.isFinite(+v) ? +v : 0);
  const esc = v => (v == null ? '' : String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));

  // -----------------------------
  // TABULATOR TABLE
  // -----------------------------
  function rowIdFromData(data) {
    const id = data?.[FLDS.MATCH_ID];
    return id != null ? `matchup_${id}` : undefined;
  }
  function getRowKey(row) { return row.getIndex(); }

  function initMatchupsTable() {
    const el = document.querySelector(TABLE_EL);
    if (!el) return;

    const table = new Tabulator(el, {
      index: rowIdFromData,
      layout: "fitColumns",
      height: "650px",
      ajaxURLFunc: () => null, // we will feed data manually to use BaseTable adapter
      columns: [
        {
          title: "", width: 36, hozAlign: "center", headerSort: false,
          formatter: cell => {
            const row = cell.getRow();
            const isOpen = row.getElement().classList.contains('is-expanded');
            return `<button class="mf-toggle">${isOpen ? '−' : '+'}</button>`;
          },
          cellClick: (e, cell) => toggleRowExpansion(table, cell.getRow())
        },
        { title: "Team", field: FLDS.TEAM, widthGrow: 1 },
        { title: "Game", field: FLDS.GAME, widthGrow: 2 },
        { title: "Ballpark", field: FLDS.PARK, widthGrow: 1 },
        { title: "Spread", field: FLDS.SPREAD, widthGrow: 0.7 },
        { title: "Total",  field: FLDS.TOTAL,  widthGrow: 0.7 },
        { title: "Lineup", field: FLDS.LINEUP, widthGrow: 0.8 },
        { title: "Time",   field: FLDS.WX1,    widthGrow: 1.6 },
        { title: "Cond.",  field: FLDS.WX2,    widthGrow: 1.6 },
        { title: "Cond.",  field: FLDS.WX3,    widthGrow: 1.6 },
        { title: "Cond.",  field: FLDS.WX4,    widthGrow: 1.6 },
      ],
      dataLoaded: () => reapplyExpandedState(table),
      dataProcessed: () => reapplyExpandedState(table),
    });

    // Load data via BaseTable-aware adapter, then set
    api.matchups().then(rows => {
      table.setData(rows || []);
      reapplyExpandedState(table);
    });

    return table;
  }

  // -----------------------------
  // EXPANSION / SUBTABLES
  // -----------------------------
  async function toggleRowExpansion(table, row) {
    const rowKey = getRowKey(row);
    const rowEl = row.getElement();

    if (rowEl.classList.contains('is-expanded')) {
      const next = rowEl.nextElementSibling;
      if (next && next.classList.contains('wf-subtable-wrapper')) next.remove();
      rowEl.classList.remove('is-expanded');
      expandedRowIds.delete(rowKey);
      saveExpanded();
      row.normalizeHeight();
      return;
    }

    await openSubtableRow(table, row);
    expandedRowIds.add(rowKey);
    saveExpanded();
  }

  async function openSubtableRow(table, row) {
    const rowKey = getRowKey(row);
    const gameId = row.getData()?.[FLDS.MATCH_ID];
    if (gameId == null) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'wf-subtable-wrapper';
    wrapper.setAttribute('data-parent-row', rowKey);
    wrapper.style.position = 'relative';
    wrapper.style.margin = '0';
    wrapper.innerHTML = buildEmptySubtableSkeleton();

    const rowEl = row.getElement();
    rowEl.insertAdjacentElement('afterend', wrapper);
    rowEl.classList.add('is-expanded');
    row.normalizeHeight();

    const data = await loadAllSubtableData(gameId);

    renderPitchers(wrapper.querySelector('[data-sec="pitchers"]'), data.pitchers);
    renderBatters(wrapper.querySelector('[data-sec="batters"]'),  data.batters);
    renderBullpen(wrapper.querySelector('[data-sec="bullpen"]'),  data.bullpen);
    renderPark(wrapper.querySelector('[data-sec="park"]'),        data.park);

    const defaultTab = getSavedSubtab(rowKey) || 'pitchers';
    switchSubtab(wrapper, defaultTab);
    wrapper.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-subtab');
        switchSubtab(wrapper, name);
        setSavedSubtab(rowKey, name);
      });
    });
  }

  function reapplyExpandedState(table) {
    const ids = [...expandedRowIds];
    if (!ids.length) return;
    requestAnimationFrame(() => {
      ids.forEach(id => {
        const row = table.getRow(id);
        if (row && !row.getElement().classList.contains('is-expanded')) {
          openSubtableRow(table, row);
        }
      });
    });
  }

  function buildEmptySubtableSkeleton() {
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

  // -----------------------------
  // DATA LOAD (all four subtables)
  // -----------------------------
  async function loadAllSubtableData(gameId) {
    if (subtableCache.has(gameId)) return subtableCache.get(gameId);
    const [park, pitchers, batters, bullpen] = await Promise.all([
      api.park(gameId), api.pitchers(gameId), api.batters(gameId), api.bullpen(gameId)
    ]);
    const payload = {
      park: Array.isArray(park) ? park : [],
      pitchers: Array.isArray(pitchers) ? pitchers : [],
      batters: Array.isArray(batters) ? batters : [],
      bullpen: Array.isArray(bullpen) ? bullpen : [],
    };
    subtableCache.set(gameId, payload);
    return payload;
  }

  // -----------------------------
  // RENDERERS
  // -----------------------------
  function renderPitchers(container, rows) {
    container.innerHTML = buildGridTable(rows, [
      { key: FLDS.P_NAME,  label: 'Name' },
      { key: FLDS.P_SPLIT, label: 'Split' },
      { key: FLDS.P_TBF,   label: 'TBF' },
      { key: FLDS.P_H_TBF, label: 'H/TBF' },
      { key: FLDS.P_H,     label: 'H' },
      { key: FLDS.P_ERA,   label: 'ERA' },
      { key: FLDS.P_SO,    label: 'SO' },
      { key: FLDS.P_BB,    label: 'BB' },
      { key: FLDS.P_R,     label: 'R' },
    ]);
  }

  function renderBatters(container, rows) {
    container.innerHTML = buildGridTable(rows, [
      { key: FLDS.B_NAME,  label: 'Name' },
      { key: FLDS.B_SPLIT, label: 'Split' },
      { key: FLDS.B_PA,    label: 'PA' },
      { key: FLDS.B_H_PA,  label: 'H/PA' },
      { key: FLDS.B_H,     label: 'H' },
      { key: FLDS.B_RBI,   label: 'RBI' },
      { key: FLDS.B_SO,    label: 'SO' },
      { key: FLDS.B_BB,    label: 'BB' },
      { key: FLDS.B_R,     label: 'R' },
    ]);
  }

  function renderPark(container, rows) {
    container.innerHTML = buildGridTable(rows, [
      { key: FLDS.PF_STADIUM, label: 'Stadium' },
      { key: FLDS.PF_SPLIT,   label: 'Split' },
      { key: FLDS.PF_R,       label: 'Runs PF' },
      { key: FLDS.PF_H,       label: 'Hits PF' },
      { key: FLDS.PF_HR,      label: 'HR PF' },
      { key: FLDS.PF_BB,      label: 'BB PF' },
      { key: FLDS.PF_SO,      label: 'SO PF' },
      { key: FLDS.PF_1B,      label: '1B PF' },
      { key: FLDS.PF_2B,      label: '2B PF' },
    ]);
  }

  function renderBullpen(container, rows) {
    const normalized = rows.map(r => ({
      [FLDS.BP_HAND_CNT]: r[FLDS.BP_HAND_CNT],
      [FLDS.BP_SPLIT]:    r[FLDS.BP_SPLIT],
      [FLDS.BP_TBF]:      toNum(r[FLDS.BP_TBF]),
      [FLDS.BP_H_TBF]:    toNum(r[FLDS.BP_H_TBF]),
      [FLDS.BP_H]:        toNum(r[FLDS.BP_H]),
      [FLDS.BP_1B]:       toNum(r[FLDS.BP_1B]),
      [FLDS.BP_2B]:       toNum(r[FLDS.BP_2B]),
      [FLDS.BP_3B]:       toNum(r[FLDS.BP_3B]),
      [FLDS.BP_HR]:       toNum(r[FLDS.BP_HR]),
      [FLDS.BP_R]:        toNum(r[FLDS.BP_R]),
      [FLDS.BP_ERA]:      r[FLDS.BP_ERA], // leave as-is (rate)
      [FLDS.BP_BB]:       toNum(r[FLDS.BP_BB]),
      [FLDS.BP_SO]:       toNum(r[FLDS.BP_SO]),
    }));

    const totals = normalized.reduce((acc, r) => {
      acc[FLDS.BP_TBF] += r[FLDS.BP_TBF];
      acc[FLDS.BP_H]   += r[FLDS.BP_H];
      acc[FLDS.BP_1B]  += r[FLDS.BP_1B];
      acc[FLDS.BP_2B]  += r[FLDS.BP_2B];
      acc[FLDS.BP_3B]  += r[FLDS.BP_3B];
      acc[FLDS.BP_HR]  += r[FLDS.BP_HR];
      acc[FLDS.BP_R]   += r[FLDS.BP_R];
      acc[FLDS.BP_BB]  += r[FLDS.BP_BB];
      acc[FLDS.BP_SO]  += r[FLDS.BP_SO];
      return acc;
    }, {
      [FLDS.BP_HAND_CNT]: 'All Bullpen (Total)',
      [FLDS.BP_SPLIT]: '—',
      [FLDS.BP_TBF]: 0, [FLDS.BP_H_TBF]: 0, [FLDS.BP_H]: 0,
      [FLDS.BP_1B]: 0, [FLDS.BP_2B]: 0, [FLDS.BP_3B]: 0, [FLDS.BP_HR]: 0,
      [FLDS.BP_R]: 0, [FLDS.BP_ERA]: '', [FLDS.BP_BB]: 0, [FLDS.BP_SO]: 0,
    });

    if (totals[FLDS.BP_TBF] > 0) {
      const weightedHOverTBF = normalized.reduce((s, r) => s + (r[FLDS.BP_H_TBF] * r[FLDS.BP_TBF]), 0) / totals[FLDS.BP_TBF];
      totals[FLDS.BP_H_TBF] = Number.isFinite(weightedHOverTBF) ? +weightedHOverTBF.toFixed(3) : 0;
    }

    const combined = [...normalized, totals];

    container.innerHTML = buildGridTable(combined, [
      { key: FLDS.BP_HAND_CNT, label: 'Group'  },
      { key: FLDS.BP_SPLIT,    label: 'Split'  },
      { key: FLDS.BP_TBF,      label: 'TBF'    },
      { key: FLDS.BP_H_TBF,    label: 'H/TBF'  },
      { key: FLDS.BP_H,        label: 'H'      },
      { key: FLDS.BP_R,        label: 'R'      },
      { key: FLDS.BP_ERA,      label: 'ERA'    },
      { key: FLDS.BP_BB,       label: 'BB'     },
      { key: FLDS.BP_SO,       label: 'SO'     },
      { key: FLDS.BP_HR,       label: 'HR'     },
      { key: FLDS.BP_1B,       label: '1B'     },
      { key: FLDS.BP_2B,       label: '2B'     },
      { key: FLDS.BP_3B,       label: '3B'     },
    ]);
  }

  function buildGridTable(rows, columns) {
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

  // -----------------------------
  // STYLES (inject once)
  // -----------------------------
  injectOnce('combinedMatchupsTableStyles', `
    .wf-subtable-wrapper { padding: .5rem 0 .75rem; }
    .wf-subtable-tabs { display:flex; gap:.5rem; margin:.25rem 0 .5rem; }
    .wf-tab { font: inherit; padding:.25rem .5rem; border-radius:6px; border:1px solid var(--wf-border, #333); background:transparent; color:inherit; cursor:pointer; }
    .wf-tab.is-active { background: var(--wf-active, rgba(255,255,255,.06)); }
    .wf-subtable-body { width:100%; }
    .wf-subsec { display:none; }
    .wf-table { width:100%; }
    .wf-grid { display:grid; gap:8px; align-items:center; }
    .wf-header { font-weight:600; opacity:.9; }
    .wf-row { border-top:1px solid var(--wf-border, #333); padding:6px 0; }
    .wf-cell { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mf-toggle { width:24px; height:24px; line-height:22px; border-radius:50%; border:1px solid var(--wf-border,#333); background:transparent; color:inherit; cursor:pointer; }
  `);

  function injectOnce(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = css;
    document.head.appendChild(s);
  }

  // -----------------------------
  // BOOT
  // -----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector(TABLE_EL)) initMatchupsTable();
  });

})();

