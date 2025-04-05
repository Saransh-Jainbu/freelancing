import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Star, CheckCircle, Loader, ThumbsUp, ThumbsDown } from 'lucide-react';

const ReviewOrderModal = ({ isOpen, onClose, order, onSubmitReview, onSkip }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(true);
  const [verificationStep, setVerificationStep] = useState('review'); // 'review' or 'verification'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1 && verificationStep === 'review') {
      setError('Please select a rating');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await onSubmitReview({
        rating,
        review,
        isCompleted,
        verificationStatus: isCompleted ? 'verified' : 'rejected'
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">
            {order.status === 'verifying' ? 'Verify Order Completion' : 'Review Completed Order'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">{order.gig_title}</h3>
            <p className="text-gray-400 text-sm">Freelancer: {order.seller_name}</p>
            <p className="text-gray-400 text-sm">Order ID: #{order.id}</p>
            
            {order.status === 'verifying' && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-200">
                  The freelancer has marked this order as completed. Please verify if the work meets your requirements.
                </p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First step: Verify completion */}
            {order.status === 'verifying' && (
              <div className="space-y-6">
                <h3 className="font-medium">Does this order meet your requirements?</h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCompleted(true)}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                      isCompleted 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isCompleted ? 'text-green-400' : ''}`} />
                    Yes, it's complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompleted(false)}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                      !isCompleted 
                        ? 'bg-red-500/20 border border-red-500/50 text-red-300' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 ${!isCompleted ? 'text-red-400' : ''}`} />
                    No, it's incomplete
                  </button>
                </div>
                
                {!isCompleted && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Please explain what's missing or needs improvement:
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      required={!isCompleted}
                      rows="4"
                      placeholder="Explain what doesn't meet your requirements..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Rating section - only show if order is completed or status is not verifying */}
            {(isCompleted || order.status !== 'verifying') && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Rate this freelancer
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                          fill={rating >= star ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-lg font-medium">{rating}/5</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {isCompleted ? 'Write a review (optional)' : 'Additional comments (optional)'}
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows="4"
                    placeholder={isCompleted ? "Share your experience working with this freelancer..." : "Any additional comments?"}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={onSkip}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Remind Me Later
              </button>
              
              <button 
                type="submit"
                className={`px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                    : 'bg-red-500'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {order.status === 'verifying' ? 'Confirm & Review' : 'Submit Review'}
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-4 h-4" />
                        Request Revisions
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

ReviewOrderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.object.isRequired,
  onSubmitReview: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

export default ReviewOrderModal;
