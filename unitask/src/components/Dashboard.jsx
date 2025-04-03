import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../api/constants';
import { useAuth } from '../context/AuthContextValue';
import { 
  Briefcase, DollarSign, Calendar, Clock, User, Users, 
  MessageSquare, Star, ChevronRight, ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isFreelancer = currentUser?.user_type === 'freelancer';
  const isBusiness = currentUser?.user_type === 'business';
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // Fetch dashboard stats
        const response = await fetch(`${API_URL}/api/dashboard/stats?userId=${currentUser.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        } else {
          throw new Error(data.message || 'Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error loading dashboard. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full mb-4"></div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }
  
  // Fallback stats if API call fails
  const defaultStats = {
    balance: 0,
    totalEarnings: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProjects: 0,
    activeProjects: 0,
    unreadMessages: 0,
    avgRating: 0
  };
  
  const displayStats = stats || defaultStats;
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, {currentUser?.displayName}!
          </h1>
          <p className="text-gray-400">
            Here's an overview of your account
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isFreelancer && (
            <>
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Available Balance</p>
                    <p className="text-2xl font-semibold">${displayStats.balance || '0.00'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Orders</p>
                    <p className="text-2xl font-semibold">{displayStats.activeOrders || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Completed Orders</p>
                    <p className="text-2xl font-semibold">{displayStats.completedOrders || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Rating</p>
                    <p className="text-2xl font-semibold">
                      {displayStats.avgRating ? displayStats.avgRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {isBusiness && (
            <>
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Projects</p>
                    <p className="text-2xl font-semibold">{displayStats.totalProjects || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Projects</p>
                    <p className="text-2xl font-semibold">{displayStats.activeProjects || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Orders</p>
                    <p className="text-2xl font-semibold">{displayStats.activeOrders || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Unread Messages</p>
                    <p className="text-2xl font-semibold">{displayStats.unreadMessages || 0}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isFreelancer && (
                  <>
                    <Link 
                      to="/gigs/create" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Briefcase className="h-6 w-6 mb-2 text-blue-400" />
                      <span className="text-sm text-center">Create Gig</span>
                    </Link>
                    <Link 
                      to="/orders" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Calendar className="h-6 w-6 mb-2 text-purple-400" />
                      <span className="text-sm text-center">View Orders</span>
                    </Link>
                    <Link 
                      to="/projects" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Users className="h-6 w-6 mb-2 text-green-400" />
                      <span className="text-sm text-center">Find Projects</span>
                    </Link>
                    <Link 
                      to="/chat" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <MessageSquare className="h-6 w-6 mb-2 text-yellow-400" />
                      <span className="text-sm text-center">Messages</span>
                    </Link>
                  </>
                )}
                
                {isBusiness && (
                  <>
                    <Link 
                      to="/business/projects" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Briefcase className="h-6 w-6 mb-2 text-blue-400" />
                      <span className="text-sm text-center">My Projects</span>
                    </Link>
                    <Link 
                      to="/business/projects/new" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Calendar className="h-6 w-6 mb-2 text-purple-400" />
                      <span className="text-sm text-center">Post Project</span>
                    </Link>
                    <Link 
                      to="/gigs" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <Users className="h-6 w-6 mb-2 text-green-400" />
                      <span className="text-sm text-center">Find Services</span>
                    </Link>
                    <Link 
                      to="/chat" 
                      className="flex flex-col items-center bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <MessageSquare className="h-6 w-6 mb-2 text-yellow-400" />
                      <span className="text-sm text-center">Messages</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Link to="/orders" className="text-sm text-purple-400 hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 border-b border-white/5 pb-4">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'order_created' ? 'bg-green-500/20 text-green-500' :
                        activity.type === 'message' ? 'bg-blue-500/20 text-blue-500' :
                        activity.type === 'review' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-purple-500/20 text-purple-500'
                      }`}>
                        {activity.type === 'order_created' && <DollarSign className="w-5 h-5" />}
                        {activity.type === 'message' && <MessageSquare className="w-5 h-5" />}
                        {activity.type === 'review' && <Star className="w-5 h-5" />}
                        {activity.type === 'project_update' && <Briefcase className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{activity.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentUser?.displayName}</h3>
                  <p className="text-gray-400 text-sm">
                    {isFreelancer ? 'Freelancer' : 'Business Account'}
                  </p>
                </div>
              </div>
              
              <Link 
                to="/profile" 
                className="bg-white/5 hover:bg-white/10 w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm mt-4"
              >
                Edit Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Messages or Notifications */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Messages</h2>
              
              {displayStats.unreadMessages > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-300">
                    You have {displayStats.unreadMessages} unread message{displayStats.unreadMessages !== 1 && 's'}
                  </p>
                  <Link 
                    to="/chat" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm mt-1"
                  >
                    View Messages
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No new messages</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
