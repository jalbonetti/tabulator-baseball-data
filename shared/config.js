// shared/config.js - UPDATED WITH PROPER SUPABASE SETTINGS
export const API_CONFIG = {
    baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Content-Type": "application/json",
        // Additional SupaBase headers for better data fetching
        "Prefer": "return=representation,count=exact",
        "Accept": "application/json",
        "Accept-Profile": "public"
    },
    // Configuration for data fetching
    fetchConfig: {
        pageSize: 1000, // SupaBase maximum per request
        maxRetries: 3,
        retryDelay: 1000 // milliseconds
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
