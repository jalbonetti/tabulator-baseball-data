// styles/tableStyles.js - COMPLETE RESPONSIVE STYLING WITH SCROLLBAR REMOVAL
import { CONFIG, isMobile, isTablet, getDeviceScale } from '../shared/config.js';

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
        
        /* Responsive scaling for mobile/tablet */
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
        
        /* Tablet (768px - 1199px) - Scale to 85% */
        @media screen and (min-width: ${CONFIG.BREAKPOINTS.mobile + 1}px) and (max-width: ${CONFIG.BREAKPOINTS.tablet}px) {
            .table-container {
                transform: scale(0.85);
                transform-origin: top center;
                width: 118%; /* 100 / 0.85 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important; /* Keep original size, let scale handle it */
            }
            
            .tab-buttons {
                transform: scale(1) !important; /* Don't scale tab buttons */
            }
        }
        
        /* Mobile (< 768px) - Scale to 75% */
        @media screen and (max-width: ${CONFIG.BREAKPOINTS.mobile}px) {
            .table-container {
                transform: scale(0.75);
                transform-origin: top center;
                width: 133%; /* 100 / 0.75 */
                margin: 0 auto;
            }
            
            .tabulator {
                font-size: 14px !important; /* Keep original size, let scale handle it */
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
        
        /* Tab styling */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
            position: sticky !important;
            top: 0 !important;
            background: white !important;
            padding: 10px 0 !important;
            width: 100% !important;
            max-width: 100% !important;
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
    console.log('Complete responsive table styles injected');
    
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
