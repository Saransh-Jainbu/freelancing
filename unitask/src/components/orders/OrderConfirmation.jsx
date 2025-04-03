import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    // Redirect to orders page if no order data is available
    if (!order) {
      navigate('/orders');
      return;
    }

    // Trigger confetti effect on successful order
    const duration = 3000;
    const end = Date.now() + duration;

    const confettiInterval = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(confettiInterval);
      }

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#ec4899']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#ec4899']
      });
    }, 150);

    return () => clearInterval(confettiInterval);
  }, [order, navigate]);

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-400">
            Your order #{order.id} has been confirmed and sent to the seller.
          </p>
        </div>

        {/* Order details */}
        <div className="bg-white/5 rounded-lg p-5 mb-6">
          <h2 className="text-xl font-medium mb-4">{order.gig_title}</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Order Number:</span>
              <span>#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Package:</span>
              <span className="capitalize">{order.package_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery:</span>
              <span>{order.delivery_time} days</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>${order.amount}</span>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">What's Next?</h3>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Wait for seller acceptance</p>
                <p className="text-sm text-gray-400">The seller will review and accept your order soon.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Communicate with the seller</p>
                <p className="text-sm text-gray-400">Use the order chat to discuss any specific requirements.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Receive and review delivery</p>
                <p className="text-sm text-gray-400">You'll be notified when your order is ready for review.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Link
            to={`/orders/${order.id}`}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex justify-center items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            to={`/chat/${order.conversation_id}`}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Message Seller</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
