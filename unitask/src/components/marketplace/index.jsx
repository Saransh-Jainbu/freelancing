import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader, AlertCircle, Search } from 'lucide-react';
import { getMarketplaceGigs } from '../../api/gigs';

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

  // Fetch gigs whenever search query or category changes
  const fetchGigs = useCallback(async (query, category) => {
    try {
      setSearching(true);
      setError('');
      const data = await getMarketplaceGigs(query, category);
      console.log(`Fetched ${data ? data.length : 0} gigs for query: ${query}, category: ${category}`);
      setGigs(data || []);
    } catch (err) {
      console.error('Failed to load gigs:', err);
      setError(err.message || 'Failed to load gigs');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchGigs('', 'all');
  }, [fetchGigs]);

  // Fetch when search or category changes
  useEffect(() => {
    fetchGigs(debouncedSearchQuery, selectedCategory);
  }, [debouncedSearchQuery, selectedCategory, fetchGigs]);

  // When category changes, fetch immediately
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
  };

  if (loading && !searching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
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
            onChange={handleCategoryChange}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="writing">Writing</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <Link
              key={gig.id}
              to={`/gig/${gig.id}`}
              className="group bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
            >
              {/* Gig Card Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={gig.seller_avatar || "/api/placeholder/32/32"}
                    alt={gig.seller_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{gig.seller_name || "Seller"}</h3>
                    <p className="text-sm text-gray-400">{gig.seller_title || "Freelancer"}</p>
                  </div>
                </div>

                <h2 className="text-lg font-semibold mb-2 line-clamp-2">{gig.title}</h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{gig.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">{gig.rating || 'New'}</span>
                  </div>
                  <span className="font-semibold">{gig.price}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {gigs.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No gigs found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
