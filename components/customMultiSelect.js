// components/customMultiSelect.js
export function createCustomMultiSelect(cell, onRendered, success, cancel) {
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
            min-width: 200px;
            max-width: 300px;
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
            
            renderDropdown();
            updateButtonText();
            updateFilter();
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
            optionCheckbox.checked = selectedValues.includes(value);
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
                
                renderDropdown();
                updateButtonText();
                updateFilter();
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
            button.textContent = "None selected";
        } else if (selectedValues.length === allValues.length) {
            button.textContent = "All selected (" + allValues.length + ")";
        } else {
            button.textContent = selectedValues.length + " of " + allValues.length + " selected";
        }
    }
    
    function loadValues() {
        console.log("Loading values for field:", field);
        allValues = [];
        var uniqueValues = new Set();
        
        // Get data using the correct method
        var data = table.getData("active"); // Get filtered data
        console.log("Table has", data.length, "rows");
        
        // Log first row to see structure
        if (data.length > 0) {
            console.log("First row data:", data[0]);
            console.log("Field value in first row:", data[0][field]);
        }
        
        data.forEach(function(row, index) {
            var value = row[field];
            // Log first few values to debug
            if (index < 3) {
                console.log(`Row ${index} - ${field}:`, value);
            }
            if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(String(value));
            }
        });
        
        allValues = Array.from(uniqueValues);
        
        if (field === "Batter Prop Value") {
            allValues.sort(function(a, b) {
                return parseFloat(a) - parseFloat(b);
            });
        } else {
            allValues.sort();
        }
        
        console.log("Found unique values for", field + ":", allValues);
        
        selectedValues = [...allValues];
        updateButtonText();
    }
    
    // Button click
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isOpen) {
            hideDropdown();
        } else {
            // Reload values when opening
            loadValues();
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
    
    // Initial load with multiple attempts
    var loadAttempts = 0;
    var tryLoad = function() {
        loadAttempts++;
        console.log("Load attempt", loadAttempts, "for", field);
        
        var data = table.getData("active");
        if (data && data.length > 0) {
            loadValues();
        } else if (loadAttempts < 5) {
            setTimeout(tryLoad, 500);
        }
    };
    
    // Try loading immediately and with delays
    tryLoad();
    
    // Also listen for table events
    table.on("dataLoaded", function() {
        console.log("dataLoaded event for", field);
        setTimeout(loadValues, 100);
    });
    
    table.on("renderComplete", function() {
        console.log("renderComplete event for", field);
        if (allValues.length === 0) {
            loadValues();
        }
    });
    
    return button;
}
