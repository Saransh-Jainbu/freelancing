import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { getUserGigs, deleteGig } from '../../api/gigs';
import { Plus, MoreVertical, Trash2, Edit, ExternalLink, PauseCircle, PlayCircle, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewGigModal from './NewGigModal';
import EditGigModal from './EditGigModal';

const MyGigs = () => {
  const { currentUser } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNewGigModalOpen, setIsNewGigModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentGig, setCurrentGig] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    const loadGigs = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        console.log("Fetching gigs for user:", currentUser.id);
        const userGigs = await getUserGigs(currentUser.id);
        setGigs(userGigs);
        setError('');
      } catch (error) {
        console.error("Error loading gigs:", error);
        setError("Failed to load your gigs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadGigs();
  }, [currentUser]);

  const handleEditGig = (gig) => {
    setCurrentGig(gig);
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeleteGig = async (gigId) => {
    if (confirm("Are you sure you want to delete this gig?")) {
      try {
        await deleteGig(gigId, currentUser.id);
        setGigs(prevGigs => prevGigs.filter(gig => gig.id !== gigId));
        setActionMenuOpen(null);
      } catch (error) {
        console.error("Error deleting gig:", error);
        setError("Failed to delete gig. Please try again.");
      }
    }
  };

  const handleToggleActionMenu = (gigId) => {
    setActionMenuOpen(actionMenuOpen === gigId ? null : gigId);
  };

  const handleToggleGigStatus = async (gig) => {
    try {
      // Call API to toggle the gig status
      const response = await fetch(`${API_URL}/api/gigs/${gig.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update gig in local state
        setGigs(prevGigs => 
          prevGigs.map(g => 
            g.id === gig.id ? { ...g, status: g.status === 'active' ? 'paused' : 'active' } : g
          )
        );
        setActionMenuOpen(null);
      } else {
        setError("Failed to update gig status. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling gig status:", error);
      setError("Failed to update gig status. Please try again.");
    }
  };

  const handleGigAdded = (newGig) => {
    setGigs(prevGigs => [newGig, ...prevGigs]);
    setIsNewGigModalOpen(false);
  };

  const handleGigUpdated = (updatedGig) => {
    setGigs(prevGigs => 
      prevGigs.map(gig => 
        gig.id === updatedGig.id ? updatedGig : gig
      )
    );
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <NewGigModal 
        isOpen={isNewGigModalOpen} 
        onClose={() => setIsNewGigModalOpen(false)} 
        userId={currentUser?.id}
        onGigAdded={handleGigAdded}
      />
      
      {isEditModalOpen && (
        <EditGigModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          gig={currentGig}
          onGigUpdated={handleGigUpdated}
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Gigs</h1>
          <button 
            onClick={() => setIsNewGigModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Gig</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}
        
        {gigs.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center">
            <h3 className="text-xl font-medium mb-2">No gigs yet</h3>
            <p className="text-gray-400 mb-6">Create your first gig to start getting clients</p>
            <button 
              onClick={() => setIsNewGigModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Gig
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 text-left">Gig</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Orders</th>
                  <th className="py-3 px-4 text-left">Earnings</th>
                  <th className="py-3 px-4 text-left">Created</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gigs.map((gig) => (
                  <tr key={gig.id} className="hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{gig.title}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{gig.category}</td>
                    <td className="py-4 px-4">{gig.price}</td>
                    <td className="py-4 px-4">{gig.orders}</td>
                    <td className="py-4 px-4">{gig.earnings}</td>
                    <td className="py-4 px-4 text-gray-300">{gig.created}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        gig.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {gig.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center items-center relative">
                        <button 
                          onClick={() => handleToggleActionMenu(gig.id)} 
                          className="p-2 hover:bg-white/10 rounded-full"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionMenuOpen === gig.id && (
                          <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl z-10 py-1">
                            <Link 
                              to={`/gig/${gig.id}`} 
                              className="px-4 py-2 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Gig
                            </Link>
                            <button 
                              onClick={() => handleEditGig(gig)} 
                              className="px-4 py-2 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Gig
                            </button>
                            <button 
                              onClick={() => handleToggleGigStatus(gig)} 
                              className="px-4 py-2 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
                            >
                              {gig.status === 'active' ? (
                                <>
                                  <PauseCircle className="w-4 h-4" />
                                  Pause Gig
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4" />
                                  Activate Gig
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteGig(gig.id)} 
                              className="px-4 py-2 flex items-center gap-2 hover:bg-red-900/20 text-red-400 w-full text-left text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Gig
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGigs;
