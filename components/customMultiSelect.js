// components/customMultiSelect.js - Custom Multi-Select Dropdown Filter for Tabulator
// Dropdowns open ABOVE the table header
// Updated for MLB field names (Batter Name, Pitcher Name, Game Matchup)

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
    var clickTimeout = null;
    var loadAttempts = 0;
    
    var column = cell.getColumn();
    
    // Save expanded rows before filter operations
    function saveExpandedState() {
        const expandedRows = new Set();
        const rows = table.getRows();
        
        rows.forEach(row => {
            const data = row.getData();
            if (data._expanded) {
                let rowId = '';
                // Batter tables
                if (data["Batter Name"]) {
                    rowId = `batter_${data["Batter Name"]}_${data["Batter Team"] || ''}`;
                    if (data["Batter Prop Type"]) rowId += `_${data["Batter Prop Type"]}`;
                    if (data["Batter Prop Line"]) rowId += `_${data["Batter Prop Line"]}`;
                    if (data["Batter Over/Under"]) rowId += `_${data["Batter Over/Under"]}`;
                    if (data["Batter Book"]) rowId += `_${data["Batter Book"]}`;
                }
                // Pitcher tables
                else if (data["Pitcher Name"]) {
                    rowId = `pitcher_${data["Pitcher Name"]}_${data["Pitcher Team"] || ''}`;
                    if (data["Pitcher Prop Type"]) rowId += `_${data["Pitcher Prop Type"]}`;
                    if (data["Pitcher Prop Line"]) rowId += `_${data["Pitcher Prop Line"]}`;
                    if (data["Pitcher Over/Under"]) rowId += `_${data["Pitcher Over/Under"]}`;
                    if (data["Pitcher Book"]) rowId += `_${data["Pitcher Book"]}`;
                }
                // Game tables
                else if (data["Game Matchup"]) {
                    rowId = `game_${data["Game Matchup"]}`;
                    if (data["Game Prop Type"]) rowId += `_${data["Game Prop Type"]}`;
                    if (data["Game Label"]) rowId += `_${data["Game Label"]}`;
                    if (data["Game Line"]) rowId += `_${data["Game Line"]}`;
                    if (data["Game Book"]) rowId += `_${data["Game Book"]}`;
                }
                
                if (rowId) {
                    expandedRows.add(rowId);
                }
            }
        });
        
        return expandedRows;
    }
    
    // Restore expanded rows after filter operations
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
                            if (expander) {
                                expander.style.transform = 'rotate(90deg)';
                            }
                            break;
                        }
                    }
                }
            });
            
            console.log(`Restored ${expandedRows.size} expanded rows after filter update`);
        }, 200);
    }
    
    function createDropdown() {
        var existing = document.getElementById(dropdownId);
        if (existing) {
            existing.remove();
        }
        
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2147483647;
            display: none;
            padding: 0;
        `;
        
        // Search box
        var searchContainer = document.createElement("div");
        searchContainer.style.cssText = 'padding: 6px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 1;';
        
        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search...";
        searchInput.style.cssText = 'width: 100%; padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px; box-sizing: border-box;';
        
        searchInput.addEventListener("input", function() {
            var searchTerm = this.value.toLowerCase();
            var items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(function(item) {
                var label = item.querySelector('label');
                if (label) {
                    var text = label.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm) ? '' : 'none';
                }
            });
        });
        
        searchInput.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        
        searchContainer.appendChild(searchInput);
        dropdown.appendChild(searchContainer);
        
        // Controls (Select All / Deselect All)
        var controlsDiv = document.createElement("div");
        controlsDiv.style.cssText = 'padding: 4px 8px; border-bottom: 1px solid #eee; display: flex; gap: 8px; position: sticky; top: 38px; background: white; z-index: 1;';
        
        var selectAllBtn = document.createElement("button");
        selectAllBtn.textContent = "All";
        selectAllBtn.style.cssText = 'font-size: 10px; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; border-radius: 2px;';
        selectAllBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            selectedValues = [...allValues];
            updateCheckboxes();
            applyFilter();
        });
        
        var deselectAllBtn = document.createElement("button");
        deselectAllBtn.textContent = "None";
        deselectAllBtn.style.cssText = 'font-size: 10px; padding: 2px 6px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; border-radius: 2px;';
        deselectAllBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            selectedValues = [];
            updateCheckboxes();
            applyFilter();
        });
        
        controlsDiv.appendChild(selectAllBtn);
        controlsDiv.appendChild(deselectAllBtn);
        dropdown.appendChild(controlsDiv);
        
        // Items container
        var itemsContainer = document.createElement("div");
        itemsContainer.className = 'dropdown-items-container';
        
        allValues.forEach(function(value) {
            var item = document.createElement("div");
            item.className = 'dropdown-item';
            item.style.cssText = 'padding: 4px 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
            
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.checked = selectedValues.includes(value);
            checkbox.style.cssText = 'margin: 0; cursor: pointer;';
            
            var label = document.createElement("label");
            label.textContent = value;
            label.style.cssText = 'cursor: pointer; font-size: 11px; white-space: nowrap;';
            
            item.addEventListener("click", function(e) {
                e.stopPropagation();
                checkbox.checked = !checkbox.checked;
                
                if (checkbox.checked) {
                    if (!selectedValues.includes(value)) {
                        selectedValues.push(value);
                    }
                } else {
                    selectedValues = selectedValues.filter(v => v !== value);
                }
                
                applyFilter();
            });
            
            item.appendChild(checkbox);
            item.appendChild(label);
            itemsContainer.appendChild(item);
        });
        
        dropdown.appendChild(itemsContainer);
        
        document.body.appendChild(dropdown);
        
        return dropdown;
    }
    
    function updateCheckboxes() {
        var dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        var checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function(cb) {
            cb.checked = selectedValues.includes(cb.value);
        });
    }
    
    function applyFilter() {
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }
        
        filterTimeout = setTimeout(function() {
            // Save expanded state before filtering
            var expandedRows = saveExpandedState();
            
            updateButtonText();
            
            if (selectedValues.length === 0 || selectedValues.length === allValues.length) {
                success(undefined);
            } else {
                success(selectedValues);
            }
            
            // Restore expanded state after filtering
            restoreExpandedState(expandedRows);
        }, 300);
    }
    
    function updateButtonText() {
        if (selectedValues.length === 0 || selectedValues.length === allValues.length) {
            button.textContent = "All";
            button.title = "All values selected";
        } else if (selectedValues.length === 1) {
            button.textContent = selectedValues[0];
            button.title = selectedValues[0];
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length;
            button.title = selectedValues.join(', ');
        }
    }
    
    function positionDropdown(dropdown) {
        var buttonRect = button.getBoundingClientRect();
        
        // Position ABOVE the button
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = 'auto';
        dropdown.style.bottom = (window.innerHeight - buttonRect.top + 2) + 'px';
        
        // Ensure it doesn't go off-screen left
        var dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth) {
            dropdown.style.left = (window.innerWidth - dropdownRect.width - 10) + 'px';
        }
    }
    
    function openDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        dropdown.style.display = 'block';
        positionDropdown(dropdown);
        isOpen = true;
    }
    
    function closeDropdown() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        isOpen = false;
    }
    
    function closeAllDropdowns() {
        document.querySelectorAll('[id^="dropdown_"]').forEach(function(d) {
            d.style.display = 'none';
        });
        isOpen = false;
    }
    
    // Load values from table data
    function loadValues() {
        loadAttempts++;
        
        try {
            var data = table.getData();
            if (!data || data.length === 0) {
                if (loadAttempts < 10) {
                    setTimeout(loadValues, 500);
                }
                return;
            }
            
            var values = data.map(function(row) {
                return row[field];
            });
            
            allValues = [...new Set(values)]
                .filter(function(v) { return v !== null && v !== undefined && v !== ''; })
                .sort();
            
            selectedValues = [...allValues];
            
            updateButtonText();
            isInitialized = true;
            
        } catch (e) {
            console.error("Error loading dropdown values for " + field + ":", e);
            if (loadAttempts < 10) {
                setTimeout(loadValues, 500);
            }
        }
    }
    
    // Button click handler
    button.addEventListener("click", function(e) {
        e.stopPropagation();
        
        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }
        
        clickTimeout = setTimeout(function() {
            if (isOpen) {
                closeDropdown();
            } else {
                closeAllDropdowns();
                if (!isInitialized) {
                    loadValues();
                }
                openDropdown();
            }
        }, 50);
    });
    
    // Close on outside click
    document.addEventListener("click", function(e) {
        if (isOpen) {
            var dropdown = document.getElementById(dropdownId);
            if (dropdown && !dropdown.contains(e.target) && !button.contains(e.target)) {
                closeDropdown();
            }
        }
    });
    
    // Custom filter function
    column.getDefinition().headerFilterFunc = function(headerValue, rowValue, rowData, filterParams) {
        if (!headerValue || !Array.isArray(headerValue)) return true;
        if (headerValue.length === 0) return true;
        return headerValue.includes(rowValue);
    };
    
    // Initialize values on render
    onRendered(function() {
        loadValues();
    });
    
    return button;
}
