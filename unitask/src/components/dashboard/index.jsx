import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextValue';
import { getUserGigs } from '../../api/gigs';
import { 
  DollarSign, Briefcase, Star, TrendingUp, 
  ArrowRight, MessageCircle 
} from 'lucide-react';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalEarnings: '$0',
    activeGigs: 0,
    totalOrders: 0,
    averageRating: 0,
    unreadMessages: 0
  });

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        // Get user's gigs
        const userGigs = await getUserGigs(currentUser.id);
        
        // Calculate stats from gigs
        const activeGigs = userGigs.filter(gig => gig.status === 'active').length;
        const totalOrders = userGigs.reduce((sum, gig) => sum + (gig.orders || 0), 0);
        const totalEarnings = userGigs.reduce((sum, gig) => sum + (parseFloat(gig.earnings?.replace('$', '')) || 0), 0);
        const ratings = userGigs.filter(gig => gig.rating).map(gig => gig.rating);
        const averageRating = ratings.length > 0 
          ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
          : 0;

        setStats({
          totalEarnings: `$${totalEarnings.toFixed(2)}`,
          activeGigs,
          totalOrders,
          averageRating,
          unreadMessages: 0 // This would come from chat API
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [currentUser]);

  // Dashboard overview cards
  const cards = [
    {
      title: 'Total Earnings',
      value: stats.totalEarnings,
      icon: DollarSign,
      color: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Active Gigs',
      value: stats.activeGigs,
      icon: Briefcase,
      color: 'from-purple-600 to-pink-600',
      link: '/my-gigs'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Average Rating',
      value: `${stats.averageRating} ★`,
      icon: Star,
      color: 'from-yellow-600 to-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {currentUser?.display_name}
          </h1>
          <p className="text-gray-400">Here&apos;s an overview of your freelancing activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                {card.link && (
                  <Link 
                    to={card.link}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            to="/my-gigs"
            className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center gap-4"
          >
            <Briefcase className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="font-semibold mb-1">Manage Gigs</h3>
              <p className="text-sm text-gray-400">Create and update your services</p>
            </div>
          </Link>

          <Link 
            to="/chat"
            className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center gap-4"
          >
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-semibold mb-1">Messages</h3>
              <p className="text-sm text-gray-400">
                {stats.unreadMessages 
                  ? `${stats.unreadMessages} unread messages` 
                  : 'No new messages'}
              </p>
            </div>
          </Link>

          <Link 
            to="/marketplace"
            className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center gap-4"
          >
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="font-semibold mb-1">Browse Marketplace</h3>
              <p className="text-sm text-gray-400">Find opportunities</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
