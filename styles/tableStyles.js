// styles/tableStyles.js - Baseball Table Styles
// Ported from NBA version with identical formatting patterns

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
    const existingFix = document.querySelector('style[data-scrollbar-fix="true"]');
    if (existingFix) return;

    const style = document.createElement('style');
    style.setAttribute('data-scrollbar-fix', 'true');
    style.textContent = `
        .tabulator .tabulator-tableholder::-webkit-scrollbar {
            display: block !important;
            width: 12px !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 6px !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 6px !important;
        }
        .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }
        @media screen and (max-width: 1024px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
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

function injectMinimalStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-minimal');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        .tabulator, .tabulator *, .subrow-container, .subrow-container *,
        .tabulator-table, .tabulator-table *, .tabulator-header, .tabulator-header *,
        .tabulator-row, .tabulator-row *, .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }
        
        .table-container { background: #e8e8e8; }
        .table-wrapper { background: #e8e8e8; }
        .tabulator { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #e8e8e8; }
        .tabulator .tabulator-tableholder { background-color: #e8e8e8; }
        
        .table-container { display: block !important; visibility: visible !important; background: #e8e8e8 !important; }
        
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        .tabulator-cell {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        .custom-multiselect-dropdown, [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        @media screen and (min-width: 1025px) {
            .table-container { background: #e8e8e8 !important; }
            .table-wrapper { background: #e8e8e8 !important; }
            .tabulator { background-color: #e8e8e8 !important; }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        @media screen and (max-width: 1024px) {
            .tabulator-header { display: flex !important; align-items: stretch !important; }
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important;
                padding-top: 4px !important;
            }
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
                z-index: 100 !important;
            }
        }
        
        .subrow-container {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
            border-top: 2px solid #b91c1c !important;
        }
        
        .min-max-filter-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            max-width: 45px !important;
            margin: 0 auto !important;
        }
        
        .min-max-input {
            width: 100% !important;
            font-size: 9px !important;
            padding: 2px 3px !important;
        }
        
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
        }
        
        @media screen and (max-width: 768px) {
            .subrow-container { padding: 8px 10px !important; }
            .subrow-container > div { gap: 6px !important; }
            .subrow-container > div > div { padding: 8px !important; min-width: unset !important; }
            .subrow-container h4 { font-size: 11px !important; margin: 0 0 4px 0 !important; }
            .subrow-container div > div > div { font-size: 10px !important; margin-bottom: 2px !important; }
            .subtable-scroll-wrapper { gap: 8px !important; max-height: 350px !important; }
        }
        
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container { padding: 10px 15px !important; }
            .subrow-container > div { gap: 10px !important; }
            .subrow-container > div > div { padding: 10px !important; }
            .subrow-container h4 { font-size: 12px !important; }
            .subrow-container div > div > div { font-size: 11px !important; }
        }
        
        .subrow-container > div[style*="flex"] {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
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
    `;
    document.head.appendChild(style);
    console.log('Baseball minimal styles injected');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const scale = getDeviceScale();
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        .tabulator, .tabulator *, .subrow-container, .subrow-container *,
        .tabulator-table, .tabulator-table *, .tabulator-header, .tabulator-header *,
        .tabulator-row, .tabulator-row *, .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }
        
        .table-container {
            width: 100%; max-width: 100%; margin: 0 auto; position: relative;
            background: #e8e8e8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: visible;
        }
        .table-wrapper { background: #e8e8e8; }
        
        .tabulator {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-size: ${baseFontSize}px !important; line-height: 1.3 !important;
            background-color: #e8e8e8; border: 1px solid #e0e0e0; border-radius: 6px; overflow: visible !important;
        }
        .tabulator .tabulator-tableholder { background-color: #e8e8e8; }
        
        .tabulator-col-title {
            white-space: normal !important; word-break: break-word !important; overflow-wrap: break-word !important;
            text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important;
        }
        
        .tabulator-cell {
            white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
        }
        
        .tabulator-row:hover { background-color: #fef2f2 !important; }
        .tabulator-row.tabulator-row-even { background-color: #fafafa; }
        .tabulator-row.tabulator-row-odd { background-color: #ffffff; }
        
        .custom-multiselect-dropdown, [id^="dropdown_"] {
            z-index: 2147483647 !important; position: fixed !important; background: white !important;
            border: 1px solid #333 !important; border-radius: 4px !important; box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important; padding: 4px 6px !important; font-size: 11px !important;
            border: 1px solid #ccc !important; border-radius: 3px !important; box-sizing: border-box !important;
        }
        
        .min-max-filter-container, .tabulator .min-max-filter-container,
        .tabulator-header-filter .min-max-filter-container {
            display: flex !important; flex-direction: column !important; flex-wrap: nowrap !important;
            gap: 2px !important; max-width: 45px !important; margin: 0 auto !important;
        }
        .min-max-input, .min-max-filter-container > input {
            width: 100% !important; flex-shrink: 0 !important; padding: 2px 3px !important;
            font-size: 9px !important; border: 1px solid #ccc !important; border-radius: 2px !important;
            text-align: center !important; box-sizing: border-box !important;
            -moz-appearance: textfield !important; -webkit-appearance: none !important; appearance: none !important;
        }
        .min-max-input::-webkit-outer-spin-button, .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important; margin: 0 !important;
        }
        .min-max-input:focus {
            outline: none !important; border-color: #b91c1c !important; box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
        }
        
        .subrow-container {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
            border-top: 2px solid #b91c1c !important;
        }
        .expand-icon { cursor: pointer; transition: transform 0.2s ease; }
        
        @media screen and (max-width: 1024px) {
            .tabulator-header { display: flex !important; align-items: stretch !important; }
            .tabulator-col:not(.tabulator-col-group) .tabulator-col-title {
                text-align: center !important; padding-top: 4px !important;
            }
            .tabulator-header .tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important; z-index: 100 !important;
            }
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            }
        }
        
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important; overflow-x: auto !important;
        }
        
        @media screen and (max-width: 768px) {
            .tabulator-col, .tabulator-cell { padding: 2px 1px !important; }
            .min-max-input { font-size: 8px !important; padding: 1px 2px !important; }
            .min-max-filter-container { max-width: 35px !important; }
            .subrow-container { padding: 8px 10px !important; }
            .subrow-container > div { gap: 6px !important; }
            .subrow-container > div > div { padding: 8px !important; min-width: unset !important; }
            .subrow-container h4 { font-size: 11px !important; margin: 0 0 4px 0 !important; }
            .subrow-container div > div > div { font-size: 10px !important; margin-bottom: 2px !important; }
            .subtable-scroll-wrapper { gap: 8px !important; max-height: 350px !important; }
        }
        
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .subrow-container { padding: 10px 15px !important; }
            .subrow-container > div { gap: 10px !important; }
            .subrow-container > div > div { padding: 10px !important; }
            .subrow-container h4 { font-size: 12px !important; }
            .subrow-container div > div > div { font-size: 11px !important; }
            .subtable-scroll-wrapper { gap: 10px !important; }
        }
        
        .subrow-container > div[style*="flex"] {
            flex-wrap: nowrap !important; overflow-x: auto !important;
        }
        
        @media screen and (min-width: 1025px) {
            .tabulator { width: 100% !important; max-width: 100% !important; background-color: #e8e8e8 !important; }
            .table-container { overflow-x: auto !important; background: #e8e8e8 !important; }
            .table-wrapper { background: #e8e8e8 !important; }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important; overflow-y: scroll !important; overflow-x: auto !important;
            }
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
    `;
    document.head.appendChild(style);
    console.log('Baseball full styles injected');
}
