// tables/batterOdds.js - Baseball Batter Prop Odds Table
// Modeled exactly on NBA basketPlayerPropOdds.js
// Supabase: BaseballBatterPropOdds
// All columns are TEXT type - sorters parse strings
// EV% and Kelly% stored as decimals (0.052 = 5.2%), multiply by 100 for display

import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { createMinMaxFilter, minMaxFilterFunction } from '../components/minMaxFilter.js';
import { createBankrollInput, bankrollFilterFunction, getBankrollValue } from '../components/bankrollInput.js';
import { isMobile, isTablet, TEAM_NAME_MAP } from '../shared/config.js';

const NAME_COLUMN_MIN_WIDTH = 205;
const EV_KELLY_COLUMN_MIN_WIDTH = 75;

export class BatterOddsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'BaseballBatterPropOdds');
        
        // Team abbreviation map (full name -> abbreviation) for matchup formatting
        this.teamAbbrevMap = TEAM_NAME_MAP;
        
        // Prop type abbreviation mapping for baseball
        this.propAbbrevMap = {
            'Hits + Runs + RBIs': 'H+R+RBI',
            'Total Bases': 'TB',
            'Strikeouts': 'K',
            'Walks': 'BB',
            'Stolen Bases': 'SB',
            'Singles': '1B',
            'Doubles': '2B',
            'Home Runs': 'HR',
        };
    }

    abbreviateMatchup(matchup) {
        if (!matchup) return '-';
        let abbreviated = matchup;
        Object.entries(this.teamAbbrevMap).forEach(([fullName, abbrev]) => {
            const regex = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            abbreviated = abbreviated.replace(regex, abbrev);
        });
        return abbreviated;
    }

    abbreviateProp(propType) {
        if (!propType) return '-';
        return this.propAbbrevMap[propType] || propType;
    }

    initialize() {
        const mobile = isMobile();
        const tablet = isTablet();
        const isSmallScreen = mobile || tablet;
        
        const config = {
            ...this.tableConfig,
            virtualDom: true,
            virtualDomBuffer: 500,
            renderVertical: "virtual",
            renderHorizontal: "basic",
            pagination: false,
            layoutColumnsOnNewData: false,
            responsiveLayout: false,
            maxHeight: "600px",
            height: "600px",
            placeholder: "Loading batter prop odds...",
            layout: "fitData",
            
            columns: this.getColumns(isSmallScreen),
            initialSort: [
                {column: "EV %", dir: "desc"}
            ],
            dataLoaded: (data) => {
                console.log(`Batter Odds table loaded ${data.length} records`);
                this.dataLoaded = true;
                
                const element = document.querySelector(this.elementId);
                if (element) {
                    const loadingDiv = element.querySelector('.loading-indicator');
                    if (loadingDiv) loadingDiv.remove();
                }
            },
            ajaxError: (error) => {
                console.error("Error loading batter odds data:", error);
            }
        };

        this.table = new Tabulator(this.elementId, config);
        
        this.table.on("tableBuilt", () => {
            console.log("Batter Odds table built");
            
            if (!isSmallScreen) {
                setTimeout(() => {
                    const data = this.table ? this.table.getData() : [];
                    if (data.length > 0) {
                        this.scanDataForMaxWidths(data);
                        this.equalizeClusteredColumns();
                        this.calculateAndApplyWidths();
                    }
                    this.ensureNameColumnWidth();
                }, 200);
            } else {
                setTimeout(() => {
                    this.ensureNameColumnWidth();
                }, 50);
            }
        });
    }

    // Ensure Name column maintains minimum width
    ensureNameColumnWidth() {
        if (!this.table) return;
        const nameColumn = this.table.getColumn("Batter Name");
        if (nameColumn) {
            const currentWidth = nameColumn.getWidth();
            if (currentWidth < NAME_COLUMN_MIN_WIDTH) {
                nameColumn.setWidth(NAME_COLUMN_MIN_WIDTH);
            }
        }
    }

    // Custom sorter for odds with +/- prefix (all stored as text)
    oddsSorter(a, b) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const num = parseInt(String(val).trim(), 10);
            return isNaN(num) ? -99999 : num;
        };
        return getNum(a) - getNum(b);
    }

    // Custom sorter for percentage values stored as decimals
    percentSorter(a, b) {
        const getNum = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return -99999;
            const str = String(val).replace('%', '').trim();
            const num = parseFloat(str);
            return isNaN(num) ? -99999 : num;
        };
        return getNum(a) - getNum(b);
    }

    getColumns(isSmallScreen = false) {
        const self = this;
        
        const oddsFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseInt(value, 10);
            if (isNaN(num)) return '-';
            return num > 0 ? `+${num}` : `${num}`;
        };

        const lineFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            return num.toFixed(1);
        };

        const matchupFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return self.abbreviateMatchup(value);
        };

        const propFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '-';
            return self.abbreviateProp(value);
        };

        // EV % formatter - decimal to percentage (0.052 -> 5.2%)
        const evFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            const pct = num * 100;
            return pct.toFixed(1) + '%';
        };

        // Quarter Kelly % formatter - decimal to percentage OR monetary amount
        const kellyFormatter = (cell) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '' || value === '-') return '-';
            const num = parseFloat(value);
            if (isNaN(num)) return '-';
            
            const bankroll = getBankrollValue('Quarter Kelly %');
            
            if (bankroll > 0) {
                // num is decimal (0.035), multiply by bankroll for dollar amount
                const amount = num * bankroll;
                return '$' + amount.toFixed(2);
            } else {
                const pct = num * 100;
                return pct.toFixed(1) + '%';
            }
        };

        const linkFormatter = (cell) => {
            const value = cell.getValue();
            if (!value || value === '-' || value === '') return '-';
            const link = document.createElement('a');
            link.href = value;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Bet';
            link.style.cssText = 'color: #b91c1c; text-decoration: underline; font-weight: 500;';
            return link;
        };

        return [
            {
                title: "Name", 
                field: "Batter Name", 
                frozen: true,
                widthGrow: 0,
                minWidth: NAME_COLUMN_MIN_WIDTH,
                sorter: "string", 
                headerFilter: true,
                resizable: false,
                hozAlign: "left"
            },
            {
                title: "Matchup", 
                field: "Batter Matchup", 
                widthGrow: 0,
                minWidth: 90,
                sorter: "string",
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: matchupFormatter
            },
            {
                title: "Team", 
                field: "Batter Team", 
                widthGrow: 0,
                minWidth: 55,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Prop", 
                field: "Batter Prop Type", 
                widthGrow: 0,
                minWidth: 65,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: propFormatter
            },
            {
                title: "Label", 
                field: "Batter Over/Under", 
                widthGrow: 0,
                minWidth: 60,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Line", 
                field: "Batter Prop Line", 
                widthGrow: 0,
                minWidth: 55,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center",
                formatter: lineFormatter
            },
            {
                title: "Book", 
                field: "Batter Book", 
                widthGrow: 0,
                minWidth: 70,
                sorter: "string", 
                headerFilter: createCustomMultiSelect,
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "Book Odds", 
                field: "Batter Prop Odds", 
                widthGrow: 0,
                minWidth: 85,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Median Odds", 
                field: "Batter Median Odds", 
                widthGrow: 0,
                minWidth: 100,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Odds", 
                field: "Batter Best Odds", 
                widthGrow: 0,
                minWidth: 85,
                sorter: function(a, b) { return self.oddsSorter(a, b); },
                headerFilter: createMinMaxFilter,
                headerFilterFunc: minMaxFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: oddsFormatter,
                hozAlign: "center",
                cssClass: "cluster-odds"
            },
            {
                title: "Best Books", 
                field: "Batter Best Odds Books", 
                widthGrow: 0,
                minWidth: 90,
                sorter: "string",
                resizable: false,
                hozAlign: "center"
            },
            {
                title: "EV %", 
                field: "EV %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                resizable: false,
                formatter: evFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            },
            {
                title: "Bet Size", 
                field: "Quarter Kelly %", 
                widthGrow: 0,
                minWidth: EV_KELLY_COLUMN_MIN_WIDTH,
                sorter: function(a, b) { return self.percentSorter(a, b); },
                headerFilter: createBankrollInput,
                headerFilterFunc: bankrollFilterFunction,
                headerFilterLiveFilter: false,
                resizable: false,
                formatter: kellyFormatter,
                hozAlign: "center",
                cssClass: "cluster-ev-kelly"
            },
            {
                title: "Link", 
                field: "Link", 
                width: 50,
                widthGrow: 0,
                minWidth: 40,
                maxWidth: 50,
                sorter: "string",
                resizable: false,
                hozAlign: "center",
                formatter: linkFormatter,
                headerSort: false
            }
        ];
    }

    // Equalize clustered column widths
    equalizeClusteredColumns() {
        if (!this.table) return;
        if (isMobile() || isTablet()) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '600 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        const CELL_PADDING = 16;
        const SORT_ICON_WIDTH = 20;
        
        // Group 1: Odds columns
        const oddsCluster = ['Batter Prop Odds', 'Batter Median Odds', 'Batter Best Odds'];
        let maxOddsWidth = 0;
        
        oddsCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                const dataWidth = column.getWidth();
                if (dataWidth > maxOddsWidth) maxOddsWidth = dataWidth;
                
                const headerTitle = column.getDefinition().title;
                if (headerTitle) {
                    const headerWidth = ctx.measureText(headerTitle).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (headerWidth > maxOddsWidth) maxOddsWidth = headerWidth;
                }
            }
        });
        
        if (maxOddsWidth > 0) {
            oddsCluster.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) column.setWidth(Math.ceil(maxOddsWidth));
            });
            console.log(`Batter Odds cluster equalized to ${Math.ceil(maxOddsWidth)}px`);
        }
        
        // Group 2: EV/Kelly columns
        const evKellyCluster = ['EV %', 'Quarter Kelly %'];
        let maxEvKellyWidth = 0;
        
        evKellyCluster.forEach(field => {
            const column = this.table.getColumn(field);
            if (column) {
                const dataWidth = column.getWidth();
                if (dataWidth > maxEvKellyWidth) maxEvKellyWidth = dataWidth;
                
                const headerTitle = column.getDefinition().title;
                if (headerTitle) {
                    const headerWidth = ctx.measureText(headerTitle).width + CELL_PADDING + SORT_ICON_WIDTH;
                    if (headerWidth > maxEvKellyWidth) maxEvKellyWidth = headerWidth;
                }
            }
        });
        
        if (maxEvKellyWidth > 0) {
            evKellyCluster.forEach(field => {
                const column = this.table.getColumn(field);
                if (column) column.setWidth(Math.ceil(maxEvKellyWidth));
            });
            console.log(`Batter EV/Kelly cluster equalized to ${Math.ceil(maxEvKellyWidth)}px`);
        }
    }

    // Scan data for max column widths (virtual scroll safety)
    scanDataForMaxWidths(data) {
        if (!data || data.length === 0 || !this.table) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxWidths = {
            "Batter Team": 0,
            "Batter Prop Type": 0,
            "Batter Book": 0,
            "Batter Matchup": 0,
            "Batter Best Odds Books": 0,
            "Batter Over/Under": 0
        };
        
        // Measure header widths first
        ctx.font = '600 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const HEADER_PADDING = 16;
        const SORT_ICON_WIDTH = 16;
        
        const fieldToTitle = {
            "Batter Team": "Team",
            "Batter Prop Type": "Prop",
            "Batter Book": "Book",
            "Batter Matchup": "Matchup",
            "Batter Best Odds Books": "Best Books",
            "Batter Over/Under": "Label"
        };
        
        Object.keys(maxWidths).forEach(field => {
            const title = fieldToTitle[field] || field;
            const headerWidth = ctx.measureText(title).width + HEADER_PADDING + SORT_ICON_WIDTH;
            maxWidths[field] = headerWidth;
        });
        
        // Measure data widths
        ctx.font = '500 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        
        data.forEach(row => {
            Object.keys(maxWidths).forEach(field => {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    let displayValue = String(value);
                    if (field === 'Batter Prop Type') {
                        displayValue = this.abbreviateProp(value);
                    }
                    if (field === 'Batter Matchup') {
                        displayValue = this.abbreviateMatchup(value);
                    }
                    const textWidth = ctx.measureText(displayValue).width;
                    if (textWidth > maxWidths[field]) {
                        maxWidths[field] = textWidth;
                    }
                }
            });
        });
        
        const CELL_PADDING = 16;
        const BUFFER = 8;
        
        Object.keys(maxWidths).forEach(field => {
            if (maxWidths[field] > 0) {
                const column = this.table.getColumn(field);
                if (column) {
                    const requiredWidth = maxWidths[field] + CELL_PADDING + BUFFER;
                    const currentWidth = column.getWidth();
                    if (requiredWidth > currentWidth) {
                        column.setWidth(Math.ceil(requiredWidth));
                    }
                }
            }
        });
        
        this.ensureNameColumnWidth();
        console.log('Batter Odds max width scan complete');
    }

    // Calculate and apply table widths
    calculateAndApplyWidths() {
        if (!this.table) return;
        
        const tableElement = this.table.element;
        if (!tableElement) return;
        
        if (isMobile() || isTablet()) {
            tableElement.style.width = '';
            tableElement.style.minWidth = '';
            tableElement.style.maxWidth = '';
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = '';
                tableContainer.style.minWidth = '';
                tableContainer.style.maxWidth = '';
            }
            this.ensureNameColumnWidth();
            return;
        }
        
        // Desktop: constrain to content width
        tableElement.style.width = 'auto';
        tableElement.style.minWidth = 'auto';
        tableElement.style.maxWidth = 'none';
        
        const tableHolder = tableElement.querySelector('.tabulator-tableholder');
        if (tableHolder) {
            tableHolder.style.width = 'auto';
            tableHolder.style.maxWidth = 'none';
        }
        
        const tabulatorTable = tableElement.querySelector('.tabulator-table');
        if (tabulatorTable) tabulatorTable.style.width = 'auto';
        
        void tableElement.offsetWidth;
        
        try {
            const columns = this.table.getColumns();
            let totalColumnWidth = 0;
            
            columns.forEach(col => {
                totalColumnWidth += col.getWidth();
            });
            
            const SCROLLBAR_WIDTH = 17;
            const totalWidthWithScrollbar = totalColumnWidth + SCROLLBAR_WIDTH;
            
            tableElement.style.width = totalWidthWithScrollbar + 'px';
            tableElement.style.minWidth = totalWidthWithScrollbar + 'px';
            tableElement.style.maxWidth = totalWidthWithScrollbar + 'px';
            
            if (tableHolder) {
                tableHolder.style.width = totalWidthWithScrollbar + 'px';
                tableHolder.style.maxWidth = totalWidthWithScrollbar + 'px';
            }
            
            const tabulatorHeader = tableElement.querySelector('.tabulator-header');
            if (tabulatorHeader) {
                tabulatorHeader.style.width = totalWidthWithScrollbar + 'px';
            }
            
            const tableContainer = tableElement.closest('.table-container');
            if (tableContainer) {
                tableContainer.style.width = 'fit-content';
                tableContainer.style.minWidth = 'auto';
                tableContainer.style.maxWidth = 'none';
            }
            
            console.log(`Batter Odds table width: ${totalWidthWithScrollbar}px`);
        } catch (error) {
            console.error('Error in calculateAndApplyWidths:', error);
        }
    }
}
