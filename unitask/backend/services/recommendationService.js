const natural = require('natural');

/**
 * Recommend gigs based on a search query.
 * @param {string} query - The search query entered by the user.
 * @param {Array} gigs - List of all available gigs.
 * @returns {Array} - Recommended gigs sorted by relevance.
 */
function recommendGigs(query, gigs) {
    if (!query || gigs.length === 0) return [];

    // Tokenize and stem the query
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const queryTokens = tokenizer.tokenize(query).map(token => stemmer.stem(token));

    // Calculate similarity scores for each gig
    const scores = gigs.map(gig => {
        const gigTokens = tokenizer.tokenize(gig.title + ' ' + gig.description).map(token => stemmer.stem(token));
        const commonTokens = queryTokens.filter(token => gigTokens.includes(token));
        return { gig, score: commonTokens.length };
    });

    // Sort gigs by score in descending order
    scores.sort((a, b) => b.score - a.score);

    // Return gigs with non-zero scores
    return scores.filter(scoreObj => scoreObj.score > 0).map(scoreObj => scoreObj.gig);
}

module.exports = { recommendGigs };