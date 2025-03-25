import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGigDetails } from '../../api/gigs';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../constants';
import { 
  ArrowLeft, Star, Clock, Calendar, CheckCircle, MessageSquare, 
  Loader, AlertCircle, DollarSign, User, Award, Activity, Share2, ShoppingCart, Repeat
} from 'lucide-react';
import OrderModal from '../orders/OrderModal'; // Add this import

const GigDetails = () => {
  const { gigId } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activePackage, setActivePackage] = useState('basic');

  useEffect(() => {
    const loadGigDetails = async () => {
      try {
        setLoading(true);
        const gigData = await getGigDetails(gigId);
        setGig(gigData);
      } catch (error) {
        console.error("Error loading gig details:", error);
        setError("Failed to load gig details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (gigId) {
      loadGigDetails();
    }
  }, [gigId]);

  const handleContactSeller = async () => {
    // Check if user is trying to contact themselves
    if (currentUser?.id === gig.seller_id) {
      setError("You cannot contact yourself on your own gig.");
      return;
    }
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/gig/${gigId}` } });
      return;
    }
    
    try {
      setContactLoading(true);
      
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: [currentUser.id, gig.seller_id],
          gigInfo: {
            gig_id: gig.id,
            title: gig.title
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to the conversation
        navigate(`/chat/${data.conversation.id}`);
        
        // If this is a newly created conversation, send an initial message
        if (!data.existed) {
          setTimeout(() => {
            // This will be handled by the chat component when it loads
            console.log('New conversation created, ready for first message');
          }, 500);
        }
      } else {
        setError("Failed to start conversation. Please try again.");
      }
    } catch (error) {
      console.error("Error contacting seller:", error);
      setError("Failed to start conversation. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleOrderClick = () => {
    if (!currentUser) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: `/gig/${gigId}` } });
      return;
    }
    
    // Open the order modal instead of directly creating order
    setIsOrderModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading gig details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Gig</h2>
          <p className="text-center text-gray-300 mb-6">{error}</p>
          <Link 
            to="/marketplace" 
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (!gig) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-black border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link 
            to="/marketplace" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <h1 className="text-3xl font-bold mb-6">{gig.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                {gig.seller_avatar ? (
                  <img 
                    src={gig.seller_avatar} 
                    alt={gig.seller_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-medium">
                    {gig.seller_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium">{gig.seller_name}</p>
                <p className="text-gray-400 text-sm">{gig.seller_title || "Student"}</p>
              </div>
            </div>
            
            {gig.seller_rating && (
              <div className="flex items-center bg-white/5 px-3 py-1 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
                <span>{gig.seller_rating}</span>
              </div>
            )}
            
            <div className="bg-white/5 px-3 py-1 rounded-lg text-purple-300">
              {gig.category}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              About This Gig
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-line">{gig.description}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              About The Seller
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                {gig.seller_avatar ? (
                  <img 
                    src={gig.seller_avatar} 
                    alt={gig.seller_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-medium">
                    {gig.seller_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{gig.seller_name}</h3>
                <p className="text-gray-400 mb-3">{gig.seller_title || "Student"}</p>
                
                <div className="flex flex-wrap gap-4">
                  {gig.seller_rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
                      <span>{gig.seller_rating} Rating</span>
                    </div>
                  )}
                  
                  {gig.completion_rate && (
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                      <span>{gig.completion_rate}% Completion</span>
                    </div>
                  )}
                  
                  {gig.response_time && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-400 mr-1" />
                      <span>{gig.response_time} Response Time</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6">
              {/* Package tabs if multiple packages are available */}
              {gig.packages && Object.keys(gig.packages).length > 1 && (
                <div className="mb-4">
                  <div className="flex border-b border-white/10 mb-4">
                    {Object.keys(gig.packages).map((pkg) => (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => setActivePackage(pkg)}
                        className={`px-4 py-2 font-medium capitalize transition ${
                          activePackage === pkg 
                          ? 'border-b-2 border-purple-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {pkg}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold capitalize">{activePackage} Package</h3>
                    <div className="flex items-center text-xl font-bold text-purple-300">
                      <DollarSign className="w-5 h-5" />
                      <span>{gig.packages[activePackage]?.price || gig.price?.replace('$', '') || '0'}</span>
                    </div>
                  </div>
                  
                  {/* Package features */}
                  <div className="mb-6 space-y-2">
                    {gig.packages[activePackage]?.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Delivery info */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Time</p>
                    <p className="text-sm text-gray-400">
                      {gig.packages && gig.packages[activePackage]
                        ? `${gig.packages[activePackage].delivery_days} days`
                        : '2-3 days'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 mb-3">
                  <Repeat className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Revisions</p>
                    <p className="text-sm text-gray-400">
                      {gig.packages && gig.packages[activePackage]
                        ? `${gig.packages[activePackage].revisions} revision${gig.packages[activePackage].revisions !== 1 ? 's' : ''}`
                        : 'Up to 2 revisions'}
                    </p>
                  </div>
                </div>
                
                {/* ...rest of existing package details... */}
              </div>
              
              {/* Action buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleContactSeller}
                  disabled={contactLoading || !currentUser || currentUser.id === gig.seller_id}
                  className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${
                    (contactLoading || !currentUser || currentUser.id === gig.seller_id) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {contactLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Contact Seller
                    </>
                  )}
                </button>
                
                {!currentUser && (
                  <p className="text-xs text-center text-gray-400">
                    Please <Link to="/login" className="text-purple-400 hover:underline">login</Link> to contact the seller
                  </p>
                )}
                
                {currentUser && currentUser.id === gig.seller_id && (
                  <p className="text-xs text-center text-gray-400">
                    This is your gig
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Share This Gig</h3>
              <div className="flex gap-3">
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                  </svg>
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Order Actions */}
      <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleContactSeller}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2"
              disabled={contactLoading || !currentUser || currentUser.id === gig.seller_id}
            >
              <MessageSquare className="w-5 h-5" />
              Contact Seller
            </button>
          </div>
          
          <button
            onClick={handleOrderClick}
            disabled={!currentUser || currentUser.id === gig.seller_id}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
              !currentUser || currentUser.id === gig.seller_id
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Order Now - {gig.price}
          </button>
        </div>
      </div>

      {/* Order Modal */}
      {isOrderModalOpen && (
        <OrderModal 
          gig={gig}
          onClose={() => setIsOrderModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GigDetails;
