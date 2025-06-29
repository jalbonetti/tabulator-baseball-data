// tabulator-bundle.js - Bundled version for Webflow (no modules)
(function() {
    'use strict';

    // ============= CONFIG =============
    const API_CONFIG = {
        baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
        headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Content-Type": "application/json"
        }
    };

    const TEAM_NAME_MAP = {
        'BAL': 'Baltimore Orioles',
        'BOS': 'Boston Red Sox',
        'NYY': 'New York Yankees',
        'TOR': 'Toronto Blue Jays',
        'CHW': 'Chicago White Sox',
        'CLE': 'Cleveland Guardians',
        'DET': 'Detroit Tigers',
        'KCR': 'Kansas City Royals',
        'MIN': 'Minnesota Twins',
        'HOU': 'Houston Astros',
        'LAA': 'Los Angeles Angels',
        'SEA': 'Seattle Mariners',
        'TEX': 'Texas Rangers',
        'ATL': 'Atlanta Braves',
        'MIA': 'Miami Marlins',
        'NYM': 'New York Mets',
        'PHI': 'Philadelphia Phillies',
        'WSN': 'Washington Nationals',
        'CHC': 'Chicago Cubs',
        'CIN': 'Cincinnati Reds',
        'MIL': 'Milwaukee Brewers',
        'PIT': 'Pittsburgh Pirates',
        'STL': 'St. Louis Cardinals',
        'ARI': 'Arizona Diamondbacks',
        'COL': 'Colorado Rockies',
        'LAD': 'Los Angeles Dodgers',
        'SDP': 'San Diego Padres',
        'SFG': 'San Francisco Giants',
        'ATH': 'Athletics',
        'TBR': 'Tampa Bay Rays'
    };

    // ============= UTILS =============
    function getOpponentTeam(matchup, playerTeam) {
        if (!matchup || !playerTeam) return '';
        
        var cleanMatchup = matchup.trim();
        cleanMatchup = cleanMatchup.replace(/\s*\([^)]*\)\s*/g, '');
        cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}:\d{2}\s*(PM|AM)?\s*/gi, '');
        cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}\/\d{1,2}\/\d{4}\s*/g, '');
        cleanMatchup = cleanMatchup.replace(/\s*\d{1,2}\/\d{1,2}\s*/g, '');
        cleanMatchup = cleanMatchup.replace(/\s*\d{4}\s*EST\s*/gi, '');
        cleanMatchup = cleanMatchup.replace(/\s*(EST|PST|CST|MST)\s*/gi, '');
        cleanMatchup = cleanMatchup.replace(/\s+/g, ' ').trim();
        
        var teams = [];
        
        if (cleanMatchup.includes(' @ ')) {
            teams = cleanMatchup.split(' @ ');
        } else if (cleanMatchup.includes(' vs ')) {
            teams = cleanMatchup.split(' vs ');
        } else if (cleanMatchup.includes(' v ')) {
            teams = cleanMatchup.split(' v ');
        } else if (cleanMatchup.includes(' - ')) {
            teams = cleanMatchup.split(' - ');
        } else {
            var matches = cleanMatchup.match(/\b[A-Z]{2,4}\b/g);
            if (matches && matches.length >= 2) {
                teams = matches;
            }
        }
        
        if (teams.length >= 2) {
            var team1 = teams[0].trim();
            var team2 = teams[1].trim();
            
            var team1Match = team1.match(/\b[A-Z]{2,4}\b/);
            var team2Match = team2.match(/\b[A-Z]{2,4}\b/);
            
            if (team1Match) team1 = team1Match[0];
            if (team2Match) team2 = team2Match[0];
            
            if (team1 === playerTeam) {
                return team2;
            } else if (team2 === playerTeam) {
                return team1;
            } else {
                if (team1.includes(playerTeam) || playerTeam.includes(team1)) {
                    return team2;
                } else {
                    return team1;
                }
            }
        }
        
        return '';
    }

    function getSwitchHitterVersus(batterHandedness, pitcherHandedness) {
        if (batterHandedness !== 'S') {
            return batterHandedness === "L" ? "Lefties" : "Righties";
        }
        
        if (pitcherHandedness === 'R') {
            return "Lefties";
        } else if (pitcherHandedness === 'L') {
            return "Righties";
        } else {
            return "Switch";
        }
    }

    function formatPercentage(value) {
        if (value === null || value === undefined) return "0%";
        return (parseFloat(value) * 100).toFixed(1) + "%";
    }

    function formatClearancePercentage(value) {
        if (value === null || value === undefined) return "0%";
        return parseFloat(value).toFixed(1) + "%";
    }

    // ============= MULTISELECT =============
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
                table.setHeaderFilterValue(field, function(data) {
                    return false;
                });
                filterApplied = true;
            } else if (selectedValues.length === allValues.length) {
                table.clearHeaderFilter(field);
                filterApplied = false;
            } else {
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

    // ============= STYLES =============
    function injectStyles() {
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
                width: 100% !important;
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
            
            /* Header overflow for dropdowns */
            .tabulator .tabulator-header {
                overflow: visible !important;
                position: relative !important;
                z-index: 100 !important;
            }
            
            .tabulator .tabulator-header .tabulator-col {
                overflow: visible !important;
                position: relative !important;
                z-index: 101 !important;
            }
            
            .tabulator .tabulator-header .tabulator-col .tabulator-header-filter {
                overflow: visible !important;
                position: relative !important;
                z-index: 102 !important;
            }
            
            /* Table body z-index */
            .tabulator .tabulator-tableHolder {
                position: relative !important;
                z-index: 50 !important;
            }
            
            /* Custom multiselect styling */
            .custom-multiselect {
                position: relative !important;
                width: 100% !important;
                z-index: 103 !important;
            }
            
            .custom-multiselect-button {
                width: 100% !important;
                padding: 4px 8px !important;
                border: 1px solid #ccc !important;
                background: white !important;
                cursor: pointer !important;
                font-size: 11px !important;
                user-select: none !important;
                pointer-events: auto !important;
                position: relative !important;
                z-index: 104 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }
            
            .custom-multiselect-button:hover {
                background: #f8f9fa !important;
                border-color: #007bff !important;
            }
            
            .custom-multiselect-dropdown {
                position: fixed !important;
                min-width: 200px !important;
                background: white !important;
                border: 2px solid #007bff !important;
                max-height: 250px !important;
                overflow-y: auto !important;
                z-index: 999999 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
                border-radius: 4px !important;
            }
            
            .custom-multiselect-dropdown.show {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .custom-multiselect-dropdown.hide {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
            
            .custom-multiselect-option {
                padding: 8px 12px !important;
                cursor: pointer !important;
                font-size: 12px !important;
                user-select: none !important;
                pointer-events: auto !important;
                border-bottom: 1px solid #eee !important;
                background: white !important;
            }
            
            .custom-multiselect-option:hover {
                background: #f8f9fa !important;
            }
            
            .custom-multiselect-option.selected {
                background: #007bff !important;
                color: white !important;
            }
            
            .custom-multiselect-option.select-all {
                font-weight: bold !important;
                background: #f8f9fa !important;
                border-bottom: 2px solid #007bff !important;
            }
            
            .custom-multiselect-option.select-all.selected {
                background: #28a745 !important;
                color: white !important;
            }
            
            /* Alternating row colors */
            .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even) {
                background-color: #f8f9fa !important;
            }
            
            .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd) {
                background-color: #ffffff !important;
            }
            
            .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(even):hover {
                background-color: #e9ecef !important;
            }
            
            .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row:nth-child(odd):hover {
                background-color: #f8f9fa !important;
            }
            
            /* Center header text */
            .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
                text-align: center !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-height: 50px !important;
            }
            
            .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-col-title {
                text-align: center !important;
                line-height: 1.2 !important;
            }
            
            /* Center cell content */
            .tabulator .tabulator-cell {
                text-align: center !important;
            }
            
            .tabulator .tabulator-cell .tabulator-cell-value {
                text-align: center !important;
                width: 100% !important;
            }
            
            /* Left align name columns */
            .tabulator .tabulator-cell[tabulator-field="Batter Name"] {
                text-align: left !important;
            }
            
            .tabulator .tabulator-cell[tabulator-field="Batter Name"] .tabulator-cell-value {
                text-align: left !important;
            }
            
            /* Subtable styling */
            .subrow-container .tabulator .tabulator-header .tabulator-col {
                cursor: default !important;
            }
            
            .subrow-container .tabulator .tabulator-header .tabulator-col .tabulator-col-content {
                cursor: default !important;
            }
            
            .subrow-container .tabulator .tabulator-header .tabulator-col:hover {
                background: inherit !important;
            }
            
            .subrow-container .tabulator .tabulator-cell {
                text-align: center !important;
            }
            
            .subrow-container .tabulator .tabulator-cell .tabulator-cell-value {
                text-align: center !important;
            }
            
            .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] {
                text-align: left !important;
            }
            
            .subrow-container .tabulator .tabulator-cell[tabulator-field="player"] .tabulator-cell-value {
                text-align: left !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ============= BASE TABLE CLASS =============
    class BaseTable {
        constructor(elementId, endpoint) {
            this.elementId = elementId;
            this.endpoint = endpoint;
            this.table = null;
            this.tableConfig = this.getBaseConfig();
        }

        getBaseConfig() {
            return {
                ajaxURL: API_CONFIG.baseURL + this.endpoint,
                ajaxConfig: {
                    method: "GET",
                    headers: API_CONFIG.headers
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
                dataLoaded: (data) => {
                    console.log(`Table loaded ${data.length} total records`);
                    data.forEach(row => {
                        row._expanded = false;
                    });
                }
            };
        }

        createNameFormatter() {
            return function(cell, formatterParams, onRendered) {
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
            };
        }

        createTeamFormatter() {
            return function(cell) {
                var value = cell.getValue();
                return TEAM_NAME_MAP[value] || value;
            };
        }

        setupRowExpansion() {
            this.table.on("cellClick", (e, cell) => {
                if (cell.getField() === "Batter Name") {
                    var row = cell.getRow();
                    var data = row.getData();
                    data._expanded = !data._expanded;
                    row.update(data);
                    row.reformat();
                    
                    setTimeout(() => {
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

        createSubtable1(container, data) {
            new Tabulator(container, {
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
                    {title: "Prop Park Factor", field: "propFactor", headerSort: false, width: 150},
                    {title: "Lineup Status", field: "lineupStatus", headerSort: false, width: 180},
                    {title: "Matchup", field: "matchup", headerSort: false, width: 280},
                    {title: "Opposing Pitcher", field: "opposingPitcher", headerSort: false, width: 180}
                ]
            });
        }

        createRowFormatter() {
            return (row) => {
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
                    
                    this.createSubtable1(subtable1, data);
                    this.createSubtable2(subtable2, data);
                } else if (!data._expanded) {
                    var existingSubrow = row.getElement().querySelector('.subrow-container');
                    if (existingSubrow) {
                        existingSubrow.remove();
                    }
                }
            };
        }

        redraw() {
            if (this.table) {
                this.table.redraw();
            }
        }
    }

    // ============= TABLE 1 =============
    class BatterClearancesTable extends BaseTable {
        constructor(elementId) {
            super(elementId, 'ModBatterClearances');
        }

        initialize() {
            const config = {
                ...this.tableConfig,
                columns: this.getColumns(),
                initialSort: [
                    {column: "Batter Name", dir: "asc"},
                    {column: "Batter Team", dir: "asc"},
                    {column: "Batter Prop Type", dir: "asc"},
                    {column: "Batter Prop Value", dir: "asc"}
                ],
                rowFormatter: this.createRowFormatter()
            };

            this.table = new Tabulator(this.elementId, config);
            this.setupRowExpansion();
            
            this.table.on("tableBuilt", () => {
                console.log("Batter Clearances table built successfully");
            });
        }

        getColumns() {
            return [
                {title: "Player Info", columns: [
                    {
                        title: "Name", 
                        field: "Batter Name", 
                        width: 180, 
                        sorter: "string", 
                        headerFilter: true,
                        resizable: false,
                        formatter: this.createNameFormatter()
                    },
                    {
                        title: "Team", 
                        field: "Batter Team", 
                        width: 160, 
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        formatter: this.createTeamFormatter()
                    }
                ]},
                {title: "Prop Info", columns: [
                    {
                        title: "Prop", 
                        field: "Batter Prop Type", 
                        width: 120, 
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false
                    },
                    {
                        title: "Value", 
                        field: "Batter Prop Value", 
                        width: 80, 
                        sorter: "number", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false
                    }
                ]},
                {title: "Full Season", columns: [
                    {
                        title: "% Above", 
                        field: "Clearance Season", 
                        width: 85, 
                        sorter: "number", 
                        sorterParams: {dir: "desc"},
                        resizable: false,
                        formatter: (cell) => formatPercentage(cell.getValue())
                    },
                    {
                        title: "Games", 
                        field: "Games Season", 
                        width: 75, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false
                    }
                ]},
                {title: "Full Season (Home/Away)", columns: [
                    {
                        title: "% Above", 
                        field: "Clearance Season At", 
                        width: 85, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false,
                        formatter: (cell) => formatPercentage(cell.getValue())
                    },
                    {
                        title: "Games", 
                        field: "Games Season At", 
                        width: 75, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false
                    }
                ]},
                {title: "Last 30 Days", columns: [
                    {
                        title: "% Above", 
                        field: "Clearance 30", 
                        width: 85, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false,
                        formatter: (cell) => formatPercentage(cell.getValue())
                    },
                    {
                        title: "Games", 
                        field: "Games 30", 
                        width: 75, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false
                    }
                ]},
                {title: "Last 30 Days (Home/Away)", columns: [
                    {
                        title: "% Above", 
                        field: "Clearance 30 At", 
                        width: 85, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false,
                        formatter: (cell) => formatPercentage(cell.getValue())
                    },
                    {
                        title: "Games", 
                        field: "Games 30 At", 
                        width: 75, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false
                    }
                ]}
            ];
        }

        createSubtable2(container, data) {
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
            var handsText = getSwitchHitterVersus(data["Handedness"], data["SP Handedness"]);
            
            var spVersusText = handsText;
            var rrVersusText = data["Handedness"] === "S" ? "Lefties" : handsText;
            var lrVersusText = data["Handedness"] === "S" ? "Righties" : handsText;
            
            new Tabulator(container, {
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
                    {title: "Players", field: "player", headerSort: false, width: 320},
                    {title: "Full Season", field: "fullSeason", headerSort: false, width: 120},
                    {title: "Full Season (Home/Away)", field: "fullSeasonHA", headerSort: false, width: 160},
                    {title: "Last 30 Days", field: "last30", headerSort: false, width: 120},
                    {title: "Last 30 Days (Home/Away)", field: "last30HA", headerSort: false, width: 160}
                ]
            });
        }
    }

    // ============= TABLE 2 =============
    class BatterClearancesAltTable extends BaseTable {
        constructor(elementId) {
            super(elementId, 'ModBatterClearancesAlt');
        }

        initialize() {
            const config = {
                ...this.tableConfig,
                ajaxConfig: {
                    ...this.tableConfig.ajaxConfig,
                    headers: {
                        ...this.tableConfig.ajaxConfig.headers,
                        "Range": ""
                    }
                },
                progressiveLoad: "load",
                progressiveLoadDelay: 200,
                progressiveLoadScrollMargin: 300,
                columns: this.getColumns(),
                initialSort: [
                    {column: "Batter Name", dir: "asc"},
                    {column: "Batter Team", dir: "asc"},
                    {column: "Batter Prop Type", dir: "asc"},
                    {column: "Batter Prop Value", dir: "asc"}
                ],
                rowFormatter: this.createRowFormatter()
            };

            this.table = new Tabulator(this.elementId, config);
            this.setupRowExpansion();
            
            this.table.on("tableBuilt", () => {
                console.log("Batter Clearances Alt table built successfully");
            });
        }

        getColumns() {
            return [
                {title: "Player Info", columns: [
                    {
                        title: "Name", 
                        field: "Batter Name", 
                        width: 180, 
                        sorter: "string", 
                        headerFilter: true,
                        resizable: false,
                        formatter: this.createNameFormatter()
                    },
                    {
                        title: "Team", 
                        field: "Batter Team", 
                        width: 160, 
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false,
                        formatter: this.createTeamFormatter()
                    }
                ]},
                {title: "Prop Info", columns: [
                    {
                        title: "Prop", 
                        field: "Batter Prop Type", 
                        width: 120, 
                        sorter: "string", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false
                    },
                    {
                        title: "Value", 
                        field: "Batter Prop Value", 
                        width: 80, 
                        sorter: "number", 
                        headerFilter: createCustomMultiSelect,
                        resizable: false
                    },
                    {
                        title: "Time/Location Split", 
                        field: "Batter Prop Split ID", 
                        width: 180, 
                        sorter: "string", 
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
                    {
                        title: "% Above", 
                        field: "Batter Clearance", 
                        width: 100, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false,
                        formatter: (cell) => formatClearancePercentage(cell.getValue())
                    },
                    {
                        title: "Games", 
                        field: "Batter Games", 
                        width: 80, 
                        sorter: "number",
                        sorterParams: {dir: "desc"},
                        resizable: false
                    }
                ]}
            ];
        }

        createSubtable2(container, data) {
            var opponentTeam = getOpponentTeam(data["Matchup"], data["Batter Team"]);
            
            var spVersusText;
            if (data["Handedness"] === "S") {
                if (data["SP Handedness"] === "R") {
                    spVersusText = "Righties";
                } else if (data["SP Handedness"] === "L") {
                    spVersusText = "Lefties";
                } else {
                    spVersusText = "Switch";
                }
            } else {
                spVersusText = data["Handedness"] === "L" ? "Lefties" : "Righties";
            }
            
            var rrVersusText = data["Handedness"] === "S" ? "Righties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
            var lrVersusText = data["Handedness"] === "S" ? "Lefties" : (data["Handedness"] === "L" ? "Lefties" : "Righties");
            
            new Tabulator(container, {
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
                    {title: "Players", field: "player", headerSort: false, resizable: false, width: 320},
                    {title: "Prop Data", field: "propData", headerSort: false, resizable: false, width: 150}
                ]
            });
        }
    }

    // ============= TAB MANAGER =============
    class TabManager {
        constructor(tables) {
            this.tables = tables;
            this.currentActiveTab = 'table1';
            this.setupTabSwitching();
        }

        setupTabSwitching() {
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-button')) {
                    var targetTab = e.target.dataset.tab;
                    console.log('Switching to tab:', targetTab);
                    
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    var table1Container = document.getElementById('table1-container');
                    var table2Container = document.getElementById('table2-container');
                    
                    if (table1Container) {
                        table1Container.className = 'table-container inactive-table';
                    }
                    if (table2Container) {
                        table2Container.className = 'table-container inactive-table';
                    }
                    
                    if (targetTab === 'table1' && table1Container) {
                        table1Container.className = 'table-container active-table';
                        this.currentActiveTab = 'table1';
                        
                        setTimeout(() => {
                            if (this.tables.table1) {
                                this.tables.table1.redraw();
                            }
                        }, 100);
                        
                    } else if (targetTab === 'table2' && table2Container) {
                        table2Container.className = 'table-container active-table';
                        this.currentActiveTab = 'table2';
                        
                        setTimeout(() => {
                            if (this.tables.table2) {
                                this.tables.table2.redraw();
                            }
                        }, 100);
                    }
                }
            });
        }

        createTabStructure(tableElement) {
            if (tableElement && !tableElement.parentElement.classList.contains('table-wrapper')) {
                var wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper';
                wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; margin: 0 auto;';
                
                var tabsContainer = document.createElement('div');
                tabsContainer.className = 'tabs-container';
                tabsContainer.innerHTML = `
                    <div class="tab-buttons">
                        <button class="tab-button active" data-tab="table1">Batter Prop Clearances</button>
                        <button class="tab-button" data-tab="table2">Batter Prop Clearances (Alt. View)</button>
                    </div>
                `;
                
                var tablesContainer = document.createElement('div');
                tablesContainer.className = 'tables-container';
                tablesContainer.style.cssText = 'width: 100%; position: relative; min-height: 500px;';
                
                var table1Container = document.createElement('div');
                table1Container.className = 'table-container active-table';
                table1Container.id = 'table1-container';
                table1Container.style.cssText = 'width: 100%; display: block;';
                
                var table2Container = document.createElement('div');
                table2Container.className = 'table-container inactive-table';
                table2Container.id = 'table2-container';
                table2Container.style.cssText = 'width: 100%; display: none;';
                
                var table2Element = document.createElement('div');
                table2Element.id = 'batter-table-alt';
                
                tableElement.parentNode.insertBefore(wrapper, tableElement);
                wrapper.appendChild(tabsContainer);
                wrapper.appendChild(tablesContainer);
                
                table1Container.appendChild(tableElement);
                table2Container.appendChild(table2Element);
                
                tablesContainer.appendChild(table1Container);
                tablesContainer.appendChild(table2Container);
            }
        }
    }

    // ============= MAIN INITIALIZATION =============
    document.addEventListener('DOMContentLoaded', function() {
        console.log('GitHub Pages: DOM ready, initializing bundled Tabulator functionality...');

        injectStyles();

        var tableElement = document.getElementById('batter-table');
        if (!tableElement) {
            console.error("Element 'batter-table' not found!");
            return;
        } else {
            console.log("Found batter-table element, proceeding with initialization...");
        }

        const tabManager = new TabManager({});
        tabManager.createTabStructure(tableElement);

        const table1 = new BatterClearancesTable("#batter-table");
        const table2 = new BatterClearancesAltTable("#batter-table-alt");

        table1.initialize();
        table2.initialize();

        tabManager.tables = {
            table1: table1,
            table2: table2
        };

        console.log('All tables initialized successfully');
    });

})();
