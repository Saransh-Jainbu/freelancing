import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { 
  Briefcase, DollarSign, Calendar, Tag, Clock, Upload, X, Plus
} from 'lucide-react';

const ProjectForm = ({ existingProject = null, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    attachmentUrl: ''
  });
  
  // If editing, initialize form with existing project data
  useEffect(() => {
    if (existingProject) {
      setFormData({
        title: existingProject.title || '',
        description: existingProject.description || '',
        category: existingProject.category || 'web-development',
        budgetMin: existingProject.budget_min || '',
        budgetMax: existingProject.budget_max || '',
        deadline: existingProject.deadline ? new Date(existingProject.deadline).toISOString().slice(0, 10) : '',
        attachmentUrl: existingProject.attachment_url || ''
      });
      setSkills(existingProject.skills || []);
    }
  }, [existingProject]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleAddSkill = () => {
    if (skillInput && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.budgetMin && formData.budgetMax && 
        parseFloat(formData.budgetMin) > parseFloat(formData.budgetMax)) {
      setError('Minimum budget cannot be greater than maximum budget');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const endpoint = existingProject
        ? `${API_URL}/api/projects/${existingProject.id}`
        : `${API_URL}/api/projects`;
      
      const method = existingProject ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: currentUser.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          skills,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          attachmentUrl: formData.attachmentUrl,
          status: existingProject?.status || 'open'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save project');
      }
      
      setSuccess(existingProject ? 'Project updated successfully!' : 'Project created successfully!');
      
      // Clear form if creating new project
      if (!existingProject) {
        setFormData({
          title: '',
          description: '',
          category: 'web-development',
          budgetMin: '',
          budgetMax: '',
          deadline: '',
          attachmentUrl: ''
        });
        setSkills([]);
      }
      
      if (onSuccess) {
        onSuccess(data.project);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Categories list
  const categories = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'writing', label: 'Writing & Translation' },
    { value: 'video', label: 'Video & Animation' },
    { value: 'music', label: 'Music & Audio' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'business', label: 'Business' },
    { value: 'data', label: 'Data Science & Analytics' },
    { value: 'other', label: 'Other' }
  ];
  
  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6">
        {existingProject ? 'Edit Project' : 'Post a New Project'}
      </h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 text-green-400 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2" htmlFor="title">
            Project Title *
          </label>
          <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
            <div className="p-2 border-r border-white/10 text-gray-500">
              <Briefcase size={20} />
            </div>
            <input
              className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Website Development for E-commerce Store"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2" htmlFor="description">
            Project Description *
          </label>
          <textarea
            className="appearance-none bg-black/30 border border-white/10 rounded w-full px-3 py-2 mb-1 leading-tight focus:outline-none"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows="8"
            placeholder="Provide detailed information about your project requirements..."
            required
          ></textarea>
          <p className="text-xs text-gray-500">
            Include detailed requirements, specifications, and any other information freelancers should know.
          </p>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2" htmlFor="category">
            Category *
          </label>
          <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
            <div className="p-2 border-r border-white/10 text-gray-500">
              <Tag size={20} />
            </div>
            <select
              className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Skills Required
          </label>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {skills.map(skill => (
              <div 
                key={skill} 
                className="bg-purple-900/30 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm flex items-center"
              >
                {skill}
                <button 
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 text-purple-300 hover:text-purple-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="appearance-none bg-black/30 border border-white/10 rounded flex-1 px-3 py-2 leading-tight focus:outline-none"
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              placeholder="e.g., React, JavaScript, UI Design"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Budget Range
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden flex-1">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <DollarSign size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="number"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  placeholder="Min"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden flex-1">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <DollarSign size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="number"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  placeholder="Max"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2" htmlFor="deadline">
              Deadline
            </label>
            <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
              <div className="p-2 border-r border-white/10 text-gray-500">
                <Calendar size={20} />
              </div>
              <input
                className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                type="date"
                name="deadline"
                id="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-6">
          {existingProject && (
            <button
              type="button"
              onClick={onSuccess}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                {existingProject ? 'Updating...' : 'Posting...'}
              </>
            ) : (
              <>{existingProject ? 'Update Project' : 'Post Project'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
