// styles/tableStyles.js - COMPLETE FIX FOR RESPONSIVE ISSUES
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
        
        /* Remove ALL scrollbars */
        * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
        }
        
        *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        
        /* Fixed table widths */
        #matchups-table .tabulator { 
            max-width: 1200px !important;
            width: 1200px !important;
            overflow: hidden !important;
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
        
        /* Prevent overflow on all table containers */
        .tabulator .tabulator-tableHolder {
            overflow: hidden !important;
            max-width: 100% !important;
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
        
        /* Remove ALL scrollbars globally */
        * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
        }
        
        *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        
        body {
            overflow-x: hidden !important;
            position: relative !important;
        }
        
        /* Enable pinch-to-zoom on mobile */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            body {
                touch-action: pan-x pan-y pinch-zoom !important;
            }
        }
        
        /* Container responsive settings */
        .table-container {
            width: 100% !important;
            max-width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            position: relative !important;
            overflow: visible !important;
        }
        
        .tables-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
        }
        
        /* Fixed width tables with explicit widths per table */
        #matchups-table { 
            max-width: 1200px !important;
            width: 1200px !important;
        }
        
        #batter-table,
        #pitcher-table,
        #mod-batter-stats-table,
        #mod-pitcher-stats-table,
        #batter-props-table,
        #pitcher-props-table,
        #game-props-table {
            max-width: 1400px !important;
            width: 1400px !important;
        }
        
        #batter-table-alt,
        #pitcher-table-alt {
            max-width: 1200px !important;
            width: 1200px !important;
        }
        
        /* IMPROVED Tablet (768px - 1199px) - Scale ALL table elements */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container {
                transform: scale(0.85);
                transform-origin: top left;
                width: 118%; /* 100 / 0.85 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important;
            }
            
            /* Scale subrows within their parent context */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
            }
            
            .subrow-container .tabulator {
                font-size: 12px !important;
            }
        }
        
        /* IMPROVED Mobile (< 768px) - Scale ALL table elements */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container {
                transform: scale(0.75);
                transform-origin: top left;
                width: 133%; /* 100 / 0.75 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important;
            }
            
            /* Scale subrows within their parent context */
            .tabulator-row > .subrow-container {
                transform: scale(1);
                width: 100%;
            }
            
            .subrow-container .tabulator {
                font-size: 11px !important;
            }
        }
        
        /* Ultra-wide screens */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.ultrawide}px) {
            .tabulator {
                font-size: 16px !important;
            }
            
            .tabulator .tabulator-header {
                font-size: 14px !important;
            }
            
            .tabulator .tabulator-cell {
                padding: 8px 10px !important;
            }
        }
        
        /* Prevent column resizing */
        .tabulator-col-resize-handle {
            display: none !important;
        }
        
        /* Alternating row colors */
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even) {
            background-color: #f8f9fa !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd) {
            background-color: #ffffff !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:hover {
            background-color: #e9ecef !important;
        }
        
        /* Center header text */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 40px !important;
        }
        
        /* Center cell content by default */
        .tabulator .tabulator-cell {
            text-align: center !important;
        }
        
        /* Left align name columns */
        .tabulator .tabulator-cell[tabulator-field="Matchup Team"],
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
            transition: none !important; /* Remove transition for instant scaling */
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
        
        /* Background image support for dead space */
        .table-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 100%;
            background-image: var(--table-bg-image, none);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: -1;
            pointer-events: none;
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
    `;
    
    document.head.appendChild(style);
    console.log('Complete responsive table styles with restored tab UI injected');
    
    // Add IMPROVED dynamic resize handler
    addResponsiveHandlers();
}

// IMPROVED responsive handlers with immediate response
function addResponsiveHandlers() {
    let resizeTimeout;
    let lastWidth = window.innerWidth;
    
    // Function to apply responsive scaling
    const applyResponsiveScaling = () => {
        const width = window.innerWidth;
        const scale = getDeviceScale();
        
        // Apply to ALL tables AND subrows
        const tables = document.querySelectorAll('.tabulator');
        const containers = document.querySelectorAll('.table-container');
        const subrows = document.querySelectorAll('.subrow-container');
        
        // Scale main table containers
        containers.forEach(container => {
            if (scale !== 1) {
                container.style.transform = `scale(${scale})`;
                container.style.transformOrigin = 'top left';
                container.style.width = `${100 / scale}%`;
                container.style.marginLeft = 'auto';
                container.style.marginRight = 'auto';
            } else {
                container.style.transform = '';
                container.style.transformOrigin = '';
                container.style.width = '';
                container.style.marginLeft = '';
                container.style.marginRight = '';
            }
        });
        
        // Apply scaling to subrows that are INSIDE expanded rows
        subrows.forEach(subrow => {
            const parentRow = subrow.closest('.tabulator-row');
            if (parentRow && parentRow.classList.contains('row-expanded')) {
                // Subrows inherit parent scaling, no additional transform needed
                subrow.style.width = '100%';
            }
        });
        
        // Add appropriate classes to all tables (including subtables)
        tables.forEach(table => {
            if (width <= CONFIG.BREAKPOINTS.mobile) {
                table.classList.add('mobile-view');
                table.classList.remove('tablet-view', 'desktop-view');
            } else if (width <= CONFIG.BREAKPOINTS.tablet) {
                table.classList.add('tablet-view');
                table.classList.remove('mobile-view', 'desktop-view');
            } else {
                table.classList.add('desktop-view');
                table.classList.remove('mobile-view', 'tablet-view');
            }
        });
        
        // Force tab buttons to maintain their size
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.style.transform = 'none';
            button.style.fontSize = width <= CONFIG.BREAKPOINTS.mobile ? '12px' : '13px';
        });
        
        // Trigger redraw for visible tables
        if (window.tabManager && window.tabManager.currentActiveTab) {
            const activeTable = window.tabManager.tables[window.tabManager.currentActiveTab];
            if (activeTable && activeTable.table) {
                // Immediate redraw without timeout
                activeTable.table.redraw();
                
                // Also redraw any subtables in expanded rows
                const expandedRows = activeTable.table.getRows().filter(row => {
                    const data = row.getData();
                    return data._expanded === true;
                });
                
                expandedRows.forEach(row => {
                    const rowElement = row.getElement();
                    const subtables = rowElement.querySelectorAll('.subrow-container .tabulator');
                    subtables.forEach(subtable => {
                        if (subtable._tabulator) {
                            subtable._tabulator.redraw();
                        }
                    });
                });
            }
        }
    };
    
    // Resize observer for more reliable detection
    const resizeObserver = new ResizeObserver(entries => {
        const newWidth = window.innerWidth;
        if (Math.abs(newWidth - lastWidth) > 10) { // Only trigger if significant change
            lastWidth = newWidth;
            
            // Apply immediately
            applyResponsiveScaling();
            
            // Also apply after a short delay for any delayed renders
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(applyResponsiveScaling, 100);
        }
    });
    
    // Observe body for size changes
    resizeObserver.observe(document.body);
    
    // Also use traditional resize listener as backup
    window.addEventListener('resize', () => {
        // Immediate application
        applyResponsiveScaling();
        
        // Debounced application for final adjustments
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyResponsiveScaling, 100);
    });
    
    // Apply on orientation change (mobile devices)
    window.addEventListener('orientationchange', () => {
        setTimeout(applyResponsiveScaling, 0);
        setTimeout(applyResponsiveScaling, 100);
        setTimeout(applyResponsiveScaling, 300);
    });
    
    // Initial application - run multiple times to ensure everything is scaled
    applyResponsiveScaling();
    setTimeout(applyResponsiveScaling, 0);
    setTimeout(applyResponsiveScaling, 100);
    setTimeout(applyResponsiveScaling, 300);
    
    // Make function available globally for manual triggering
    window.applyResponsiveScaling = applyResponsiveScaling;
}

// Enhanced update function that can be called externally
export function updateTableResponsiveness() {
    if (window.applyResponsiveScaling) {
        window.applyResponsiveScaling();
    }
}

// Export for use by other modules
export { addResponsiveHandlers };
