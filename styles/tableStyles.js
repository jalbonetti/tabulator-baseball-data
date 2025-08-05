// styles/tableStyles.js - FIXED VERSION WITH PROPER WIDTH HANDLING
export function injectStyles() {
    // EASILY CONFIGURABLE TABLE WIDTHS - Adjust these values as needed
    const TABLE_WIDTHS = {
        matchups: '1200px',
        batterClearances: '1200px',     // Updated to match your header width
        batterClearancesAlt: '1200px',  
        pitcherClearances: '1200px',    
        pitcherClearancesAlt: '1200px', 
        batterStats: '1900px',          
        pitcherStats: '1900px',         
        batterProps: '1900px',          
        pitcherProps: '1900px',         
        gameProps: '1900px'             
    };

    var style = document.createElement('style');
    style.textContent = `
        /* Mobile viewport optimization */
        @viewport {
            width: device-width;
            zoom: 1.0;
        }
        
        /* Prevent iOS zoom on input focus */
        input, select, textarea {
            font-size: 16px !important;
        }
        
        /* CRITICAL FIX: Disable column resizing completely */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-resize-handle,
        .tabulator-col-resize-handle,
        .tabulator-header .tabulator-col-resize-handle,
        div.tabulator-col-resize-handle {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            right: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
            position: absolute !important;
            z-index: -1 !important;
        }
        
        /* Prevent any column resizing behavior */
        .tabulator .tabulator-header .tabulator-col,
        .tabulator-col,
        .tabulator-header-contents {
            resize: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
        }
        
        /* Table wrapper - LEFT JUSTIFIED with proper width handling */
        .table-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important; /* Left align */
            width: 100% !important;
            margin: 0 !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        /* Tab styling - make tabs fit content width */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
            position: sticky !important;
            top: 0 !important;
            background: transparent !important; /* Changed from white */
            padding: 10px 0 !important;
            width: fit-content !important; /* Only as wide as needed */
            max-width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 10px;
            flex-wrap: nowrap;
            min-width: fit-content;
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
            flex-shrink: 0;
        }
        
        .tab-button:hover {
            background: #e9ecef;
        }
        
        .tab-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        /* Table container styling - FIT CONTENT WIDTH */
        .tables-container {
            width: fit-content !important; /* Changed from 100% */
            max-width: 100% !important; /* Prevent overflow */
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            overflow-x: visible !important;
        }
        
        /* All table containers - fit content approach */
        .table-container {
            width: fit-content !important; /* Changed from 100% */
            background-image: url('https://cdn.prod.website-files.com/6853385d00d0191723429bab/68535f3f476035eec0c40452_unnamed%20(1).jpg');
            background-repeat: repeat;
            background-position: center center;
            background-size: auto;
            background-attachment: fixed;
            padding: 20px !important; /* Added padding for visual space */
            position: relative !important;
            overflow-x: visible !important; /* Changed from auto */
            overflow-y: visible !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important; /* Add shadow for definition */
            border-radius: 8px !important; /* Rounded corners */
        }
        
        /* Ensure proper row height handling */
        .tabulator-row {
            overflow: visible !important;
            height: auto !important;
            min-height: 31px !important;
            position: relative !important;
        }

        .tabulator-row:has(.subrow-container),
        .tabulator-row.row-expanded {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
        }

        .tabulator-table {
            overflow: visible !important;
        }

        .tabulator-row-holder {
            overflow: visible !important;
            min-height: 0 !important;
        }

        /* FIXED SUBTABLE CONTAINER STYLING */
        .subrow-container {
            position: relative !important;
            z-index: 1 !important;
            overflow: hidden !important; /* Changed from visible to prevent gaps */
            margin: 10px -10px !important; /* Negative margin to extend to edges */
            min-height: 0 !important;
            max-height: none !important;
            width: calc(100% + 20px) !important; /* Compensate for negative margins */
            display: block !important;
            background: #f8f9fa !important;
            padding: 15px !important; /* Increased padding */
            box-shadow: inset 0 0 4px rgba(0,0,0,0.1) !important; /* Inner shadow */
        }
        
        /* Ensure subtables fill their container properly */
        .subrow-container .tabulator {
            overflow: hidden !important; /* Changed from visible */
            height: auto !important;
            max-height: none !important;
            margin: 0 !important; /* Remove margins */
            width: 100% !important;
            display: block !important;
            min-width: 100% !important;
            box-sizing: border-box !important; /* Include padding in width */
        }
        
        /* Fix subtable table holders */
        .subrow-container .tabulator .tabulator-tableHolder {
            overflow: hidden !important; /* Prevent scrollbars */
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
        }

        /* Ensure cells don't block clicks */
        .tabulator-cell {
            position: relative !important;
            z-index: auto !important;
        }
        
        /* Table-specific widths with proper constraints */
        #matchups-table {
            width: ${TABLE_WIDTHS.matchups} !important;
            max-width: 100% !important; /* Prevent overflow on small screens */
            margin: 0 !important;
            background: white !important;
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
        }
        
        #batter-table { 
            width: ${TABLE_WIDTHS.batterClearances} !important;
            max-width: 100% !important;
        }
        #batter-table-alt { 
            width: ${TABLE_WIDTHS.batterClearancesAlt} !important;
            max-width: 100% !important;
        }
        #pitcher-table { 
            width: ${TABLE_WIDTHS.pitcherClearances} !important;
            max-width: 100% !important;
        }
        #pitcher-table-alt { 
            width: ${TABLE_WIDTHS.pitcherClearancesAlt} !important;
            max-width: 100% !important;
        }
        #mod-batter-stats-table { 
            width: ${TABLE_WIDTHS.batterStats} !important;
            max-width: 100% !important;
        }
        #mod-pitcher-stats-table { 
            width: ${TABLE_WIDTHS.pitcherStats} !important;
            max-width: 100% !important;
        }
        #batter-props-table { 
            width: ${TABLE_WIDTHS.batterProps} !important;
            max-width: 100% !important;
        }
        #pitcher-props-table { 
            width: ${TABLE_WIDTHS.pitcherProps} !important;
            max-width: 100% !important;
        }
        #game-props-table { 
            width: ${TABLE_WIDTHS.gameProps} !important;
            max-width: 100% !important;
        }
        
        #batter-table, #batter-table-alt, #pitcher-table, #pitcher-table-alt,
        #mod-batter-stats-table, #mod-pitcher-stats-table,
        #batter-props-table, #pitcher-props-table, #game-props-table {
            margin: 0 !important;
            background: white !important;
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
        }
        
        /* Override Tabulator's default behavior */
        .tabulator {
            width: 100% !important; /* Fill parent container */
            max-width: 100% !important;
            overflow: visible !important; /* Allow content to determine height */
        }
        
        /* Fix active/inactive table visibility */
        .table-container.active-table {
            display: block !important;
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
        }
        
        .table-container.inactive-table {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }

        /* Fixed height for all tables */
        #matchups-table,
        #batter-table,
        #batter-table-alt,
        #pitcher-table,
        #pitcher-table-alt,
        #mod-batter-stats-table,
        #mod-pitcher-stats-table,
        #batter-props-table,
        #pitcher-props-table,
        #game-props-table {
            height: 600px !important;
            min-height: 200px !important;
            display: block !important;
            visibility: visible !important;
            overflow: hidden !important;
            position: relative !important;
            contain: layout;
        }

        /* Sticky header for ALL main tables */
        #matchups-table .tabulator-header,
        #batter-table .tabulator-header,
        #batter-table-alt .tabulator-header,
        #pitcher-table .tabulator-header,
        #pitcher-table-alt .tabulator-header,
        #mod-batter-stats-table .tabulator-header,
        #mod-pitcher-stats-table .tabulator-header,
        #batter-props-table .tabulator-header,
        #pitcher-props-table .tabulator-header,
        #game-props-table .tabulator-header {
            position: sticky !important;
            top: 0 !important;
            z-index: 100 !important;
            background: white !important;
            border-bottom: 2px solid #ddd !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }

        /* Table holder with scroll */
        #matchups-table .tabulator-tableHolder,
        #batter-table .tabulator-tableHolder,
        #batter-table-alt .tabulator-tableHolder,
        #pitcher-table .tabulator-tableHolder,
        #pitcher-table-alt .tabulator-tableHolder,
        #mod-batter-stats-table .tabulator-tableHolder,
        #mod-pitcher-stats-table .tabulator-tableHolder,
        #batter-props-table .tabulator-tableHolder,
        #pitcher-props-table .tabulator-tableHolder,
        #game-props-table .tabulator-tableHolder {
            overflow-y: auto !important;
            overflow-x: hidden !important; /* Prevent horizontal scroll in table holder */
            max-height: calc(600px - 50px) !important;
            -webkit-overflow-scrolling: touch !important;
        }

        /* Ensure .tabulator doesn't constrain width */
        .tabulator {
            min-width: 100% !important;
            overflow: hidden !important;
            display: block !important;
        }

        /* Ensure proper table display */
        .tabulator-table {
            display: table !important;
            width: 100% !important; /* Fill container */
            min-width: 100% !important;
            table-layout: fixed !important; /* Fixed layout for predictable widths */
        }

        /* Force table rows to be visible */
        .tabulator-row {
            display: table-row !important;
            visibility: visible !important;
        }
        
        /* Hide placeholder when data is loaded */
        .tabulator-loaded .tabulator-placeholder {
            display: none !important;
        }
        
        /* Critical: Subtable specific width fixes */
        .subrow-container .tabulator-table {
            table-layout: fixed !important; /* Force fixed layout */
            width: 100% !important;
            min-width: 100% !important;
        }
        
        /* Ensure subtable cells respect their defined widths */
        .subrow-container .tabulator-cell {
            box-sizing: border-box !important;
            padding: 4px 8px !important; /* Consistent padding */
        }
        
        /* Remove any default margins on subtables that might cause gaps */
        .subrow-container > div {
            margin: 0 !important;
        }
        
        /* Fix for subtable headers */
        .subrow-container .tabulator-header {
            width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* The rest of your styles remain unchanged... */
        
        /* CRITICAL: Header overflow for dropdowns */
        .tabulator .tabulator-header {
            overflow: visible !important;
            position: relative !important;
            z-index: 10 !important;
        }
        
        /* ... rest of existing styles ... */
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
            .table-container {
                padding: 10px !important;
                border-radius: 0 !important; /* Remove rounded corners on mobile */
            }
            
            .tabs-container {
                width: 100% !important; /* Full width on mobile */
            }
            
            /* Allow horizontal scroll on mobile */
            .table-wrapper {
                overflow-x: auto !important;
            }
        }
    `;
    document.head.appendChild(style);
}
