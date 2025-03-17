import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMarketplaceGigs } from '../api/gigs';
import { Search, Star, DollarSign, Filter, Briefcase, Loader, AlertCircle, ArrowUpRight } from 'lucide-react';

const MarketplacePage = () => {
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    'All Categories',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Marketing',
    'Data Analysis',
    'Video Editing',
    'Music Production'
  ];

  useEffect(() => {
    const loadGigs = async () => {
      try {
        setLoading(true);
        const marketplaceGigs = await getMarketplaceGigs();
        setGigs(marketplaceGigs);
        setFilteredGigs(marketplaceGigs);
      } catch (error) {
        console.error("Error loading marketplace gigs:", error);
        setError("Failed to load gigs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadGigs();
  }, []);

  useEffect(() => {
    if (!gigs) return;
    
    let result = [...gigs];
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      result = result.filter(gig => gig.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(gig => 
        gig.title.toLowerCase().includes(lowerSearchTerm) || 
        (gig.description && gig.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    setFilteredGigs(result);
  }, [searchTerm, selectedCategory, gigs]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === 'All Categories' ? '' : category);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Discovering student talents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 z-0"></div>
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              Campus Talent Marketplace
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover and hire talented university students for your projects
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for services..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Categories Filter */}
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-purple-400" />
            <h2 className="text-xl font-semibold">Categories</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  (category === 'All Categories' && !selectedCategory) || 
                  category === selectedCategory
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* No Results Message */}
        {filteredGigs?.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No gigs found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs?.map(gig => (
            <Link to={`/gig/${gig.id}`} key={gig.id} className="group">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 transition-all h-full flex flex-col">
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-300 transition-colors line-clamp-2 flex items-start">
                    {gig.title}
                    <ArrowUpRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {gig.description || "No description provided"}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-300">
                      {gig.category}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                        {gig.seller_avatar ? (
                          <img 
                            src={gig.seller_avatar} 
                            alt={gig.seller_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                            {gig.seller_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 overflow-hidden">
                        <p className="font-medium text-sm truncate">{gig.seller_name}</p>
                        <p className="text-gray-400 text-xs truncate">{gig.seller_title || "Student"}</p>
                      </div>
                    </div>
                    
                    {gig.seller_rating && (
                      <div className="flex items-center bg-white/5 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 text-yellow-400 mr-1 fill-yellow-400" />
                        <span className="text-xs">{gig.seller_rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white/5 border-t border-white/10 p-4 flex justify-between items-center">
                  <div className="text-sm">
                    Starting at
                  </div>
                  <div className="text-lg font-bold text-purple-300 flex items-center">
                    <DollarSign className="w-4 h-4 mr-0.5" />
                    {gig.price?.replace('$', '') || '0'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
