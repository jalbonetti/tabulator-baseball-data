// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
// EXACT PORT from NBA basketball-props repository
// Key features:
// - "Select All / Deselect All" toggle checkbox at top (no search box, no separate buttons)
// - Individual checkboxes for each value
// - Opens ABOVE the table header
// - Preserves expanded row state during filter operations

export function createCustomMultiSelect(cell, onRendered, success, cancel, options = {}) {
    const dropdownWidth = options.dropdownWidth || 200;
    
    var button = document.createElement("button");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    button.style.cssText = `
        width: 100%;
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 11px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 3px;
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var dropdownId = 'dropdown_' + field.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
    var isOpen = false;
    var isInitialized = false;
    var filterTimeout = null;
    var loadAttempts = 0;
    
    var column = cell.getColumn();
    
    // =========================================================
    // Expanded state preservation (MLB field names)
    // =========================================================
    function saveExpandedState() {
        const expandedRows = new Set();
        const rows = table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                let rowId = '';
                if (data["Batter Name"]) {
                    rowId = `batter_${data["Batter Name"]}_${data["Batter Team"] || ''}`;
                    if (data["Batter Prop Type"]) rowId += `_${data["Batter Prop Type"]}`;
                    if (data["Batter Prop Line"]) rowId += `_${data["Batter Prop Line"]}`;
                    if (data["Batter Over/Under"]) rowId += `_${data["Batter Over/Under"]}`;
                    if (data["Batter Book"]) rowId += `_${data["Batter Book"]}`;
                } else if (data["Pitcher Name"]) {
                    rowId = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"] || ''}`;
                    if (data["Pitcher Prop Type"]) rowId += `_${data["Pitcher Prop Type"]}`;
                    if (data["Pitcher Prop Line"]) rowId += `_${data["Pitcher Prop Line"]}`;
                    if (data["Pitcher Over/Under"]) rowId += `_${data["Pitcher Over/Under"]}`;
                    if (data["Pitcher Book"]) rowId += `_${data["Pitcher Book"]}`;
                } else if (data["Game Matchup"]) {
                    rowId = `game_${data["Game Matchup"]}`;
                    if (data["Game Prop Type"]) rowId += `_${data["Game Prop Type"]}`;
                    if (data["Game Label"]) rowId += `_${data["Game Label"]}`;
                    if (data["Game Line"]) rowId += `_${data["Game Line"]}`;
                    if (data["Game Book"]) rowId += `_${data["Game Book"]}`;
                }
                if (rowId) expandedRows.add(rowId);
            }
        });
        return expandedRows;
    }
    
    function restoreExpandedState(expandedRows) {
        if (!expandedRows || expandedRows.size === 0) return;
        
        setTimeout(() => {
            const rows = table.getRows();
            rows.forEach(row => {
                const data = row.getData();
                let rowId = '';
                if (data["Batter Name"]) {
                    rowId = `batter_${data["Batter Name"]}_${data["Batter Team"] || ''}`;
                    if (data["Batter Prop Type"]) rowId += `_${data["Batter Prop Type"]}`;
                    if (data["Batter Prop Line"]) rowId += `_${data["Batter Prop Line"]}`;
                    if (data["Batter Over/Under"]) rowId += `_${data["Batter Over/Under"]}`;
                    if (data["Batter Book"]) rowId += `_${data["Batter Book"]}`;
                } else if (data["Pitcher Name"]) {
                    rowId = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"] || ''}`;
                    if (data["Pitcher Prop Type"]) rowId += `_${data["Pitcher Prop Type"]}`;
                    if (data["Pitcher Prop Line"]) rowId += `_${data["Pitcher Prop Line"]}`;
                    if (data["Pitcher Over/Under"]) rowId += `_${data["Pitcher Over/Under"]}`;
                    if (data["Pitcher Book"]) rowId += `_${data["Pitcher Book"]}`;
                } else if (data["Game Matchup"]) {
                    rowId = `game_${data["Game Matchup"]}`;
                    if (data["Game Prop Type"]) rowId += `_${data["Game Prop Type"]}`;
                    if (data["Game Label"]) rowId += `_${data["Game Label"]}`;
                    if (data["Game Line"]) rowId += `_${data["Game Line"]}`;
                    if (data["Game Book"]) rowId += `_${data["Game Book"]}`;
                }
                
                if (rowId && expandedRows.has(rowId)) {
                    if (!data._expanded) {
                        data._expanded = true;
                        row.update(data);
                        row.reformat();
                    }
                    const cells = row.getCells();
                    const nameFields = ["Batter Name", "Pitcher Name", "Game Matchup"];
                    for (let nameField of nameFields) {
                        const nameCell = cells.find(c => c.getField() === nameField);
                        if (nameCell) {
                            const cellElement = nameCell.getElement();
                            const expander = cellElement.querySelector('.expand-icon');
                            if (expander) expander.style.transform = 'rotate(90deg)';
                            break;
                        }
                    }
                }
            });
        }, 200);
    }
    
    // =========================================================
    // Create the dropdown container
    // =========================================================
    function createDropdown() {
        var existing = document.getElementById(dropdownId);
        if (existing) existing.remove();
        
        var dropdown = document.createElement("div");
        dropdown.id = dropdownId;
        dropdown.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #333;
            min-width: ${dropdownWidth}px;
            max-width: ${Math.max(dropdownWidth, 300)}px;
            max-height: 300px;
            overflow-y: auto;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
            border-radius: 4px;
        `;
        
        document.body.appendChild(dropdown);
        return dropdown;
    }
    
    // =========================================================
    // Create individual option element (matching NBA pattern exactly)
    // =========================================================
    function createOptionElement(value, isSelectAll) {
        var optionDiv = document.createElement('div');
        optionDiv.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            border-bottom: 1px solid #eee;
            background: white;
            transition: background 0.15s ease;
        `;
        
        if (isSelectAll) {
            optionDiv.style.cssText += `
                font-weight: bold;
                background: #f8f9fa;
                position: sticky;
                top: 0;
                z-index: 1;
                border-bottom: 2px solid #b91c1c;
            `;
        }
        
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = 'margin: 0; cursor: pointer;';
        
        var label = document.createElement('span');
        
        if (isSelectAll) {
            checkbox.checked = selectedValues.length === allValues.length;
            label.textContent = selectedValues.length === allValues.length ? 'Deselect All' : 'Select All';
            label.style.cssText = 'font-weight: bold; color: #b91c1c;';
        } else {
            checkbox.checked = selectedValues.indexOf(value) !== -1;
            label.textContent = value;
        }
        
        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        
        optionDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (isSelectAll) {
                if (selectedValues.length === allValues.length) {
                    selectedValues = [];
                } else {
                    selectedValues = [...allValues];
                }
                renderDropdown();
            } else {
                var index = selectedValues.indexOf(value);
                if (index === -1) {
                    selectedValues.push(value);
                    checkbox.checked = true;
                } else {
                    selectedValues.splice(index, 1);
                    checkbox.checked = false;
                }
                // Update select all checkbox state
                var selectAllCb = dropdown.querySelector('input[type="checkbox"]');
                if (selectAllCb) {
                    selectAllCb.checked = selectedValues.length === allValues.length;
                    var selectAllLabel = selectAllCb.nextElementSibling;
                    if (selectAllLabel) {
                        selectAllLabel.textContent = selectedValues.length === allValues.length ? 'Deselect All' : 'Select All';
                    }
                }
            }
            
            updateButtonText();
            updateFilter();
        });
        
        optionDiv.addEventListener('mouseenter', function() {
            optionDiv.style.background = isSelectAll ? '#f0f0f0' : '#f5f5f5';
        });
        
        optionDiv.addEventListener('mouseleave', function() {
            optionDiv.style.background = isSelectAll ? '#f8f9fa' : 'white';
        });
        
        return optionDiv;
    }
    
    var dropdown = createDropdown();
    
    // =========================================================
    // Render dropdown content
    // =========================================================
    function renderDropdown() {
        dropdown.innerHTML = '';
        
        // Select All / Deselect All toggle at top
        dropdown.appendChild(createOptionElement(null, true));
        
        // Separator line
        var separator = document.createElement('div');
        separator.style.cssText = 'height: 1px; background: #ccc; margin: 0;';
        dropdown.appendChild(separator);
        
        // Individual value options
        allValues.forEach(function(value) {
            dropdown.appendChild(createOptionElement(value, false));
        });
    }
    
    // =========================================================
    // Show/hide dropdown (positioned ABOVE the button)
    // =========================================================
    function showDropdown() {
        renderDropdown();
        
        var buttonRect = button.getBoundingClientRect();
        
        // Show to measure height
        dropdown.style.display = 'block';
        
        // Position ABOVE the button
        var dropdownHeight = Math.min(300, dropdown.scrollHeight);
        var topPosition = buttonRect.top - dropdownHeight - 2;
        
        // Fallback: below if not enough space above
        if (topPosition < 10) {
            topPosition = buttonRect.bottom + 2;
        }
        
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = topPosition + 'px';
        dropdown.style.width = Math.max(dropdownWidth, buttonRect.width) + 'px';
        
        // Don't go off screen horizontally
        var dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth - 10) {
            dropdown.style.left = (window.innerWidth - dropdown.offsetWidth - 10) + 'px';
        }
        
        isOpen = true;
    }
    
    function hideDropdown() {
        dropdown.style.display = 'none';
        isOpen = false;
    }
    
    // =========================================================
    // Button text and filter logic
    // =========================================================
    function updateButtonText() {
        if (selectedValues.length === 0) {
            button.textContent = "None";
            button.style.color = "#999";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All";
            button.style.color = "#333";
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length;
            button.style.color = "#b91c1c";
        }
    }
    
    // Custom filter function
    function customFilterFunction(headerValue, rowValue, rowData, filterParams) {
        if (!headerValue) return true;
        var rowValueStr = String(rowValue || '');
        if (headerValue === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") return false;
        if (Array.isArray(headerValue)) return headerValue.indexOf(rowValueStr) !== -1;
        return rowValueStr === String(headerValue);
    }
    
    column.getDefinition().headerFilterFunc = customFilterFunction;
    
    function updateFilter() {
        if (filterTimeout) clearTimeout(filterTimeout);
        
        const expandedState = saveExpandedState();
        
        filterTimeout = setTimeout(() => {
            if (selectedValues.length === 0) {
                success("IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING");
            } else if (selectedValues.length === allValues.length) {
                success("");
            } else {
                success([...selectedValues]);
            }
            
            table.redraw();
            restoreExpandedState(expandedState);
        }, 150);
    }
    
    // =========================================================
    // Load values from table data
    // =========================================================
    function loadValues() {
        loadAttempts++;
        
        try {
            var data = table.getData();
            if (!data || data.length === 0) {
                if (loadAttempts < 10) setTimeout(loadValues, 500);
                return;
            }
            
            var values = data.map(function(row) { return row[field]; });
            
            allValues = [...new Set(values)]
                .filter(function(v) { return v !== null && v !== undefined && v !== ''; });
            
            // Sort numerically for line/number fields, alphabetically otherwise
            if (field.includes("Prop Line") || field.includes("Prop Value") || field.includes("Game Line")) {
                allValues.sort(function(a, b) { return parseFloat(a) - parseFloat(b); });
            } else {
                allValues.sort();
            }
            
            // Check for existing filter and sync
            const headerFilters = table.getHeaderFilters();
            const currentFilter = headerFilters.find(f => f.field === field);
            if (currentFilter && currentFilter.value && Array.isArray(currentFilter.value)) {
                selectedValues = currentFilter.value;
            } else {
                selectedValues = [...allValues];
            }
            
            isInitialized = true;
            updateButtonText();
            
        } catch (e) {
            console.error("Error loading dropdown values for " + field + ":", e);
            if (loadAttempts < 10) setTimeout(loadValues, 500);
        }
    }
    
    // =========================================================
    // Event handlers
    // =========================================================
    document.addEventListener('click', function(e) {
        if (isOpen && !dropdown.contains(e.target) && !button.contains(e.target)) {
            hideDropdown();
        }
    });
    
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('[id^="dropdown_"]').forEach(function(otherDropdown) {
            if (otherDropdown.id !== dropdownId) otherDropdown.style.display = 'none';
        });
        
        if (isOpen) {
            hideDropdown();
        } else {
            if (!isInitialized) loadValues();
            showDropdown();
        }
    });
    
    onRendered(function() {
        loadValues();
    });
    
    return button;
}
