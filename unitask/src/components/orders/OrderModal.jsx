import { useState } from 'react';
import { X, Calendar, DollarSign, CheckCircle, Shield, Clock, AlertCircle, Repeat, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const OrderModal = ({ gig, onClose, onOrderSuccess }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Safely extract the price with fallbacks
  const safePrice = gig && gig.price 
    ? parseFloat(gig.price.replace(/[^0-9.]/g, '') || '0') 
    : 0;
    
  const [orderData, setOrderData] = useState({
    gig_id: gig?.id,
    client_id: currentUser?.id,
    requirements: '',
    delivery_time: 7,
    package: 'basic',
    quantity: 1,
    amount: safePrice
  });

  // Use gig packages if available, otherwise use default packages
  const gigPackages = (gig && gig.packages) ? gig.packages : {
    basic: {
      price: safePrice,
      delivery_days: 7,
      revisions: 1,
      features: ['Basic service']
    },
    standard: {
      price: parseFloat((safePrice * 1.5).toFixed(2)),
      delivery_days: 5,
      revisions: 2,
      features: ['Standard service', 'Faster delivery']
    },
    premium: {
      price: parseFloat((safePrice * 2).toFixed(2)),
      delivery_days: 3,
      revisions: 5,
      features: ['Premium service', 'Fastest delivery', 'Premium support']
    }
  };

  // Transform gigPackages into the format needed for UI
  const packages = Object.keys(gigPackages).map(id => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    description: `${gigPackages[id].revisions} revision${gigPackages[id].revisions !== 1 ? 's' : ''}, ${gigPackages[id].delivery_days} days delivery`,
    price: gigPackages[id].price,
    delivery_time: gigPackages[id].delivery_days,
    revisions: gigPackages[id].revisions,
    features: gigPackages[id].features || []
  }));

  // Get selected package details
  const selectedPackage = packages.find(pkg => pkg.id === orderData.package) || packages[0];

  const updateOrderData = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value,
      amount: field === 'quantity' 
        ? selectedPackage.price * value 
        : field === 'package' 
          ? packages.find(p => p.id === value).price * orderData.quantity
          : prev.amount,
      delivery_time: field === 'package'
        ? packages.find(p => p.id === value).delivery_time
        : prev.delivery_time
    }));
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      
      if (data.success) {
        if (onOrderSuccess) {
          onOrderSuccess(data.order);
        } else {
          navigate(`/orders/${data.order.id}`);
        }
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different steps based on activeStep
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <>
            <h3 className="font-semibold text-lg mb-4">Choose a Package</h3>
            <div className="space-y-3 mb-6">
              {packages.map(pkg => (
                <div 
                  key={pkg.id}
                  onClick={() => updateOrderData('package', pkg.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    orderData.package === pkg.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{pkg.name}</h4>
                    <span className="font-semibold">${pkg.price}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                  
                  {/* Show package features */}
                  <div className="mt-3 space-y-1">
                    {pkg.features && pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{pkg.delivery_time} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      <span>{pkg.revisions} revision{pkg.revisions > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Quantity
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => orderData.quantity > 1 && updateOrderData('quantity', orderData.quantity - 1)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-l-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={orderData.quantity}
                  onChange={(e) => updateOrderData('quantity', parseInt(e.target.value) || 1)}
                  className="w-16 px-3 py-1 bg-white/5 border-y border-white/10 text-center"
                />
                <button
                  type="button"
                  onClick={() => updateOrderData('quantity', orderData.quantity + 1)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <h3 className="font-semibold text-lg mb-4">Project Requirements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Describe Your Project
                </label>
                <textarea
                  value={orderData.requirements}
                  onChange={(e) => updateOrderData('requirements', e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg"
                  rows="5"
                  placeholder="Be specific about what you need, include any relevant details that will help the freelancer understand your requirements..."
                />
              </div>
            </div>
          </>
        );
        
      case 3:
        return (
          <>
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium mb-3">{gig?.title || 'Service'}</h4>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span>{selectedPackage.name} Package</span>
                  <span>${selectedPackage.price}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span>Quantity</span>
                  <span>× {orderData.quantity}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span>Delivery Time</span>
                  <span>{selectedPackage.delivery_time} days</span>
                </div>
                <div className="flex justify-between py-2 mt-2 font-semibold">
                  <span>Total</span>
                  <span>${(Number(selectedPackage.price) * Number(orderData.quantity)).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">100% Secure Payments</p>
                  <p className="text-xs text-gray-400">Secure payment handling, built-in payment protection.</p>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Place Your Order</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {['Package', 'Requirements', 'Payment'].map((step, index) => (
                <div 
                  key={step}
                  className={`flex flex-col items-center ${index + 1 === activeStep ? 'text-purple-400' : 'text-gray-500'}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      index + 1 === activeStep 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : index + 1 < activeStep 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-white/10'
                    }`}
                  >
                    {index + 1 < activeStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs">{step}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-full" 
                style={{ width: `${(activeStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="pt-6 flex justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            )}
            
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Place Order</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

OrderModal.propTypes = {
  gig: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onOrderSuccess: PropTypes.func
};

export default OrderModal;
