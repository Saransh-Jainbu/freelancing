/**
 * Recommend gigs based on a search query.
 * @param {string} query - The search query entered by the user.
 * @param {Array} gigs - List of all available gigs.
 * @param {Object} options - Additional options like userLanguage, cacheKey, etc.
 * @returns {Array} - Recommended gigs sorted by relevance.
 */
function recommendGigs(query, gigs, options = {}) {
    try {
        // Early return cases
        if (!gigs || !Array.isArray(gigs) || gigs.length === 0) return [];
        if (!query || !query.trim()) {
            // Return all gigs sorted by orders/reviews if no query
            return gigs.sort((a, b) => (b.reviewCount || b.orders || 0) - (a.reviewCount || a.orders || 0)).slice(0, 20);
        }

        // Check cache if cacheKey is provided
        if (options.cacheKey && recommendationCache[options.cacheKey]) {
            console.log(`[Recommendation] Cache hit for key: ${options.cacheKey}`);
            return recommendationCache[options.cacheKey];
        }

        // Apply rate limiting if needed
        if (options.ipAddress && !checkRateLimit(options.ipAddress)) {
            console.warn(`[Recommendation] Rate limit exceeded for IP: ${options.ipAddress}`);
            return gigs.slice(0, 20); // Return default results when rate limited
        }

        // Try to use natural language processing if available
        try {
            const natural = require('natural');
            const results = recommendWithNLP(query, gigs, natural, options);
            
            // Cache results if caching is enabled
            if (options.cacheKey) {
                cacheResults(options.cacheKey, results);
            }
            
            return results;
        } catch (error) {
            // If natural package fails, fall back to simple string matching
            console.warn('[Recommendation] Natural package failed, using fallback method:', error.message);
            const results = recommendSimple(query, gigs, options);
            
            // Cache results if caching is enabled
            if (options.cacheKey) {
                cacheResults(options.cacheKey, results);
            }
            
            return results;
        }
    } catch (error) {
        console.error('[Recommendation] Error in recommendation service:', error);
        // In case of any error, return all gigs as last resort
        return gigs;
    }
}

// Simple in-memory cache for recommendations
const recommendationCache = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Rate limiting
const rateLimits = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per minute

/**
 * Caches recommendation results with expiration
 */
function cacheResults(key, results) {
    recommendationCache[key] = results;
    // Set expiration
    setTimeout(() => {
        delete recommendationCache[key];
    }, CACHE_TTL);
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(ipAddress) {
    const now = Date.now();
    if (!rateLimits[ipAddress]) {
        rateLimits[ipAddress] = {
            count: 1,
            firstRequest: now
        };
        return true;
    }

    // Reset counter if window has passed
    if (now - rateLimits[ipAddress].firstRequest > RATE_LIMIT_WINDOW) {
        rateLimits[ipAddress] = {
            count: 1,
            firstRequest: now
        };
        return true;
    }

    // Increment count and check limit
    rateLimits[ipAddress].count++;
    return rateLimits[ipAddress].count <= MAX_REQUESTS;
}

/**
 * Simple recommendation algorithm that doesn't rely on external packages
 */
function recommendSimple(query, gigs, options = {}) {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const userLanguage = options.userLanguage || 'en';
    
    // Calculate a simple score based on term frequency
    const scoredGigs = gigs.map(gig => {
        const title = (gig.title || '').toLowerCase();
        const description = (gig.description || '').toLowerCase();
        const category = (gig.category || '').toLowerCase();
        const text = `${title} ${description} ${category}`;
        
        let score = 0;
        
        // Count search term occurrences
        for (const term of searchTerms) {
            if (term.length < 3) continue; // Skip very short terms
            
            // Exact category match gets high score
            if (category === term) {
                score += 5;
                continue;
            }
            
            // Title matches are more important
            const titleMatches = title.split(term).length - 1;
            score += titleMatches * 3;
            
            // Description matches
            const descMatches = description.split(term).length - 1;
            score += descMatches;
            
            // Partial matches
            if (title.includes(term) || description.includes(term)) {
                score += 2;
            }
        }
        
        // Add small boost based on popularity (orders)
        score += Math.log(1 + (gig.reviewCount || gig.orders || 0)) * 0.5;
        
        // Language preference boost
        if (gig.language === userLanguage) {
            score += 1.5;
        }
        
        // User preferences boost if available
        if (options.userPreferences && gig.category && options.userPreferences.favoriteCategories) {
            if (options.userPreferences.favoriteCategories.includes(gig.category)) {
                score += 2;
            }
        }
        
        return { gig, score };
    });
    
    // Sort by score, then by orders/popularity as tiebreaker
    scoredGigs.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.gig.reviewCount || b.gig.orders || 0) - (a.gig.reviewCount || a.gig.orders || 0);
    });
    
    console.log(`[Recommendation Simple] Query: "${query}" found ${scoredGigs.filter(s => s.score > 0).length} matches`);
    
    return scoredGigs.map(scoredGig => scoredGig.gig);
}

/**
 * Advanced recommendation using natural language processing
 */
function recommendWithNLP(query, gigs, natural, options = {}) {
    // Tokenize and stem the query
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const queryTokens = tokenizer.tokenize((query || '').toLowerCase());
    const queryStems = queryTokens.map(token => stemmer.stem(token));
    const userLanguage = options.userLanguage || 'en';

    // Calculate similarity scores for each gig
    const scores = gigs.map(gig => {
        try {
            // Create tokens from gig title and description
            const gigText = `${gig.title || ''} ${gig.description || ''} ${gig.category || ''}`.toLowerCase();
            const gigTokens = tokenizer.tokenize(gigText);
            const gigStems = gigTokens.map(token => stemmer.stem(token));
            
            // Calculate scores using a combination of methods
            
            // 1. Exact token matches
            const exactMatches = queryTokens.filter(token => gigText.includes(token)).length;
            
            // 2. Stemmed matches
            const stemMatches = queryStems.filter(stem => gigStems.includes(stem)).length;
            
            // 3. Partial word matches
            let partialMatches = 0;
            for (const queryToken of queryTokens) {
                if (queryToken.length < 3) continue; // Skip short words
                
                for (const gigToken of gigTokens) {
                    if (gigToken.includes(queryToken) || queryToken.includes(gigToken)) {
                        partialMatches++;
                        break;
                    }
                }
            }
            
            // 4. Category match bonus
            const categoryBonus = gig.category && query.toLowerCase().includes(gig.category.toLowerCase()) ? 2 : 0;
            
            // 5. Review count consideration (popularity factor)
            // Use either reviewCount or orders as the popularity metric
            const popularity = gig.reviewCount || gig.orders || 0;
            const popularityFactor = Math.log(1 + popularity) * 0.5;
            
            // 6. Language preference boost
            const languageBoost = gig.language === userLanguage ? 1.5 : 0;
            
            // 7. User preferences boost if available
            let userPreferenceBoost = 0;
            if (options.userPreferences && gig.category && options.userPreferences.favoriteCategories) {
                if (options.userPreferences.favoriteCategories.includes(gig.category)) {
                    userPreferenceBoost = 2;
                }
            }
            
            // Calculate final score with different weights
            const score = 
                (exactMatches * 3) + 
                (stemMatches * 2) + 
                (partialMatches * 1) + 
                categoryBonus +
                popularityFactor +
                languageBoost +
                userPreferenceBoost;
                
            return { 
                gig, 
                score,
                matchDetails: {
                    exact: exactMatches,
                    stem: stemMatches,
                    partial: partialMatches,
                    category: categoryBonus,
                    popularity: popularityFactor,
                    language: languageBoost,
                    userPreference: userPreferenceBoost
                }
            };
        } catch (err) {
            // If processing a specific gig fails, give it a zero score
            console.warn(`[Recommendation] Error processing gig ${gig.id}:`, err.message);
            return { gig, score: 0 };
        }
    });

    // Sort gigs by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    console.log(`[Recommendation NLP] Query: "${query}" found ${scores.filter(s => s.score > 0).length} matches`);
    
    // Return all gigs, sorted by relevance (even with zero score as fallback)
    return scores.map(scoreObj => scoreObj.gig);
}

module.exports = { 
    recommendGigs,
    clearCache: () => Object.keys(recommendationCache).forEach(key => delete recommendationCache[key]),
    getCacheStats: () => ({
        size: Object.keys(recommendationCache).length,
        keys: Object.keys(recommendationCache)
    })
};