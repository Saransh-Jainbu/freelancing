import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import CreateGigModal from './CreateGigModal';
import GigCard from '../dashboard/GigCard';
import EmptyState from '../dashboard/EmptyState';
import { getUserGigs, createGig } from '../../api/gigs';

const MyGigsPage = () => {
  const { currentUser } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch user's gigs
  useEffect(() => {
    const fetchGigs = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await getUserGigs(currentUser.id);
        setGigs(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load gigs');
        console.error('Error loading gigs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, [currentUser]);

  const handleCreateGig = async (formData) => {
    try {
      const newGig = await createGig(currentUser.id, formData);
      setGigs(prev => [newGig, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create gig:', err);
      throw err;
    }
  };

  const handleUpdateGig = async (formData) => {
    try {
      const response = await fetch(`/api/gigs/${editingGig.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGigs(prev => prev.map(gig => 
          gig.id === editingGig.id ? data.gig : gig
        ));
        setEditingGig(null);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to update gig:', err);
      throw err;
    }
  };

  const handleToggleStatus = async (gigId) => {
    try {
      const response = await fetch(`/api/gigs/${gigId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGigs(prev => prev.map(gig => 
          gig.id === gigId ? { ...gig, status: data.gig.status } : gig
        ));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to toggle gig status:', err);
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gigs/${gigId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGigs(prev => prev.filter(gig => gig.id !== gigId));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Failed to delete gig:', err);
    }
  };

  const filteredGigs = gigs.filter(gig => 
    filterStatus === 'all' || gig.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Gigs</h1>
            <p className="text-gray-400">Manage your service offerings</p>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Gig
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Gigs</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : filteredGigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                onEdit={() => setEditingGig(gig)}
                onDelete={handleDeleteGig}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            filterApplied={filterStatus !== 'all'}
            onCreateClick={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* Create/Edit Modal */}
        <CreateGigModal
          isOpen={isCreateModalOpen || !!editingGig}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingGig(null);
          }}
          onCreateGig={editingGig ? handleUpdateGig : handleCreateGig}
          initialData={editingGig}
        />
      </div>
    </div>
  );
};

export default MyGigsPage;
