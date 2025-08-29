// styles/tableStyles.js - FIXED WITH VERTICAL SCROLLBARS
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
        
        /* FIXED: Show vertical scrollbars, hide horizontal */
        .tabulator .tabulator-tableHolder {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            max-width: 100% !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: thin !important;
        }
        
        /* Show vertical scrollbars */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 12px !important;
            display: block !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 6px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 6px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }
        
        /* Hide horizontal scrollbars specifically */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar:horizontal {
            display: none !important;
            height: 0 !important;
        }
        
        /* Alternating row colors */
        .tabulator-row.tabulator-row-even {
            background-color: #f9f9f9 !important;
        }
        
        .tabulator-row.tabulator-row-odd {
            background-color: white !important;
        }
        
        /* Keep expanded rows/subtables white */
        .subrow-container {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        
        /* Fixed table widths */
        #matchups-table .tabulator { 
            max-width: 1200px !important;
            width: 1200px !important;
        }
        
        #batter-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #batter-table-alt .tabulator { 
            max-width: 1200px !important;
            width: 1200px !important;
        }
        
        #pitcher-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #pitcher-table-alt .tabulator { 
            max-width: 1200px !important;
            width: 1200px !important;
        }
        
        #mod-batter-stats-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #mod-pitcher-stats-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #batter-props-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #pitcher-props-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #game-props-table .tabulator { 
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        /* Text alignment fixes */
        .tabulator .tabulator-cell[tabulator-field="Batter Name"],
        .tabulator .tabulator-cell[tabulator-field="Pitcher Name"] {
            text-align: left !important;
        }
        
        /* Subtable responsive - prevent overflow */
        .subrow-container {
            width: 100% !important;
            max-width: 1120px !important;
            overflow: hidden !important;
            margin: 0 auto !important;
            transition: none !important;
        }
        
        .subrow-container .tabulator {
            font-size: 11px !important;
            min-width: auto !important;
            overflow: hidden !important;
        }
        
        /* Fix for Webflow containers */
        .w-container {
            max-width: 100% !important;
            overflow: hidden !important;
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
    console.log('Minimal table styles with VERTICAL SCROLLBARS injected');
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
        
        /* FIXED: Show vertical scrollbars, hide horizontal */
        .tabulator .tabulator-tableHolder {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -ms-overflow-style: auto !important;
            scrollbar-width: thin !important;
        }
        
        /* Show vertical scrollbars */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 12px !important;
            display: block !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 6px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 6px !important;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }
        
        /* Hide horizontal scrollbars */
        .tabulator .tabulator-tableHolder::-webkit-scrollbar:horizontal {
            display: none !important;
            height: 0 !important;
        }
        
        /* Alternating row colors */
        .tabulator-row.tabulator-row-even {
            background-color: #f9f9f9 !important;
        }
        
        .tabulator-row.tabulator-row-odd {
            background-color: white !important;
        }
        
        /* Keep expanded rows/subtables white */
        .subrow-container {
            background-color: white !important;
            padding: 0 !important;
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
        
        /* Table container styling */
        .table-container {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        /* Tabulator overrides */
        .tabulator {
            font-size: 12px;
            border: none !important;
            background: transparent;
        }
        
        .tabulator .tabulator-header {
            background: #f8f9fa !important;
            border-bottom: 2px solid #dee2e6 !important;
            font-weight: 600;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            background: transparent !important;
            border-right: 1px solid #dee2e6 !important;
        }
        
        .tabulator .tabulator-header .tabulator-col:last-child {
            border-right: none !important;
        }
        
        .tabulator .tabulator-header .tabulator-col-title {
            padding: 8px !important;
            font-size: 11px !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tabulator .tabulator-cell {
            padding: 6px 8px !important;
            border-right: 1px solid #e9ecef !important;
        }
        
        .tabulator .tabulator-cell:last-child {
            border-right: none !important;
        }
        
        .tabulator-row {
            border-bottom: 1px solid #e9ecef !important;
        }
        
        .tabulator-row:hover {
            background-color: #f0f8ff !important;
        }
        
        /* Custom multiselect styling */
        .custom-multiselect {
            position: relative;
            width: 100%;
        }
        
        .custom-multiselect-button {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
            font-size: 11px;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .custom-multiselect-button:hover {
            background: #f8f9fa;
            border-color: #007bff;
        }
        
        .custom-multiselect-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 250px;
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
            background: #f8f9fa !important;
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
        
        /* Responsive design handled by CONFIG settings */
    `;
    
    document.head.appendChild(style);
    console.log('Complete responsive table styles with VERTICAL SCROLLBARS injected');
    
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
                container.style.fontSize = `${11 * parentScale}px`;
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
