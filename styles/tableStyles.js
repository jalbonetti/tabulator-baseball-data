// styles/tableStyles.js - Baseball Table Styles
// Ported from NBA version with identical formatting patterns
//
// ARCHITECTURE:
//   injectStyles() is the entry point, called once from main.js.
//   It detects Webflow vs non-Webflow and injects the appropriate base styles,
//   then ALWAYS calls injectContainerStyles() for each known table container.
//   injectContainerStyles() uses #id selectors (specificity 1,0,X) which beat
//   Webflow's class-based and universal rules every time.
//
// FIX LOG:
//   - injectContainerStyles() now auto-called for table0/table1/table2 containers
//   - Added ID-scoped font-size overrides to beat Webflow's specificity
//   - Added header notch fix (header padding-right for scrollbar space)
//   - Removed all spinner-hiding CSS for .min-max-input (up/down arrows visible)
//   - Placeholder text forced to 24px at ID specificity

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

// =====================================================
// PUBLIC API
// =====================================================

export function injectStyles() {
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        injectScrollbarFix();
    } else {
        injectFullStyles();
    }

    // ALWAYS inject ID-scoped container styles for all 3 Phase-1 tables.
    // These use #id selectors that beat any class/universal Webflow rules.
    injectContainerStyles('table0-container');
    injectContainerStyles('table1-container');
    injectContainerStyles('table2-container');
}

/**
 * Inject container-ID-scoped styles for a specific table.
 * Can also be called individually from a table's initialize() method.
 *
 * Uses #containerId selectors (specificity 1,0,X) which reliably beat
 * Webflow's class-based and universal rules.
 */
export function injectContainerStyles(containerId, color = '#b91c1c') {
    const styleId = `${containerId}-override-styles`;
    if (document.getElementById(styleId)) return;

    const hoverColor = color === '#b91c1c' ? '#991b1b' : color;
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* =====================================================
           ID-SCOPED OVERRIDES for #${containerId}
           Specificity: 1,0,X — beats Webflow's class/universal rules
           ===================================================== */

        /* ---- FONT SIZE at ID specificity ---- */
        #${containerId} .tabulator,
        #${containerId} .tabulator *,
        #${containerId} .tabulator-table,
        #${containerId} .tabulator-table *,
        #${containerId} .tabulator-header,
        #${containerId} .tabulator-header *,
        #${containerId} .tabulator-row,
        #${containerId} .tabulator-row *,
        #${containerId} .tabulator-cell,
        #${containerId} .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }

        /* ---- HEADER: gradient, white text, word-wrap ---- */
        #${containerId} .tabulator-header {
            background: linear-gradient(135deg, ${color} 0%, ${hoverColor} 100%) !important;
            color: white !important;
            font-weight: 600 !important;
            position: relative !important;
        }

        #${containerId} .tabulator-col {
            background: transparent !important;
            border-right: 1px solid rgba(255,255,255,0.2) !important;
        }

        #${containerId} .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4px 2px !important;
            color: white !important;
        }

        /* ---- DATA CELLS: single-line ellipsis ---- */
        #${containerId} .tabulator-cell {
            padding: 6px 4px !important;
            border-right: 1px solid #f0f0f0 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }

        /* ---- ROWS ---- */
        #${containerId} .tabulator-row {
            border-bottom: 1px solid #e8e8e8 !important;
            min-height: 32px !important;
        }
        #${containerId} .tabulator-row:nth-child(even) {
            background-color: #fafafa !important;
        }
        #${containerId} .tabulator-row:hover {
            background-color: #fef2f2 !important;
        }

        /* ---- GREY BACKGROUND for empty space ---- */
        #${containerId} .tabulator {
            background-color: #e8e8e8 !important;
            border: 1px solid #e0e0e0 !important;
            border-radius: 6px !important;
            overflow: visible !important;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif !important;
        }
        #${containerId} .tabulator .tabulator-tableholder {
            background-color: #e8e8e8 !important;
        }

        /* ---- PLACEHOLDER text — large and visible during loading/empty state ---- */
        #${containerId} .tabulator .tabulator-placeholder span {
            font-size: 24px !important;
            color: #999 !important;
            font-style: italic !important;
        }

        /* ---- Multi-select button — override global .tabulator * font-size ---- */
        #${containerId} .tabulator .custom-multiselect-button {
            font-size: 11px !important;
        }

        /* ---- Bankroll input — override global .tabulator * font-size ---- */
        #${containerId} .tabulator .bankroll-input {
            font-size: 9px !important;
        }
        #${containerId} .tabulator .bankroll-input-container span {
            font-size: 9px !important;
        }

        /* ---- Header filter text input ---- */
        #${containerId} .tabulator-header-filter input[type="search"],
        #${containerId} .tabulator-header-filter input[type="text"] {
            font-size: 11px !important;
            width: 100% !important;
            padding: 4px 6px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }

        /* ---- Min/Max filter layout — no spinner-hiding ---- */
        #${containerId} .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        #${containerId} .min-max-input {
            width: 100% !important;
            flex-shrink: 0 !important;
            padding: 2px 3px !important;
            font-size: 9px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }
        #${containerId} .min-max-input:focus {
            outline: none !important;
            border-color: ${color} !important;
        }

        /* ---- DROPDOWN filters — position ABOVE the table ---- */
        #${containerId} .custom-multiselect-dropdown,
        #${containerId} [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }

        /* =====================================================
           DESKTOP (>1024px): scrollbar, width, header notch fix
           ===================================================== */
        @media screen and (min-width: 1025px) {
            #${containerId} {
                width: fit-content !important;
                max-width: none !important;
                overflow-x: visible !important;
            }

            #${containerId} .tabulator {
                width: auto !important;
                max-width: none !important;
            }

            #${containerId} .tabulator .tabulator-tableholder {
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }

            /* HEADER NOTCH FIX: pad right side so header doesn't bleed
               into the scrollbar track area */
            #${containerId} .tabulator .tabulator-header {
                padding-right: 16px !important;
                box-sizing: border-box !important;
            }

            /* Scrollbar — display: block beats Webflow's display: none */
            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 16px !important;
                height: 16px !important;
                visibility: visible !important;
                -webkit-appearance: scrollbar !important;
            }

            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                display: block !important;
                background: #f1f1f1 !important;
                border-radius: 8px !important;
                visibility: visible !important;
            }

            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: ${color} !important;
                border-radius: 8px !important;
                visibility: visible !important;
                min-height: 50px !important;
            }

            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: ${hoverColor} !important;
            }

            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar-corner {
                background: #e8e8e8 !important;
                display: block !important;
                visibility: visible !important;
            }

            /* Firefox scrollbar */
            #${containerId} .tabulator .tabulator-tableholder {
                scrollbar-width: thin !important;
                scrollbar-color: ${color} #f1f1f1 !important;
            }
        }

        /* =====================================================
           MOBILE/TABLET (≤1024px): frozen columns, touch scroll
           ===================================================== */
        @media screen and (max-width: 1024px) {
            #${containerId} {
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }

            #${containerId} .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }

            #${containerId} .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }

            /* Frozen column backgrounds */
            #${containerId} .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            #${containerId} .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            #${containerId} .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            #${containerId} .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fef2f2 !important;
            }
            #${containerId} .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
                background: linear-gradient(135deg, ${color} 0%, ${hoverColor} 100%) !important;
            }

            /* Standalone header alignment */
            #${containerId} .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            #${containerId} .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 8px !important;
            }

            /* Thin scrollbar for touch */
            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 4px !important;
                height: 4px !important;
                visibility: visible !important;
            }
            #${containerId} .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #ccc !important;
                border-radius: 2px !important;
                visibility: visible !important;
            }
        }

        /* Mobile: extra compact */
        @media screen and (max-width: 768px) {
            #${containerId} .tabulator-col,
            #${containerId} .tabulator-cell {
                padding: 2px 1px !important;
            }
            #${containerId} .min-max-input {
                font-size: 8px !important;
                padding: 1px 2px !important;
            }
            #${containerId} .min-max-filter-container {
                max-width: 35px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Injected ID-scoped styles for #' + containerId + ' (font: ' + baseFontSize + 'px)');
}

// =====================================================
// SCROLLBAR FIX — generic high-specificity fallback
// =====================================================

function injectScrollbarFix() {
    if (document.querySelector('style[data-source="scrollbar-fix"]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-source', 'scrollbar-fix');
    style.textContent = `
        @media screen and (min-width: 1025px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important; width: 16px !important; height: 16px !important;
                visibility: visible !important; -webkit-appearance: scrollbar !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-track,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-track {
                display: block !important; background: #f1f1f1 !important;
                border-radius: 8px !important; visibility: visible !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important; background: #b91c1c !important;
                border-radius: 8px !important; visibility: visible !important; min-height: 50px !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #991b1b !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-corner,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-corner {
                background: #e8e8e8 !important; display: block !important; visibility: visible !important;
            }
            html body .tabulator .tabulator-tableholder,
            html body div.tabulator div.tabulator-tableholder {
                scrollbar-width: thin !important; scrollbar-color: #b91c1c #f1f1f1 !important;
            }
        }
        @media screen and (max-width: 1024px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important; width: 4px !important; height: 4px !important; visibility: visible !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important; background: #ccc !important; border-radius: 2px !important; visibility: visible !important;
            }
        }
    `;
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.parentNode) {
        webflowStyle.parentNode.insertBefore(style, webflowStyle.nextSibling);
    } else {
        document.head.appendChild(style);
    }
}

// =====================================================
// MINIMAL STYLES — used when Webflow custom styles detected
// =====================================================

function injectMinimalStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;

    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-minimal');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* Base font — class level (ID-scoped rules in injectContainerStyles override if needed) */
        .tabulator, .tabulator *, .subrow-container, .subrow-container *,
        .tabulator-table, .tabulator-table *, .tabulator-header, .tabulator-header *,
        .tabulator-row, .tabulator-row *, .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }

        .table-container { background: #e8e8e8 !important; display: block !important; visibility: visible !important; }
        .table-wrapper { background: #e8e8e8 !important; }
        .tabulator { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #e8e8e8 !important; }
        .tabulator .tabulator-tableholder { background-color: #e8e8e8 !important; }

        .tabulator-header {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            color: white !important; font-weight: 600 !important; position: relative !important;
        }
        .tabulator-col { background: transparent !important; border-right: 1px solid rgba(255,255,255,0.2) !important; }
        .tabulator-col-title {
            white-space: normal !important; word-break: break-word !important; overflow-wrap: break-word !important;
            text-align: center !important; display: flex !important; align-items: center !important;
            justify-content: center !important; padding: 4px 2px !important; color: white !important;
        }
        .tabulator-cell { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }

        .custom-multiselect-dropdown, [id^="dropdown_"] {
            z-index: 2147483647 !important; position: fixed !important; background: white !important;
            border: 1px solid #333 !important; border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }

        /* Min/Max filter — no spinner-hiding */
        .min-max-filter-container { display: flex !important; flex-direction: column !important; gap: 2px !important; max-width: 45px !important; margin: 0 auto !important; }
        .min-max-input { width: 100% !important; padding: 2px 3px !important; font-size: 9px !important; border: 1px solid #ccc !important; border-radius: 2px !important; text-align: center !important; box-sizing: border-box !important; }

        .tabulator .custom-multiselect-button { font-size: 11px !important; }
        .tabulator .tabulator-placeholder span { font-size: 24px !important; color: #999 !important; font-style: italic !important; }
        .tabulator-header-filter input[type="search"], .tabulator-header-filter input[type="text"] {
            width: 100% !important; padding: 4px 6px !important; font-size: 11px !important;
            border: 1px solid #ccc !important; border-radius: 3px !important; box-sizing: border-box !important;
        }

        /* Mobile subtable compact layout */
        @media screen and (max-width: 768px) {
            .subrow-container { padding: 8px 10px !important; }
            .subrow-container > div { gap: 6px !important; }
            .subrow-container > div > div { padding: 8px !important; min-width: unset !important; }
            .subrow-container h4 { font-size: 11px !important; margin: 0 0 4px 0 !important; }
        }
        .subrow-container > div[style*="flex"] { flex-wrap: nowrap !important; overflow-x: auto !important; }
    `;
    document.head.appendChild(style);
    console.log('Baseball minimal styles injected (baseFontSize: ' + baseFontSize + 'px)');
}

// =====================================================
// FULL STYLES — used when NO Webflow custom styles detected
// =====================================================

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;

    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        .tabulator, .tabulator *, .subrow-container, .subrow-container *,
        .tabulator-table, .tabulator-table *, .tabulator-header, .tabulator-header *,
        .tabulator-row, .tabulator-row *, .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important; line-height: 1.3 !important;
        }
        .table-container { width: 100%; max-width: 100%; margin: 0 auto; position: relative; background: #e8e8e8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: visible; }
        .table-wrapper { background: #e8e8e8; }
        .tabulator { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: ${baseFontSize}px !important; line-height: 1.3 !important; background-color: #e8e8e8; border: 1px solid #e0e0e0; border-radius: 6px; overflow: visible !important; }
        .tabulator .tabulator-tableholder { background-color: #e8e8e8; }
        .tabulator-header { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); color: white; font-weight: 600; position: relative !important; }
        .tabulator-col { background: transparent; border-right: 1px solid rgba(255,255,255,0.2); }
        .tabulator-col-title { white-space: normal !important; word-break: break-word !important; overflow-wrap: break-word !important; text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 4px 2px !important; }
        .tabulator-col-group-cols { border-top: 1px solid rgba(255,255,255,0.3); }
        .tabulator-row { border-bottom: 1px solid #e8e8e8; min-height: 32px; }
        .tabulator-row:nth-child(even) { background-color: #fafafa; }
        .tabulator-row:hover { background-color: #fef2f2; }
        .tabulator-cell { padding: 6px 4px; border-right: 1px solid #f0f0f0; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }

        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar { width: 16px !important; height: 16px !important; }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb { background: #b91c1c; border-radius: 8px; min-height: 50px; }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover { background: #991b1b; }
            .tabulator .tabulator-tableholder { scrollbar-width: auto; scrollbar-color: #b91c1c #f1f1f1; }
        }

        .custom-multiselect-dropdown, [id^="dropdown_"] { z-index: 2147483647 !important; position: fixed !important; background: white !important; border: 1px solid #333 !important; border-radius: 4px !important; box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important; }
        .min-max-filter-container { display: flex !important; flex-direction: column !important; gap: 2px !important; max-width: 45px !important; margin: 0 auto !important; }
        .min-max-input { width: 100% !important; padding: 2px 3px !important; font-size: 9px !important; border: 1px solid #ccc !important; border-radius: 2px !important; text-align: center !important; box-sizing: border-box !important; }

        @media screen and (max-width: 1024px) {
            .tabulator-header { display: flex !important; align-items: stretch !important; }
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content { display: flex !important; flex-direction: column !important; justify-content: flex-start !important; align-items: center !important; height: 100% !important; padding-top: 8px !important; }
            .tabulator-header .tabulator-frozen { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important; z-index: 100 !important; }
            .tabulator .tabulator-tableholder::-webkit-scrollbar { width: 4px !important; height: 4px !important; }
        }
        @media screen and (max-width: 768px) {
            .tabulator-col, .tabulator-cell { padding: 2px 1px !important; }
            .min-max-input { font-size: 8px !important; padding: 1px 2px !important; }
            .min-max-filter-container { max-width: 35px !important; }
        }

        .tabulator .tabulator-tableholder { overflow-y: auto !important; overflow-x: auto !important; }
        @media screen and (min-width: 1025px) {
            .tabulator { width: 100% !important; max-width: 100% !important; background-color: #e8e8e8 !important; }
            .table-container { overflow-x: auto !important; background: #e8e8e8 !important; }
            .table-wrapper { background: #e8e8e8 !important; }
            .tabulator .tabulator-tableholder { background-color: #e8e8e8 !important; overflow-y: scroll !important; overflow-x: auto !important; }
        }
        @media screen and (max-width: 1024px) {
            .table-container { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; }
            .table-container .tabulator { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
            .table-container .tabulator .tabulator-tableholder { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
            .tabulator-row .tabulator-cell.tabulator-frozen { background: inherit !important; position: sticky !important; left: 0 !important; z-index: 10 !important; }
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen { background: #fafafa !important; }
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen { background: #ffffff !important; }
            .tabulator-row:hover .tabulator-cell.tabulator-frozen { background: #fef2f2 !important; }
            .tabulator-header .tabulator-col.tabulator-frozen { position: sticky !important; left: 0 !important; z-index: 101 !important; }
        }

        .tabulator .custom-multiselect-button { font-size: 11px !important; }
        .tabulator .tabulator-placeholder span { font-size: 24px !important; color: #999 !important; font-style: italic !important; }
        .tabulator-header-filter input[type="search"], .tabulator-header-filter input[type="text"] {
            width: 100% !important; padding: 4px 6px !important; font-size: 11px !important;
            border: 1px solid #ccc !important; border-radius: 3px !important; box-sizing: border-box !important;
        }
        @media screen and (max-width: 768px) {
            .subrow-container { padding: 8px 10px !important; }
            .subrow-container > div { gap: 6px !important; }
            .subrow-container > div > div { padding: 8px !important; min-width: unset !important; }
            .subrow-container h4 { font-size: 11px !important; margin: 0 0 4px 0 !important; }
        }
        .subrow-container > div[style*="flex"] { flex-wrap: nowrap !important; overflow-x: auto !important; }
    `;
    document.head.appendChild(style);
    console.log('Baseball full styles injected (baseFontSize: ' + baseFontSize + 'px)');
}
