// shared/config.js - ENHANCED WITH BETTER SUPABASE SETTINGS
export const API_CONFIG = {
    baseURL: "https://hcwolbvmffkmjcxsumwn.supabase.co/rest/v1/",
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0",
        "Content-Type": "application/json",
        // Enhanced SupaBase headers for better data fetching
        "Prefer": "return=representation,count=exact",
        "Accept": "application/json",
        "Accept-Profile": "public",
        // Add cache control to leverage CDN caching
        "Cache-Control": "public, max-age=900" // 15 minutes to match update interval
    },
    // Enhanced configuration for large data fetching
    fetchConfig: {
        pageSize: 1000, // SupaBase maximum per request
        maxRetries: 3,
        retryDelay: 1000, // milliseconds
        // Timeout for large requests (5 minutes)
        timeout: 300000,
        // Rate limiting - max requests per second
        maxRequestsPerSecond: 5,
        // Enable request batching for efficiency
        enableBatching: true,
        // Cache settings
        cacheEnabled: true,
        cacheDuration: 15 * 60 * 1000 // 15 minutes
    }
};

// Service Worker configuration for advanced caching
export const SW_CONFIG = {
    enabled: true,
    cacheVersion: 'v1',
    cacheNames: {
        static: 'tabulator-static-v1',
        api: 'tabulator-api-v1',
        runtime: 'tabulator-runtime-v1'
    },
    // URLs to cache
    cacheUrls: {
        static: [
            '/',
            '/main.js',
            '/styles/tableStyles.js',
            '/components/customMultiSelect.js',
            '/components/tabManager.js'
        ],
        // API endpoints to cache with TTL
        api: [
            {
                url: '/ModBatterClearancesAlt',
                ttl: 15 * 60 * 1000 // 15 minutes
            },
            {
                url: '/ModBatterClearances',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModPitcherClearances',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModPitcherClearancesAlt',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModMatchupsData',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModBatterStats',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModPitcherStats',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModBatterProps',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModPitcherProps',
                ttl: 15 * 60 * 1000
            },
            {
                url: '/ModGameProps',
                ttl: 15 * 60 * 1000
            }
        ]
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
