// styles/tableStyles.js - UPDATED VERSION WITH PROPS TABLE STYLING
export function injectStyles() {
    var style = document.createElement('style');
    style.textContent = `
        /* Table centering */
        .table-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        /* Tab styling */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
            position: sticky !important;
            top: 0 !important;
            background: white !important;
            padding: 10px 0 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 10px;
            flex-wrap: wrap;  /* Allow wrapping on smaller screens */
        }
        
        .tab-button {
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .tab-button:hover {
            background: #e9ecef;
        }
        
        .tab-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        /* Table container styling - FIXED FOR MATCHUPS AND ALL TABLES */
        .tables-container {
            width: 100% !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;  /* Remove gaps between containers */
        }
        
        .table-container {
            width: 100% !important;
        }
        
        .table-container.active-table {
            display: block !important;
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            overflow: visible !important;
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
        
        #batter-table, #batter-table-alt, #matchups-table,
        #pitcher-table, #pitcher-table-alt, #mod-batter-stats-table, #mod-pitcher-stats-table,
        #batter-props-table, #pitcher-props-table, #game-props-table {
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        /* Specific fixes for all table positioning */
        #table0-container, #table1-container, #table2-container, #table3-container, 
        #table4-container, #table5-container, #table6-container, #table7-container, 
        #table8-container, #table9-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            overflow: visible !important;
        }

        #table0-container.inactive-table, #table1-container.inactive-table, 
        #table2-container.inactive-table, #table3-container.inactive-table,
        #table4-container.inactive-table, #table5-container.inactive-table,
        #table6-container.inactive-table, #table7-container.inactive-table,
        #table8-container.inactive-table, #table9-container.inactive-table {
            display: none !important;
            max-height: 0 !important;
        }

        #table0-container.active-table, #table1-container.active-table,
        #table2-container.active-table, #table3-container.active-table,
        #table4-container.active-table, #table5-container.active-table,
        #table6-container.active-table, #table7-container.active-table,
        #table8-container.active-table, #table9-container.active-table {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* ENHANCED STICKY HEADERS FOR ALL MAIN TABLES INCLUDING PROPS */
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
            width: 100% !important;
            height: 600px !important;  /* Fixed height for sticky headers */
            min-height: 200px !important;
            display: block !important;
            visibility: visible !important;
            overflow: hidden !important;
            position: relative !important;
        }

        /* Sticky header for ALL main tables including props */
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
            overflow-x: hidden !important;
            max-height: calc(600px - 50px) !important; /* Account for header height */
        }

        /* Ensure proper table display */
        .tabulator-table {
            display: table !important;
            width: 100% !important;
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
        
        /* Disable column resizing */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-resize-handle {
            display: none !important;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            resize: none !important;
        }
        
        /* Disable row height resizing */
        .tabulator .tabulator-row .tabulator-cell {
            resize: none !important;
        }
        
        /* CRITICAL: Header overflow for dropdowns */
        .tabulator .tabulator-header {
            overflow: visible !important;
            position: relative !important;
            z-index: 10 !important;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            overflow: visible !important;
            position: relative !important;
            z-index: 11 !important;
        }
        
        .tabulator .tabulator-header .tabulator-col .tabulator-header-filter {
            overflow: visible !important;
            position: relative !important;
            z-index: 12 !important;
        }
        
        /* Table body MUST have lower z-index */
        .tabulator .tabulator-tableHolder {
            position: relative !important;
            z-index: 1 !important;
        }
        
        /* Make sure rows don't overflow and cover dropdowns */
        .tabulator .tabulator-table {
            position: relative !important;
            z-index: 1 !important;
        }
        
        /* Custom multiselect styling with high z-index */
        .custom-multiselect {
            position: relative !important;
            width: 100% !important;
            z-index: 13 !important;
        }
        
        .custom-multiselect-button {
            width: 100% !important;
            padding: 4px 8px !important;
            border: 1px solid #ccc !important;
            background: white !important;
            cursor: pointer !important;
            font-size: 11px !important;
            user-select: none !important;
            pointer-events: auto !important;
            position: relative !important;
            z-index: 14 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        .custom-multiselect-button:hover {
            background: #f8f9fa !important;
            border-color: #007bff !important;
        }
        
        /* CRITICAL: Dropdown must be at highest z-index */
        .custom-multiselect-dropdown {
            position: fixed !important;
            min-width: 200px !important;
            background: white !important;
            border: 2px solid #007bff !important;
            max-height: 250px !important;
            overflow-y: auto !important;
            z-index: 9999 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
            border-radius: 4px !important;
        }
        
        .custom-multiselect-dropdown.show {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 9999 !important;
        }
        
        .custom-multiselect-dropdown.hide {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
        
        .custom-multiselect-option {
            padding: 8px 12px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            user-select: none !important;
            pointer-events: auto !important;
            border-bottom: 1px solid #eee !important;
            background: white !important;
        }
        
        .custom-multiselect-option:hover {
            background: #f8f9fa !important;
        }
        
        .custom-multiselect-option.selected {
            background: #007bff !important;
            color: white !important;
        }
        
        .custom-multiselect-option.select-all {
            font-weight: bold !important;
            background: #f8f9fa !important;
            border-bottom: 2px solid #007bff !important;
        }
        
        .custom-multiselect-option.select-all.selected {
            background: #28a745 !important;
            color: white !important;
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
        
        .tabulator .tabulator-cell .tabulator-cell-value {
            text-align: center !important;
            width: 100% !important;
        }
        
        /* Left align name/team columns */
        .tabulator .tabulator-cell[tabulator-field="Batter Name"],
        .tabulator .tabulator-cell[tabulator-field="Pitcher Name"],
        .tabulator .tabulator-cell[tabulator-field="Matchup Team"] {
            text-align: left !important;
        }
        
        .tabulator .tabulator-cell[tabulator-field="Batter Name"] .tabulator-cell-value,
        .tabulator .tabulator-cell[tabulator-field="Pitcher Name"] .tabulator-cell-value,
        .tabulator .tabulator-cell[tabulator-field="Matchup Team"] .tabulator-cell-value {
            text-align: left !important;
        }
        
        /* Subtable styling */
        .subrow-container {
            position: relative !important;
            z-index: 1 !important;
            overflow: visible !important;
            will-change: transform !important; /* Optimize for animations */
        }
        
        .subrow-container .tabulator {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            contain: layout !important; /* Prevent layout thrashing */
        }
        
        .subrow-container .tabulator .tabulator-header .tabulator-col {
            cursor: default !important;
        }
        
        .subrow-container .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            cursor: default !important;
        }
        
        .subrow-container .tabulator .tabulator-header .tabulator-col:hover {
            background: inherit !important;
        }
        
        .subrow-container .tabulator .tabulator-cell {
            text-align: center !important;
        }
        
        .subrow-container .tabulator .tabulator-cell .tabulator-cell-value {
            text-align: center !important;
        }
        
        .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] {
            text-align: left !important;
        }
        
        .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] .tabulator-cell-value {
            text-align: left !important;
        }
        
        /* Remove sticky headers from subtables */
        .subrow-container .tabulator .tabulator-header {
            position: relative !important;
            top: auto !important;
            z-index: 1 !important;
            background: #f8f9fa !important;
            border-bottom: 1px solid #ddd !important;
        }
        
        .subrow-container .tabulator .tabulator-tableHolder {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
        }
        
        /* Prevent nested table rows from causing layout shifts */
        .subrow-container .tabulator .tabulator-table {
            table-layout: fixed !important;
            width: 100% !important;
        }
        
        .subrow-container .tabulator .tabulator-row {
            contain: layout !important;
        }
        
        /* Frozen columns styling */
        .tabulator .tabulator-frozen {
            position: sticky !important;
            left: 0 !important;
            z-index: 10 !important;
            background: white !important;
            border-right: 2px solid #ddd !important;
        }
        
        .tabulator .tabulator-frozen-left {
            box-shadow: 3px 0 5px rgba(0,0,0,0.1) !important;
        }
        
        /* Split row styling for expanded rows */
        .split-row {
            background-color: #ffffff !important;
        }
        
        .split-row:nth-child(even) {
            background-color: #f8f9fa !important;
        }
        
        .split-row:hover {
            background-color: #e9ecef !important;
        }
        
        .split-row .tabulator-cell:first-child {
            padding-left: 30px !important;
        }
        
        /* Webflow specific fixes */
        .w-embed {
            overflow: visible !important;
        }
        
        /* Ensure dropdowns appear above everything in Webflow */
        body {
            position: relative !important;
        }
        
        /* Loading animation for data fetching */
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Expansion animation */
        .subrow-container {
            animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}
