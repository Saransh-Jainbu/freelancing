const natural = require('natural');

/**
 * Recommend gigs based on a search query.
 * @param {string} query - The search query entered by the user.
 * @param {Array} gigs - List of all available gigs.
 * @returns {Array} - Recommended gigs sorted by relevance.
 */
function recommendGigs(query, gigs) {
    if (!query || !query.trim()) {
        // Return all gigs sorted by review count if no query
        return gigs.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 20);
    }
    
    if (gigs.length === 0) return [];

    // Tokenize and stem the query
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const queryTokens = tokenizer.tokenize((query || '').toLowerCase());
    const queryStems = queryTokens.map(token => stemmer.stem(token));

    // Calculate similarity scores for each gig
    const scores = gigs.map(gig => {
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
        const popularityFactor = Math.log(1 + (gig.reviewCount || 0)) * 0.5;
        
        // Calculate final score with different weights
        const score = 
            (exactMatches * 3) + 
            (stemMatches * 2) + 
            (partialMatches * 1) + 
            categoryBonus +
            popularityFactor;
            
        return { 
            gig, 
            score,
            matchDetails: {
                exact: exactMatches,
                stem: stemMatches,
                partial: partialMatches,
                category: categoryBonus,
                popularity: popularityFactor
            }
        };
    });

    // Sort gigs by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    // For debugging
    console.log(`[Recommendation] Query: "${query}" found ${scores.filter(s => s.score > 0).length} matches`);
    
    // Return all gigs, sorted by relevance (even with zero score as fallback)
    return scores.map(scoreObj => scoreObj.gig);
}

module.exports = { recommendGigs };