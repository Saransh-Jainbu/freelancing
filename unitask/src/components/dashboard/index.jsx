import { useState, useEffect } from 'react';
import { Plus, Filter, ArrowUpDown, AlertCircle, Loader } from 'lucide-react';
import { getUserGigs, createGig, toggleGigStatus, deleteGig, updateGig } from '../../api/gigs';
import { useAuth } from '../../context/AuthContextValue';

// Import components
import GigCard from './GigCard';
import CreateGigModal from './CreateGigModal';
import EmptyState from './EmptyState';

const MyGigsPage = () => {
  const { currentUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get the user ID from the auth context
  const userId = currentUser?.id || 1; // Fallback for development

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const data = await getUserGigs(userId);
        setGigs(data);
        setError('');
      } catch (err) {
        console.error('Failed to load gigs:', err);
        setError('Failed to load gigs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGigs();
  }, [userId]);

  const handleCreateGig = async (gigData) => {
    if (editingGig) {
      // Update existing gig
      const updatedGig = await updateGig(editingGig.id, userId, gigData);
      setGigs(prevGigs => 
        prevGigs.map(gig => gig.id === editingGig.id ? updatedGig : gig)
      );
      setEditingGig(null);
    } else {
      // Create new gig
      const newGig = await createGig(userId, gigData);
      setGigs(prevGigs => [newGig, ...prevGigs]);
    }
  };

  const handleEditGig = (gig) => {
    setEditingGig(gig);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingGig(null);
  };

  const handleDeleteGig = async (gigId) => {
    if (!confirm('Are you sure you want to delete this gig?')) {
      return;
    }
    
    try {
      await deleteGig(gigId, userId);
      setGigs(gigs.filter(gig => gig.id !== gigId));
    } catch (err) {
      console.error('Failed to delete gig:', err);
      alert('Failed to delete gig. Please try again.');
    }
  };

  const handleStatusToggle = async (gigId) => {
    try {
      const result = await toggleGigStatus(gigId, userId);
      
      setGigs(gigs.map(gig => {
        if (gig.id === parseInt(result.id)) {
          return {
            ...gig,
            status: result.status
          };
        }
        return gig;
      }));
    } catch (err) {
      console.error('Failed to toggle gig status:', err);
      alert('Failed to update gig status. Please try again.');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Create/Edit Gig Modal */}
      <CreateGigModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onCreateGig={handleCreateGig}
        initialData={editingGig}
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

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm underline hover:text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

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
            <GigCard 
              key={gig.id}
              gig={gig}
              onToggleStatus={handleStatusToggle}
              onDelete={handleDeleteGig}
              onEdit={handleEditGig}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredGigs.length === 0 && !loading && !error && (
          <EmptyState 
            filterApplied={filterStatus !== 'all'} 
            onCreateClick={() => setIsCreateModalOpen(true)} 
          />
        )}
      </div>
    </div>
  );
};

export default MyGigsPage;
