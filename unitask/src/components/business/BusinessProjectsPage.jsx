import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { PlusCircle, PieChart, Users, Clock, ChevronRight, Edit, Trash, Filter } from 'lucide-react';
import ProjectForm from './ProjectForm';

const BusinessProjectsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects/business/${currentUser.id}${filter !== 'all' ? `?status=${filter}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        throw new Error(data.message || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Error loading your projects');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (currentUser?.id) {
      fetchProjects();
    }
  }, [currentUser?.id, filter]);

  const getStatusBadge = (status) => {
    const statusColors = {
      open: 'bg-green-500/20 text-green-500',
      awarded: 'bg-blue-500/20 text-blue-500',
      completed: 'bg-purple-500/20 text-purple-500',
      cancelled: 'bg-red-500/20 text-red-500',
      closed: 'bg-gray-500/20 text-gray-500'
    };
    
    return <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status] || 'bg-gray-500/20 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>;
  };
  
  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const handleProjectSuccess = (project) => {
    setIsFormOpen(false);
    fetchProjects();
  };
  
  const formatBudget = (min, max) => {
    if (min && max) {
      return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
    } else if (min) {
      return `From $${min.toFixed(2)}`;
    } else if (max) {
      return `Up to $${max.toFixed(2)}`;
    }
    return 'Budget not specified';
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Your Projects</h1>
            <p className="text-gray-400">Manage your posted projects and review bids</p>
          </div>
          
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Post New Project
          </button>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <PieChart className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Projects</p>
                <p className="text-xl font-semibold">{projects.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Active Bids</p>
                <p className="text-xl font-semibold">
                  {projects.reduce((sum, project) => sum + (project.bid_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Ongoing</p>
                <p className="text-xl font-semibold">
                  {projects.filter(p => p.status === 'awarded').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <PieChart className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-xl font-semibold">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2"
          >
            <option value="all">All Projects</option>
            <option value="open">Open Projects</option>
            <option value="awarded">Awarded Projects</option>
            <option value="completed">Completed Projects</option>
            <option value="cancelled">Cancelled Projects</option>
          </select>
        </div>
        
        {/* Projects List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-6 rounded-lg text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/business/projects/${project.id}`}
                className="block bg-gray-900 border border-white/10 hover:border-purple-500/30 hover:bg-gray-800 transition-colors rounded-lg p-6"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusBadge(project.status)}
                      <span className="bg-white/10 rounded-full px-3 py-1 text-sm">{project.category}</span>
                    </div>
                    <p className="text-gray-400 line-clamp-2 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {(project.skills || []).slice(0, 3).map(skill => (
                        <span key={skill} className="bg-gray-800 rounded-full px-3 py-1 text-xs">
                          {skill}
                        </span>
                      ))}
                      {(project.skills || []).length > 3 && (
                        <span className="bg-gray-800 rounded-full px-3 py-1 text-xs">
                          +{project.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-medium whitespace-nowrap">
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>{project.bid_count || 0} bids</span>
                      </span>
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span>{calculateDaysRemaining(project.deadline)} days left</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <ChevronRight className="text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-white/10 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">You haven't created any projects yet</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-3"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
      
      {/* Modal for Project Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <ProjectForm onSuccess={handleProjectSuccess} />
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProjectsPage;
