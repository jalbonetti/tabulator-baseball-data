document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages: DOM ready, initializing Tabulator with working dropdowns...');

    // Check if required element exists
    var tableElement = document.getElementById('batter-table');
    if (!tableElement) {
        console.error("Element 'batter-table' not found!");
        return;
    } else {
        console.log("Found batter-table element, proceeding with initialization...");
    }
    
    // Add CSS for dropdowns with proper z-index stacking
    var style = document.createElement('style');
    style.textContent = `
        .tabulator { position: relative !important; z-index: 1 !important; }
        .tabulator .tabulator-header { overflow: visible !important; position: relative !important; z-index: 100 !important; }
        .tabulator .tabulator-header .tabulator-col { overflow: visible !important; position: relative !important; z-index: 101 !important; }
        .tabulator .tabulator-header .tabulator-col .tabulator-header-filter { overflow: visible !important; position: relative !important; z-index: 102 !important; }
        .tabulator .tabulator-tableHolder { position: relative !important; z-index: 50 !important; }
        .custom-multiselect { position: relative !important; width: 100% !important; z-index: 103 !important; }
        .custom-multiselect-button { width: 100% !important; padding: 4px 8px !important; border: 1px solid #ccc !important; background: white !important; cursor: pointer !important; font-size: 11px !important; user-select: none !important; pointer-events: auto !important; position: relative !important; z-index: 104 !important; }
        .custom-multiselect-button:hover { background: #f8f9fa !important; border-color: #007bff !important; }
        .custom-multiselect-dropdown { position: fixed !important; min-width: 200px !important; background: white !important; border: 2px solid #007bff !important; max-height: 250px !important; overflow-y: auto !important; z-index: 999999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; border-radius: 4px !important; }
        .custom-multiselect-dropdown.show { display: block !important; visibility: visible !important; opacity: 1 !important; }
        .custom-multiselect-dropdown.hide { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        .custom-multiselect-option { padding: 8px 12px !important; cursor: pointer !important; font-size: 12px !important; user-select: none !important; pointer-events: auto !important; border-bottom: 1px solid #eee !important; background: white !important; }
        .custom-multiselect-option:hover { background: #f8f9fa !important; }
        .custom-multiselect-option.selected { background: #007bff !important; color: white !important; }
        .custom-multiselect-option.select-all { font-weight: bold !important; background: #f8f9fa !important; border-bottom: 2px solid #007bff !important; }
        .custom-multiselect-option.select-all.selected { background: #28a745 !important; color: white !important; }
    `;
    document.head.appendChild(style);
    
    // Custom multiselect function
    function createCustomMultiSelect(cell, onRendered, success, cancel) {
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
            if (selectedValues.length === 0) {
                success(function() { return false; });
            } else if (selectedValues.length === allValues.length) {
                success("");
            } else {
                success(function(data) {
                    return selectedValues.indexOf(String(data[field])) !== -1;
                });
            }
            setTimeout(function() { if (table && table.redraw) table.redraw(); }, 10);
        }
        
        setTimeout(function() {
            table.getData().forEach(function(row) {
                var value = row[field];
                if (value && allValues.indexOf(String(value)) === -1) {
                    allValues.push(String(value));
                }
            });
            allValues.sort();
            
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
    
    // Create table
    var mainTable = new Tabulator("#batter-table", {
        ajaxURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/ModBatterClearances",
        ajaxConfig: {
            method: "GET",
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Content-Type": "application/json"
            }
        },
        layout: "fitColumns",
        height: 400,
        columns: [
            {title: "Name", field: "Batter Name", width: 200, headerFilter: true},
            {title: "Team", field: "Batter Team", width: 100, headerFilter: createCustomMultiSelect},
            {title: "Prop", field: "Batter Prop Type", width: 150, headerFilter: createCustomMultiSelect},
            {title: "Value", field: "Batter Prop Value", width: 100, headerFilter: createCustomMultiSelect},
            {title: "Season %", field: "Clearance Season", width: 100, formatter: function(cell) {
                var value = cell.getValue();
                if (value === null || value === undefined) return "0%";
                return (parseFloat(value) * 100).toFixed(1) + "%";
            }}
        ],
        dataLoaded: function(data) {
            console.log("GitHub Pages table with working dropdowns loaded:", data.length, "records");
        }
    });
});
