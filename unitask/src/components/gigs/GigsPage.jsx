import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { Search, Filter, ChevronDown, Star, Clock, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import NewGigModal from './NewGigModal';

const GigsPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    deliveryTime: searchParams.get('deliveryTime') || '',
    sort: searchParams.get('sort') || 'newest'
  });
  
  const isFreelancer = currentUser?.user_type === 'freelancer';

  // Categories for filtering
  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'web-development', name: 'Web Development' },
    { id: 'mobile-development', name: 'Mobile Development' },
    { id: 'design', name: 'Design' },
    { id: 'writing', name: 'Writing & Translation' },
    { id: 'video', name: 'Video & Animation' },
    { id: 'music', name: 'Music & Audio' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'data', name: 'Data Science & Analytics' }
  ];

  // Sorting options
  const sortOptions = [
    { id: 'newest', name: 'Newest First' },
    { id: 'price_low', name: 'Price (Low to High)' },
    { id: 'price_high', name: 'Price (High to Low)' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'popular', name: 'Most Popular' }
  ];

  useEffect(() => {
    fetchGigs();
  }, [searchParams]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      
      // Build query string from search params
      const params = new URLSearchParams();
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      if (searchParams.get('category')) params.append('category', searchParams.get('category'));
      if (searchParams.get('minPrice')) params.append('minPrice', searchParams.get('minPrice'));
      if (searchParams.get('maxPrice')) params.append('maxPrice', searchParams.get('maxPrice'));
      if (searchParams.get('deliveryTime')) params.append('deliveryTime', searchParams.get('deliveryTime'));
      if (searchParams.get('sort')) params.append('sort', searchParams.get('sort'));
      
      const response = await fetch(`${API_URL}/api/gigs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gigs');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGigs(data.gigs);
      } else {
        throw new Error(data.message || 'Failed to load gigs');
      }
    } catch (error) {
      console.error('Error fetching gigs:', error);
      setError(error.message || 'Error loading gigs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.set(key, filters[key]);
      } else {
        params.delete(key);
      }
    });
    
    setSearchParams(params);
    setShowFilters(false);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    const searchInput = e.target.elements.search.value;
    const params = new URLSearchParams(searchParams);
    
    if (searchInput) {
      params.set('search', searchInput);
    } else {
      params.delete('search');
    }
    
    setSearchParams(params);
  };
  
  const handleNewGigSuccess = () => {
    setShowModal(false);
    fetchGigs();
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Services Marketplace</h1>
            <p className="text-gray-400">Find the perfect service for your needs</p>
          </div>
          
          {isFreelancer && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-4 py-2 flex items-center gap-2 hover:opacity-90"
            >
              <PlusCircle size={18} />
              Create New Gig
            </button>
          )}
        </div>
        
        {/* Search Bar and Filters */}
        <div className="bg-gray-900 border border-white/10 rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  name="search"
                  defaultValue={searchParams.get('search') || ''}
                  className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:border-purple-500"
                  placeholder="Search services..."
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-2 hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Filter toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <Filter className="h-5 w-5" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Filter options */}
          {showFilters && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg w-full px-3 py-2"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 w-full"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Delivery Time (days)</label>
                  <input
                    type="number"
                    placeholder="Max delivery days"
                    value={filters.deliveryTime}
                    onChange={(e) => handleFilterChange('deliveryTime', e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg w-full px-3 py-2"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={applyFilters}
                  className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-6 rounded-lg text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchGigs}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : gigs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map(gig => (
              <Link 
                key={gig.id} 
                to={`/gig/${gig.id}`}
                className="bg-gray-900/80 border border-white/10 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors"
              >
                <div className="h-48 bg-gray-800">
                  {gig.main_image ? (
                    <img 
                      src={gig.main_image}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No image available
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-800 rounded-full overflow-hidden">
                      {gig.seller_avatar ? (
                        <img 
                          src={gig.seller_avatar}
                          alt={gig.seller_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                          {gig.seller_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{gig.seller_name}</p>
                      {gig.seller_rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          <span className="text-xs">{gig.seller_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2 line-clamp-2">{gig.title}</h3>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <Clock className="w-4 h-4 mr-1" /> 
                    <span>{gig.delivery_time} day{gig.delivery_time !== 1 ? 's' : ''} delivery</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400">Starting at</div>
                    <div className="text-lg font-semibold">${gig.base_price}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/80 border border-white/10 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No services found</h2>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria or check back later.</p>
            <button
              onClick={() => {
                setSearchParams({});
                setFilters({
                  category: '',
                  minPrice: '',
                  maxPrice: '',
                  deliveryTime: '',
                  sort: 'newest'
                });
              }}
              className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* New Gig Modal */}
      {showModal && (
        <NewGigModal 
          onClose={() => setShowModal(false)}
          onSuccess={handleNewGigSuccess}
        />
      )}
    </div>
  );
};

export default GigsPage;
