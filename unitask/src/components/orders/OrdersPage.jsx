import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Star,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '../../api/constants';

const OrdersPage = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('buyer');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/orders/user/${currentUser.id}?role=${activeTab}`
        );
        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser.id, activeTab]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, class: 'bg-yellow-500/10 text-yellow-500' },
      active: { icon: CheckCircle, class: 'bg-green-500/10 text-green-500' },
      completed: { icon: CheckCircle, class: 'bg-blue-500/10 text-blue-500' },
      cancelled: { icon: AlertCircle, class: 'bg-red-500/10 text-red-500' }
    };

    const BadgeIcon = badges[status]?.icon || AlertCircle;
    const badgeClass = badges[status]?.class || 'bg-gray-500/10 text-gray-500';

    return (
      <span className={`px-3 py-1 rounded-full flex items-center gap-2 ${badgeClass}`}>
        <BadgeIcon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Orders</h1>
          
          {/* Tab switcher */}
          <div className="bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'buyer' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                  : 'hover:bg-white/5'
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setActiveTab('freelancer')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'freelancer' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                  : 'hover:bg-white/5'
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900 border border-white/10 rounded-lg px-4 py-2"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-gray-900 border border-white/10 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {order.gig_title}
                  </h3>
                  <p className="text-gray-400">
                    {activeTab === 'buyer' 
                      ? `Freelancer: ${order.freelancer_name}`
                      : `Client: ${order.client_name}`}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Order Date</p>
                  <p>{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Delivery Time</p>
                  <p>{order.delivery_time} days</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {order.amount}
                  </p>
                </div>
              </div>

              {order.status === 'completed' && order.rating && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{order.rating}</span>
                    <span className="text-gray-400">|</span>
                    <p className="text-gray-400">{order.review}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
