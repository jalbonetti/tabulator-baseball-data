// styles/tableStyles.js - Baseball Table Styles
// DIRECT COPY of CBB tableStyles.js with color changes:
//   #b8860b -> #b91c1c (dark red)
//   #996515 -> #991b1b (darker red)
//   #fdf6e3 -> #fef2f2 (light red hover)
//   #f5ecd0 -> #fee2e2 (light red)
// Includes: grey background, min/max stacking, frozen columns, scrollbar fix,
//   standalone header alignment, mobile frozen column support
// CHANGE FROM CBB: min-max spinner arrows kept visible (no appearance:none)

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        injectScrollbarFix();
        return;
    }
    injectFullStyles();
}

function injectScrollbarFix() {
    if (document.querySelector('#mlb-scrollbar-fix')) return;
    
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.id = 'mlb-scrollbar-fix';
    scrollbarStyle.textContent = `
        @media screen and (min-width: 1025px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 16px !important;
                height: 16px !important;
                visibility: visible !important;
                -webkit-appearance: scrollbar !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-track,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-track {
                display: block !important;
                background: #f1f1f1 !important;
                border-radius: 8px !important;
                visibility: visible !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #b91c1c !important;
                border-radius: 8px !important;
                visibility: visible !important;
                min-height: 50px !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #991b1b !important;
            }
            html body .tabulator .tabulator-tableholder,
            html body div.tabulator div.tabulator-tableholder {
                scrollbar-width: thin !important;
                scrollbar-color: #b91c1c #f1f1f1 !important;
            }
        }
        @media screen and (max-width: 1024px) {
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar {
                display: block !important;
                width: 4px !important;
                height: 4px !important;
                visibility: visible !important;
            }
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-thumb {
                display: block !important;
                background: #ccc !important;
                border-radius: 2px !important;
                visibility: visible !important;
            }
        }
    `;
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.nextSibling) {
        webflowStyle.parentNode.insertBefore(scrollbarStyle, webflowStyle.nextSibling);
    } else {
        document.head.appendChild(scrollbarStyle);
    }
}

function injectMinimalStyles() {
    if (document.querySelector('style[data-source="mlb-minimal"]')) return;
    
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'mlb-minimal');
    style.textContent = `
        .tabulator {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            background: #e8e8e8 !important;
        }
        .table-container {
            display: block !important;
            visibility: visible !important;
            background: #e8e8e8 !important;
        }
        
        /* HEADERS: Allow word wrapping, center-justified */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* DATA CELLS: Single-line with ellipsis */
        .tabulator-cell {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* DROPDOWNS: Position ABOVE the table */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        /* DESKTOP: Grey background fills empty space */
        @media screen and (min-width: 1025px) {
            .table-container {
                background: #e8e8e8 !important;
            }
            .table-wrapper {
                background: #e8e8e8 !important;
            }
            .tabulator {
                background-color: #e8e8e8 !important;
            }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        /* Standalone header alignment on mobile/tablet */
        @media screen and (max-width: 1024px) {
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
            }
            .tabulator-header > .tabulator-headers > .tabulator-col {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
            }
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: center !important;
                height: 100% !important;
                padding-top: 8px !important;
            }
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important;
                padding-top: 4px !important;
            }
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
                z-index: 100 !important;
            }
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
            }
        }
        
        /* Min/Max filter — stacked, NO spinner-hiding */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
        .tabulator-header .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            flex-wrap: nowrap !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        .min-max-input,
        .min-max-filter-container > input {
            width: 100% !important;
            flex-shrink: 0 !important;
            padding: 2px 3px !important;
            font-size: 9px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }
        .min-max-input:focus {
            outline: none !important;
            border-color: #b91c1c !important;
            box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
        }
        
        .tabulator .custom-multiselect-button { font-size: 11px !important; }
        .tabulator .tabulator-placeholder span {
            font-size: 24px !important; color: #999 !important; font-style: italic !important;
        }
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }
        
        /* Mobile frozen column support */
        @media screen and (max-width: 1024px) {
            .table-container {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
            }
            .table-container .tabulator {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
            }
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            .tabulator-row .tabulator-cell.tabulator-frozen {
                background: inherit !important;
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
            }
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen {
                background: #fafafa !important;
            }
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen {
                background: #ffffff !important;
            }
            .tabulator-row:hover .tabulator-cell.tabulator-frozen {
                background: #fef2f2 !important;
            }
            .tabulator-header .tabulator-col.tabulator-frozen {
                position: sticky !important;
                left: 0 !important;
                z-index: 101 !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('MLB minimal styles injected with grey background, min/max stacking, frozen column fix');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const scale = getDeviceScale();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'mlb-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* GLOBAL FONT SIZE - Responsive */
        .tabulator, .tabulator *, .tabulator-table, .tabulator-table *,
        .tabulator-header, .tabulator-header *, .tabulator-row, .tabulator-row *,
        .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }
        
        .table-container {
            width: 100%; max-width: 100%; margin: 0 auto; position: relative;
            background: #e8e8e8; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px; overflow: visible;
        }
        .table-wrapper { background: #e8e8e8; }
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: ${baseFontSize}px !important; line-height: 1.3 !important;
            background-color: #e8e8e8; border: 1px solid #e0e0e0;
            border-radius: 6px; overflow: visible !important;
        }
        .tabulator .tabulator-tableholder { background-color: #e8e8e8; }
        
        .tabulator-header {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            color: white; font-weight: 600;
        }
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        .tabulator-col-title {
            white-space: normal !important; word-break: break-word !important;
            overflow-wrap: break-word !important; text-align: center !important;
            display: flex !important; align-items: center !important;
            justify-content: center !important; padding: 4px 2px !important;
        }
        .tabulator-col-group-cols { border-top: 1px solid rgba(255,255,255,0.3); }
        
        .tabulator-row { border-bottom: 1px solid #e8e8e8; min-height: 32px; }
        .tabulator-row:nth-child(even) { background-color: #fafafa; }
        .tabulator-row:hover { background-color: #fef2f2; }
        
        .tabulator-cell {
            padding: 6px 4px; border-right: 1px solid #f0f0f0;
            white-space: nowrap !important; overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* Scrollbar styles - Desktop only */
        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 16px !important; height: 16px !important;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1; border-radius: 8px;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #b91c1c; border-radius: 8px; min-height: 50px;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #991b1b;
            }
            .tabulator .tabulator-tableholder {
                scrollbar-width: auto; scrollbar-color: #b91c1c #f1f1f1;
            }
        }
        
        /* Dropdown filter styles - ABOVE the table */
        .custom-multiselect-dropdown, [id^="dropdown_"] {
            z-index: 2147483647 !important; position: fixed !important;
            background: white !important; border: 1px solid #333 !important;
            border-radius: 4px !important; box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        /* Min/Max filter — stacked, NO spinner-hiding */
        .min-max-filter-container, .tabulator .min-max-filter-container,
        .tabulator-header .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important; flex-direction: column !important;
            flex-wrap: nowrap !important; gap: 2px !important;
            max-width: 45px !important; margin: 0 auto !important;
        }
        .min-max-input, .min-max-filter-container > input {
            width: 100% !important; flex-shrink: 0 !important;
            padding: 2px 3px !important; font-size: 9px !important;
            border: 1px solid #ccc !important; border-radius: 2px !important;
            text-align: center !important; box-sizing: border-box !important;
        }
        .min-max-input:focus {
            outline: none !important; border-color: #b91c1c !important;
            box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
        }
        
        /* Standalone header alignment on mobile/tablet */
        @media screen and (max-width: 1024px) {
            .tabulator-header { display: flex !important; align-items: stretch !important; }
            .tabulator-header > .tabulator-headers > .tabulator-col {
                display: flex !important; flex-direction: column !important; align-items: stretch !important;
            }
            .tabulator-col:not(.tabulator-col-group) > .tabulator-col-content {
                display: flex !important; flex-direction: column !important;
                justify-content: flex-start !important; align-items: center !important;
                height: 100% !important; padding-top: 8px !important;
            }
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important; padding-top: 4px !important;
            }
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
                z-index: 100 !important;
            }
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important; height: 4px !important;
            }
        }
        
        /* Mobile styles */
        @media screen and (max-width: 768px) {
            .tabulator-col, .tabulator-cell { padding: 2px 1px !important; }
            .min-max-input { font-size: 8px !important; padding: 1px 2px !important; }
            .min-max-filter-container { max-width: 35px !important; }
        }
        
        /* Desktop: grey background and scrollbar */
        @media screen and (min-width: 1025px) {
            .tabulator { width: 100% !important; max-width: 100% !important; background-color: #e8e8e8 !important; }
            .table-container { overflow-x: auto !important; background: #e8e8e8 !important; }
            .table-wrapper { background: #e8e8e8 !important; }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important; overflow-y: scroll !important; overflow-x: auto !important;
            }
        }
        
        .tabulator .custom-multiselect-button { font-size: 11px !important; }
        .tabulator .tabulator-placeholder span {
            font-size: 24px !important; color: #999 !important; font-style: italic !important;
        }
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important; padding: 4px 6px !important; font-size: 11px !important;
            border: 1px solid #ccc !important; border-radius: 3px !important; box-sizing: border-box !important;
        }
        
        /* Mobile frozen column support */
        @media screen and (max-width: 1024px) {
            .table-container { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; }
            .table-container .tabulator { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
            .table-container .tabulator .tabulator-tableholder {
                overflow-x: auto !important; -webkit-overflow-scrolling: touch !important;
            }
            .tabulator-row .tabulator-cell.tabulator-frozen { background: inherit !important; position: sticky !important; left: 0 !important; z-index: 10 !important; }
            .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-frozen { background: #fafafa !important; }
            .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-frozen { background: #ffffff !important; }
            .tabulator-row:hover .tabulator-cell.tabulator-frozen { background: #fef2f2 !important; }
            .tabulator-header .tabulator-col.tabulator-frozen { position: sticky !important; left: 0 !important; z-index: 101 !important; }
        }
    `;
    document.head.appendChild(style);
    console.log('MLB full styles injected with grey background, min/max stacking, frozen columns, desktop scrollbar');
}
