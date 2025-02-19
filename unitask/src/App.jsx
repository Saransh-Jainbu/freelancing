import { useState, useEffect } from 'react';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Filter,
  ArrowUpDown,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';

// Custom Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg bg-gray-900 rounded-xl shadow-xl">
        {children}
      </div>
    </div>
  );
};

// Create Gig Modal Component
const CreateGigModal = ({ isOpen, onClose, onCreateGig }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newGig = {
      id: Date.now(),
      ...formData,
      status: 'active',
      orders: 0,
      rating: 0,
      earnings: '$0',
      created: new Date().toISOString().split('T')[0]
    };

    onCreateGig(newGig);
    onClose();
    setFormData({
      title: '',
      category: '',
      price: '',
      description: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Gig</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Enter gig title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Enter category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Price (per hour)
            </label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Enter price (e.g. $30/hr)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Enter gig description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white"
            >
              Create Gig
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Main Page Component
const MyGigsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gigs, setGigs] = useState([
    {
      id: 1,
      title: "Web Development Services",
      category: "Web Development",
      price: "$30/hr",
      status: "active",
      orders: 12,
      rating: 4.8,
      earnings: "$2,450",
      description: "Full-stack web development services including React, Node.js, and database design.",
      created: "2025-01-15"
    },
    {
      id: 2,
      title: "Content Writing & SEO",
      category: "Content Writing",
      price: "$25/hr",
      status: "paused",
      orders: 8,
      rating: 4.6,
      earnings: "$1,200",
      description: "Professional content writing with SEO optimization for websites and blogs.",
      created: "2025-02-01"
    }
  ]);

  const [sortBy, setSortBy] = useState('created');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCreateGig = (newGig) => {
    setGigs(prevGigs => [newGig, ...prevGigs]);
  };

  const handleDeleteGig = (gigId) => {
    setGigs(gigs.filter(gig => gig.id !== gigId));
  };

  const handleStatusToggle = (gigId) => {
    setGigs(gigs.map(gig => {
      if (gig.id === gigId) {
        return {
          ...gig,
          status: gig.status === 'active' ? 'paused' : 'active'
        };
      }
      return gig;
    }));
  };

  const filteredGigs = gigs
    .filter(gig => filterStatus === 'all' ? true : gig.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'earnings':
          return parseFloat(b.earnings.replace('$', '').replace(',', '')) - 
                 parseFloat(a.earnings.replace('$', '').replace(',', ''));
        case 'orders':
          return b.orders - a.orders;
        case 'rating':
          return b.rating - a.rating;
        default:
          return new Date(b.created) - new Date(a.created);
      }
    });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Create Gig Modal */}
      <CreateGigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGig={handleCreateGig}
      />

      {/* Header */}
      <div className="border-b border-white/5 bg-black/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Gigs</h1>
              <p className="text-gray-400 mt-1">Manage and track your freelance services</p>
            </div>
            <button 
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2 hover:opacity-90 transition-opacity"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <span>Create New Gig</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="created">Date Created</option>
                <option value="earnings">Earnings</option>
                <option value="orders">Orders</option>
                <option value="rating">Rating</option>
              </select>
              <ArrowUpDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <p className="text-gray-400">
            Showing {filteredGigs.length} of {gigs.length} gigs
          </p>
        </div>

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map((gig) => (
            <div 
              key={gig.id}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  gig.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusToggle(gig.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {/* Handle edit */}}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGig(gig.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Gig Content */}
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-2">{gig.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{gig.description}</p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="font-semibold">{gig.price}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Orders</p>
                    <p className="font-semibold">{gig.orders}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Rating</p>
                    <p className="font-semibold">{gig.rating} ★</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Earnings</p>
                    <p className="font-semibold">{gig.earnings}</p>
                  </div>
                </div>

                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGigs.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No gigs found</h3>
            <p className="text-gray-400 mb-6">
              {filterStatus !== 'all' 
                ? "Try changing your filters or create a new gig"
                : "Start by creating your first gig"}
            </p>
            <button 
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Create New Gig
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGigsPage;
                