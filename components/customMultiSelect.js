// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
    var container = document.createElement("div");
    container.className = "custom-multiselect";
    container.style.position = "relative";
    
    var button = document.createElement("div");
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
        user-select: none;
    `;
    
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown";
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 99999;
        background: white;
        border: 1px solid #ccc;
        min-width: 200px;
        max-width: 300px;
        max-height: 250px;
        overflow-y: auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: none;
        margin-top: 2px;
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var isOpen = false;
    
    function updateFilter() {
        if (selectedValues.length === 0) {
            success(false);
        } else if (selectedValues.length === allValues.length) {
            success("");
        } else {
            success(function(cellValue) {
                return selectedValues.includes(String(cellValue));
            });
        }
    }
    
    function createOption(value, isSelectAll) {
        var option = document.createElement("div");
        option.className = "multiselect-option";
        if (isSelectAll) {
            option.className += " select-all";
        }
        option.setAttribute('data-value', value);
        
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.style.cssText = "margin-right: 8px; pointer-events: none;";
        
        var label = document.createElement("span");
        label.textContent = isSelectAll ? "Select All" : value;
        label.style.cssText = "pointer-events: none;";
        
        option.appendChild(checkbox);
        option.appendChild(label);
        
        option.style.cssText = `
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #eee;
            font-size: 12px;
            user-select: none;
        `;
        
        if (isSelectAll) {
            option.style.fontWeight = "bold";
            option.style.borderBottom = "2px solid #007bff";
        }
        
        // Add hover effect
        option.addEventListener('mouseenter', function() {
            option.style.background = "#f0f0f0";
        });
        
        option.addEventListener('mouseleave', function() {
            option.style.background = "white";
        });
        
        return option;
    }
    
    function loadValues() {
        allValues = [];
        selectedValues = [];
        
        // Get unique values
        var uniqueValues = new Set();
        table.getData().forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(String(value));
            }
        });
        
        allValues = Array.from(uniqueValues);
        
        // Sort values
        if (field === "Batter Prop Value") {
            allValues.sort(function(a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            allValues.sort();
        }
        
        // Clear dropdown
        dropdown.innerHTML = '';
        
        if (allValues.length === 0) {
            button.textContent = "No data";
            return;
        }
        
        // Initialize all as selected
        selectedValues = [...allValues];
        
        // Create select all option
        var selectAllOption = createOption("", true);
        dropdown.appendChild(selectAllOption);
        
        // Create individual options
        allValues.forEach(function(value) {
            var option = createOption(value, false);
            dropdown.appendChild(option);
        });
        
        button.textContent = "All selected (" + allValues.length + ")";
        
        // Update UI
        function updateUI() {
            // Update checkboxes
            dropdown.querySelectorAll('.multiselect-option').forEach(function(opt) {
                var checkbox = opt.querySelector('input[type="checkbox"]');
                var value = opt.getAttribute('data-value');
                
                if (opt.classList.contains('select-all')) {
                    checkbox.checked = selectedValues.length === allValues.length;
                    opt.querySelector('span').textContent = checkbox.checked ? "Unselect All" : "Select All";
                } else {
                    checkbox.checked = selectedValues.includes(value);
                }
            });
            
            // Update button text
            if (selectedValues.length === 0) {
                button.textContent = "None selected";
            } else if (selectedValues.length === allValues.length) {
                button.textContent = "All selected (" + allValues.length + ")";
            } else {
                button.textContent = selectedValues.length + " of " + allValues.length + " selected";
            }
        }
        
        // Event delegation for dropdown clicks
        dropdown.addEventListener('click', function(e) {
            var option = e.target.closest('.multiselect-option');
            if (!option) return;
            
            e.stopPropagation();
            e.preventDefault();
            
            if (option.classList.contains('select-all')) {
                // Toggle all
                if (selectedValues.length === allValues.length) {
                    selectedValues = [];
                } else {
                    selectedValues = [...allValues];
                }
            } else {
                // Toggle individual
                var value = option.getAttribute('data-value');
                var index = selectedValues.indexOf(value);
                
                if (index > -1) {
                    selectedValues.splice(index, 1);
                } else {
                    selectedValues.push(value);
                }
            }
            
            updateUI();
            updateFilter();
        });
        
        updateUI();
    }
    
    // Button click handler
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (isOpen) {
            dropdown.style.display = "none";
            isOpen = false;
        } else {
            dropdown.style.display = "block";
            isOpen = true;
            
            // Ensure dropdown is visible
            requestAnimationFrame(function() {
                var dropdownRect = dropdown.getBoundingClientRect();
                
                // Adjust vertical position
                if (dropdownRect.bottom > window.innerHeight - 20) {
                    dropdown.style.top = "auto";
                    dropdown.style.bottom = "100%";
                    dropdown.style.marginTop = "0";
                    dropdown.style.marginBottom = "2px";
                }
                
                // Adjust horizontal position
                if (dropdownRect.right > window.innerWidth - 20) {
                    dropdown.style.left = "auto";
                    dropdown.style.right = "0";
                }
            });
        }
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Close on outside click
    var closeHandler = function(e) {
        if (isOpen && !container.contains(e.target)) {
            dropdown.style.display = "none";
            isOpen = false;
        }
    };
    
    // Use capture phase to ensure we get the event
    document.addEventListener('click', closeHandler, true);
    
    // Load values when table data is ready
    table.on("dataLoaded", loadValues);
    
    // Initial load
    setTimeout(function() {
        loadValues();
    }, 100);
    
    // Append elements
    container.appendChild(button);
    container.appendChild(dropdown);
    
    return container;
}
