import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { useAuth } from '../../context/AuthContextValue';
import { 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  FileText,
  DollarSign,
  Star,
  AlertTriangle,
  ChevronDown,
  XCircle
} from 'lucide-react';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          throw new Error(data.message || 'Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error.message || 'An error occurred while loading order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          userId: currentUser.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        setIsStatusDropdownOpen(false);
      } else {
        throw new Error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update order status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      const response = await fetch(`${API_URL}/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: currentUser.id,
          rating: review.rating,
          comment: review.comment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrder(prev => ({ ...prev, review: data.review, rating: data.review.rating }));
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review: ' + error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Check if current user is the freelancer for this order
  const isFreelancer = currentUser && order && currentUser.id === order.freelancer_id;
  
  // Check if current user is the client for this order
  const isClient = currentUser && order && currentUser.id === order.client_id;

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500' },
    { value: 'active', label: 'Active', color: 'bg-blue-500/10 text-blue-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500/10 text-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/10 text-red-500' }
  ];

  // Get color class for status
  const getStatusColorClass = (status) => {
    return statusOptions.find(option => option.value === status)?.color || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Error</h3>
            <p className="text-gray-400">{error}</p>
            <button 
              onClick={() => navigate('/orders')}
              className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
            >
              Back to Orders
            </button>
          </div>
        ) : order ? (
          <div className="bg-gray-900 rounded-lg border border-white/10">
            {/* Order Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{order.gig_title || 'Order Details'}</h1>
                  <p className="text-gray-400">Order #{order.id}</p>
                </div>
                
                {isFreelancer ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      disabled={updatingStatus}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColorClass(order.status)} hover:opacity-90`}
                    >
                      {updatingStatus ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current"></div>
                      ) : (
                        <>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsStatusDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 z-20 min-w-[160px] bg-gray-800 border border-white/10 rounded-lg shadow-lg overflow-hidden">
                          {statusOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusUpdate(option.value)}
                              disabled={order.status === option.value}
                              className={`w-full text-left px-4 py-2 ${
                                order.status === option.value 
                                  ? 'bg-white/10 cursor-default'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={`px-4 py-2 rounded-full ${getStatusColorClass(order.status)}`}>
                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Delivery Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{order.delivery_time ? `${order.delivery_time} days` : 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>${order.amount}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Package</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="capitalize">{order.package_type || 'Basic'}</span>
                    {order.quantity > 1 && <span>× {order.quantity}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold mb-4">Order Participants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Client</p>
                  <div className="font-medium">{order.client_name}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Freelancer</p>
                  <div className="font-medium">{order.freelancer_name}</div>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold mb-4">Requirements</h3>
              <div className="bg-white/5 p-4 rounded-lg whitespace-pre-line">
                {order.requirements || 'No specific requirements provided.'}
              </div>
            </div>

            {/* Order Actions */}
            <div className="p-6 border-b border-white/10">
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/chat/${order.conversation_id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                {isFreelancer && order.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Completed
                  </button>
                )}
                {isFreelancer && order.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('active')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept Order
                  </button>
                )}
                {(isFreelancer || isClient) && order.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Review Section */}
            {order.status === 'completed' && !order.rating && isClient && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                          className={`p-1 ${star <= review.rating ? 'text-yellow-500' : 'text-gray-600'}`}
                        >
                          <Star className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Comment</label>
                    <textarea
                      value={review.comment}
                      onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg"
                      rows="4"
                      placeholder="Share your experience working with this freelancer..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || !review.comment.trim()}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isSubmittingReview || !review.comment.trim()
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}
                  >
                    {isSubmittingReview ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Review Display */}
            {order.rating && (
              <div className="p-6 border-t border-white/10">
                <h3 className="text-lg font-semibold mb-4">Review</h3>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-5 h-5 ${star <= order.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="font-medium ml-2">{order.rating}/5</span>
                  </div>
                  <p className="text-gray-300">{order.review || 'No comment provided.'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p>No order found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
