// ============================================================================
// CACHE UTILITIES
// ============================================================================
/**
 * Generic caching utilities using API Mesh's context.state
 *
 * API Mesh provides a distributed key-value store via context.state that
 * persists data across requests. This module provides a reusable pattern
 * for fetch-and-cache operations.
 */

/**
 * Fetch data with automatic caching in context.state
 *
 * This function implements a cache-aside pattern with in-flight request deduplication:
 * 1. Check cache for existing data
 * 2. Return cached data if found
 * 3. Check if a fetch is already in progress for this request
 * 4. If yes, wait for it; if no, start a new fetch
 * 5. Process and cache the data
 * 6. Return the processed data
 *
 * In-flight deduplication prevents multiple concurrent fetches when processing
 * lists of products where each item checks the cache simultaneously.
 *
 * @param {string} cacheKey - Key to use for storing/retrieving from cache
 * @param {number} ttl - Time to live in seconds (e.g., 604800 for 7 days)
 * @param {Function} fetchFn - Async function that fetches the raw data
 * @param {Function} processFn - Function that transforms raw data to desired format
 * @param {Object} context - API Mesh resolver context (provides state, logger)
 * @param {string} logPrefix - Prefix for log messages (e.g., "VAT_RATES")
 * @returns {Promise<Object>} - Processed data from cache or fresh fetch
 *
 * @example
 * const data = await fetchWithCache(
 *   'MY_DATA',
 *   3600,
 *   async () => fetch('https://api.example.com/data').then(r => r.json()),
 *   (raw) => ({ formatted: raw.value }),
 *   context,
 *   'MY_DATA'
 * );
 */
async function fetchWithCache(cacheKey, ttl, fetchFn, processFn, context, logPrefix) {
    try {
        // Check cache first
        const cachedData = await context.state.get(cacheKey);
        if (cachedData) {
            context.logger.log(`${logPrefix}_CACHE_HIT`);
            return JSON.parse(cachedData);
        }

        // Initialize in-flight requests map on context if not exists
        if (!context._inFlightRequests) {
            context._inFlightRequests = {};
        }

        // Check if a fetch is already in progress for this cache key
        if (context._inFlightRequests[cacheKey]) {
            context.logger.log(`${logPrefix}_CACHE_MISS_WAITING_FOR_INFLIGHT`);
            // Wait for the in-flight request to complete
            return await context._inFlightRequests[cacheKey];
        }

        context.logger.log(`${logPrefix}_CACHE_MISS_FETCHING_API`);

        // Create the fetch promise and store it
        const fetchPromise = (async () => {
            // Fetch fresh data
            const data = await fetchFn();

            // Process the data
            const processedData = processFn(data);

            context.logger.log(`${logPrefix}_FETCHED_SUCCESS`);

            // Cache the processed data
            await context.state.put(cacheKey, JSON.stringify(processedData), { ttl });

            return processedData;
        })();

        // Store the promise so other concurrent calls can wait for it
        context._inFlightRequests[cacheKey] = fetchPromise;

        // Wait for the fetch to complete
        const result = await fetchPromise;

        // Clean up the in-flight request
        delete context._inFlightRequests[cacheKey];

        return result;

    } catch (error) {
        context.logger.error(`${logPrefix}_FETCH_ERROR`, { error: error.message });
        // Clean up in-flight request on error
        if (context._inFlightRequests && context._inFlightRequests[cacheKey]) {
            delete context._inFlightRequests[cacheKey];
        }
        // Return empty object to gracefully handle errors
        // Prevents resolver from failing when external API is down
        return {};
    }
}

module.exports = {
    fetchWithCache
};
