// styles/tableStyles.js - COMPLETE RESPONSIVE VERSION
export function injectStyles() {
    // Check if Webflow custom styles are already applied
    if (document.body.classList.contains('bettor-results-tables')) {
        console.log('Webflow custom styles detected, using minimal injection');
        
        // Only inject critical table-specific widths
        var style = document.createElement('style');
        style.setAttribute('data-source', 'github-tables');
        style.textContent = `
            /* GitHub table-specific settings only */
            #matchups-table .tabulator { max-width: 1200px !important; }
            #batter-table .tabulator { max-width: 1860px !important; }
            #batter-table-alt .tabulator { max-width: 1360px !important; }
            #pitcher-table .tabulator { max-width: 1860px !important; }
            #pitcher-table-alt .tabulator { max-width: 1360px !important; }
            #mod-batter-stats-table .tabulator { max-width: 1720px !important; }
            #mod-pitcher-stats-table .tabulator { max-width: 1720px !important; }
            #batter-props-table .tabulator { max-width: 1720px !important; }
            #pitcher-props-table .tabulator { max-width: 1720px !important; }
            #game-props-table .tabulator { max-width: 1720px !important; }
            
            /* Responsive overrides */
            @media screen and (max-width: 1400px) {
                .tabulator { max-width: 100% !important; }
            }
        `;
        document.head.appendChild(style);
        return;
    }

    // Full style injection for non-Webflow environments (development/testing)
    var style = document.createElement('style');
    style.setAttribute('data-source', 'github-tables-full');
    style.textContent = `
        /* ===================================
           RESPONSIVE TABLE SYSTEM
           =================================== */
        
        /* Remove ALL scrollbars globally */
        * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
        }
        
        *::-webkit-scrollbar {
            display: none !important;
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
        }
        
        .tabulator .tabulator-tableHolder {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 80vh !important;
        }
        
        /* Table-specific max widths for desktop */
        @media screen and (min-width: 1401px) {
            #matchups-table { max-width: 1200px !important; }
            #batter-table { max-width: 1860px !important; }
            #batter-table-alt { max-width: 1360px !important; }
            #pitcher-table { max-width: 1860px !important; }
            #pitcher-table-alt { max-width: 1360px !important; }
            #mod-batter-stats-table { max-width: 1720px !important; }
            #mod-pitcher-stats-table { max-width: 1720px !important; }
            #batter-props-table { max-width: 1720px !important; }
            #pitcher-props-table { max-width: 1720px !important; }
            #game-props-table { max-width: 1720px !important; }
        }
        
        /* Standard desktop (1200px - 1400px) */
        @media screen and (min-width: 1200px) and (max-width: 1400px) {
            .tabulator { max-width: 100% !important; }
            .table-container { padding: 15px !important; }
        }
        
        /* Tablet (768px - 1199px) */
        @media screen and (min-width: 768px) and (max-width: 1199px) {
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
                padding: 10px !important;
            }
        }
        
        /* Mobile (< 768px) */
        @media screen and (max-width: 767px) {
            .tabulator {
                font-size: 11px !important;
                max-width: 100% !important;
            }
            
            .tabulator .tabulator-header {
                font-size: 10px !important;
            }
            
            .tabulator .tabulator-cell {
                padding: 3px 4px !important;
            }
            
            /* Scale transform for mobile */
            .table-wrapper,
            .tables-container {
                transform: scale(0.75);
                transform-origin: top left;
                width: 133.33% !important;
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
            }
            
            .tab-button {
                padding: 8px 12px !important;
                font-size: 11px !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
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
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        .subrow-container .tabulator {
            font-size: 11px !important;
            min-width: 600px !important;
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
    `;
    
    document.head.appendChild(style);
    console.log('Responsive table styles injected');
}
