import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Tag,
  Loader
} from 'lucide-react';
import ProjectForm from './ProjectForm';
import ProjectBids from '../projects/ProjectBids';

const BusinessProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'bids'

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Verify this project belongs to the current user
        if (data.project.business_id !== currentUser.id) {
          throw new Error('You do not have permission to view this project');
        }
        setProject(data.project);
      } else {
        throw new Error(data.message || 'Failed to load project details');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Error loading project details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (currentUser) {
      fetchProject();
    }
  }, [currentUser, projectId]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const handleEditSuccess = (updatedProject) => {
    setProject(updatedProject);
    setIsEditing(false);
    fetchProject(); // Refresh with full details
  };
  
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Open for Bids
          </div>
        );
      case 'awarded':
        return (
          <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Awarded
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-medium">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-medium">
            <XCircle className="w-4 h-4" />
            Cancelled
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full font-medium">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading project details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Project</h2>
          <p className="text-center text-gray-300 mb-6">{error}</p>
          <Link 
            to="/business/projects" 
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Projects
          </Link>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p>Project not found.</p>
      </div>
    );
  }
  
  // If editing, show the form
  if (isEditing) {
    return (
      <div className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel Editing
            </button>
          </div>
          
          <ProjectForm
            existingProject={project}
            onSuccess={handleEditSuccess}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            to="/business/projects" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Projects
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">{project.title}</h1>
            
            <div className="flex items-center gap-2">
              {renderStatusBadge(project.status)}
              
              {project.status === 'open' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'details' 
                ? 'border-purple-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Project Details
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 border-b-2 flex items-center gap-2 ${
              activeTab === 'bids' 
                ? 'border-purple-500 text-white' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Proposals
            <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs">
              {project.bid_count || 0}
            </span>
          </button>
        </div>
        
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-line text-gray-300">{project.description}</p>
                </div>
                
                {project.skills && project.skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Skills Required</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map(skill => (
                        <span 
                          key={skill}
                          className="bg-purple-900/30 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-5">
                <h3 className="text-lg font-semibold mb-3">Project Details</h3>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Budget</p>
                    <p className="font-medium">
                      {project.budget_min && project.budget_max ? 
                        `$${project.budget_min.toFixed(2)} - $${project.budget_max.toFixed(2)}` : 
                        project.budget_min ? 
                          `From $${project.budget_min.toFixed(2)}` : 
                          project.budget_max ? 
                            `Up to $${project.budget_max.toFixed(2)}` : 
                            'Not specified'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Deadline</p>
                    <p className="font-medium">
                      {project.deadline ? formatDate(project.deadline) : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {project.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Time Remaining</p>
                      <p className="font-medium">
                        {calculateDaysRemaining(project.deadline) <= 0 ? 
                          'Deadline passed' : 
                          `${calculateDaysRemaining(project.deadline)} days left`
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Proposals</p>
                    <p className="font-medium">{project.bid_count || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Category</p>
                    <p className="font-medium capitalize">
                      {project.category?.replace(/-/g, ' ') || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Posted</p>
                    <p className="font-medium">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Bids tab
          <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <ProjectBids 
              projectId={project.id} 
              isBusinessOwner={true} 
              businessId={currentUser.id}
              projectStatus={project.status}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProjectDetail;
