// styles/tableStyles.js
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
        }
        
        .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 10px;
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
        
        /* Table container styling */
        .tables-container {
            width: 100% !important;
            position: relative !important;
        }
        
        .table-container {
            width: 100% !important;
        }
        
        .table-container.active-table {
            display: block !important;
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .table-container.inactive-table {
            display: none !important;
            position: absolute !important;
            top: 0 !important;
            left: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
        
        #batter-table, #batter-table-alt {
            width: 100% !important;
            margin: 0 auto !important;
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
            overflow: auto !important;
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
        
        /* Left align name columns */
        .tabulator .tabulator-cell[tabulator-field="Batter Name"] {
            text-align: left !important;
        }
        
        .tabulator .tabulator-cell[tabulator-field="Batter Name"] .tabulator-cell-value {
            text-align: left !important;
        }
        
        /* Subtable styling */
        .subrow-container {
            position: relative !important;
            z-index: 1 !important;
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
        
        /* Webflow specific fixes */
        .w-embed {
            overflow: visible !important;
        }
        
        /* Ensure dropdowns appear above everything in Webflow */
        body {
            position: relative !important;
        }
    `;
    document.head.appendChild(style);
}
