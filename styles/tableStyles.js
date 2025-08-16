// styles/tableStyles.js - UPDATED WITH ADJUSTED WIDTHS FOR BEST ODDS COLUMNS
export function injectStyles() {
    // EASILY CONFIGURABLE TABLE WIDTHS - Updated for Best Odds columns
    const TABLE_WIDTHS = {
        matchups: '1200px',      
        batterClearances: '1860px',          // Increased to accommodate Best odds columns
        batterClearancesAlt: '1360px',       // Increased to accommodate Best odds columns  
        pitcherClearances: '1860px',         // Increased to accommodate Best odds columns
        pitcherClearancesAlt: '1360px',      // Increased to accommodate Best odds columns
        batterStats: '1720px',          
        pitcherStats: '1720px',         
        batterProps: '1720px',          
        pitcherProps: '1720px',         
        gameProps: '1720px'             
    };

    var style = document.createElement('style');
    style.textContent = `
        /* Apply updated widths to batter clearances tables */
        #batter-table {
            width: ${TABLE_WIDTHS.batterClearances} !important;
            max-width: ${TABLE_WIDTHS.batterClearances} !important;
        }
        
        #batter-table-alt {
            width: ${TABLE_WIDTHS.batterClearancesAlt} !important;
            max-width: ${TABLE_WIDTHS.batterClearancesAlt} !important;
        }
        
        /* Apply updated widths to pitcher clearances tables */
        #pitcher-table {
            width: ${TABLE_WIDTHS.pitcherClearances} !important;
            max-width: ${TABLE_WIDTHS.pitcherClearances} !important;
        }
        
        #pitcher-table-alt {
            width: ${TABLE_WIDTHS.pitcherClearancesAlt} !important;
            max-width: ${TABLE_WIDTHS.pitcherClearancesAlt} !important;
        }
        
        /* Update container widths for clearance tables */
        #table1-container {
            width: ${TABLE_WIDTHS.batterClearances} !important;
            max-width: ${TABLE_WIDTHS.batterClearances} !important;
        }
        
        #table2-container {
            width: ${TABLE_WIDTHS.batterClearancesAlt} !important;
            max-width: ${TABLE_WIDTHS.batterClearancesAlt} !important;
        }
        
        #table3-container {
            width: ${TABLE_WIDTHS.pitcherClearances} !important;
            max-width: ${TABLE_WIDTHS.pitcherClearances} !important;
        }
        
        #table4-container {
            width: ${TABLE_WIDTHS.pitcherClearancesAlt} !important;
            max-width: ${TABLE_WIDTHS.pitcherClearancesAlt} !important;
        }

        /* Rest of styles remain the same... */
        
        /* CRITICAL: Prevent horizontal scroll on matchups table */
        #matchups-table {
            width: ${TABLE_WIDTHS.matchups} !important;
            max-width: ${TABLE_WIDTHS.matchups} !important;
            overflow: hidden !important;
            margin: 0 !important;
            background: white !important;
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            box-sizing: border-box !important;
        }
        
        /* Fix Tabulator container overflow */
        #matchups-table .tabulator {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
        }
        
        /* Fix table holder to prevent horizontal scroll */
        #matchups-table .tabulator-tableHolder {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* Fix table to prevent expansion beyond container */
        #matchups-table .tabulator-table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            box-sizing: border-box !important;
        }
        
        /* Ensure rows don't exceed table width */
        #matchups-table .tabulator-row {
            max-width: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
        }
        
        /* Fix subtable containers to prevent overflow */
        #matchups-table .subrow-container {
            position: relative !important;
            z-index: 1 !important;
            overflow: hidden !important;
            margin: 10px 0 !important;
            padding: 15px !important;
            max-width: calc(100% - 30px) !important;
            width: calc(100% - 30px) !important;
            background: #f8f9fa !important;
            box-shadow: inset 0 0 4px rgba(0,0,0,0.1) !important;
            box-sizing: border-box !important;
        }
        
        /* Ensure subtables don't cause overflow */
        #matchups-table .subrow-container .tabulator {
            overflow: hidden !important;
            max-width: 100% !important;
            margin: 0 !important;
            width: auto !important;
            display: block !important;
            box-sizing: border-box !important;
        }
        
        /* Fix subtable table holders */
        #matchups-table .subrow-container .tabulator .tabulator-tableHolder {
            overflow: hidden !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* Ensure subtable tables fit properly */
        #matchups-table .subrow-container .tabulator .tabulator-table {
            table-layout: auto !important;
            width: auto !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* Fix column headers to prevent overflow */
        #matchups-table .tabulator-header {
            overflow: hidden !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
        }
        
        #matchups-table .tabulator-headers {
            overflow: hidden !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* Ensure cells respect boundaries */
        #matchups-table .tabulator-cell {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
        }
        
        /* Fix for expanded rows */
        #matchups-table .tabulator-row.row-expanded {
            height: auto !important;
            min-height: auto !important;
            overflow: hidden !important;
            max-width: 100% !important;
        }
        
        /* Remove any default margins that might cause issues */
        #matchups-table * {
            box-sizing: border-box !important;
        }
        
        /* Table wrapper - LEFT JUSTIFIED with proper width handling */
        .table-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            width: 100% !important;
            margin: 0 !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        /* Table container specific for matchups */
        #table0-container {
            width: ${TABLE_WIDTHS.matchups} !important;
            max-width: ${TABLE_WIDTHS.matchups} !important;
            overflow: hidden !important;
            padding: 20px !important;
            position: relative !important;
            background: transparent !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
        }
        
        /* Tables container */
        .tables-container {
            width: fit-content !important;
            max-width: 100% !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            overflow-x: visible !important;
        }
        
        /* Active table visibility */
        .table-container.active-table {
            display: block !important;
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            overflow: hidden !important;
        }
        
        /* Inactive table visibility */
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
        
        /* Fixed height for matchups table */
        #matchups-table {
            height: 600px !important;
            min-height: 200px !important;
            display: block !important;
            visibility: visible !important;
            overflow: hidden !important;
            position: relative !important;
            contain: layout;
        }
        
        /* Sticky header for matchups table */
        #matchups-table .tabulator-header {
            position: sticky !important;
            top: 0 !important;
            z-index: 100 !important;
            background: white !important;
            border-bottom: 2px solid #ddd !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            overflow: hidden !important;
        }
        
        /* Table holder with controlled scroll */
        #matchups-table .tabulator-tableHolder {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            max-height: calc(600px - 50px) !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        /* Disable column resizing completely */
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
        
        /* Tab styling */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
            position: sticky !important;
            top: 0 !important;
            background: transparent !important;
            padding: 10px 0 !important;
            width: fit-content !important;
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
        
        /* Alternating row colors */
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even) {
            background-color: #f8f9fa !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd) {
            background-color: #ffffff !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even):hover {
            background-color: #e9ecef !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd):hover {
            background-color: #f8f9fa !important;
        }
        
        /* Center header text */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 50px !important;
        }
        
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-col-title {
            text-align: center !important;
            line-height: 1.2 !important;
        }
        
        /* Center cell content */
        .tabulator .tabulator-cell {
            text-align: center !important;
        }
        
        /* Left align name/team columns */
        .tabulator .tabulator-cell[tabulator-field="Matchup Team"],
        .tabulator .tabulator-cell[tabulator-field="Batter Name"],
        .tabulator .tabulator-cell[tabulator-field="Pitcher Name"] {
            text-align: left !important;
        }
    `;
    document.head.appendChild(style);
}
