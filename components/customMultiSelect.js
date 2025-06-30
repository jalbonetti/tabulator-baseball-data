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
    `;
    
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown hide";
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
    var allValues = new Set();
    var selectedValues = new Set();
    var isOpen = false;
    
    function updateFilter() {
        if (selectedValues.size === 0) {
            success(false);
        } else if (selectedValues.size === allValues.size) {
            success("");
        } else {
            var selected = Array.from(selectedValues);
            success(function(cellValue) {
                return selected.includes(String(cellValue));
            });
        }
    }
    
    function loadValues() {
        allValues.clear();
        
        table.getData().forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                allValues.add(String(value));
            }
        });
        
        var sortedValues = Array.from(allValues);
        if (field === "Batter Prop Value") {
            sortedValues.sort(function(a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            sortedValues.sort();
        }
        
        dropdown.innerHTML = '';
        
        if (sortedValues.length === 0) {
            button.textContent = "No data";
            return;
        }
        
        selectedValues = new Set(sortedValues);
        
        // Create select all option
        var selectAllOption = document.createElement("div");
        selectAllOption.className = "custom-multiselect-option select-all selected";
        selectAllOption.textContent = "✓ Unselect All";
        selectAllOption.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 2px solid #007bff;
            font-weight: bold;
            background: #f8f9fa;
        `;
        dropdown.appendChild(selectAllOption);
        
        // Create individual options
        sortedValues.forEach(function(value) {
            var option = document.createElement("div");
            option.className = "custom-multiselect-option selected";
            option.innerHTML = '<span style="margin-right: 8px;">✓</span>' + value;
            option.setAttribute('data-value', value);
            option.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 12px;
            `;
            dropdown.appendChild(option);
        });
        
        button.textContent = "All selected (" + sortedValues.length + ")";
        
        // Event handlers
        selectAllOption.onclick = function(e) {
            e.stopPropagation();
            if (selectedValues.size === allValues.size) {
                // Unselect all
                selectedValues.clear();
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.innerHTML = '<span style="margin-right: 8px; opacity: 0;">✓</span>' + opt.getAttribute('data-value');
                    opt.style.background = "white";
                });
                selectAllOption.textContent = "Select All";
                button.textContent = "None selected";
            } else {
                // Select all
                selectedValues = new Set(allValues);
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.innerHTML = '<span style="margin-right: 8px;">✓</span>' + opt.getAttribute('data-value');
                    opt.style.background = "#f0f8ff";
                });
                selectAllOption.textContent = "✓ Unselect All";
                button.textContent = "All selected (" + allValues.size + ")";
            }
            updateFilter();
        };
        
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(option) {
            // Hover effects
            option.onmouseover = function() {
                option.style.background = "#e9ecef";
            };
            
            option.onmouseout = function() {
                option.style.background = selectedValues.has(option.getAttribute('data-value')) ? "#f0f8ff" : "white";
            };
            
            option.onclick = function(e) {
                e.stopPropagation();
                var value = option.getAttribute('data-value');
                
                if (selectedValues.has(value)) {
                    selectedValues.delete(value);
                    option.innerHTML = '<span style="margin-right: 8px; opacity: 0;">✓</span>' + value;
                    option.style.background = "white";
                } else {
                    selectedValues.add(value);
                    option.innerHTML = '<span style="margin-right: 8px;">✓</span>' + value;
                    option.style.background = "#f0f8ff";
                }
                
                // Update button text
                if (selectedValues.size === 0) {
                    button.textContent = "None selected";
                } else if (selectedValues.size === allValues.size) {
                    button.textContent = "All selected (" + allValues.size + ")";
                } else {
                    button.textContent = selectedValues.size + " of " + allValues.size + " selected";
                }
                
                // Update select all button
                if (selectedValues.size === allValues.size) {
                    selectAllOption.textContent = "✓ Unselect All";
                } else {
                    selectAllOption.textContent = "Select All";
                }
                
                updateFilter();
            };
        });
        
        // Set initial selected background
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
            opt.style.background = "#f0f8ff";
        });
    }
    
    // Load values after table data is ready
    table.on("dataLoaded", loadValues);
    setTimeout(loadValues, 100);
    
    // Button hover effect
    button.onmouseover = function() {
        button.style.borderColor = "#007bff";
        button.style.background = "#f8f9fa";
    };
    
    button.onmouseout = function() {
        button.style.borderColor = "#ccc";
        button.style.background = "white";
    };
    
    button.onclick = function(e) {
        e.stopPropagation();
        
        if (isOpen) {
            dropdown.style.display = "none";
            isOpen = false;
        } else {
            dropdown.style.display = "block";
            isOpen = true;
            
            // Adjust position if dropdown goes off-screen
            var dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight - 20) {
                dropdown.style.top = "auto";
                dropdown.style.bottom = "100%";
                dropdown.style.marginTop = "0";
                dropdown.style.marginBottom = "2px";
            }
            
            if (dropdownRect.right > window.innerWidth - 20) {
                dropdown.style.left = "auto";
                dropdown.style.right = "0";
            }
        }
    };
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (isOpen && !container.contains(e.target)) {
            dropdown.style.display = "none";
            isOpen = false;
        }
    });
    
    container.appendChild(button);
    container.appendChild(dropdown);
    
    return container;
}
