// Variables to hold table instances
var table1, table2;
var currentActiveTab = 'table1';

// Create tabs and inject CSS directly
document.addEventListener('DOMContentLoaded', function() {
    // Create wrapper for centering if it doesn't exist
    var tableElement = document.getElementById('batter-table');
    if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
        var wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
        
        // Create tabs container
        var tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.innerHTML = `
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="table1">Batter Prop Clearances</button>
                <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
            </div>
        `;
        
        // Create table containers wrapper
        var tablesContainer = document.createElement('div');
        tablesContainer.className = 'tables-container';
        tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
        
        // Move original table into first container
        var table1Container = document.createElement('div');
        table1Container.className = 'table-container active-table';
        table1Container.id = 'table1-container';
        table1Container.style.cssText = 'width: 100%; display: block;';
        
        // Create second table container
        var table2Container = document.createElement('div');
        table2Container.className = 'table-container inactive-table';
        table2Container.id = 'table2-container';
        table2Container.style.cssText = 'width: 100%; display: none;';
        
        // Create second table element
        var table2Element = document.createElement('div');
        table2Element.id = 'batter-table-alt';
        
        tableElement.parentNode.insertBefore(wrapper, tableElement);
        wrapper.appendChild(tabsContainer);
        wrapper.appendChild(tablesContainer);
        
        // Move table1 into its container
        table1Container.appendChild(tableElement);
        table2Container.appendChild(table2Element);
        
        tablesContainer.appendChild(table1Container);
        tablesContainer.appendChild(table2Container);
        
        // Set up tab switching functionality
        setupTabSwitching();
        
        // Initialize tables
        initializeTables();
    }
    
    // Inject CSS styles directly
    var style = document.createElement('style');
    style.textContent = `
        /* Table centering */
        .table-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 auto !important;
        }
        
        /* Tab styling */
        .tabs-container {
            margin-bottom: 20px;
            z-index: 10;
        }
        
        .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 10px;
        }
        
        .tab-button {
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .tab-button:hover {
            background: #e9ecef;
        }
        
        .tab-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        /* Table container styling */
        .tables-container {
            width: 100% !important;
            position: relative !important;
        }
        
        .table-container {
            width: 100% !important;
        }
        
        .table-container.active-table {
            display: block !important;
            position: relative !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .table-container.inactive-table {
            display: none !important;
            position: absolute !important;
            top: 0 !important;
            left: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
        
        #batter-table, #batter-table-alt {
            width: auto !important;
            max-width: 95% !important;
            margin: 0 auto !important;
        }
        
        /* Disable column resizing */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-resize-handle {
            display: none !important;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            resize: none !important;
        }
        
        /* Disable row height resizing */
        .tabulator .tabulator-row .tabulator-cell {
            resize: none !important;
        }
        
        /* FIXED: Prevent header overflow clipping */
        .tabulator .tabulator-header {
            overflow: visible !important;
        }
        
        .tabulator .tabulator-header .tabulator-col {
            overflow: visible !important;
        }
        
        /* Custom multiselect dropdown styling */
        .custom-multiselect {
            position: relative !important;
            display: inline-block !important;
            width: 100% !important;
            min-width: 150px !important;
        }
        
        .custom-multiselect-button {
            width: 100% !important;
            padding: 4px 8px !important;
            border: 1px solid #ccc !important;
            background: white !important;
            text-align: left !important;
            cursor: pointer !important;
            font-size: 11px !important;
            min-height: 24px !important;
            box-sizing: border-box !important;
            user-select: none !important;
        }
        
        .custom-multiselect-button:after {
            content: "▼" !important;
            float: right !important;
            font-size: 10px !important;
            color: #666 !important;
        }
        
        /* FIXED: Higher z-index and better positioning */
        .custom-multiselect-dropdown {
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            min-width: 200px !important;
            background: white !important;
            border: 1px solid #ccc !important;
            border-top: none !important;
            max-height: 250px !important;
            overflow-y: auto !important;
            z-index: 9999 !important;
            display: none !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        }
        
        .custom-multiselect-option {
            padding: 6px 10px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            user-select: none !important;
            white-space: nowrap !important;
        }
        
        .custom-multiselect-option:hover {
            background: #f0f0f0 !important;
        }
        
        .custom-multiselect-option.selected {
            background: #007bff !important;
            color: white !important;
        }
        
        .custom-multiselect-option.select-all {
            font-weight: bold !important;
            border-bottom: 1px solid #ccc !important;
            background: #f8f9fa !important;
        }
        
        .custom-multiselect-option.select-all:hover {
            background: #e9ecef !important;
        }
        
        .custom-multiselect-option.select-all.selected {
            background: #28a745 !important;
            color: white !important;
        }
        
        /* Alternating row colors with higher specificity */
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even) {
            background-color: #f8f9fa !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd) {
            background-color: #ffffff !important;
        }
        
        /* Ensure alternating colors stay on hover */
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even):hover {
            background-color: #e9ecef !important;
        }
        
        .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd):hover {
            background-color: #f8f9fa !important;
        }
        
        /* Center header text and vertically center all headers */
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 40px !important;
        }
        
        .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-col-title {
            text-align: center !important;
            line-height: 1.2 !important;
        }
        
        /* Center cell content horizontally */
        .tabulator .tabulator-cell {
            text-align: center !important;
        }
        
        .tabulator .tabulator-cell .tabulator-cell-value {
            text-align: center !important;
            width: 100% !important;
        }
        
        /* Special handling for name column - keep left aligned */
        .tabulator .tabulator-cell[tabulator-field="Batter Name"] {
            text-align: left !important;
        }
        
        .tabulator .tabulator-cell[tabulator-field="Batter Name"] .tabulator-cell-value {
            text-align: left !important;
        }
        
        /* Remove sorting from subtables */
        .subrow-container .tabulator .tabulator-header .tabulator-col {
            cursor: default !important;
        }
        
        .subrow-container .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
            cursor: default !important;
        }
        
        .subrow-container .tabulator .tabulator-header .tabulator-col:hover {
            background: inherit !important;
        }
        
        /* Center subtable content */
        .subrow-container .tabulator .tabulator-cell {
            text-align: center !important;
        }
        
        .subrow-container .tabulator .tabulator-cell .tabulator-cell-value {
            text-align: center !important;
        }
        
        /* Keep subtable players column left-aligned */
        .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] {
            text-align: left !important;
        }
        
        .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] .tabulator-cell-value {
            text-align: left !important;
        }
    `;
    document.head.appendChild(style);
});

function setupTabSwitching() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-button')) {
            var targetTab = e.target.dataset.tab;
            console.log('Switching to tab:', targetTab);
            
            // Update button states
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Get containers
            var table1Container = document.getElementById('table1-container');
            var table2Container = document.getElementById('table2-container');
            
            // Hide all containers
            if (table1Container) {
                table1Container.className = 'table-container inactive-table';
            }
            if (table2Container) {
                table2Container.className = 'table-container inactive-table';
            }
            
            // Show target container
            if (targetTab === 'table1' && table1Container) {
                table1Container.className = 'table-container active-table';
                currentActiveTab = 'table1';
                console.log('Table 1 container is now active');
                
                setTimeout(function() {
                    if (table1) {
                        table1.redraw();
                        console.log('Table 1 redrawn');
                    }
                }, 100);
                
            } else if (targetTab === 'table2' && table2Container) {
                table2Container.className = 'table-container active-table';
                currentActiveTab = 'table2';
                console.log('Table 2 container is now active');
                
                setTimeout(function() {
                    if (table2) {
                        table2.redraw();
                        console.log('Table 2 redrawn');
                    }
                }, 100);
            }
        }
    });
}

// Helper function to extract opponent team from matchup
function getOpponentTeam(matchup, playerTeam) {
    if (!matchup || !playerTeam) return '';
    
    console.log('Processing matchup:', matchup, 'for player team:', playerTeam);
    
    // Clean up the matchup string - remove any time/date info and extra whitespace
    var cleanMatchup = matchup.trim();
    
    // Remove common time/date patterns like "(7:05 PM)", "7:05", date info, etc.
    cleanMatchup = cleanMatchup.replace(/\s*\([^)]*\)\s*/g, ''); // Remove anything in parentheses
    cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}:\d{2}\s*(PM|AM)?\s*/gi, ''); // Remove time patterns
    cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}\/\d{1,2}\/\d{4}\s*/g, ''); // Remove full date patterns
    cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}\/\d{1,2}\s*/g, ''); // Remove short date patterns
    cleanMatchup = cleanMatchup.replace(/\s*\d{4}\s*EST\s*/gi, ''); // Remove year and timezone
    cleanMatchup = cleanMatchup.replace(/\s*(EST|PST|CST|MST)\s*/gi, ''); // Remove timezones
    cleanMatchup = cleanMatchup.replace(/\s+/g, ' ').trim(); // Clean up extra spaces
    
    console.log('Cleaned matchup:', cleanMatchup);
    
    var teams = [];
    
    // Try different separators: @, vs, v, -
    if (cleanMatchup.includes(' @ ')) {
        teams = cleanMatchup.split(' @ ');
    } else if (cleanMatchup.includes(' vs ')) {
        teams = cleanMatchup.split(' vs ');
    } else if (cleanMatchup.includes(' v ')) {
        teams = cleanMatchup.split(' v ');
    } else if (cleanMatchup.includes(' - ')) {
        teams = cleanMatchup.split(' - ');
    } else {
        // Fallback: try to find team abbreviations (2-4 letters each)
        var matches = cleanMatchup.match(/\b[A-Z]{2,4}\b/g);
        if (matches && matches.length >= 2) {
            teams = matches;
        }
    }
    
    if (teams.length >= 2) {
        var team1 = teams[0].trim();
        var team2 = teams[1].trim();
        
        // Extract just the team abbreviation (2-4 capital letters)
        var team1Match = team1.match(/\b[A-Z]{2,4}\b/);
        var team2Match = team2.match(/\b[A-Z]{2,4}\b/);
        
        if (team1Match) team1 = team1Match[0];
        if (team2Match) team2 = team2Match[0];
        
        console.log('Found teams:', team1, 'and', team2);
        
        // Return the team that's not the player's team
        if (team1 === playerTeam) {
            console.log('Returning opponent:', team2);
            return team2;
        } else if (team2 === playerTeam) {
            console.log('Returning opponent:', team1);
            return team1;
        } else {
            // If neither matches exactly, try partial matching
            if (team1.includes(playerTeam) || playerTeam.includes(team1)) {
                return team2;
            } else {
                return team1;
            }
        }
    }
    
    console.log('Could not determine opponent team');
    return '';
}

// Helper function to determine what switch hitters face
function getSwitchHitterVersus(batterHandedness, pitcherHandedness) {
    if (batterHandedness !== 'S') {
        // Not a switch hitter, use original logic
        return batterHandedness === "L" ? "Lefties" : "Righties";
    }
    
    // Switch hitter logic - they bat with the opposite hand of the pitcher
    if (pitcherHandedness === 'R') {
        return "Lefties"; // Switch hitter bats left against righties, so pitcher faces lefties
    } else if (pitcherHandedness === 'L') {
        return "Righties"; // Switch hitter bats right against lefties, so pitcher faces righties
    } else {
        return "Switch"; // Fallback
    }
}

// FIXED: Custom multiselect filter function with proper Tabulator integration
function createCustomMultiSelect(cell, onRendered, success, cancel, editorParams) {
    console.log("Creating multiselect for field:", cell.getColumn().getField());
    
    var container = document.createElement("div");
    container.className = "custom-multiselect";
    
    var button = document.createElement("div");
    button.className = "custom-multiselect-button";
    button.textContent = "Loading...";
    
    var dropdown = document.createElement("div");
    dropdown.className = "custom-multiselect-dropdown";
    
    var field = cell.getColumn().getField();
    var table = cell.getTable();
    var allValues = [];
    var selectedValues = [];
    var isOpen = false;
    var initialized = false;
    
    // Function to populate dropdown options
    function populateDropdown() {
        console.log("Populating dropdown for field:", field);
        
        // Clear existing options
        dropdown.innerHTML = '';
        allValues = [];
        
        // Get all unique values for this column
        table.getData().forEach(function(row) {
            var value = row[field];
            if (value !== null && value !== undefined && value !== '') {
                var stringValue = String(value);
                if (allValues.indexOf(stringValue) === -1) {
                    allValues.push(stringValue);
                }
            }
        });
        
        allValues.sort();
        console.log("Found values for", field + ":", allValues);
        
        if (allValues.length === 0) {
            button.textContent = "No data";
            return;
        }
    
    // Create select all option
    var selectAllOption = document.createElement("div");
    selectAllOption.className = "custom-multiselect-option select-all";
    selectAllOption.textContent = "Select All";
    
    // FIXED: Use click instead of mousedown and stop propagation properly
    selectAllOption.addEventListener("click", function(e) {
        console.log("Select all clicked");
        e.preventDefault();
        e.stopPropagation();
        if (selectedValues.length === allValues.length) {
            // Unselect all
            selectedValues = [];
        } else {
            // Select all
            selectedValues = allValues.slice();
        }
        updateDropdown();
        updateButtonText();
        applyFilter();
    });
    dropdown.appendChild(selectAllOption);
    
    // Create options for each value
    allValues.forEach(function(value) {
        var option = document.createElement("div");
        option.className = "custom-multiselect-option";
        option.textContent = value;
        option.setAttribute('data-value', value);
        
        // FIXED: Use click instead of mousedown
        option.addEventListener("click", function(e) {
            console.log("Option clicked:", value);
            e.preventDefault();
            e.stopPropagation();
            var index = selectedValues.indexOf(value);
            if (index === -1) {
                selectedValues.push(value);
            } else {
                selectedValues.splice(index, 1);
            }
            updateDropdown();
            updateButtonText();
            applyFilter();
        });
        dropdown.appendChild(option);
    });
    
    function updateDropdown() {
        var options = dropdown.querySelectorAll('.custom-multiselect-option:not(.select-all)');
        options.forEach(function(option) {
            var value = option.getAttribute('data-value');
            if (selectedValues.indexOf(value) !== -1) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Update select all option
        if (selectedValues.length === allValues.length && allValues.length > 0) {
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
    
    // FIXED: Proper filter application that Tabulator understands
    function applyFilter() {
        if (selectedValues.length === 0) {
            // If nothing selected, hide all rows
            success(function(data, filterParams) {
                return false; // Hide all rows
            });
        } else if (selectedValues.length === allValues.length) {
            // If all selected, show all rows
            success(function(data, filterParams) {
                return true; // Show all rows
            });
        } else {
            // Apply multiselect filter
            success(function(data, filterParams) {
                var cellValue = data[field];
                return selectedValues.indexOf(String(cellValue)) !== -1;
            });
        }
    }
    
    // FIXED: Better event handling for button click
    button.addEventListener("click", function(e) {
        console.log("Button clicked, current isOpen:", isOpen);
        e.preventDefault();
        e.stopPropagation();
        isOpen = !isOpen;
        dropdown.style.display = isOpen ? "block" : "none";
        console.log("Dropdown display set to:", dropdown.style.display);
        
        // Close other dropdowns
        document.querySelectorAll('.custom-multiselect-dropdown').forEach(function(otherDropdown) {
            if (otherDropdown !== dropdown) {
                otherDropdown.style.display = "none";
            }
        });
    });
    
    // FIXED: Close dropdown when clicking outside, but don't interfere with dropdown clicks
    document.addEventListener("click", function(e) {
        if (!container.contains(e.target)) {
            isOpen = false;
            dropdown.style.display = "none";
        }
    });
    
    container.appendChild(button);
    container.appendChild(dropdown);
    
    // Initialize with all values selected
    selectedValues = allValues.slice();
    updateDropdown();
    updateButtonText();
    
    // FIXED: Don't apply initial filter immediately, let Tabulator handle it
    return container;
}

function initializeTables() {
    // Original Table
    table1 = new Tabulator("#batter-table", {
        ajaxURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/ModBatterClearances",
        ajaxConfig: {
            method: "GET",
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Content-Type": "application/json"
            },
        },
        layout: "fitColumns",
        responsiveLayout: "hide",
        persistence: false,
        ajaxContentType: "json",
        paginationSize: false,
        height: false,
        resizableColumns: false,
        resizableRows: false,
        movableColumns: false,
        columns: [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: function(cell, formatterParams, onRendered) {
                        var value = cell.getValue();
                        var row = cell.getRow();
                        var expanded = row.getData()._expanded || false;
                        
                        onRendered(function() {
                            try {
                                var cellElement = cell.getElement();
                                if (cellElement && cellElement.querySelector) {
                                    cellElement.innerHTML = '';
                                    
                                    var container = document.createElement("div");
                                    container.style.display = "flex";
                                    container.style.alignItems = "center";
                                    container.style.cursor = "pointer";
                                    
                                    var expander = document.createElement("span");
                                    expander.innerHTML = expanded ? "−" : "+";
                                    expander.style.marginRight = "8px";
                                    expander.style.fontWeight = "bold";
                                    expander.style.color = "#007bff";
                                    expander.style.fontSize = "14px";
                                    expander.style.minWidth = "12px";
                                    expander.classList.add("row-expander");
                                    
                                    var textSpan = document.createElement("span");
                                    textSpan.textContent = value || "";
                                    
                                    container.appendChild(expander);
                                    container.appendChild(textSpan);
                                    
                                    cellElement.appendChild(container);
                                }
                            } catch (error) {
                                console.error("Error in formatter onRendered:", error);
                            }
                        });
                        
                        return (expanded ? "− " : "+ ") + (value || "");
                    }
                },
                {title: "Team", field: "Batter Team", width: 220, sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                }
            ]},
            {title: "Prop Info", columns: [
                {title: "Prop", field: "Batter Prop Type", width: 220, sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {title: "Value", field: "Batter Prop Value", width: 220, sorter: "number", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                }
            ]},
            {title: "Full Season", columns: [
                {title: "% Above", field: "Clearance Season", width: 100, 
                    sorter: "number", 
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "0%";
                        return (parseFloat(value) * 100).toFixed(1) + "%";
                    }
                },
                {title: "Games", field: "Games Season", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Full Season (Home/Away)", columns: [
                {title: "% Above", field: "Clearance Season At", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "0%";
                        return (parseFloat(value) * 100).toFixed(1) + "%";
                    }
                },
                {title: "Games", field: "Games Season At", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Last 30 Days", columns: [
                {title: "% Above", field: "Clearance 30", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "0%";
                        return (parseFloat(value) * 100).toFixed(1) + "%";
                    }
                },
                {title: "Games", field: "Games 30", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]},
            {title: "Last 30 Days (Home/Away)", columns: [
                {title: "% Above", field: "Clearance 30 At", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "0%";
                        return (parseFloat(value) * 100).toFixed(1) + "%";
                    }
                },
                {title: "Games", field: "Games 30 At", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]}
        ],
        initialSort: [
            {column: "Batter Name", dir: "asc"},
            {column: "Batter Team", dir: "asc"},
            {column: "Batter Prop Type", dir: "asc"},
            {column: "Batter Prop Value", dir: "asc"}
        ],
        rowFormatter: function(row) {
            var data = row.getData();
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                var holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                var subtable1 = document.createElement("div");
                var subtable2 = document.createElement("div");
                
                holderEl.appendChild(subtable1);
                holderEl.appendChild(subtable2);
                row.getElement().appendChild(holderEl);
                
                new Tabulator(subtable1, {
                    layout: "fitColumns",
                    columnHeaderSortMulti: false,
                    data: [{
                        propFactor: data["Batter Prop Park Factor"],
                        lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                        matchup: data["Matchup"],
                        opposingPitcher: data["SP"]
                    }],
                    columns: [
                        {title: "Prop Park Factor", field: "propFactor", headerSort: false},
                        {title: "Lineup Status", field: "lineupStatus", headerSort: false},
                        {title: "Matchup", field: "matchup", headerSort: false, width: 150},
                        {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false}
                    ]
                });
                
                var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
                var handsText = getSwitchHitterVersus(data["Handedness"], data["SP Handedness"]);
                
                // For switch hitters, determine pitcher-specific matchups
                var spVersusText = handsText;
                var rrVersusText = data["Handedness"] === "S" ? "Lefties" : handsText;
                var lrVersusText = data["Handedness"] === "S" ? "Righties" : handsText;
                
                new Tabulator(subtable2, {
                    layout: "fitColumns",
                    columnHeaderSortMulti: false,
                    data: [
                        {
                            player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                            fullSeason: data["Batter Prop Total R Season"],
                            fullSeasonHA: data["Batter Prop Total R Season At"],
                            last30: data["Batter Prop Total R 30"],
                            last30HA: data["Batter Prop Total R 30 At"]
                        },
                        {
                            player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                            fullSeason: data["Batter Prop Total L Season"],
                            fullSeasonHA: data["Batter Prop Total L Season At"],
                            last30: data["Batter Prop Total L 30"],
                            last30HA: data["Batter Prop Total L 30 At"]
                        },
                        {
                            player: data["SP"] + " Versus " + spVersusText,
                            fullSeason: data["SP Prop Total Vs Season"],
                            fullSeasonHA: data["SP Prop Total Vs Season At"],
                            last30: data["SP Prop Total Vs 30"],
                            last30HA: data["SP Prop Total Vs 30 At"]
                        },
                        {
                            player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + data["R Relievers"] + ") Versus " + rrVersusText,
                            fullSeason: data["RR Prop Total Vs Season"],
                            fullSeasonHA: data["RR Prop Total Vs Season At"],
                            last30: data["RR Prop Total Vs 30"],
                            last30HA: data["RR Prop Total Vs 30 At"]
                        },
                        {
                            player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + data["L Relievers"] + ") Versus " + lrVersusText,
                            fullSeason: data["LR Prop Total Vs Season"],
                            fullSeasonHA: data["LR Prop Total Vs Season At"],
                            last30: data["LR Prop Total Vs 30"],
                            last30HA: data["LR Prop Total Vs 30 At"]
                        }
                    ],
                    columns: [
                        {title: "Players", field: "player", headerSort: false},
                        {title: "Full Season", field: "fullSeason", headerSort: false},
                        {title: "Full Season (Home/Away)", field: "fullSeasonHA", headerSort: false},
                        {title: "Last 30 Days", field: "last30", headerSort: false},
                        {title: "Last 30 Days (Home/Away)", field: "last30HA", headerSort: false}
                    ]
                });
            } else if (!data._expanded) {
                var existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        },
        dataLoaded: function(data) {
            console.log("Table 1 loaded", data.length, "total records");
            data.forEach(function(row) {
                row._expanded = false;
            });
        }
    });

    // Alternative Table
    table2 = new Tabulator("#batter-table-alt", {
        ajaxURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/ModBatterClearancesAlt?limit=10000",
        ajaxConfig: {
            method: "GET",
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
                "Content-Type": "application/json"
            },
        },
        layout: "fitColumns",
        responsiveLayout: "hide",
        persistence: false,
        ajaxContentType: "json",
        paginationSize: false,
        height: false,
        resizableColumns: false,
        resizableRows: false,
        movableColumns: false,
        columns: [
            {title: "Player Info", columns: [
                {
                    title: "Name", 
                    field: "Batter Name", 
                    width: 200, 
                    sorter: "string", 
                    headerFilter: true,
                    resizable: false,
                    formatter: function(cell, formatterParams, onRendered) {
                        var value = cell.getValue();
                        var row = cell.getRow();
                        var expanded = row.getData()._expanded || false;
                        
                        onRendered(function() {
                            try {
                                var cellElement = cell.getElement();
                                if (cellElement && cellElement.querySelector) {
                                    cellElement.innerHTML = '';
                                    
                                    var container = document.createElement("div");
                                    container.style.display = "flex";
                                    container.style.alignItems = "center";
                                    container.style.cursor = "pointer";
                                    
                                    var expander = document.createElement("span");
                                    expander.innerHTML = expanded ? "−" : "+";
                                    expander.style.marginRight = "8px";
                                    expander.style.fontWeight = "bold";
                                    expander.style.color = "#007bff";
                                    expander.style.fontSize = "14px";
                                    expander.style.minWidth = "12px";
                                    expander.classList.add("row-expander");
                                    
                                    var textSpan = document.createElement("span");
                                    textSpan.textContent = value || "";
                                    
                                    container.appendChild(expander);
                                    container.appendChild(textSpan);
                                    
                                    cellElement.appendChild(container);
                                }
                            } catch (error) {
                                console.error("Error in formatter onRendered:", error);
                            }
                        });
                        
                        return (expanded ? "− " : "+ ") + (value || "");
                    }
                },
                {title: "Team", field: "Batter Team", width: 220, sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                }
            ]},
            {title: "Prop Info", columns: [
                {title: "Prop", field: "Batter Prop Type", width: 220, sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {title: "Value", field: "Batter Prop Value", width: 220, sorter: "number", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false
                },
                {title: "Time/Location Split", field: "Batter Prop Split ID", width: 320, sorter: "string", 
                    headerFilter: createCustomMultiSelect,
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        var mapping = {
                            "Season": "Full Season",
                            "Season @": "Full Season (Home/Away)",
                            "Last 30 Days": "Last 30 Days",
                            "Last 30 Days @": "Last 30 Days (Home/Away)"
                        };
                        return mapping[value] || value;
                    }
                }
            ]},
            {title: "Prop Clearance", columns: [
                {title: "% Above", field: "Batter Clearance", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false,
                    formatter: function(cell) {
                        var value = cell.getValue();
                        if (value === null || value === undefined) return "0%";
                        // Fixed: Don't multiply by 100 since data is already in percentage format
                        return parseFloat(value).toFixed(1) + "%";
                    }
                },
                {title: "Games", field: "Batter Games", width: 100, 
                    sorter: "number",
                    sorterParams: {dir: "desc"},
                    resizable: false
                }
            ]}
        ],
        initialSort: [
            {column: "Batter Name", dir: "asc"},
            {column: "Batter Team", dir: "asc"},
            {column: "Batter Prop Type", dir: "asc"},
            {column: "Batter Prop Value", dir: "asc"}
        ],
        rowFormatter: function(row) {
            var data = row.getData();
            if (data._expanded && !row.getElement().querySelector('.subrow-container')) {
                var holderEl = document.createElement("div");
                holderEl.classList.add('subrow-container');
                holderEl.style.padding = "10px";
                holderEl.style.background = "#f8f9fa";
                
                var subtable1 = document.createElement("div");
                var subtable2 = document.createElement("div");
                
                holderEl.appendChild(subtable1);
                holderEl.appendChild(subtable2);
                row.getElement().appendChild(holderEl);
                
                new Tabulator(subtable1, {
                    layout: "fitColumns",
                    columnHeaderSortMulti: false,
                    resizableColumns: false,
                    resizableRows: false,
                    movableColumns: false,
                    data: [{
                        propFactor: data["Batter Prop Park Factor"],
                        lineupStatus: data["Lineup Status"] + ": " + data["Batting Position"],
                        matchup: data["Matchup"],
                        opposingPitcher: data["SP"]
                    }],
                    columns: [
                        {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 190, resizable: false},
                        {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 190, resizable: false},
                        {title: "Matchup", field: "matchup", headerSort: false, width: 300, resizable: false},
                        {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 180, resizable: false}
                    ]
                });
                
                var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
                
                // Fixed switch hitter logic for starting pitcher
                var spVersusText;
                if (data["Handedness"] === "S") {
                    // For switch hitters, show the opposite of the pitcher's handedness
                    if (data["SP Handedness"] === "R") {
                        spVersusText = "Righties"; // SP faces righties when switch hitter bats left
                    } else if (data["SP Handedness"] === "L") {
                        spVersusText = "Lefties"; // SP faces lefties when switch hitter bats right
                    } else {
                        spVersusText = "Switch";
                    }
                } else {
                    // Regular logic for non-switch hitters
                    spVersusText = data["Handedness"] === "L" ? "Lefties" : "Righties";
                }
                
                // For relievers with switch hitters
                var rrVersusText = data["Handedness"] === "S" ? "Righties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
                var lrVersusText = data["Handedness"] === "S" ? "Lefties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
                
                new Tabulator(subtable2, {
                    layout: "fitColumns",
                    columnHeaderSortMulti: false,
                    resizableColumns: false,
                    resizableRows: false,
                    movableColumns: false,
                    data: [
                        {
                            player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Righties",
                            propData: data["Batter Prop Total R"]
                        },
                        {
                            player: data["Batter Name"] + " (" + data["Handedness"] + ") Versus Lefties",
                            propData: data["Batter Prop Total L"]
                        },
                        {
                            player: data["SP"] + " Versus " + spVersusText,
                            propData: data["SP Prop Total"]
                        },
                        {
                            player: (opponentTeam ? opponentTeam + " " : "") + "Righty Relievers (" + data["R Relievers"] + ") Versus " + rrVersusText,
                            propData: data["RR Prop Total"]
                        },
                        {
                            player: (opponentTeam ? opponentTeam + " " : "") + "Lefty Relievers (" + data["L Relievers"] + ") Versus " + lrVersusText,
                            propData: data["LR Prop Total"]
                        }
                    ],
                    columns: [
                        {title: "Players", field: "player", headerSort: false, resizable: false},
                        {title: "Prop Data", field: "propData", headerSort: false, resizable: false}
                    ]
                });
            } else if (!data._expanded) {
                var existingSubrow = row.getElement().querySelector('.subrow-container');
                if (existingSubrow) {
                    existingSubrow.remove();
                }
            }
        },
        dataLoaded: function(data) {
            console.log("Table 2 loaded", data.length, "total records");
            data.forEach(function(row) {
                row._expanded = false;
            });
        }
    });

    // Handle row expansion/collapse for both tables
    function setupClickHandler(tableObj, tableId) {
        tableObj.on("cellClick", function(e, cell) {
            if (cell.getField() === "Batter Name") {
                var row = cell.getRow();
                var data = row.getData();
                data._expanded = !data._expanded;
                row.update(data);
                row.reformat();
                
                setTimeout(function() {
                    try {
                        var cellElement = cell.getElement();
                        if (cellElement && cellElement.querySelector) {
                            var expanderIcon = cellElement.querySelector('.row-expander');
                            if (expanderIcon) {
                                expanderIcon.innerHTML = data._expanded ? "−" : "+";
                            }
                        }
                    } catch (error) {
                        console.error("Error updating expander icon:", error);
                    }
                }, 100);
            }
        });
    }

    setupClickHandler(table1, "table1");
    setupClickHandler(table2, "table2");

    table1.on("tableBuilt", function() {
        console.log("Table 1 built successfully");
    });

    table2.on("tableBuilt", function() {
        console.log("Table 2 built successfully");
    });
}
