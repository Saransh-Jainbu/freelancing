import { useState, useEffect } from 'react';
import { API_URL } from '../../api/constants';
import { formatDistanceToNow } from 'date-fns';
import { Clock, DollarSign, CheckCircle, XCircle, User, Award, AlertTriangle, Loader } from 'lucide-react';
import PropTypes from 'prop-types';

const ProjectBids = ({ projectId, isBusinessOwner, businessId, projectStatus }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [awardingBid, setAwardingBid] = useState(null);
  const [confirmAward, setConfirmAward] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  
  const fetchBids = async () => {
    try {
      setLoading(true);
      
      const url = new URL(`${API_URL}/api/bids/project/${projectId}`);
      if (isBusinessOwner) {
        url.searchParams.append('businessId', businessId);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBids(data.bids);
      } else {
        throw new Error(data.message || 'Failed to load bids');
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError(error.message || 'Error loading bids');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBids();
  }, [projectId, isBusinessOwner, businessId]);
  
  const handleAwardProject = async (bidId) => {
    if (!isBusinessOwner || projectStatus !== 'open') return;
    
    try {
      setAwardingBid(bidId);
      
      const response = await fetch(`${API_URL}/api/projects/${projectId}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bidId,
          businessId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to award project');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI to reflect the awarded bid
        window.location.reload(); // For now, just refresh the page
      } else {
        throw new Error(data.message || 'Failed to award project');
      }
    } catch (error) {
      console.error('Error awarding project:', error);
      alert(`Error: ${error.message || 'Failed to award project'}`);
    } finally {
      setAwardingBid(null);
      setConfirmAward(false);
      setSelectedBid(null);
    }
  };

  const showAwardConfirmation = (bid) => {
    setSelectedBid(bid);
    setConfirmAward(true);
  };
  
  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchBids}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (bids.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="flex justify-center mb-4">
          <User className="w-12 h-12 text-gray-500" />
        </div>
        <h3 className="text-xl font-medium mb-2">No bids yet</h3>
        <p className="text-gray-400">
          {isBusinessOwner ? 
            "No freelancers have bid on this project yet." : 
            "Be the first to bid on this project."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {bids.length} Proposal{bids.length !== 1 && 's'}
      </h2>
      
      <div className="space-y-6">
        {bids.map(bid => {
          const isAccepted = bid.status === 'accepted';
          const isRejected = bid.status === 'rejected';
          
          return (
            <div 
              key={bid.id} 
              className={`bg-black/30 border rounded-lg overflow-hidden ${
                isAccepted ? 
                  'border-green-500/30' : 
                  isRejected ? 
                    'border-red-500/30 opacity-60' : 
                    'border-white/10'
              }`}
            >
              {isAccepted && (
                <div className="bg-green-500/20 text-green-400 px-4 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Accepted Proposal</span>
                </div>
              )}
              
              {isRejected && (
                <div className="bg-red-500/20 text-red-400 px-4 py-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>Rejected Proposal</span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  {/* Freelancer info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                      {bid.freelancer_avatar ? (
                        <img 
                          src={bid.freelancer_avatar} 
                          alt={bid.freelancer_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{bid.freelancer_name}</h3>
                      {bid.freelancer_rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <span className="text-yellow-400">★</span>
                          <span>
                            {bid.freelancer_rating.toFixed(1)} ({bid.freelancer_reviews || 0} reviews)
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bid details */}
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-xl font-semibold">${bid.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Delivery in {bid.delivery_time} days</span>
                    </div>
                  </div>
                </div>
                
                {/* Proposal content */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">Cover Letter</h4>
                  <div className="bg-white/5 rounded-lg p-4 whitespace-pre-line">
                    {bid.proposal}
                  </div>
                </div>
                
                {/* Actions */}
                {isBusinessOwner && projectStatus === 'open' && !isAccepted && !isRejected && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => showAwardConfirmation(bid)}
                      disabled={awardingBid === bid.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                    >
                      {awardingBid === bid.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Awarding...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          Award Project
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Award confirmation modal */}
      {confirmAward && selectedBid && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-center mb-4">
              <Award className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Award Project</h2>
            <p className="text-center text-gray-300 mb-4">
              Are you sure you want to award this project to <span className="font-medium">{selectedBid.freelancer_name}</span> for <span className="font-medium">${selectedBid.amount}</span>?
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">Important:</p>
                <p>This action cannot be undone. Once awarded, other bids will be rejected automatically.</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmAward(false);
                  setSelectedBid(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAwardProject(selectedBid.id)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
              >
                Confirm Award
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProjectBids.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isBusinessOwner: PropTypes.bool.isRequired,
  businessId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  projectStatus: PropTypes.string.isRequired
};

export default ProjectBids;
