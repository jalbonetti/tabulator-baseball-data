// config/config.js - ENHANCED WITH RESPONSIVE TABLE CONFIGURATIONS
export const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://hcwolbvmffkmjcxsumwn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjd29sYnZtZmZrbWpjeHN1bXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNDQzMTIsImV4cCI6MjA1NTkyMDMxMn0.tM4RwXZpZM6ZHuFFMhWcKYLT3E4NA6Ig90CHw7QtJf0',
    
    // Cache Configuration
    CACHE_ENABLED: true,
    CACHE_TTL: 15 * 60 * 1000, // 15 minutes in milliseconds
    CACHE_VERSION: '1.0.0',
    
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
            "Cache-Control": "public, max-age=900"
        },
        fetchConfig: {
            pageSize: 1000,
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 300000,
            maxRequestsPerSecond: 5,
            enableBatching: true,
            cacheEnabled: true,
            cacheDuration: 15 * 60 * 1000
        }
    },
    
    // Table Configuration - RESPONSIVE DIMENSIONS
    TABLES: {
        BATTER_CLEARANCES: 'ModBatterClearances',
        PITCHER_CLEARANCES: 'ModPitcherClearances',
        BATTER_CLEARANCES_ALT: 'ModBatterClearancesAlt',
        PITCHER_CLEARANCES_ALT: 'ModPitcherClearancesAlt',
        MOD_BATTER_STATS: 'ModBatterStats',
        MOD_PITCHER_STATS: 'ModPitcherStats',
        MATCHUPS: 'ModMatchupsData',
        BATTER_ODDS: 'ModBatterOdds',
        PITCHER_ODDS: 'ModPitcherOdds',
        BATTER_PROPS: 'ModBatterProps',
        PITCHER_PROPS: 'ModPitcherProps',
        GAME_PROPS: 'ModGameProps'
    },
    
    // RESPONSIVE TABLE DIMENSIONS
    TABLE_DIMENSIONS: {
        // Desktop dimensions (1200px+ screens)
        desktop: {
            matchups: { width: 1200, maxWidth: 1200 },
            batterClearances: { width: 1860, maxWidth: 1860 },
            batterClearancesAlt: { width: 1360, maxWidth: 1360 },
            pitcherClearances: { width: 1860, maxWidth: 1860 },
            pitcherClearancesAlt: { width: 1360, maxWidth: 1360 },
            modBatterStats: { width: 1720, maxWidth: 1720 },
            modPitcherStats: { width: 1720, maxWidth: 1720 },
            batterProps: { width: 1720, maxWidth: 1720 },
            pitcherProps: { width: 1720, maxWidth: 1720 },
            gameProps: { width: 1720, maxWidth: 1720 }
        },
        // Tablet dimensions (768px - 1199px)
        tablet: {
            matchups: { width: '100%', maxWidth: 1000 },
            batterClearances: { width: '100%', maxWidth: '100%' },
            batterClearancesAlt: { width: '100%', maxWidth: '100%' },
            pitcherClearances: { width: '100%', maxWidth: '100%' },
            pitcherClearancesAlt: { width: '100%', maxWidth: '100%' },
            modBatterStats: { width: '100%', maxWidth: '100%' },
            modPitcherStats: { width: '100%', maxWidth: '100%' },
            batterProps: { width: '100%', maxWidth: '100%' },
            pitcherProps: { width: '100%', maxWidth: '100%' },
            gameProps: { width: '100%', maxWidth: '100%' }
        },
        // Mobile dimensions (< 768px) - use scale transform
        mobile: {
            scale: 0.65,
            transformOrigin: 'top left',
            widthMultiplier: 1.54 // 100 / 0.65
        }
    },
    
    // Responsive breakpoints
    BREAKPOINTS: {
        mobile: 767,
        tablet: 1199,
        desktop: 1200,
        ultrawide: 1920
    },
    
    // Display Configuration
    DISPLAY: {
        ROWS_PER_PAGE: 50,
        MAX_ROWS_VIRTUAL: 10000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 200,
        TABLE_HEIGHT: '600px',
        HEADER_HEIGHT: 30,
        ROW_HEIGHT: 28,
        MOBILE_SCALE: 0.65,
        TABLET_SCALE: 0.85
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_VIRTUAL_DOM: true,
        ENABLE_PROGRESSIVE_LOADING: true,
        ENABLE_STATE_PRESERVATION: true,
        ENABLE_ODDS_INTEGRATION: true,
        ENABLE_RESPONSIVE_TABLES: true,
        REMOVE_SCROLLBARS: true,
        ENABLE_MOBILE_PINCH_ZOOM: true
    },
    
    // Team Abbreviations Mapping
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
    },
    
    // Service Worker Configuration
    SW_CONFIG: {
        enabled: true,
        cacheVersion: 'v1',
        cacheNames: {
            static: 'tabulator-static-v1',
            api: 'tabulator-api-v1',
            runtime: 'tabulator-runtime-v1'
        },
        cacheUrls: {
            static: [
                '/',
                '/main.js',
                '/styles/tableStyles.js',
                '/components/customMultiSelect.js',
                '/components/tabManager.js'
            ],
            api: [
                { url: '/ModBatterClearancesAlt', ttl: 15 * 60 * 1000 },
                { url: '/ModBatterClearances', ttl: 15 * 60 * 1000 },
                { url: '/ModPitcherClearances', ttl: 15 * 60 * 1000 },
                { url: '/ModPitcherClearancesAlt', ttl: 15 * 60 * 1000 },
                { url: '/ModMatchupsData', ttl: 15 * 60 * 1000 },
                { url: '/ModBatterStats', ttl: 15 * 60 * 1000 },
                { url: '/ModPitcherStats', ttl: 15 * 60 * 1000 },
                { url: '/ModBatterProps', ttl: 15 * 60 * 1000 },
                { url: '/ModPitcherProps', ttl: 15 * 60 * 1000 },
                { url: '/ModGameProps', ttl: 15 * 60 * 1000 }
            ]
        }
    }
};

// Export helper functions
export function getTeamAbbreviation(fullName) {
    return CONFIG.TEAM_ABBREVIATIONS[fullName] || fullName;
}

export function getSupabaseConfig() {
    return {
        url: CONFIG.SUPABASE_URL,
        anonKey: CONFIG.SUPABASE_ANON_KEY
    };
}

// Get responsive table dimensions based on screen size
export function getTableDimensions(tableName) {
    const width = window.innerWidth;
    
    if (width < CONFIG.BREAKPOINTS.mobile) {
        // Mobile - return desktop dimensions but they'll be scaled
        return CONFIG.TABLE_DIMENSIONS.desktop[tableName];
    } else if (width < CONFIG.BREAKPOINTS.desktop) {
        // Tablet
        return CONFIG.TABLE_DIMENSIONS.tablet[tableName];
    } else {
        // Desktop
        return CONFIG.TABLE_DIMENSIONS.desktop[tableName];
    }
}

// Check if device is mobile
export function isMobile() {
    return window.innerWidth <= CONFIG.BREAKPOINTS.mobile;
}

// Check if device is tablet
export function isTablet() {
    return window.innerWidth > CONFIG.BREAKPOINTS.mobile && 
           window.innerWidth <= CONFIG.BREAKPOINTS.tablet;
}

// Get appropriate scale for current device
export function getDeviceScale() {
    if (isMobile()) {
        return CONFIG.DISPLAY.MOBILE_SCALE;
    } else if (isTablet()) {
        return CONFIG.DISPLAY.TABLET_SCALE;
    }
    return 1;
}

// Export CONFIG as default for backwards compatibility
export default CONFIG;
