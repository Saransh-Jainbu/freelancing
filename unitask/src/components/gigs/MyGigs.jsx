import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { getUserGigs, deleteGig } from '../../api/gigs';
import { Plus, MoreVertical, Trash2, Edit, ExternalLink, PauseCircle, PlayCircle, Loader, Star, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import NewGigModal from './NewGigModal';
import EditGigModal from './EditGigModal';
import { API_URL } from '../../constants';

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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading your gigs...</p>
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
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">My Gigs</h1>
            <p className="text-gray-400 mt-1">Manage and monitor your services</p>
          </div>
          <button 
            onClick={() => setIsNewGigModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Create Gig</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {gigs.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10 shadow-xl">
            <div className="w-20 h-20 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-medium mb-3 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">No gigs yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">Showcase your skills and start earning by creating your first gig. It takes just a few minutes!</p>
            <button 
              onClick={() => setIsNewGigModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3.5 rounded-lg inline-flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Gig
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gigs.map((gig) => (
              <div key={gig.id} className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
                        gig.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {gig.status === 'active' ? 'Active' : 'Paused'}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">{gig.title}</h3>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => handleToggleActionMenu(gig.id)} 
                        className="p-2 hover:bg-white/10 rounded-full"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionMenuOpen === gig.id && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl z-10 py-1 border border-white/10">
                          <Link 
                            to={`/gig/${gig.id}`} 
                            className="px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Gig
                          </Link>
                          <button 
                            onClick={() => handleEditGig(gig)} 
                            className="px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Gig
                          </button>
                          <button 
                            onClick={() => handleToggleGigStatus(gig)} 
                            className="px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 w-full text-left text-sm"
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
                            className="px-4 py-2.5 flex items-center gap-2 hover:bg-red-900/20 text-red-400 w-full text-left text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Gig
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {gig.description || "No description provided"}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-white/5 px-3 py-1 rounded-full text-xs flex items-center">
                      <span className="text-gray-300">{gig.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-white/5 p-4 grid grid-cols-4 divide-x divide-white/5 bg-white/5">
                  <div className="flex flex-col items-center px-2">
                    <DollarSign className="w-4 h-4 text-green-400 mb-1" />
                    <span className="text-sm font-medium">{gig.price}</span>
                    <span className="text-xs text-gray-400">Price</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <Star className="w-4 h-4 text-yellow-400 mb-1" />
                    <span className="text-sm font-medium">{gig.rating || '0.0'}</span>
                    <span className="text-xs text-gray-400">Rating</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <DollarSign className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-sm font-medium">{gig.earnings || '$0'}</span>
                    <span className="text-xs text-gray-400">Earned</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <Calendar className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="text-sm font-medium">{gig.created}</span>
                    <span className="text-xs text-gray-400">Created</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGigs;
