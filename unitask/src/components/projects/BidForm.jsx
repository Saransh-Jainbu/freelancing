import { useState } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { DollarSign, Clock, AlertTriangle, Info } from 'lucide-react';
import PropTypes from 'prop-types';

const BidForm = ({ projectId, existingBid, onClose, onSuccess, budgetInfo }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    amount: existingBid?.amount || 
      (budgetInfo?.min ? budgetInfo.min : 100),
    deliveryTime: existingBid?.delivery_time || 7,
    proposal: existingBid?.proposal || ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.deliveryTime || !formData.proposal) {
      setError('Please fill all fields');
      return;
    }
    
    if (formData.proposal.length < 50) {
      setError('Your proposal should be at least 50 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const method = existingBid ? 'PUT' : 'POST';
      const url = existingBid 
        ? `${API_URL}/api/bids/${existingBid.id}`
        : `${API_URL}/api/bids`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          freelancerId: currentUser.id,
          amount: parseFloat(formData.amount),
          deliveryTime: parseInt(formData.deliveryTime),
          proposal: formData.proposal
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit bid');
      }
      
      if (onSuccess) {
        onSuccess(data.bid);
      }
    } catch (error) {
      console.error('Error submitting bid:', error);
      setError(error.message || 'Failed to submit bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6">
        {existingBid ? 'Update Your Proposal' : 'Submit Your Proposal'}
      </h2>
      
      {error && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-red-500/20 text-red-400 rounded-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amount" className="block text-gray-400 text-sm mb-2">
              Bid Amount ($)
            </label>
            <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
              <div className="p-2 border-r border-white/10 text-gray-500">
                <DollarSign size={20} />
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min={1}
                step="0.01"
                className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                required
              />
            </div>
            {budgetInfo && (
              <p className="mt-2 text-sm text-gray-400">
                Client budget: 
                {budgetInfo.min && budgetInfo.max ? 
                  ` $${budgetInfo.min} - $${budgetInfo.max}` :
                  budgetInfo.min ? 
                    ` Starting from $${budgetInfo.min}` :
                    budgetInfo.max ? 
                      ` Up to $${budgetInfo.max}` :
                      ' Not specified'
                }
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="deliveryTime" className="block text-gray-400 text-sm mb-2">
              Delivery Time (days)
            </label>
            <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
              <div className="p-2 border-r border-white/10 text-gray-500">
                <Clock size={20} />
              </div>
              <input
                type="number"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                min={1}
                max={365}
                className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="proposal" className="block text-gray-400 text-sm mb-2">
            Cover Letter
          </label>
          <textarea
            id="proposal"
            name="proposal"
            value={formData.proposal}
            onChange={handleChange}
            rows={8}
            className="appearance-none bg-black/30 border border-white/10 rounded w-full px-3 py-2 leading-tight focus:outline-none"
            placeholder="Introduce yourself and explain why you're a good fit for this project. Be specific about how your experience relates to the client's needs."
            required
          ></textarea>
          <p className="mt-2 text-sm text-gray-400">
            Minimum 50 characters. Currently: {formData.proposal.length} characters.
          </p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Tips for a successful bid:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Be specific about your relevant experience</li>
              <li>Address the client's requirements directly</li>
              <li>Explain your process and approach</li>
              <li>Set realistic expectations for delivery time</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {existingBid ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>{existingBid ? 'Update Proposal' : 'Submit Proposal'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

BidForm.propTypes = {
  projectId: PropTypes.string.isRequired,
  existingBid: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  budgetInfo: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number
  })
};

export default BidForm;
