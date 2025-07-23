// components/customMultiSelect.js - UPDATED WITH CONFIGURABLE WIDTH AND SIMPLIFIED TEXT
export function createCustomMultiSelect(cell, onRendered, success, cancel, options = {}) {
    // Extract options with defaults
    const dropdownWidth = options.dropdownWidth || 200; // Default width
    
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
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var dropdownId = 'dropdown_' + field.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 9);
    var isOpen = false;
    var isInitialized = false;
    
    // Store reference to column
    var column = cell.getColumn();
    
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
        
        document.body.appendChild(dropdown);
        return dropdown;
    }
    
    // Custom filter function that will be used by Tabulator
    function customFilterFunction(headerValue, rowValue, rowData, filterParams) {
        // If no header value, show all
        if (!headerValue) return true;
        
        // Convert row value to string for comparison
        var rowValueStr = String(rowValue || '');
        
        // If headerValue is our special hide-all value
        if (headerValue === "IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING") {
            return false;
        }
        
        // If headerValue is an array (our selected values)
        if (Array.isArray(headerValue)) {
            return headerValue.indexOf(rowValueStr) !== -1;
        }
        
        // Default: exact match
        return rowValueStr === String(headerValue);
    }
    
    // Set the custom filter function on the column
    column.getDefinition().headerFilterFunc = customFilterFunction;
    
    function updateFilter() {
        console.log("Updating filter for", field, "- selected:", selectedValues.length, "of", allValues.length);
        
        if (selectedValues.length === 0) {
            // No values selected - hide all rows
            success("IMPOSSIBLE_VALUE_THAT_MATCHES_NOTHING");
        } else if (selectedValues.length === allValues.length) {
            // All selected - show all rows
            success("");
        } else {
            // Some selected - pass the array of selected values
            // Make a copy to ensure it's a new reference
            success([...selectedValues]);
        }
        
        // Force table to refilter
        table.redraw();
    }
    
    function renderDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        dropdown.innerHTML = '';
        
        // Add select all
        var selectAll = document.createElement("div");
        selectAll.style.cssText = `
            padding: 8px 12px;
            border-bottom: 2px solid #007bff;
            font-weight: bold;
            background: #f8f9fa;
        `;
        
        var selectAllLabel = document.createElement("label");
        selectAllLabel.style.cssText = "display: flex; align-items: center; cursor: pointer;";
        
        var selectAllCheckbox = document.createElement("input");
        selectAllCheckbox.type = "checkbox";
        selectAllCheckbox.checked = selectedValues.length === allValues.length;
        selectAllCheckbox.style.marginRight = "8px";
        
        var selectAllText = document.createElement("span");
        selectAllText.textContent = selectedValues.length === allValues.length ? 'Unselect All' : 'Select All';
        
        selectAllLabel.appendChild(selectAllCheckbox);
        selectAllLabel.appendChild(selectAllText);
        selectAll.appendChild(selectAllLabel);
        
        selectAll.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (selectedValues.length === allValues.length) {
                selectedValues = [];
            } else {
                selectedValues = [...allValues];
            }
            
            // Update immediately
            updateButtonText();
            updateFilter();
            
            // Then re-render dropdown to update checkboxes
            renderDropdown();
        });
        
        dropdown.appendChild(selectAll);
        
        // Add individual options
        allValues.forEach(function(value) {
            var optionDiv = document.createElement("div");
            optionDiv.style.cssText = `
                padding: 6px 12px;
                border-bottom: 1px solid #eee;
            `;
            
            var optionLabel = document.createElement("label");
            optionLabel.style.cssText = "display: flex; align-items: center; cursor: pointer;";
            
            var optionCheckbox = document.createElement("input");
            optionCheckbox.type = "checkbox";
            optionCheckbox.checked = selectedValues.indexOf(value) !== -1;
            optionCheckbox.style.marginRight = "8px";
            
            var optionText = document.createElement("span");
            optionText.textContent = value;
            
            optionLabel.appendChild(optionCheckbox);
            optionLabel.appendChild(optionText);
            optionDiv.appendChild(optionLabel);
            
            optionDiv.addEventListener('click', function(e) {
                e.stopPropagation();
                
                var index = selectedValues.indexOf(value);
                if (index > -1) {
                    selectedValues.splice(index, 1);
                } else {
                    selectedValues.push(value);
                }
                
                console.log("Selection changed:", value, "- now selected:", selectedValues);
                
                // Update immediately
                updateButtonText();
                updateFilter();
                
                // Then update checkbox
                optionCheckbox.checked = selectedValues.indexOf(value) !== -1;
                
                // Update select all checkbox
                selectAllCheckbox.checked = selectedValues.length === allValues.length;
                selectAllText.textContent = selectedValues.length === allValues.length ? 'Unselect All' : 'Select All';
            });
            
            optionDiv.addEventListener('mouseenter', function() {
                optionDiv.style.background = '#f0f0f0';
            });
            
            optionDiv.addEventListener('mouseleave', function() {
                optionDiv.style.background = 'white';
            });
            
            dropdown.appendChild(optionDiv);
        });
    }
    
    function showDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        
        renderDropdown();
        
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.display = 'block';
        
        setTimeout(function() {
            var dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight) {
                dropdown.style.top = (buttonRect.top - dropdown.offsetHeight - 2) + 'px';
            }
            if (dropdownRect.right > window.innerWidth) {
                dropdown.style.left = (window.innerWidth - dropdown.offsetWidth - 10) + 'px';
            }
        }, 0);
        
        isOpen = true;
    }
    
    function hideDropdown() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        isOpen = false;
    }
    
    function updateButtonText() {
        if (selectedValues.length === 0) {
            button.textContent = "None";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All";
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length;
        }
    }
    
    function loadValues() {
        if (!isInitialized) {
            allValues = [];
            var uniqueValues = new Set();
            
            var data = table.getData();
            
            data.forEach(function(row) {
                var value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    uniqueValues.add(String(value));
                }
            });
            
            allValues = Array.from(uniqueValues);
            
            // Sort prop value fields numerically for both batter and pitcher tables
            if (field === "Batter Prop Value" || field === "Pitcher Prop Value") {
                allValues.sort(function(a, b) {
                    return parseFloat(a) - parseFloat(b);
                });
            } else {
                allValues.sort();
            }
            
            selectedValues = [...allValues];
            isInitialized = true;
        }
        
        updateButtonText();
    }
    
    // Button click
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isOpen) {
            hideDropdown();
        } else {
            if (!isInitialized) {
                loadValues();
            }
            showDropdown();
        }
    });
    
    // Close on outside click
    var closeHandler = function(e) {
        if (isOpen) {
            var dropdown = document.getElementById(dropdownId);
            if (dropdown && !dropdown.contains(e.target) && e.target !== button) {
                hideDropdown();
            }
        }
    };
    
    setTimeout(function() {
        document.addEventListener('click', closeHandler);
    }, 100);
    
    // Initial load
    var loadAttempts = 0;
    var tryLoad = function() {
        loadAttempts++;
        
        var data = table.getData();
        if (data && data.length > 0) {
            loadValues();
            updateFilter();
        } else if (loadAttempts < 5) {
            setTimeout(tryLoad, 500);
        }
    };
    
    tryLoad();
    
    // Listen for table events
    table.on("dataLoaded", function() {
        if (!isInitialized) {
            setTimeout(function() {
                loadValues();
                updateFilter();
            }, 100);
        }
    });
    
    // Cleanup
    var cleanup = function() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.remove();
        }
        document.removeEventListener('click', closeHandler);
    };
    
    return button;
}
