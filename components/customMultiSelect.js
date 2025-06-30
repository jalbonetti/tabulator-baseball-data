// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
    var container = document.createElement("div");
    container.className = "custom-multiselect";
    container.style.position = "relative";
    
    var button = document.createElement("div");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown hide";
    dropdown.style.cssText = `
        position: absolute !important;
        top: 100% !important;
        left: 0 !important;
        z-index: 99999 !important;
        background: white !important;
        border: 2px solid #007bff !important;
        min-width: 200px !important;
        max-height: 250px !important;
        overflow-y: auto !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        display: none !important;
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
        
        // Debug info
        var debugDiv = document.createElement("div");
        debugDiv.style.cssText = "padding: 5px; background: #f0f0f0; font-size: 10px;";
        debugDiv.textContent = `Field: ${field} (${sortedValues.length} values)`;
        dropdown.appendChild(debugDiv);
        
        var selectAllOption = document.createElement("div");
        selectAllOption.className = "custom-multiselect-option select-all selected";
        selectAllOption.textContent = "Unselect All";
        selectAllOption.style.cssText = "padding: 8px 12px; cursor: pointer; border-bottom: 2px solid #007bff; background: #28a745; color: white;";
        dropdown.appendChild(selectAllOption);
        
        sortedValues.forEach(function(value) {
            var option = document.createElement("div");
            option.className = "custom-multiselect-option selected";
            option.textContent = value;
            option.setAttribute('data-value', value);
            option.style.cssText = "padding: 8px 12px; cursor: pointer; background: #007bff; color: white; border-bottom: 1px solid #0056b3;";
            dropdown.appendChild(option);
        });
        
        button.textContent = "All selected";
        
        selectAllOption.onclick = function(e) {
            e.stopPropagation();
            if (selectedValues.size === allValues.size) {
                selectedValues.clear();
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.style.background = "white";
                    opt.style.color = "black";
                });
                selectAllOption.textContent = "Select All";
                selectAllOption.style.background = "#f8f9fa";
                selectAllOption.style.color = "black";
                button.textContent = "None selected";
            } else {
                selectedValues = new Set(allValues);
                dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(opt) {
                    opt.style.background = "#007bff";
                    opt.style.color = "white";
                });
                selectAllOption.textContent = "Unselect All";
                selectAllOption.style.background = "#28a745";
                selectAllOption.style.color = "white";
                button.textContent = "All selected";
            }
            updateFilter();
        };
        
        dropdown.querySelectorAll('.custom-multiselect-option[data-value]').forEach(function(option) {
            option.onmouseover = function() {
                if (!selectedValues.has(option.getAttribute('data-value'))) {
                    option.style.background = "#f8f9fa";
                }
            };
            
            option.onmouseout = function() {
                if (selectedValues.has(option.getAttribute('data-value'))) {
                    option.style.background = "#007bff";
                    option.style.color = "white";
                } else {
                    option.style.background = "white";
                    option.style.color = "black";
                }
            };
            
            option.onclick = function(e) {
                e.stopPropagation();
                var value = option.getAttribute('data-value');
                
                if (selectedValues.has(value)) {
                    selectedValues.delete(value);
                    option.style.background = "white";
                    option.style.color = "black";
                } else {
                    selectedValues.add(value);
                    option.style.background = "#007bff";
                    option.style.color = "white";
                }
                
                if (selectedValues.size === 0) {
                    button.textContent = "None selected";
                } else if (selectedValues.size === allValues.size) {
                    button.textContent = "All selected";
                } else {
                    button.textContent = selectedValues.size + " selected";
                }
                
                if (selectedValues.size === allValues.size) {
                    selectAllOption.textContent = "Unselect All";
                    selectAllOption.style.background = "#28a745";
                    selectAllOption.style.color = "white";
                } else {
                    selectAllOption.textContent = "Select All";
                    selectAllOption.style.background = "#f8f9fa";
                    selectAllOption.style.color = "black";
                }
                
                updateFilter();
            };
        });
    }
    
    // Load values after table data is ready
    table.on("dataLoaded", loadValues);
    setTimeout(loadValues, 100);
    
    button.onclick = function(e) {
        e.stopPropagation();
        
        if (isOpen) {
            dropdown.style.display = "none";
            isOpen = false;
        } else {
            // Debug: log position
            console.log("Opening dropdown for", field);
            console.log("Button position:", button.getBoundingClientRect());
            console.log("Container position:", container.getBoundingClientRect());
            
            dropdown.style.display = "block";
            isOpen = true;
            
            // Make sure the dropdown is visible
            var dropdownRect = dropdown.getBoundingClientRect();
            console.log("Dropdown position:", dropdownRect);
            
            // If dropdown is off-screen, adjust position
            if (dropdownRect.bottom > window.innerHeight) {
                dropdown.style.top = "auto";
                dropdown.style.bottom = "100%";
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
    
    // Append dropdown to container instead of body
    container.appendChild(button);
    container.appendChild(dropdown);
    
    return container;
}
