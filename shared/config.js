// shared/config.js - Baseball Props Configuration
// Flat export pattern matching CBB repos exactly

export const CONFIG = {
    SUPABASE_URL: 'https://hcwolbvmffkmjcxsumwn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0',
    CACHE_ENABLED: true,
    CACHE_TTL: 5 * 60 * 1000,
    BREAKPOINTS: { mobile: 768, tablet: 1024, desktop: 1025 }
};

export const API_CONFIG = {
    baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
    headers: {
        "apikey": CONFIG.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + CONFIG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation,count=exact",
        "Accept": "application/json",
        "Accept-Profile": "public",
        "Cache-Control": "public, max-age=300"
    },
    fetchConfig: { pageSize: 1000, maxRetries: 3, retryDelay: 1000 }
};

export const TEAM_NAME_MAP = {
    'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL',
    'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CHW',
    'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL',
    'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
    'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA',
    'Milwaukee Brewers': 'MIL', 'Minnesota Twins': 'MIN', 'New York Mets': 'NYM',
    'New York Yankees': 'NYY', 'Oakland Athletics': 'OAK', 'Philadelphia Phillies': 'PHI',
    'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
    'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL', 'Tampa Bay Rays': 'TB',
    'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR', 'Washington Nationals': 'WSH'
};

export function isMobile() { return window.innerWidth <= CONFIG.BREAKPOINTS.mobile; }
export function isTablet() { return window.innerWidth > CONFIG.BREAKPOINTS.mobile && window.innerWidth <= CONFIG.BREAKPOINTS.tablet; }
export function getDeviceType() { if (isMobile()) return 'mobile'; if (isTablet()) return 'tablet'; return 'desktop'; }
export function getDeviceScale() { return window.devicePixelRatio || 1; }
