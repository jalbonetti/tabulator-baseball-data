// tables/combinedMatchupsTable.js - WORKING VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, null);
        this.isInitialized = false;
    }

    async fetchMatchupsData() {
        try {
            console.log('Fetching basic matchups data...');
            
            const response = await fetch(API_CONFIG.baseURL + 'ModMatchupsData', {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched matchups data:', data.length, 'records');
            
            // Convert to simple, guaranteed-to-work format
            const simpleData = data.map(item => ({
                team: String(item['Matchup Team'] || 'Unknown'),
                game: String(item['Matchup Game'] || 'Unknown'),
                spread: String(item['Matchup Spread'] || ''),
                total: String(item['Matchup Total'] || ''),
                lineupStatus: String(item['Matchup Lineup Status'] || 'Unknown')
            }));
            
            console.log('Converted data sample:', simpleData[0]);
            return simpleData;
            
        } catch (error) {
            console.error('Error fetching matchups data:', error);
            return [];
        }
    }

    // Create manual table if Tabulator fails
    createManualTable(data) {
        console.log('Creating manual HTML table as fallback...');
        
        const container = document.getElementById('matchups-table');
        
        let html = `
            <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                <div style="background: #f8f9fa; padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">
                    Matchups Data (${data.length} games)
                </div>
                <div style="overflow: auto; max-height: 600px;">
                    <table style="width: 100%; border-collapse: collapse; margin: 0;">
                        <thead style="background: #fff; position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 12px; border-bottom: 2px solid #007bff; text-align: left; font-weight: bold;">Team</th>
                                <th style="padding: 12px; border-bottom: 2px solid #007bff; text-align: left; font-weight: bold;">Game</th>
                                <th style="padding: 12px; border-bottom: 2px solid #007bff; text-align: center; font-weight: bold;">Spread</th>
                                <th style="padding: 12px; border-bottom: 2px solid #007bff; text-align: center; font-weight: bold;">Total</th>
                                <th style="padding: 12px; border-bottom: 2px solid #007bff; text-align: center; font-weight: bold;">Lineup Status</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        data.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
            html += `
                <tr style="background: ${bgColor}; cursor: pointer;" 
                    onmouseover="this.style.background='#e9ecef'" 
                    onmouseout="this.style.background='${bgColor}'">
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: 500;">${row.team}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${row.game}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${row.spread}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${row.total}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                        <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            ${row.lineupStatus}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        console.log('✅ Manual table created successfully with', data.length, 'rows');
        
        // Ensure container is visible
        const tableContainer = document.getElementById('table0-container');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.style.opacity = '1';
        }
    }

    // Try to create a working Tabulator instance
    createWorkingTabulator(data) {
        console.log('Attempting to create working Tabulator...');
        
        // Clear any existing content
        const element = document.getElementById('matchups-table');
        element.innerHTML = '';
        
        try {
            // Most basic Tabulator configuration possible
            const table = new Tabulator('#matchups-table', {
                data: data, // Set data immediately
                autoResize: false,
                responsiveLayout: false,
                height: 400,
                layout: "fitData",
                columns: [
                    {title: "Team", field: "team", headerSort: false, resizable: false},
                    {title: "Game", field: "game", headerSort: false, resizable: false},
                    {title: "Spread", field: "spread", headerSort: false, resizable: false},
                    {title: "Total", field: "total", headerSort: false, resizable: false},
                    {title: "Status", field: "lineupStatus", headerSort: false, resizable: false}
                ]
            });
            
            // Check if it worked after a delay
            setTimeout(() => {
                const rows = element.querySelectorAll('.tabulator-row');
                console.log('Tabulator rows created:', rows.length);
                
                if (rows.length === 0) {
                    console.log('Tabulator failed, falling back to manual table');
                    this.createManualTable(data);
                } else {
                    console.log('✅ Tabulator working!');
                    this.table = table;
                }
            }, 500);
            
        } catch (error) {
            console.error('Tabulator creation failed:', error);
            this.createManualTable(data);
        }
    }

    initialize() {
        console.log('Initializing matchups table...');
        
        // Ensure we wait for everything to be ready
        setTimeout(() => {
            this.fetchMatchupsData().then(data => {
                console.log('Fetched data for matchups:', data.length, 'rows');
                
                if (data && data.length > 0) {
                    // Try Tabulator first, fall back to manual table
                    this.createWorkingTabulator(data);
                } else {
                    console.error('No matchups data available');
                    const element = document.getElementById('matchups-table');
                    element.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No matchups data available</div>';
                }
            }).catch(error => {
                console.error('Failed to fetch matchups data:', error);
                const element = document.getElementById('matchups-table');
                element.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;">Error loading matchups data</div>';
            });
        }, 100); // Small delay to ensure DOM is ready
    }

    // Dummy methods to satisfy the BaseTable interface
    setupRowExpansion() {
        // Not needed for basic version
    }

    getColumns() {
        return [];
    }

    createRowFormatter() {
        return () => {};
    }
}
