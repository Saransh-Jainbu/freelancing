import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader, AlertCircle, Search } from 'lucide-react';
import { getMarketplaceGigs } from '../../api/gigs';
import { API_URL } from '../../constants';

const MarketplacePage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch gigs with a callback to reuse the function
  const fetchGigs = useCallback(async (query, category) => {
    try {
      setSearching(true);
      setError('');
      console.log(`Fetching gigs with query: "${query}", category: ${category}`);
      
      // Direct fetch for debugging
      const url = `${API_URL}/api/marketplace/gigs${query || category !== 'all' ? '?' : ''}${query ? `q=${query}` : ''}${query && category !== 'all' ? '&' : ''}${category !== 'all' ? `category=${category}` : ''}`;
      console.log('DEBUG: Fetching from URL:', url);
      
      const response = await fetch(url);
      const jsonData = await response.json();
      console.log('DEBUG: Raw API response:', jsonData);
      
      if (!jsonData.success) {
        throw new Error(jsonData.message || 'API returned unsuccessful response');
      }
      
      console.log(`DEBUG: Gigs count in response: ${jsonData.gigs ? jsonData.gigs.length : 0}`);
      console.log('DEBUG: First few gigs:', jsonData.gigs?.slice(0, 2));
      
      setGigs(jsonData.gigs || []);
    } catch (err) {
      console.error('Failed to load gigs:', err);
      setError(err.message || 'Failed to load gigs');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load - important to load gigs on first render with empty query
  useEffect(() => {
    setLoading(true);
    fetchGigs('', selectedCategory);
  }, [fetchGigs, selectedCategory]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Handle search button click
  const handleSearch = () => {
    fetchGigs(searchQuery, selectedCategory);
  };

  // Loading state
  if (loading && !searching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover talented students offering various services</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gigs..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Content Writing">Content Writing</option>
            <option value="Marketing">Marketing</option>
            <option value="Data Analysis">Data Analysis</option>
            <option value="Video Editing">Video Editing</option>
            <option value="Music Production">Music Production</option>
          </select>
          
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs && gigs.length > 0 ? (
            gigs.map((gig) => (
              <Link
                key={gig.id}
                to={`/gig/${gig.id}`}
                className="group bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
              >
                {/* Gig Card Content */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                      {gig.seller_avatar ? (
                        <img
                          src={gig.seller_avatar}
                          alt={gig.seller_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-medium">
                          {gig.seller_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{gig.seller_name || "Seller"}</h3>
                      <p className="text-sm text-gray-400">{gig.seller_title || "Freelancer"}</p>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {gig.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{gig.description || "No description provided"}</p>
                  
                  <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-sm text-gray-300 mb-4">
                    {gig.category || "Uncategorized"}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{gig.rating || 'New'}</span>
                    </div>
                    <span className="font-semibold text-purple-300">{gig.price || "$0"}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Empty state when no gigs are found and loading is complete
            !loading && (
              <div className="col-span-full text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No gigs found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
