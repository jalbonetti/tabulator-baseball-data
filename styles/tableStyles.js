// styles/tableStyles.js - WITH RESTORED TAB STYLING
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
        
        /* Responsive scaling for mobile/tablet - EXCLUDING TAB BUTTONS */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.mobile.scale});
                transform-origin: top center;
                width: ${CONFIG.TABLE_DIMENSIONS.mobile.containerWidth};
            }
        }
        
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container {
                transform: scale(${CONFIG.TABLE_DIMENSIONS.tablet.scale});
                transform-origin: top center;
                width: ${CONFIG.TABLE_DIMENSIONS.tablet.containerWidth};
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
        
        /* Container responsive sizing */
        .table-wrapper {
            width: 100% !important;
            max-width: 100vw !important;
            overflow: hidden !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            position: relative !important;
        }
        
        .tables-container {
            width: 100% !important;
            max-width: 100vw !important;
            overflow: hidden !important;
            position: relative !important;
        }
        
        .table-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
        }
        
        /* Active/Inactive table states */
        .table-container.active-table {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .table-container.inactive-table {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
        
        /* Base Tabulator responsive */
        .tabulator {
            margin: 0 auto !important;
            font-size: 14px !important;
            overflow: hidden !important;
            position: relative !important;
        }
        
        .tabulator .tabulator-tableholder {
            overflow: hidden !important;
            max-height: 600px !important;
            position: relative !important;
        }
        
        /* Prevent horizontal scroll */
        .tabulator .tabulator-table {
            width: 100% !important;
            max-width: 100% !important;
        }
        
        /* Fixed table widths for desktop */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.desktop}px) {
            #matchups-table { 
                max-width: 1200px !important;
                width: 1200px !important;
            }
            
            #matchups-table .tabulator {
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
        }
        
        /* Tablet (768px - 1199px) - Scale tables ONLY, not tabs */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container {
                transform: scale(0.85);
                transform-origin: top center;
                width: 118%; /* 100 / 0.85 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important;
            }
        }
        
        /* Mobile (< 768px) - Scale tables ONLY, not tabs */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container {
                transform: scale(0.75);
                transform-origin: top center;
                width: 133%; /* 100 / 0.75 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important;
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
        
        /* Custom multiselect overflow fix */
        .custom-multiselect-dropdown {
            position: fixed !important;
            z-index: 999999 !important;
            max-height: 300px !important;
            overflow-y: auto !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('Complete responsive table styles with restored tab UI injected');
    
    // Add dynamic resize handler
    addResponsiveHandlers();
}

// Add responsive handlers for dynamic resizing
function addResponsiveHandlers() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateTableResponsiveness();
        }, 250);
    });
    
    // Initial check
    updateTableResponsiveness();
}

// Update tables based on current viewport
function updateTableResponsiveness() {
    const width = window.innerWidth;
    const tables = document.querySelectorAll('.tabulator');
    const scale = getDeviceScale();
    
    tables.forEach(table => {
        const container = table.closest('.table-container');
        if (container) {
            if (scale !== 1) {
                container.style.transform = `scale(${scale})`;
                container.style.transformOrigin = 'top center';
                container.style.width = `${100 / scale}%`;
            } else {
                container.style.transform = '';
                container.style.width = '';
            }
        }
        
        // Add appropriate classes
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
    
    // Trigger redraw for visible tables
    if (window.tabManager && window.tabManager.currentActiveTab) {
        const activeTable = window.tabManager.tables[window.tabManager.currentActiveTab];
        if (activeTable && activeTable.table) {
            setTimeout(() => {
                activeTable.table.redraw();
            }, 100);
        }
    }
}

// Export for use by other modules
export { updateTableResponsiveness };
