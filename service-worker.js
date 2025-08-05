// service-worker.js - Advanced caching for Tabulator tables
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
    static: `tabulator-static-${CACHE_VERSION}`,
    api: `tabulator-api-${CACHE_VERSION}`,
    runtime: `tabulator-runtime-${CACHE_VERSION}`
};

// API endpoints with their cache durations (15 minutes)
const API_CACHE_CONFIG = {
    'ModBatterClearancesAlt': 15 * 60 * 1000,
    'ModBatterClearances': 15 * 60 * 1000,
    'ModPitcherClearances': 15 * 60 * 1000,
    'ModPitcherClearancesAlt': 15 * 60 * 1000,
    'ModMatchupsData': 15 * 60 * 1000,
    'ModBatterStats': 15 * 60 * 1000,
    'ModPitcherStats': 15 * 60 * 1000,
    'ModBatterProps': 15 * 60 * 1000,
    'ModPitcherProps': 15 * 60 * 1000,
    'ModGameProps': 15 * 60 * 1000
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll([
                    '/',
                    '/main.js',
                    '/styles/tableStyles.js',
                    '/shared/config.js',
                    '/shared/utils.js',
                    '/components/customMultiSelect.js',
                    '/components/tabManager.js',
                    '/tables/baseTable.js',
                    '/tables/batterClearancesTable.js',
                    '/tables/batterClearancesAltTable.js',
                    '/tables/pitcherClearancesTable.js',
                    '/tables/pitcherClearancesAltTable.js',
                    '/tables/combinedMatchupsTable.js',
                    '/tables/modBatterStats.js',
                    '/tables/modPitcherStats.js',
                    '/tables/batterProps.js',
                    '/tables/pitcherProps.js',
                    '/tables/gameProps.js'
                ]);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Check if this is a Supabase API request
    if (url.origin === 'https://hcwolbvmffkmjcxsumwn.supabase.co') {
        event.respondWith(handleAPIRequest(request));
    }
    // Check if this is a static asset
    else if (request.destination === 'script' || 
             request.destination === 'style' || 
             request.destination === 'document') {
        event.respondWith(handleStaticRequest(request));
    }
});

// Handle API requests with cache-first strategy for large datasets
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const endpoint = getEndpointFromURL(url);
    
    // Check if this endpoint should be cached
    if (!API_CACHE_CONFIG[endpoint]) {
        return fetch(request);
    }
    
    // Try to get from cache first
    const cachedResponse = await getCachedAPIResponse(request);
    if (cachedResponse) {
        console.log(`Service Worker: Serving ${endpoint} from cache`);
        
        // Refresh cache in background if needed
        const cacheAge = await getCacheAge(request);
        if (cacheAge > API_CACHE_CONFIG[endpoint]) {
            console.log(`Service Worker: Cache for ${endpoint} is stale, refreshing in background`);
            refreshCacheInBackground(request);
        }
        
        return cachedResponse;
    }
    
    // If not in cache or cache miss, fetch from network
    console.log(`Service Worker: Fetching ${endpoint} from network`);
    
    try {
        const networkResponse = await fetchWithTimeout(request, 300000); // 5 minute timeout
        
        // Cache the response if successful
        if (networkResponse && networkResponse.ok) {
            await cacheAPIResponse(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Network request failed:', error);
        
        // Try to return stale cache if available
        const staleCache = await getStaleCache(request);
        if (staleCache) {
            console.log('Service Worker: Returning stale cache due to network failure');
            return staleCache;
        }
        
        // Return error response
        return new Response(JSON.stringify({ error: 'Network request failed' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle static assets with stale-while-revalidate strategy
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
    }
    
    // Fetch from network if not cached
    try {
        const networkResponse = await fetch(request);
        
        // Cache for future use
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAMES.static);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Failed to fetch static asset:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Helper functions
function getEndpointFromURL(url) {
    const pathname = url.pathname;
    const match = pathname.match(/\/rest\/v1\/([^?]+)/);
    return match ? match[1] : null;
}

async function getCachedAPIResponse(request) {
    const cache = await caches.open(CACHE_NAMES.api);
    const response = await cache.match(request);
    
    if (!response) return null;
    
    // Check if cache is still valid
    const cachedAt = response.headers.get('sw-cached-at');
    if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        const endpoint = getEndpointFromURL(new URL(request.url));
        
        if (age < API_CACHE_CONFIG[endpoint]) {
            return response;
        }
    }
    
    return null;
}

async function getCacheAge(request) {
    const cache = await caches.open(CACHE_NAMES.api);
    const response = await cache.match(request);
    
    if (!response) return Infinity;
    
    const cachedAt = response.headers.get('sw-cached-at');
    return cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;
}

async function cacheAPIResponse(request, response) {
    const cache = await caches.open(CACHE_NAMES.api);
    
    // Clone response and add cache timestamp
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', Date.now().toString());
    
    const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
    
    await cache.put(request, cachedResponse);
}

async function refreshCacheInBackground(request) {
    try {
        const freshResponse = await fetch(request.clone());
        
        if (freshResponse && freshResponse.ok) {
            await cacheAPIResponse(request, freshResponse);
            console.log('Service Worker: Background cache refresh complete');
        }
    } catch (error) {
        console.error('Service Worker: Background refresh failed:', error);
    }
}

async function getStaleCache(request) {
    const cache = await caches.open(CACHE_NAMES.api);
    return cache.match(request);
}

async function fetchWithTimeout(request, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Periodic cache cleanup
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEANUP_CACHE') {
        cleanupOldCaches();
    }
});

async function cleanupOldCaches() {
    const cache = await caches.open(CACHE_NAMES.api);
    const requests = await cache.keys();
    
    for (const request of requests) {
        const response = await cache.match(request);
        const cachedAt = response.headers.get('sw-cached-at');
        
        if (cachedAt) {
            const age = Date.now() - parseInt(cachedAt);
            const endpoint = getEndpointFromURL(new URL(request.url));
            
            // Remove if older than 2x the cache duration
            if (age > API_CACHE_CONFIG[endpoint] * 2) {
                await cache.delete(request);
                console.log(`Service Worker: Cleaned up old cache for ${endpoint}`);
            }
        }
    }
}
