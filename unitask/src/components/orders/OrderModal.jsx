import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';

const OrderModal = ({ gig, onClose, onConfirm }) => {
  const [requirements, setRequirements] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(7);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ requirements, deliveryTime });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Order Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Requirements
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg"
                rows="4"
                placeholder="Describe your requirements..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Delivery Time (days)
              </label>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(Number(e.target.value))}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span>Service Price</span>
                <span>{gig.price}</span>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
              >
                Confirm Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
