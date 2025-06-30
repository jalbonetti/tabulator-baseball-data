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
    var dropdownId = 'dropdown_' + field.replace(/\s+/g, '_') + '_' + Date.now();
    
    function createDropdown() {
        // Remove any existing dropdown
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
        
        // Add to body
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
    
    function showDropdown() {
        var dropdown = document.getElementById(dropdownId) || createDropdown();
        dropdown.innerHTML = '';
        
        // Position dropdown
        var buttonRect = button.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 2) + 'px';
        dropdown.style.display = 'block';
        
        // Add select all
        var selectAll = document.createElement("div");
        selectAll.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 2px solid #007bff;
            font-weight: bold;
            background: #f8f9fa;
        `;
        selectAll.innerHTML = `
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" ${selectedValues.length === allValues.length ? 'checked' : ''} style="margin-right: 8px;">
                ${selectedValues.length === allValues.length ? 'Unselect All' : 'Select All'}
            </label>
        `;
        
        selectAll.addEventListener('click', function(e) {
            e.stopPropagation();
            var checkbox = selectAll.querySelector('input');
            
            if (selectedValues.length === allValues.length) {
                selectedValues = [];
                checkbox.checked = false;
                selectAll.querySelector('label').childNodes[1].textContent = ' Select All';
            } else {
                selectedValues = [...allValues];
                checkbox.checked = true;
                selectAll.querySelector('label').childNodes[1].textContent = ' Unselect All';
            }
            
            // Update all checkboxes
            dropdown.querySelectorAll('.option-item input').forEach(function(cb, index) {
                cb.checked = selectedValues.includes(allValues[index]);
            });
            
            updateButtonText();
            updateFilter();
        });
        
        dropdown.appendChild(selectAll);
        
        // Add options
        allValues.forEach(function(value, index) {
            var optionDiv = document.createElement("div");
            optionDiv.className = "option-item";
            optionDiv.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            
            optionDiv.innerHTML = `
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" ${selectedValues.includes(value) ? 'checked' : ''} style="margin-right: 8px;">
                    ${value}
                </label>
            `;
            
            optionDiv.addEventListener('click', function(e) {
                e.stopPropagation();
                var checkbox = optionDiv.querySelector('input');
                
                if (selectedValues.includes(value)) {
                    selectedValues = selectedValues.filter(v => v !== value);
                    checkbox.checked = false;
                } else {
                    selectedValues.push(value);
                    checkbox.checked = true;
                }
                
                // Update select all
                var selectAllCb = selectAll.querySelector('input');
                if (selectedValues.length === allValues.length) {
                    selectAllCb.checked = true;
                    selectAll.querySelector('label').childNodes[1].textContent = ' Unselect All';
                } else {
                    selectAllCb.checked = false;
                    selectAll.querySelector('label').childNodes[1].textContent = ' Select All';
                }
                
                updateButtonText();
                updateFilter();
            });
            
            // Hover effect
            optionDiv.addEventListener('mouseenter', function() {
                optionDiv.style.background = '#f0f0f0';
            });
            
            optionDiv.addEventListener('mouseleave', function() {
                optionDiv.style.background = 'white';
            });
            
            dropdown.appendChild(optionDiv);
        });
        
        // Adjust position if off-screen
        setTimeout(function() {
            var dropdownRect = dropdown.getBoundingClientRect();
            if (dropdownRect.bottom > window.innerHeight) {
                dropdown.style.top = (buttonRect.top - dropdown.offsetHeight - 2) + 'px';
            }
            if (dropdownRect.right > window.innerWidth) {
                dropdown.style.left = (window.innerWidth - dropdown.offsetWidth - 10) + 'px';
            }
        }, 0);
    }
    
    function hideDropdown() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
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
        allValues = [];
        var uniqueValues = new Set();
        
        table.getData().forEach(function(row) {
            var value = row[field];
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
        
        selectedValues = [...allValues];
        updateButtonText();
    }
    
    // Button click
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var dropdown = document.getElementById(dropdownId);
        if (dropdown && dropdown.style.display === 'block') {
            hideDropdown();
        } else {
            showDropdown();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown && dropdown.style.display === 'block' && !dropdown.contains(e.target) && e.target !== button) {
            hideDropdown();
        }
    });
    
    // Load values
    table.on("dataLoaded", loadValues);
    setTimeout(loadValues, 100);
    
    // Cleanup on cell removal
    cell.getElement().addEventListener('DOMNodeRemoved', function() {
        var dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.remove();
        }
    });
    
    return button;
}
