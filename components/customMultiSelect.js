// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
    // Create a select element with multiple attribute
    var select = document.createElement("select");
    select.multiple = true;
    select.style.cssText = `
        width: 100%;
        min-height: 25px;
        font-size: 11px;
        border: 1px solid #ccc;
        padding: 2px;
    `;
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    
    function updateFilter() {
        var selected = Array.from(select.selectedOptions).map(opt => opt.value);
        
        if (selected.length === 0) {
            // No selection = hide all
            success(false);
        } else if (selected.length === allValues.length) {
            // All selected = show all
            success("");
        } else {
            // Some selected = filter
            success(function(cellValue) {
                return selected.includes(String(cellValue));
            });
        }
    }
    
    function loadValues() {
        // Clear existing options
        select.innerHTML = '';
        allValues = [];
        
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
        
        // Add options
        allValues.forEach(function(value) {
            var option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = true; // Start with all selected
            select.appendChild(option);
        });
        
        // Adjust size based on number of options (max 5 visible)
        select.size = Math.min(allValues.length, 5);
    }
    
    // Handle change event
    select.addEventListener('change', function() {
        updateFilter();
    });
    
    // Add Ctrl+A / Cmd+A to select all
    select.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            for (var i = 0; i < select.options.length; i++) {
                select.options[i].selected = true;
            }
            updateFilter();
        }
    });
    
    // Load values when table data is ready
    table.on("dataLoaded", function() {
        loadValues();
    });
    
    // Initial load
    setTimeout(function() {
        loadValues();
    }, 100);
    
    // Add a helper text
    var container = document.createElement("div");
    container.style.position = "relative";
    
    var helperText = document.createElement("div");
    helperText.style.cssText = "font-size: 9px; color: #666; margin-top: 2px;";
    helperText.textContent = "Ctrl+Click to multi-select";
    
    container.appendChild(select);
    container.appendChild(helperText);
    
    return container;
}
