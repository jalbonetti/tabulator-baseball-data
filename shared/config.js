// shared/config.js
export const API_CONFIG = {
    baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Content-Type": "application/json"
    }
};

export const TEAM_NAME_MAP = {
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

// shared/utils.js
export function getOpponentTeam(matchup, playerTeam) {
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

export function getSwitchHitterVersus(batterHandedness, pitcherHandedness) {
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

export function formatPercentage(value) {
    if (value === null || value === undefined) return "0%";
    return (parseFloat(value) * 100).toFixed(1) + "%";
}

export function formatClearancePercentage(value) {
    if (value === null || value === undefined) return "0%";
    return parseFloat(value).toFixed(1) + "%";
}
