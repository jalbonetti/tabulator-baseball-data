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
    var filterApplied = false;
    
    function positionDropdown() {
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.width = Math.max(200, buttonRect.width) + 'px';
    }
    
    function applyFilter() {
        console.log("Applying filter for", field, "with selected values:", selectedValues.length, "of", allValues.length);
        
        if (selectedValues.length === 0) {
            // No values selected - hide all rows
            table.setHeaderFilterValue(field, function(data) {
                return false;
            });
            filterApplied = true;
        } else if (selectedValues.length === allValues.length) {
            // All values selected - clear filter completely
            table.clearHeaderFilter(field);
            filterApplied = false;
        } else {
            // Some values selected - apply filter
            table.setHeaderFilterValue(field, function(data) {
                var cellValue = data[field];
                return selectedValues.indexOf(String(cellValue)) !== -1;
            });
            filterApplied = true;
        }
    }
    
    setTimeout(function() {
        table.getData().forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                var stringValue = String(value);
                if (allValues.indexOf(stringValue) === -1) {
                    allValues.push(stringValue);
                }
            }
        });
        
        // Proper numeric sorting for prop values
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
        
        var selectAllOption = document.createElement("div");
        selectAllOption.className = "custom-multiselect-option select-all selected";
        selectAllOption.textContent = "Unselect All";
        dropdown.appendChild(selectAllOption);
        
        allValues.forEach(function(value) {
            var option = document.createElement("div");
            option.className = "custom-multiselect-option selected";
            option.textContent = value;
            option.setAttribute('data-value', value);
            dropdown.appendChild(option);
        });
        
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
        
        selectAllOption.addEventListener("mousedown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (selectedValues.length === allValues.length) {
                selectedValues = [];
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.remove('selected');
                });
            } else {
                selectedValues = allValues.slice();
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.classList.add('selected');
                });
            }
            updateSelectAllButton();
            updateButtonText();
            applyFilter();
        });
        
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(option) {
            var value = option.getAttribute('data-value');
            option.addEventListener("mousedown", function(e) {
                e.preventDefault();
                e.stopPropagation();
                var index = selectedValues.indexOf(value);
                if (index === -1) {
                    selectedValues.push(value);
                    option.classList.add('selected');
                } else {
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
    
    button.addEventListener("mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation();
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
    
    document.addEventListener("mousedown", function(e) {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            isOpen = false;
            dropdown.className = "custom-multiselect-dropdown hide";
        }
    });
    
    window.addEventListener('resize', function() { if (isOpen) positionDropdown(); });
    window.addEventListener('scroll', function() { if (isOpen) positionDropdown(); });
    
    container.appendChild(button);
    return container;
}
