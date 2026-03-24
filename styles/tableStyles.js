// styles/tableStyles.js - Baseball Table Styles
// Ported from NBA version with identical formatting patterns
// FIXED:
// - Desktop baseFontSize reduced from 14 to 12 to match NBA (prevents squished headers)
// - Mobile baseFontSize reduced from 11 to 10 to match NBA
// - Scrollbar fix uses high-specificity selectors to counter Webflow's aggressive hiding
// - Custom multi-select button font-size override (global .tabulator * rule was overriding)
// - Placeholder text enlarged to 24px for loading state visibility
// - Red notch above scrollbar fixed via ::after pseudo-element on header

import { isMobile, isTablet, getDeviceScale } from '../shared/config.js';

export function injectStyles() {
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        // CRITICAL: Inject scrollbar fix AFTER minimal styles to counter Webflow's aggressive hiding
        injectScrollbarFix();
        return;
    }
    injectFullStyles();
}

/**
 * CRITICAL FIX: Webflow has a global rule that hides ALL scrollbars:
 *   *::-webkit-scrollbar { display: none !important; width: 0 !important; }
 * 
 * This function injects a high-specificity counter-rule that:
 * 1. Is inserted AFTER the Webflow style element
 * 2. Uses high-specificity selector chains (html body .tabulator ...) to override
 * 3. Explicitly sets display: block + visibility: visible to counter display: none
 * 4. Uses MLB red theme color (#b91c1c) for scrollbar thumb
 */
function injectScrollbarFix() {
    // Check if fix already exists
    if (document.querySelector('style[data-source="scrollbar-fix"]')) {
        return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-source', 'scrollbar-fix');

    style.textContent = `
        /* =====================================================
           SCROLLBAR FIX - Counters Webflow's aggressive hiding
           Webflow uses: *::-webkit-scrollbar { display: none !important }
           We counter with higher specificity + display: block
           ===================================================== */
        
        /* Desktop only - show scrollbar */
        @media screen and (min-width: 1025px) {
            /* High specificity selector chain */
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
            
            /* Scrollbar corner */
            html body .tabulator .tabulator-tableholder::-webkit-scrollbar-corner,
            html body div.tabulator div.tabulator-tableholder::-webkit-scrollbar-corner {
                background: #e8e8e8 !important;
                display: block !important;
                visibility: visible !important;
            }
            
            /* Firefox scrollbar */
            html body .tabulator .tabulator-tableholder,
            html body div.tabulator div.tabulator-tableholder {
                scrollbar-width: thin !important;
                scrollbar-color: #b91c1c #f1f1f1 !important;
            }
        }
        
        /* Mobile/tablet - keep thin scrollbar */
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

    // Insert AFTER the Webflow style element for proper cascade order
    const webflowStyle = document.querySelector('style[data-table-styles="webflow"]');
    if (webflowStyle && webflowStyle.parentNode) {
        webflowStyle.parentNode.insertBefore(style, webflowStyle.nextSibling);
        console.log('Scrollbar fix injected immediately after Webflow styles');
    } else {
        document.head.appendChild(style);
        console.log('Scrollbar fix injected at end of head');
    }
}

function injectMinimalStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    // FIXED: Font sizes now match NBA exactly: 10/11/12
    // Previously was 11/12/14 which made headers squished and filters oversized
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-minimal');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* GLOBAL FONT SIZE - Responsive (matches NBA: 10/11/12) */
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
        
        /* Header styles */
        .tabulator-header {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            color: white;
            font-weight: 600;
            position: relative !important;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        
        /* Header title - center-justified, wrap at word boundaries */
        .tabulator-col-title {
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4px 2px !important;
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
        
        /* Desktop layout */
        @media screen and (min-width: 1025px) {
            .table-container { background: #e8e8e8 !important; }
            .table-wrapper { background: #e8e8e8 !important; }
            .tabulator { background-color: #e8e8e8 !important; }
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
            
            /* FIX: Grey overlay above scrollbar to hide red header gradient bleed.
               The header extends the full width of .tabulator including the 17px scrollbar
               gutter. This pseudo-element covers that area so the red gradient doesn't
               show as a colored notch above the scrollbar track. */
            .tabulator .tabulator-header::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 17px;
                height: 100%;
                background: #e8e8e8;
                z-index: 50;
                pointer-events: none;
            }
        }
        
        /* Mobile/tablet layout */
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
            .tabulator-header .tabulator-col.tabulator-frozen {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            }
        }
        
        .subrow-container {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
            border-top: 2px solid #b91c1c !important;
        }
        
        /* Min/Max filter - stacked vertically */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
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
            -moz-appearance: textfield !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #b91c1c !important;
            box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
        }
        
        .expand-icon {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        /* Base overflow for tableholder */
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
        }
        
        /* Mobile frozen column support */
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
        
        /* FIX: Bankroll input text size */
        .tabulator .bankroll-input {
            font-size: 9px !important;
        }
        .tabulator .bankroll-input-container span {
            font-size: 9px !important;
        }
        
        /* FIX: Custom multi-select button - override global .tabulator * font-size */
        .tabulator .custom-multiselect-button,
        .tabulator-header-filter .custom-multiselect-button {
            font-size: 11px !important;
        }
        
        /* FIX: Placeholder text - large and visible during loading state */
        .tabulator .tabulator-placeholder span {
            font-size: 24px !important;
            color: #999 !important;
            font-style: italic !important;
        }
        
        /* Header text filter input */
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }
        
        /* Mobile subtable compact layout */
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
            .subtable-scroll-wrapper { gap: 10px !important; }
        }
        
        .subrow-container > div[style*="flex"] {
            flex-wrap: nowrap !important; overflow-x: auto !important;
        }
    `;
    document.head.appendChild(style);
    console.log('Baseball minimal styles injected');
}

function injectFullStyles() {
    const mobile = isMobile();
    const tablet = isTablet();
    const scale = getDeviceScale();
    // FIXED: Font sizes now match NBA exactly: 10/11/12
    // Previously was 11/12/14 which made headers squished and filters oversized
    const baseFontSize = mobile ? 10 : tablet ? 11 : 12;
    
    const style = document.createElement('style');
    style.setAttribute('data-source', 'github-baseball-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           BASEBALL TABLE STYLES
           Matches NBA basketball-props patterns:
           - Desktop 12px font (same as NBA)
           - Headers wrap at word boundaries
           - Center-justified via CSS
           - Data cells single-line with ellipsis
           - Desktop vertical scrollbar with Webflow counter
           - Grey overlay above scrollbar (no red notch)
           - 24px placeholder text for loading visibility
           =================================== */
        
        /* GLOBAL FONT SIZE - Responsive (matches NBA: 10/11/12) */
        .tabulator, .tabulator *, .subrow-container, .subrow-container *,
        .tabulator-table, .tabulator-table *, .tabulator-header, .tabulator-header *,
        .tabulator-row, .tabulator-row *, .tabulator-cell, .tabulator-cell * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.3 !important;
        }
        
        /* Base table container */
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
        
        /* Header styles */
        .tabulator-header {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            color: white;
            font-weight: 600;
            position: relative !important;
        }
        
        .tabulator-col {
            background: transparent;
            border-right: 1px solid rgba(255,255,255,0.2);
        }
        
        /* Header title - wrap at word boundaries, CENTER-JUSTIFIED */
        .tabulator-col-title {
            white-space: normal !important; word-break: break-word !important; overflow-wrap: break-word !important;
            text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important;
            padding: 4px 2px !important;
        }
        
        /* Column group headers */
        .tabulator-col-group-cols {
            border-top: 1px solid rgba(255,255,255,0.3);
        }
        
        /* Row styles */
        .tabulator-row {
            border-bottom: 1px solid #e8e8e8;
            min-height: 32px;
        }
        .tabulator-row:nth-child(even) { background-color: #fafafa; }
        .tabulator-row:hover { background-color: #fef2f2 !important; }
        .tabulator-row.row-expanded { background-color: #fef2f2 !important; }
        
        /* Cell styles - SINGLE LINE with ellipsis */
        .tabulator-cell {
            padding: 6px 4px;
            border-right: 1px solid #f0f0f0;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        /* =====================================================
           SCROLLBAR STYLES - Desktop only
           ===================================================== */
        @media screen and (min-width: 1025px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 16px !important;
                height: 16px !important;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 8px;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb {
                background: #b91c1c;
                border-radius: 8px;
                min-height: 50px;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-thumb:hover {
                background: #991b1b;
            }
            .tabulator .tabulator-tableholder::-webkit-scrollbar-corner {
                background: #e8e8e8;
            }
            /* Firefox */
            .tabulator .tabulator-tableholder {
                scrollbar-width: auto;
                scrollbar-color: #b91c1c #f1f1f1;
            }
            
            /* FIX: Grey overlay above scrollbar to hide red header gradient bleed.
               The header extends the full width of .tabulator including the 17px scrollbar
               gutter. This pseudo-element covers that area so the red gradient doesn't
               show as a colored notch above the scrollbar track. */
            .tabulator .tabulator-header::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 17px;
                height: 100%;
                background: #e8e8e8;
                z-index: 50;
                pointer-events: none;
            }
        }
        
        /* Mobile/tablet: thin scrollbar */
        @media screen and (max-width: 1024px) {
            .tabulator .tabulator-tableholder::-webkit-scrollbar {
                width: 4px !important;
                height: 4px !important;
            }
        }
        
        /* =====================================================
           DROPDOWN FILTER STYLES - opens ABOVE the table
           ===================================================== */
        .custom-multiselect-dropdown,
        [id^="dropdown_"] {
            z-index: 2147483647 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #333 !important;
            border-radius: 4px !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3) !important;
        }
        
        /* FIX: Custom multi-select button - override global .tabulator * font-size */
        .custom-multiselect-button,
        .tabulator .custom-multiselect-button,
        .tabulator-header-filter .custom-multiselect-button {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
            font-size: 11px !important;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-radius: 3px;
            color: #333;
        }
        
        /* =====================================================
           MIN/MAX FILTER - stacked vertically
           ===================================================== */
        .min-max-filter-container,
        .tabulator .min-max-filter-container,
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
            font-size: 9px !important;
            padding: 2px 3px !important;
            border: 1px solid #ccc !important;
            border-radius: 2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            -moz-appearance: textfield !important;
            -webkit-appearance: none !important;
            appearance: none !important;
        }
        
        .min-max-input::-webkit-outer-spin-button,
        .min-max-input::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
        }
        
        .min-max-input:focus {
            outline: none !important;
            border-color: #b91c1c !important;
            box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
        }
        
        /* =====================================================
           EXPANDABLE ROW / SUBTABLE Styles
           ===================================================== */
        .subrow-container {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
            border-top: 2px solid #b91c1c !important;
        }
        
        .expand-icon {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        /* =====================================================
           HEADER FILTER INPUT
           ===================================================== */
        .tabulator-header-filter input[type="search"],
        .tabulator-header-filter input[type="text"] {
            width: 100% !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            box-sizing: border-box !important;
        }
        
        /* FIX: Bankroll input text size */
        .tabulator .bankroll-input {
            font-size: 9px !important;
        }
        .tabulator .bankroll-input-container span {
            font-size: 9px !important;
        }
        
        /* FIX: Placeholder text - large and visible during loading state */
        .tabulator .tabulator-placeholder span {
            font-size: 24px !important;
            color: #999 !important;
            font-style: italic !important;
        }
        
        /* =====================================================
           STANDALONE HEADER VERTICAL ALIGNMENT
           ===================================================== */
        @media screen and (max-width: 1024px) {
            .tabulator-header {
                display: flex !important;
                align-items: stretch !important;
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
        }
        
        /* =====================================================
           MOBILE SUBTABLE FIXES
           ===================================================== */
        @media screen and (max-width: 768px) {
            .tabulator-col,
            .tabulator-cell {
                padding: 2px 1px !important;
            }
            
            .min-max-input {
                font-size: 8px !important;
                padding: 1px 2px !important;
            }
            
            .min-max-filter-container {
                max-width: 35px !important;
            }
            
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
        
        /* Base overflow for tableholder */
        .tabulator .tabulator-tableholder {
            overflow-y: auto !important;
            overflow-x: auto !important;
        }
        
        /* =====================================================
           DESKTOP LAYOUT
           ===================================================== */
        @media screen and (min-width: 1025px) {
            .tabulator {
                width: 100% !important;
                max-width: 100% !important;
                background-color: #e8e8e8 !important;
            }
            
            .table-container {
                overflow-x: auto !important;
                background: #e8e8e8 !important;
            }
            
            .table-wrapper {
                background: #e8e8e8 !important;
            }
            
            .tabulator .tabulator-tableholder {
                background-color: #e8e8e8 !important;
                overflow-y: scroll !important;
                overflow-x: auto !important;
            }
        }
        
        /* =====================================================
           MOBILE FROZEN COLUMN FIX
           ===================================================== */
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
    console.log('Baseball full styles injected');
}
