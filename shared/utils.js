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
        return "Unknown"; // Changed from "Switch" to "Unknown"
    }
}

export function formatPercentage(value) {
    if (value === null || value === undefined) return "0%";
    return (parseFloat(value) * 100).toFixed(1) + "%";
}

// FIXED: This function should multiply by 100 if the value is stored as a decimal
export function formatClearancePercentage(value) {
    if (value === null || value === undefined) return "0%";
    // Check if the value appears to be a decimal (less than 1) that should be a percentage
    const numValue = parseFloat(value);
    if (numValue >= 0 && numValue <= 1) {
        // Value is stored as decimal, multiply by 100
        return (numValue * 100).toFixed(1) + "%";
    } else {
        // Value is already a percentage
        return numValue.toFixed(1) + "%";
    }
}

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
        return "Unknown"; // Changed from "Switch" to "Unknown"
    }
}

export function formatPercentage(value) {
    if (value === null || value === undefined) return "0%";
    const formatted = (parseFloat(value) * 100).toFixed(1);
    return removeLeadingZero(formatted) + "%";
}

export function formatClearancePercentage(value) {
    if (value === null || value === undefined) return "0%";
    // Check if the value appears to be a decimal (less than 1) that should be a percentage
    const numValue = parseFloat(value);
    let formatted;
    if (numValue >= 0 && numValue <= 1) {
        // Value is stored as decimal, multiply by 100
        formatted = (numValue * 100).toFixed(1);
    } else {
        // Value is already a percentage
        formatted = numValue.toFixed(1);
    }
    return removeLeadingZero(formatted) + "%";
}

// New utility function to remove leading zeros from decimal numbers
export function removeLeadingZero(value) {
    if (value === null || value === undefined || value === "") return value;
    
    // Convert to string if it's a number
    const str = String(value);
    
    // Check if it starts with "0." - remove the leading 0 for ALL cases
    if (str.startsWith("0.")) {
        return str.substring(1);
    }
    
    return str;
}

// Format decimal values with specified decimal places and remove leading zero
export function formatDecimal(value, decimalPlaces = 3) {
    if (value === null || value === undefined || value === "") return "-";
    const formatted = parseFloat(value).toFixed(decimalPlaces);
    return removeLeadingZero(formatted);
}
