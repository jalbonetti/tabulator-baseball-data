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
