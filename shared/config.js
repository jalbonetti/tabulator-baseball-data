// shared/config.js - Baseball Props Configuration
// Updated to match NBA repository patterns (responsive breakpoints, helpers)

export const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://hcwolbvmffkmjcxsumwn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0',
    
    // Cache Configuration
    CACHE_ENABLED: true,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    CACHE_VERSION: '2.0.0',
    
    // API Configuration
    API_CONFIG: {
        baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
        headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
            "Content-Type": "application/json",
            "Prefer": "return=representation,count=exact",
            "Accept": "application/json",
            "Accept-Profile": "public",
            "Cache-Control": "public, max-age=300"
        },
        fetchConfig: {
            pageSize: 1000,
            maxRetries: 3,
            retryDelay: 1000,
        }
    },
    
    // Responsive Breakpoints (matching NBA)
    BREAKPOINTS: {
        mobile: 768,
        tablet: 1024,
        desktop: 1025
    },
    
    // Team Abbreviations
    TEAM_ABBREVIATIONS: {
        'Arizona Diamondbacks': 'ARI',
        'Atlanta Braves': 'ATL',
        'Baltimore Orioles': 'BAL',
        'Boston Red Sox': 'BOS',
        'Chicago Cubs': 'CHC',
        'Chicago White Sox': 'CHW',
        'Cincinnati Reds': 'CIN',
        'Cleveland Guardians': 'CLE',
        'Colorado Rockies': 'COL',
        'Detroit Tigers': 'DET',
        'Houston Astros': 'HOU',
        'Kansas City Royals': 'KC',
        'Los Angeles Angels': 'LAA',
        'Los Angeles Dodgers': 'LAD',
        'Miami Marlins': 'MIA',
        'Milwaukee Brewers': 'MIL',
        'Minnesota Twins': 'MIN',
        'New York Mets': 'NYM',
        'New York Yankees': 'NYY',
        'Oakland Athletics': 'OAK',
        'Philadelphia Phillies': 'PHI',
        'Pittsburgh Pirates': 'PIT',
        'San Diego Padres': 'SD',
        'San Francisco Giants': 'SF',
        'Seattle Mariners': 'SEA',
        'St. Louis Cardinals': 'STL',
        'Tampa Bay Rays': 'TB',
        'Texas Rangers': 'TEX',
        'Toronto Blue Jays': 'TOR',
        'Washington Nationals': 'WSH'
    }
};

// =====================================================
// Responsive helper functions (matching NBA patterns)
// =====================================================

export function isMobile() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= CONFIG.BREAKPOINTS.mobile;
}

export function isTablet() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > CONFIG.BREAKPOINTS.mobile && 
           window.innerWidth <= CONFIG.BREAKPOINTS.tablet;
}

export function isDesktop() {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > CONFIG.BREAKPOINTS.tablet;
}

export function getDeviceType() {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

export function getDeviceScale() {
    if (typeof window === 'undefined') return 1;
    const width = window.innerWidth;
    if (width <= 480) return 0.7;
    if (width <= 768) return 0.8;
    if (width <= 1024) return 0.9;
    return 1;
}

export function getResponsiveFontSize(baseSize = 12) {
    const scale = getDeviceScale();
    return Math.round(baseSize * scale);
}

// Export API config and team map for direct access
export const API_CONFIG = CONFIG.API_CONFIG;
export const TEAM_NAME_MAP = CONFIG.TEAM_ABBREVIATIONS;

export default CONFIG;
