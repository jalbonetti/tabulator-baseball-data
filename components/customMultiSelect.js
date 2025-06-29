// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
    var container = document.createElement("div");
    container.className = "custom-multiselect";
    var button = document.createElement("div");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown hide";
    document.body.appendChild(dropdown);
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var isOpen = false;
    
    function positionDropdown() {
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.width = Math.max(200, buttonRect.width) + 'px';
    }
    
    function applyFilter() {
        console.log("Applying filter for", field, "with selected values:", selectedValues.length, "of", allValues.length);
        
        if (selectedValues.length === 0) {
            // No values selected - show no rows
            table.setHeaderFilterValue(field, function(headerValue, rowValue, rowData, filterParams) {
                return false;
            });
        } else if (selectedValues.length === allValues.length) {
            // All values selected - clear this specific filter
            table.setHeaderFilterValue(field, "");
        } else {
            // Some values selected - apply custom filter function
            table.setHeaderFilterValue(field, function(headerValue, rowValue, rowData, filterParams) {
                // Convert the row value to string for comparison
                var rowValueStr = String(rowValue);
                var isIncluded = selectedValues.indexOf(rowValueStr) !== -1;
                return isIncluded;
            });
        }
    }
    
    setTimeout(function() {
        // Get all data from the table
        var tableData = table.getData();
        
        tableData.forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                var stringValue = String(value);
                if (allValues.indexOf(stringValue) === -1) {
                    allValues.push(stringValue);
                }
            }
        });
        
        // Sort values appropriately
        if (field === "Batter Prop Value") {
            allValues.sort(function(a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            allValues.sort();
        }
        
        console.log("Found values for", field + ":", allValues);
        
        if (allValues.length === 0) {
            button.textContent = "No data";
            return;
        }
        
        // Create select all option
        var selectAllOption = document.createElement("div");
        selectAllOption.className = "custom-multiselect-option select-all selected";
        selectAllOption.textContent = "Unselect All";
        dropdown.appendChild(selectAllOption);
        
        // Create individual options
        allValues.forEach(function(value) {
            var option = document.createElement("div");
            option.className = "custom-multiselect-option selected";
            option.textContent = value;
            option.setAttribute('data-value', value);
            dropdown.appendChild(option);
        });
        
        // Initialize with all values selected
        selectedValues = allValues.slice();
        button.textContent = "All selected";
        
        function updateSelectAllButton() {
            if (selectedValues.length === allValues.length) {
                selectAllOption.textContent = "Unselect All";
                selectAllOption.classList.add('selected');
            } else {
                selectAllOption.textContent = "Select All";
                selectAllOption.classList.remove('selected');
            }
        }
        
        function updateButtonText() {
            if (selectedValues.length === 0) {
                button.textContent = "None selected";
            } else if (selectedValues.length === allValues.length) {
                button.textContent = "All selected";
            } else {
                button.textContent = selectedValues.length + " selected";
            }
        }
        
        // Handle select all click
        selectAllOption.addEventListener("mousedown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (selectedValues.length === allValues.length) {
                // Unselect all
                selectedValues = [];
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.remove('selected');
                });
            } else {
                // Select all
                selectedValues = allValues.slice();
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.add('selected');
                });
            }
            
            updateSelectAllButton();
            updateButtonText();
            applyFilter();
        });
        
        // Handle individual option clicks
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(option) {
            var value = option.getAttribute('data-value');
            
            option.addEventListener("mousedown", function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                var index = selectedValues.indexOf(value);
                if (index === -1) {
                    // Add to selected
                    selectedValues.push(value);
                    option.classList.add('selected');
                } else {
                    // Remove from selected
                    selectedValues.splice(index, 1);
                    option.classList.remove('selected');
                }
                
                updateSelectAllButton();
                updateButtonText();
                applyFilter();
            });
        });
        
        updateSelectAllButton();
        updateButtonText();
    }, 500);
    
    // Handle button click to open/close dropdown
    button.addEventListener("mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('.custom-multiselect-dropdown').forEach(function(otherDropdown) {
            if (otherDropdown !== dropdown) {
                otherDropdown.className = "custom-multiselect-dropdown hide";
            }
        });
        
        isOpen = !isOpen;
        if (isOpen) {
            positionDropdown();
            dropdown.className = "custom-multiselect-dropdown show";
        } else {
            dropdown.className = "custom-multiselect-dropdown hide";
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener("mousedown", function(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            isOpen = false;
            dropdown.className = "custom-multiselect-dropdown hide";
        }
    });
    
    // Reposition on window events
    window.addEventListener('resize', function() { 
        if (isOpen) positionDropdown(); 
    });
    
    window.addEventListener('scroll', function() { 
        if (isOpen) positionDropdown(); 
    });
    
    container.appendChild(button);
    return container;
}
