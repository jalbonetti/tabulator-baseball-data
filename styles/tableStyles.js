// styles/tableStyles.js - COMPLETE RESPONSIVE VERSION
import { CONFIG, isMobile, isTablet } from '../config/config.js';

export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.body.classList.contains('bettor-results-tables')) {
        console.log('Webflow custom styles detected, using minimal injection');
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
        #matchups-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.matchups.maxWidth}px !important; 
        }
        #batter-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterClearances.maxWidth}px !important; 
        }
        #batter-table-alt .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterClearancesAlt.maxWidth}px !important; 
        }
        #pitcher-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherClearances.maxWidth}px !important; 
        }
        #pitcher-table-alt .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherClearancesAlt.maxWidth}px !important; 
        }
        #mod-batter-stats-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.modBatterStats.maxWidth}px !important; 
        }
        #mod-pitcher-stats-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.modPitcherStats.maxWidth}px !important; 
        }
        #batter-props-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterProps.maxWidth}px !important; 
        }
        #pitcher-props-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherProps.maxWidth}px !important; 
        }
        #game-props-table .tabulator { 
            max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.gameProps.maxWidth}px !important; 
        }
        
        /* Responsive overrides */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.desktop}px) {
            .tabulator { max-width: 100% !important; }
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
           RESPONSIVE TABLE SYSTEM
           =================================== */
        
        /* Remove ALL scrollbars globally */
        ${CONFIG.FEATURES.REMOVE_SCROLLBARS ? `
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
        }
        ` : ''}
        
        /* Container responsive sizing */
        .table-wrapper {
            width: 100% !important;
            max-width: 100vw !important;
            overflow: hidden !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
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
            width: 100% !important;
            margin: 0 auto !important;
            font-size: 14px !important;
            overflow: hidden !important;
        }
        
        .tabulator .tabulator-tableholder {
            overflow: hidden !important;
            max-height: ${CONFIG.DISPLAY.TABLE_HEIGHT} !important;
        }
        
        /* Prevent horizontal scroll */
        .tabulator .tabulator-table {
            width: 100% !important;
        }
        
        /* Table-specific max widths for desktop */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.desktop}px) {
            #matchups-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.matchups.maxWidth}px !important; 
                width: ${CONFIG.TABLE_DIMENSIONS.desktop.matchups.width}px !important;
            }
            #batter-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterClearances.maxWidth}px !important; 
            }
            #batter-table-alt { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterClearancesAlt.maxWidth}px !important; 
            }
            #pitcher-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherClearances.maxWidth}px !important; 
            }
            #pitcher-table-alt { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherClearancesAlt.maxWidth}px !important; 
            }
            #mod-batter-stats-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.modBatterStats.maxWidth}px !important; 
            }
            #mod-pitcher-stats-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.modPitcherStats.maxWidth}px !important; 
            }
            #batter-props-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.batterProps.maxWidth}px !important; 
            }
            #pitcher-props-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.pitcherProps.maxWidth}px !important; 
            }
            #game-props-table { 
                max-width: ${CONFIG.TABLE_DIMENSIONS.desktop.gameProps.maxWidth}px !important; 
            }
        }
        
        /* Tablet (768px - 1199px) */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .tabulator {
                font-size: 12px !important;
                max-width: 100% !important;
            }
            
            .tabulator .tabulator-header {
                font-size: 11px !important;
            }
            
            .tabulator .tabulator-cell {
                padding: 4px 6px !important;
            }
            
            .table-container {
                padding: 15px !important;
            }
            
            /* Adjust column widths for tablet */
            .tabulator .tabulator-col {
                min-width: auto !important;
            }
        }
        
        /* Mobile (< 768px) - Scale transform approach */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            /* Scale the entire table wrapper */
            .table-wrapper,
            .tables-container {
                transform: scale(${CONFIG.DISPLAY.MOBILE_SCALE});
                transform-origin: top left;
                width: ${CONFIG.TABLE_DIMENSIONS.mobile.widthMultiplier * 100}% !important;
                max-width: ${CONFIG.TABLE_DIMENSIONS.mobile.widthMultiplier * 100}% !important;
            }
            
            .tabulator {
                font-size: 14px !important; /* Keep original size, let scale handle it */
            }
            
            .table-container {
                padding: 10px !important;
            }
            
            /* Mobile tab buttons */
            .tab-buttons {
                display: flex !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                gap: 5px !important;
                padding-bottom: 10px !important;
                transform: scale(1) !important; /* Don't scale tab buttons */
                width: 100% !important;
            }
            
            .tab-button {
                padding: 8px 12px !important;
                font-size: 12px !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
            }
            
            /* Enable pinch-to-zoom on mobile */
            body {
                touch-action: pan-x pan-y pinch-zoom !important;
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
            
            .table-container {
                padding: 30px !important;
            }
        }
        
        /* Tab styling */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
            position: sticky !important;
            top: 0 !important;
            background: white !important;
            padding: 10px 0 !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        .tab-button {
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            font-weight: bold;
            transition: background-color 0.3s;
            white-space: nowrap;
        }
        
        .tab-button:hover {
            background: #e9ecef;
        }
        
        .tab-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
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
        
        /* Subtable responsive */
        .subrow-container {
            width: 100% !important;
            overflow: hidden !important;
        }
        
        .subrow-container .tabulator {
            font-size: 11px !important;
            min-width: auto !important;
        }
        
        /* Loading indicator */
        .loading-indicator {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 9999 !important;
            background: white !important;
            padding: 20px 30px !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
            text-align: center !important;
        }
        
        .loading-indicator .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Prevent text selection on mobile during scroll */
        @media (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .tabulator {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
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
        
        /* Custom scrollbar styling (if scrollbars are enabled) */
        ${!CONFIG.FEATURES.REMOVE_SCROLLBARS ? `
        .tabulator .tabulator-tableHolder::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        
        .tabulator .tabulator-tableHolder::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        ` : ''}
    `;
    
    document.head.appendChild(style);
    console.log('Responsive table styles injected');
    
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
