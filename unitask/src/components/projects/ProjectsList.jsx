import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { Search, Clock, Users, Filter, Building, DollarSign, ChevronRight } from 'lucide-react';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minBudget: '',
    maxBudget: '',
    searchTerm: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });

  // Categories list
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing & Translation' },
    { value: 'video', label: 'Video & Animation' },
    { value: 'music', label: 'Music & Audio' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'business', label: 'Business' },
    { value: 'data', label: 'Data Science & Analytics' },
    { value: 'other', label: 'Other' }
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'budget_high', label: 'Highest Budget' },
    { value: 'budget_low', label: 'Lowest Budget' },
    { value: 'deadline', label: 'Closest Deadline' },
    { value: 'bid_count', label: 'Most Bids' }
  ];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        status: 'open',
        category: filters.category,
        minBudget: filters.minBudget || 0,
        maxBudget: filters.maxBudget || 999999,
        searchTerm: filters.searchTerm,
        sortBy: filters.sortBy
      });
      
      const response = await fetch(`${API_URL}/api/projects?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total
        }));
      } else {
        throw new Error(data.message || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, pagination.limit, filters.sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
    fetchProjects();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const formatBudget = (min, max) => {
    if (min && max) {
      return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
    } else if (min) {
      return `From $${min.toFixed(2)}`;
    } else if (max) {
      return `Up to $${max.toFixed(2)}`;
    }
    return 'Budget not specified';
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects Marketplace</h1>
          <p className="text-gray-400">Find projects to bid on and showcase your skills</p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-gray-900 border border-white/10 rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:border-purple-500"
                  placeholder="Search projects, skills or keywords..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Category</label>
              <select
                className="bg-black/30 border border-white/10 rounded-lg w-full px-3 py-2"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Min Budget</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="number"
                  className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:border-purple-500"
                  placeholder="Min"
                  min="0"
                  step="10"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Budget</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="number"
                  className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:border-purple-500"
                  placeholder="Max"
                  min="0"
                  step="10"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Sort By</label>
              <select
                className="bg-black/30 border border-white/10 rounded-lg w-full px-3 py-2"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Results count and filter tags */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="text-gray-400 mb-4 md:mb-0">
            Found <span className="text-white font-medium">{pagination.total}</span> project{pagination.total !== 1 && 's'}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <div className="bg-purple-900/30 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                {categories.find(c => c.value === filters.category)?.label || filters.category}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-1 hover:text-white"
                >
                  &times;
                </button>
              </div>
            )}
            
            {filters.searchTerm && (
              <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                Search: {filters.searchTerm}
                <button
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className="ml-1 hover:text-white"
                >
                  &times;
                </button>
              </div>
            )}
            
            {(filters.minBudget || filters.maxBudget) && (
              <div className="bg-green-900/30 border border-green-500/30 text-green-300 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                Budget: {filters.minBudget ? `$${filters.minBudget}` : '$0'} - {filters.maxBudget ? `$${filters.maxBudget}` : 'Any'}
                <button
                  onClick={() => {
                    handleFilterChange('minBudget', '');
                    handleFilterChange('maxBudget', '');
                  }}
                  className="ml-1 hover:text-white"
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Projects List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-6 rounded-lg text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-6">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block bg-gray-900 border border-white/10 hover:border-purple-500/30 hover:bg-gray-800 transition-colors rounded-lg p-6"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{project.company_name}</span>
                      </div>
                      {project.company_verified && (
                        <span className="bg-blue-900/30 text-blue-300 rounded-full px-2 py-0.5 text-xs">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.skills && project.skills.slice(0, 5).map(skill => (
                        <span key={skill} className="bg-gray-800 rounded-full px-2.5 py-0.5 text-xs">
                          {skill}
                        </span>
                      ))}
                      {project.skills && project.skills.length > 5 && (
                        <span className="bg-gray-800 rounded-full px-2.5 py-0.5 text-xs">
                          +{project.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-lg font-medium whitespace-nowrap mb-2">
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <span className="flex items-center gap-1 text-sm text-gray-300">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>{project.bid_count || 0} bids</span>
                      </span>
                      
                      {project.deadline && (
                        <span className="flex items-center gap-1 text-sm text-gray-300">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span>{calculateDaysRemaining(project.deadline)} days left</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <ChevronRight className="text-gray-500" />
                </div>
              </Link>
            ))}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-50"
                  >
                    &laquo; Prev
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Logic to show current page and nearby pages
                    let pageToShow;
                    if (pagination.totalPages <= 5) {
                      pageToShow = i + 1;
                    } else if (pagination.page <= 3) {
                      pageToShow = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageToShow = pagination.totalPages - 4 + i;
                    } else {
                      pageToShow = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageToShow }))}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          pagination.page === pageToShow 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                            : 'bg-gray-800'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-50"
                  >
                    Next &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 border border-white/10 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search filters or check back later</p>
            <button
              onClick={() => {
                setFilters({
                  category: '',
                  minBudget: '',
                  maxBudget: '',
                  searchTerm: '',
                  sortBy: 'newest'
                });
                fetchProjects();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
