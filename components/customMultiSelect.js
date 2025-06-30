// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
    var container = document.createElement("div");
    container.className = "custom-multiselect";
    var button = document.createElement("div");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown hide";
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = new Set();
    var selectedValues = new Set();
    var isOpen = false;
    
    // Store dropdown in container for cleanup
    container._dropdown = dropdown;
    
    function positionDropdown() {
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.width = Math.max(200, buttonRect.width) + 'px';
    }
    
    function updateFilter() {
        if (selectedValues.size === 0) {
            // Hide all rows
            success(false);
        } else if (selectedValues.size === allValues.size) {
            // Show all rows
            success("");
        } else {
            // Show only selected values
            var selected = Array.from(selectedValues);
            success(function(cellValue) {
                return selected.includes(String(cellValue));
            });
        }
    }
    
    function loadValues() {
        allValues.clear();
        
        // Get all data from the column
        table.getData().forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                allValues.add(String(value));
            }
        });
        
        // Convert to array and sort
        var sortedValues = Array.from(allValues);
        if (field === "Batter Prop Value") {
            sortedValues.sort(function(a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            sortedValues.sort();
        }
        
        // Clear dropdown
        dropdown.innerHTML = '';
        
        if (sortedValues.length === 0) {
            button.textContent = "No data";
            return;
        }
        
        // Initialize all as selected
        selectedValues = new Set(sortedValues);
        
        // Create select all option
        var selectAllOption = document.createElement("div");
        selectAllOption.className = "custom-multiselect-option select-all selected";
        selectAllOption.textContent = "Unselect All";
        dropdown.appendChild(selectAllOption);
        
        // Create individual options
        sortedValues.forEach(function(value) {
            var option = document.createElement("div");
            option.className = "custom-multiselect-option selected";
            option.textContent = value;
            option.setAttribute('data-value', value);
            dropdown.appendChild(option);
        });
        
        button.textContent = "All selected";
        
        // Event handlers
        selectAllOption.onclick = function(e) {
            e.stopPropagation();
            if (selectedValues.size === allValues.size) {
                // Unselect all
                selectedValues.clear();
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.remove('selected');
                });
                selectAllOption.textContent = "Select All";
                selectAllOption.classList.remove('selected');
                button.textContent = "None selected";
            } else {
                // Select all
                selectedValues = new Set(allValues);
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.add('selected');
                });
                selectAllOption.textContent = "Unselect All";
                selectAllOption.classList.add('selected');
                button.textContent = "All selected";
            }
            updateFilter();
        };
        
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(option) {
            option.onclick = function(e) {
                e.stopPropagation();
                var value = option.getAttribute('data-value');
                
                if (selectedValues.has(value)) {
                    selectedValues.delete(value);
                    option.classList.remove('selected');
                } else {
                    selectedValues.add(value);
                    option.classList.add('selected');
                }
                
                // Update button text
                if (selectedValues.size === 0) {
                    button.textContent = "None selected";
                } else if (selectedValues.size === allValues.size) {
                    button.textContent = "All selected";
                } else {
                    button.textContent = selectedValues.size + " selected";
                }
                
                // Update select all button
                if (selectedValues.size === allValues.size) {
                    selectAllOption.textContent = "Unselect All";
                    selectAllOption.classList.add('selected');
                } else {
                    selectAllOption.textContent = "Select All";
                    selectAllOption.classList.remove('selected');
                }
                
                updateFilter();
            };
        });
    }
    
    // Load values when table data changes
    table.on("dataLoaded", loadValues);
    
    // Initial load
    setTimeout(loadValues, 100);
    
    // Button click handler
    button.onclick = function(e) {
        e.stopPropagation();
        
        if (isOpen) {
            dropdown.classList.remove('show');
            dropdown.classList.add('hide');
            isOpen = false;
        } else {
            // Close other dropdowns
            document.querySelectorAll('.custom-multiselect-dropdown.show').forEach(function(d) {
                d.classList.remove('show');
                d.classList.add('hide');
            });
            
            // Append to body if not already there
            if (!dropdown.parentNode) {
                document.body.appendChild(dropdown);
            }
            
            positionDropdown();
            dropdown.classList.remove('hide');
            dropdown.classList.add('show');
            isOpen = true;
        }
    };
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (isOpen && !container.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
            dropdown.classList.add('hide');
            isOpen = false;
        }
    });
    
    // Clean up on destroy
    cell.getElement().addEventListener('DOMNodeRemoved', function() {
        if (dropdown.parentNode) {
            dropdown.parentNode.removeChild(dropdown);
        }
    });
    
    container.appendChild(button);
    return container;
}
