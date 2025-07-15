// tables/combinedMatchupsTable.js - BASIC WORKING VERSION
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, null);
        this.combinedData = [];
    }

    async fetchAllData() {
        try {
            console.log('Fetching matchups data...');
            
            // Just fetch the main matchups table for now
            const response = await fetch(API_CONFIG.baseURL + 'ModMatchupsData', {
                method: 'GET',
                headers: API_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched matchups data:', data.length, 'records');
            
            // Convert to simple format that definitely works with Tabulator
            const simpleData = data.map(item => ({
                team: item['Matchup Team'] || 'Unknown',
                game: item['Matchup Game'] || 'Unknown',
                spread: item['Matchup Spread'] || 0,
                total: item['Matchup Total'] || 0,
                lineupStatus: item['Matchup Lineup Status'] || 'Unknown',
                ballpark: item['Matchup Ballpark'] || 'Unknown'
            }));
            
            console.log('Converted to simple format:', simpleData.length, 'records');
            console.log('Sample record:', simpleData[0]);
            
            return simpleData;
            
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    initialize() {
        console.log('Initializing basic matchups table...');
        
        // Create the most basic Tabulator configuration possible
        this.table = new Tabulator(this.elementId, {
            height: 400,
            layout: "fitColumns",
            placeholder: "Loading...",
            columns: [
                {title: "Team", field: "team", width: 200},
                {title: "Game", field: "game", width: 300},
                {title: "Spread", field: "spread", width: 100},
                {title: "Total", field: "total", width: 100},
                {title: "Lineup Status", field: "lineupStatus", width: 150}
            ]
        });
        
        console.log('Basic table created, fetching data...');
        
        // Fetch and set data
        this.fetchAllData().then(data => {
            console.log('Setting basic data:', data.length, 'rows');
            
            if (data && data.length > 0) {
                this.table.setData(data).then(() => {
                    console.log('✅ Basic data set successfully');
                    
                    // Force visibility
                    setTimeout(() => {
                        const tableEl = document.getElementById('matchups-table');
                        const container = document.getElementById('table0-container');
                        
                        if (tableEl && container) {
                            container.style.display = 'block';
                            container.style.visibility = 'visible';
                            tableEl.style.display = 'block';
                            tableEl.style.visibility = 'visible';
                            
                            // Check if it worked
                            const rows = tableEl.querySelectorAll('.tabulator-row');
                            console.log('Basic table rows visible:', rows.length);
                            
                            if (rows.length > 0) {
                                console.log('🎉 SUCCESS: Basic table is working!');
                            } else {
                                console.log('❌ Basic table still not showing rows');
                                
                                // Last resort: manual table creation
                                this.createManualTable(data);
                            }
                        }
                    }, 200);
                    
                }).catch(error => {
                    console.error('Error setting data:', error);
                });
            } else {
                console.error('No data to display');
            }
        }).catch(error => {
            console.error('Error fetching data:', error);
        });
        
        this.table.on("tableBuilt", () => {
            console.log("Basic matchups table built");
        });
    }

    // Manual table creation as last resort
    createManualTable(data) {
        console.log('Creating manual HTML table...');
        
        const tableEl = document.getElementById('matchups-table');
        
        let html = `
            <div style="overflow: auto; border: 1px solid #ddd;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Team</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Game</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Spread</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Total</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Lineup Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 8px; border: 1px solid #ddd;">${row.team}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${row.game}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.spread}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.total}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.lineupStatus}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        tableEl.innerHTML = html;
        console.log('✅ Manual table created with', data.length, 'rows');
    }
}
