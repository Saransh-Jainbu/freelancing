import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Star, Clock, DollarSign, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import { createConversation } from '../../api/chat';
import { getGigDetails } from '../../api/gigs';

const GigDetails = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch gig details
  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        setLoading(true);
        const data = await getGigDetails(gigId);
        setGig(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load gig details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGigDetails();
  }, [gigId]);

  const handleContactSeller = async () => {
    try {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      if (currentUser.id === gig.seller_id) {
        alert("You cannot message yourself!");
        return;
      }

      // Create or get existing conversation
      const conversation = await createConversation(
        [currentUser.id, gig.seller_id],
        {
          gig_id: parseInt(gigId),  // Make sure gigId is parsed as integer
          title: gig.title
        }
      );

      console.log('Created conversation:', conversation);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Show error state if there's an error
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

  if (!gig) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Gig Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{gig.title}</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{gig.rating} ({gig.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Delivery in {gig.delivery_time} days</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Gig Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-300 whitespace-pre-line">{gig.description}</p>
            </div>

            {/* More sections as needed */}
          </div>

          {/* Right Column - Action Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 rounded-xl p-6 sticky top-24">
              {/* Price */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400">Starting at</span>
                <span className="text-2xl font-bold">{gig.price}</span>
              </div>

              {/* Contact Button */}
              {currentUser?.id !== gig.user_id && (
                <button
                  onClick={handleContactSeller}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Seller
                </button>
              )}

              {/* Seller Info */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <img 
                    src={gig.seller_avatar || "/api/placeholder/40/40"}
                    alt={gig.seller_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{gig.seller_name}</h3>
                    <p className="text-sm text-gray-400">{gig.seller_title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetails;
