import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  FileText,
  DollarSign,
  Star,
  Send
} from 'lucide-react';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
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
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      const response = await fetch(`${API_URL}/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const data = await response.json();
      if (data.success) {
        setOrder(prev => ({ ...prev, review: data.review }));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
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
                <div className={`px-4 py-2 rounded-full ${
                  order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                  order.status === 'active' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Delivery Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(order.delivery_date).toLocaleDateString()}</span>
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
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{order.status}</span>
                  </div>
                </div>
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
                <button
                  onClick={() => {/* Handle order requirements view */}}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <FileText className="w-4 h-4" />
                  View Requirements
                </button>
              </div>
            </div>

            {/* Review Section */}
            {order.status === 'completed' && !order.review && (
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
                    />
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
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
