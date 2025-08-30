// styles/tableStyles.js - COMPLETE FIXED VERSION WITH VERTICAL SCROLLBARS
import { CONFIG, isMobile, isTablet, getDeviceScale } from '../shared/config.js';
import { TAB_STYLES } from '../components/tabManager.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.querySelector('style[data-table-styles="webflow"]')) {
        console.log('Using Webflow custom styles, applying minimal overrides only');
        injectMinimalStyles();
        return;
    }

    // Full style injection for non-Webflow environments
    injectFullStyles();
}

function injectMinimalStyles() {
    // Only inject critical table-specific settings for Webflow
    var style = document.createElement('style');
    style.setAttribute('data-source', 'github-tables-minimal');
    style.textContent = `
        /* GitHub table-specific settings only */
        
        ${TAB_STYLES}
        
        /* CRITICAL FIX 1: Restore alternating row colors using nth-child */
        .tabulator-row:nth-child(even):not(.tabulator-row-moving):not(.tabulator-group) {
            background-color: #f9f9f9 !important;
        }
        
        .tabulator-row:nth-child(odd):not(.tabulator-row-moving):not(.tabulator-group) {
            background-color: white !important;
        }
        
        /* Keep expanded rows/subtables with transparent background */
        .subrow-container {
            background-color: transparent !important;
            padding: 10px 20px !important;
            margin: 0 !important;
        }
        
        /* CRITICAL FIX 2: Force vertical scrollbar to always be visible */
        .tabulator .tabulator-tableHolder {
            overflow-y: scroll !important;  /* Changed from auto to scroll */
            overflow-x: hidden !important;
            max-width: 100% !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: auto !important;  /* Changed from thin to auto */
        }
        
        /* Ensure scrollbar is always visible and prominent */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 14px !important;  /* Wider for better visibility */
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #e0e0e0 !important;  /* Darker track */
            border-radius: 7px !important;
            border: 1px solid #ccc !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 7px !important;
            border: 1px solid #666 !important;
            min-height: 40px !important;  /* Minimum thumb size */
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }
        
        /* Hide horizontal scrollbars specifically */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar:horizontal {
            display: none !important;
            height: 0 !important;
        }
        
        /* CRITICAL FIX 3: Remove grey space around tables */
        .table-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
        }
        
        .tabulator {
            border: none !important;
            background: white !important;
        }
        
        /* Fixed table widths without extra spacing */
        #matchups-table .tabulator { 
            max-width: 1200px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #batter-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #batter-table-alt .tabulator { 
            max-width: 1200px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #pitcher-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #pitcher-table-alt .tabulator { 
            max-width: 1200px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #mod-batter-stats-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #mod-pitcher-stats-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #batter-props-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #pitcher-props-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        #game-props-table .tabulator { 
            max-width: 1400px !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        /* Text alignment fixes */
        .tabulator .tabulator-cell[tabulator-field="Batter Name"],
        .tabulator .tabulator-cell[tabulator-field="Pitcher Name"] {
            text-align: left !important;
        }
        
        /* CRITICAL FIX 4: Subtable font size consistency */
        .subrow-container .tabulator {
            font-size: 12px !important;  /* Increased from 11px */
            line-height: 1.4 !important;
            min-width: auto !important;
            overflow: hidden !important;
            transform: none !important;  /* Remove any scaling */
        }
        
        .subrow-container .tabulator .tabulator-cell {
            padding: 4px 8px !important;
            font-size: 12px !important;
        }
        
        .subrow-container .tabulator .tabulator-header {
            font-size: 12px !important;
            font-weight: 600 !important;
        }
        
        /* Subtable responsive - prevent overflow */
        .subrow-container {
            width: 100% !important;
            max-width: 1120px !important;
            overflow: hidden !important;
            margin: 0 auto !important;
            transition: none !important;
        }
        
        /* Fix for Webflow containers */
        .w-container {
            max-width: 100% !important;
            padding: 0 !important;
            background: transparent !important;
        }
        
        /* Center all headers */
        .tabulator .tabulator-header .tabulator-col-title {
            text-align: center !important;
        }
        
        /* Ensure proper stacking context */
        .tabulator {
            position: relative;
            z-index: 1;
        }
        
        .tabulator .tabulator-header {
            position: relative;
            z-index: 2;
        }
        
        /* Matchups table specific fixes */
        #matchups-table .subrow-container {
            max-width: 1120px !important;
        }
        
        #matchups-table .tabulator-row {
            max-width: 100% !important;
        }
        
        /* Custom multiselect dropdown overflow fix */
        .custom-multiselect-dropdown {
            position: fixed !important;
            z-index: 999999 !important;
            max-height: 300px !important;
            overflow-y: auto !important;
        }
        
        /* IMPROVED Responsive scaling - INCLUDING SUBTABLES */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container,
            .subrow-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.mobile.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.mobile.containerWidth};
            }
            
            /* Ensure subrow containers scale properly */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
                margin-left: 0;
                margin-right: 0;
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container,
            .subrow-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.tablet.scale});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.tablet.containerWidth};
            }
            
            /* Ensure subrow containers scale properly */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
                margin-left: 0;
                margin-right: 0;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('Minimal table styles with FIXED VERTICAL SCROLLBARS and alternating rows injected');
}

function injectFullStyles() {
    var style = document.createElement('style');
    style.setAttribute('data-source', 'github-tables-full');
    style.setAttribute('data-table-styles', 'github');
    style.textContent = `
        /* ===================================
           COMPLETE RESPONSIVE TABLE SYSTEM
           =================================== */
        
        ${TAB_STYLES}
        
        /* FIXED: Force vertical scrollbars to always show */
        .tabulator .tabulator-tableHolder {
            overflow-y: scroll !important;  /* Changed from auto to scroll */
            overflow-x: hidden !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: auto !important;  /* Changed from thin to auto */
        }
        
        /* Show vertical scrollbars with better visibility */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 14px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #e0e0e0 !important;
            border-radius: 7px !important;
            border: 1px solid #ccc !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 7px !important;
            border: 1px solid #666 !important;
            min-height: 40px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }
        
        /* Hide horizontal scrollbars */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar:horizontal {
            display: none !important;
            height: 0 !important;
        }
        
        /* Alternating row colors using nth-child */
        .tabulator-row:nth-child(even):not(.tabulator-row-moving) {
            background-color: #f9f9f9 !important;
        }
        
        .tabulator-row:nth-child(odd):not(.tabulator-row-moving) {
            background-color: white !important;
        }
        
        /* Keep expanded rows/subtables transparent */
        .subrow-container {
            background-color: transparent !important;
            padding: 10px 20px !important;
            margin: 0 !important;
        }
        
        /* Base reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            overflow-x: hidden;
        }
        
        /* Table container styling - no grey padding */
        .table-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0;
            background: transparent;
        }
        
        /* Main Tabulator styling */
        .tabulator {
            font-size: 13px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        /* Header styling */
        .tabulator .tabulator-header {
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            border-bottom: 2px solid #007bff;
            font-weight: 600;
            font-size: 12px;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            background: transparent;
            border-right: 1px solid #dee2e6;
        }
        
        .tabulator .tabulator-header .tabulator-col:last-child {
            border-right: none;
        }
        
        .tabulator .tabulator-header .tabulator-col-content {
            padding: 10px 8px;
        }
        
        .tabulator .tabulator-header .tabulator-col-title {
            white-space: normal;
            text-align: center;
            line-height: 1.2;
        }
        
        /* Cell styling */
        .tabulator .tabulator-cell {
            padding: 8px;
            border-right: 1px solid #e9ecef;
            text-align: center;
        }
        
        .tabulator .tabulator-cell:last-child {
            border-right: none;
        }
        
        /* Row styling with proper alternating colors */
        .tabulator .tabulator-row {
            border-bottom: 1px solid #e9ecef;
            min-height: 40px;
        }
        
        .tabulator .tabulator-row:hover:not(.tabulator-row-moving) {
            background-color: #e7f3ff !important;
        }
        
        /* Selected row */
        .tabulator .tabulator-row.tabulator-selected {
            background-color: #007bff !important;
        }
        
        .tabulator .tabulator-row.tabulator-selected .tabulator-cell {
            color: white;
        }
        
        /* Expanded row indicator */
        .tabulator .tabulator-row.tabulator-row-expanded {
            background-color: #f0f8ff !important;
        }
        
        /* Footer styling */
        .tabulator-footer {
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            padding: 10px;
            font-size: 12px;
        }
        
        /* Loading indicator */
        .tabulator-loading {
            background: rgba(255,255,255,0.9);
        }
        
        .tabulator-loading-message {
            font-size: 14px;
            color: #007bff;
        }
        
        /* Custom header filter (if any) */
        .tabulator-header-filter {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #999;
            padding: 4px;
            font-size: 12px;
        }
        
        /* Sort arrows */
        .tabulator-arrow {
            border-color: #666;
        }
        
        .tabulator-arrow.asc {
            border-bottom-color: #007bff;
        }
        
        .tabulator-arrow.desc {
            border-top-color: #007bff;
        }
        
        /* Custom multi-select styles */
        .custom-multiselect {
            position: relative;
            display: inline-block;
            width: 100%;
        }
        
        .custom-multiselect-header {
            padding: 5px;
            background: white;
            border: 1px solid #007bff;
            cursor: pointer;
            font-size: 11px;
            text-align: center;
            user-select: none;
        }
        
        .custom-multiselect-header:hover {
            background: #f8f9fa;
        }
        
        .custom-multiselect-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: white;
            border: 2px solid #007bff;
            border-top: none;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .custom-multiselect-option {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .custom-multiselect-option:hover {
            background: #f8f9fa;
        }
        
        .custom-multiselect-option.selected {
            background: #007bff;
            color: white;
        }
        
        .custom-multiselect-option.select-all {
            font-weight: bold;
            background: #e9ecef;
            border-bottom: 2px solid #dee2e6;
        }
        
        /* Subtable styling */
        .subrow-container {
            padding: 15px !important;
            background: transparent !important;
            border-top: 2px solid #007bff !important;
        }
        
        .subtable-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .subtable-container > div {
            flex: 1;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
        }
        
        .subtable-container h4 {
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #dee2e6;
            font-size: 13px;
            color: #495057;
        }
        
        /* Fixed subtable text scaling */
        .subrow-container .tabulator {
            font-size: 12px !important;
            transform: none !important;
        }
        
        .subrow-container .tabulator .tabulator-cell {
            font-size: 12px !important;
            padding: 4px 8px !important;
        }
        
        .subrow-container .tabulator .tabulator-header {
            font-size: 12px !important;
        }
        
        /* Responsive design handled by CONFIG settings */
    `;
    
    document.head.appendChild(style);
    console.log('Complete responsive table styles with FIXED VERTICAL SCROLLBARS and alternating rows injected');
    
    // Add dynamic resize handlers
    addResponsiveHandlers();
}

// IMPROVED responsive handlers with immediate response
function addResponsiveHandlers() {
    let resizeTimeout;
    let lastWidth = window.innerWidth;
    
    const applyResponsiveScaling = () => {
        const currentWidth = window.innerWidth;
        const scale = getDeviceScale();
        
        // Apply scaling to all table containers
        document.querySelectorAll('.table-container').forEach(container => {
            container.style.transform = `scale(${scale})`;
            container.style.transformOrigin = 'top left';
            container.style.width = scale < 1 ? `${100 / scale}%` : '100%';
        });
        
        // Also scale subtable containers
        document.querySelectorAll('.subrow-container').forEach(container => {
            const parentScale = parseFloat(container.closest('.table-container')?.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || 1);
            if (parentScale < 1) {
                container.style.fontSize = `${12 * parentScale}px`;  /* Fixed to 12px base */
            }
        });
        
        // Adjust font sizes for better readability
        document.querySelectorAll('.tabulator').forEach(table => {
            const baseSize = isMobile() ? 11 : isTablet() ? 12 : 13;
            table.style.fontSize = `${baseSize}px`;
        });
        
        // Trigger redraw for visible tables
        if (window.tabManager && window.tabManager.currentActiveTab) {
            const activeTable = window.tabManager.tables[window.tabManager.currentActiveTab];
            if (activeTable && activeTable.table) {
                activeTable.table.redraw();
            }
        }
    };
    
    // Resize observer for more reliable detection
    const resizeObserver = new ResizeObserver(entries => {
        const newWidth = window.innerWidth;
        if (Math.abs(newWidth - lastWidth) > 10) {
            lastWidth = newWidth;
            applyResponsiveScaling();
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(applyResponsiveScaling, 100);
        }
    });
    
    // Observe body for size changes
    resizeObserver.observe(document.body);
    
    // Also use traditional resize listener
    window.addEventListener('resize', () => {
        applyResponsiveScaling();
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyResponsiveScaling, 100);
    });
    
    // Apply on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(applyResponsiveScaling, 100);
    });
    
    // Initial application
    applyResponsiveScaling();
    setTimeout(applyResponsiveScaling, 100);
    
    // Make function available globally
    window.applyResponsiveScaling = applyResponsiveScaling;
}

// Export for use by other modules
export { addResponsiveHandlers };
export function updateTableResponsiveness() {
    if (window.applyResponsiveScaling) {
        window.applyResponsiveScaling();
    }
}
