// tables/combinedMatchupsTable.js - VERSION WITH LAZY LOADING ADDITIONAL DATA
import { BaseTable } from './baseTable.js';
import { createCustomMultiSelect } from '../components/customMultiSelect.js';
import { API_CONFIG, TEAM_NAME_MAP } from '../shared/config.js';

export class MatchupsTable extends BaseTable {
    constructor(elementId) {
        super(elementId, 'ModMatchupsData');
        this.matchupsData = [];
        this.additionalDataCache = new Map(); // Cache for additional data
    }

    // Fetch additional data for a specific matchup (lazy loading)
    async fetchAdditionalData(matchupId) {
        // Check cache first
        if (this.additionalDataCache.has(matchupId)) {
            return this.additionalDataCache.get(matchupId);
        }

        try {
            console.log(`Fetching additional data for matchup ${matchupId}...`);
            
            // Fetch from multiple tables in parallel
            const [parkFactors, batterMatchups, pitcherMatchups, bullpenMatchups] = await Promise.all([
                this.fetchTableData('ModParkFactors', matchupId),
                this.fetchTableData('ModBatterMatchups', matchupId),
                this.fetchTableData('ModPitcherMatchups', matchupId),
                this.fetchTableData('ModBullpenMatchups', matchupId)
            ]);

            const additionalData = {
                parkFactors,
                batterMatchups,
                pitcherMatchups,
                bullpenMatchups
            };

            // Cache the result
            this.additionalDataCache.set(matchupId, additionalData);
            
            return additionalData;
        } catch (error) {
            console.error('Error fetching additional data:', error);
            return null;
        }
    }

    // Helper to fetch data from a specific table
    async fetchTableData(tableName, matchupId) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseURL}${tableName}?Matchup_Game_ID=eq.${matchupId}`,
                {
                    method: 'GET',
                    headers: API_CONFIG.headers
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${tableName}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return [];
        }
    }

    // Override setupRowExpansion to include data fetching
    setupRowExpansion() {
        this.table.on("cellClick", async (e, cell) => {
            if (cell.getField() === "Matchup Team") {
                const row = cell.getRow();
                const data = row.getData();
                
                // If expanding and no additional data yet, fetch it
                if (!data._expanded && !data._additionalDataFetched) {
                    // Show loading indicator
                    const cellElement = cell.getElement();
                    const originalContent = cellElement.innerHTML;
                    
                    // Add loading spinner
                    const expanderIcon = cellElement.querySelector('.row-expander');
                    if (expanderIcon) {
                        expanderIcon.innerHTML = '⟳'; // Loading symbol
                        expanderIcon.style.animation = 'spin 1s linear infinite';
                    }
                    
                    // Fetch additional data
                    const matchupId = data["Matchup Game ID"];
                    const additionalData = await this.fetchAdditionalData(matchupId);
                    
                    if (additionalData) {
                        // Add the additional data to the row
                        data._additionalData = additionalData;
                        data._additionalDataFetched = true;
                        row.update(data);
                    }
                    
                    // Remove loading spinner
                    if (expanderIcon) {
                        expanderIcon.style.animation = '';
                    }
                }
                
                // Toggle expansion
                data._expanded = !data._expanded;
                row.update(data);
                row.reformat();
                
                setTimeout(() => {
                    try {
                        const cellElement = cell.getElement();
                        if (cellElement) {
                            const expanderIcon = cellElement.querySelector('.row-expander');
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

    // Enhanced subtable with additional data if available
    createMatchupsSubtable(container, data) {
        // Basic weather table (always shown)
        const weatherData = [
            { label: "Temperature", value: data["Matchup Weather 1"] || "N/A" },
            { label: "Conditions", value: data["Matchup Weather 2"] || "N/A" },
            { label: "Wind", value: data["Matchup Weather 3"] || "N/A" },
            { label: "Humidity", value: data["Matchup Weather 4"] || "N/A" }
        ];

        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd; margin-bottom: 10px;">
                <tbody>
                    <tr>
                        <td rowspan="4" style="width: 40%; padding: 15px; border-right: 2px solid #ddd; vertical-align: middle; text-align: center; background: #f8f9fa; font-weight: bold; font-size: 14px;">
                            ${data["Matchup Ballpark"] || "Unknown Ballpark"}
                        </td>
                        <td style="padding: 8px 15px; border-bottom: 1px solid #eee;">
                            <span style="font-weight: bold; color: #666;">${weatherData[0].label}:</span> 
                            <span style="color: #333;">${weatherData[0].value}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 15px; border-bottom: 1px solid #eee;">
                            <span style="font-weight: bold; color: #666;">${weatherData[1].label}:</span> 
                            <span style="color: #333;">${weatherData[1].value}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 15px; border-bottom: 1px solid #eee;">
                            <span style="font-weight: bold; color: #666;">${weatherData[2].label}:</span> 
                            <span style="color: #333;">${weatherData[2].value}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 15px;">
                            <span style="font-weight: bold; color: #666;">${weatherData[3].label}:</span> 
                            <span style="color: #333;">${weatherData[3].value}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        // If additional data is available, show it
        if (data._additionalData) {
            const { parkFactors, batterMatchups, pitcherMatchups } = data._additionalData;
            
            // Add a summary section
            tableHTML += `
                <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Additional Matchup Data</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <div>
                            <strong>Park Factors:</strong> ${parkFactors.length} records
                        </div>
                        <div>
                            <strong>Batter Matchups:</strong> ${batterMatchups.length} records
                        </div>
                        <div>
                            <strong>Pitcher Matchups:</strong> ${pitcherMatchups.length} records
                        </div>
                    </div>
                </div>
            `;
        } else if (!data._additionalDataFetched) {
            // Show message that data can be loaded
            tableHTML += `
                <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 4px; text-align: center; color: #1976d2;">
                    <em>Additional matchup data available - Click the team name again to load</em>
                </div>
            `;
        }

        container.innerHTML = tableHTML;
    }
}

// Add the loading animation to your CSS
const loadingCSS = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
