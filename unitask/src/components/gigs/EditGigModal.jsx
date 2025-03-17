import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Loader } from 'lucide-react';
import { updateGig } from '../../api/gigs';
import { useAuth } from '../../context/AuthContextValue';

const EditGigModal = ({ isOpen, onClose, gig, onGigUpdated }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gig) {
      setFormData({
        title: gig.title || '',
        description: gig.description || '',
        category: gig.category || '',
        price: gig.price || '',
        status: gig.status || 'active'
      });
    }
  }, [gig]);

  if (!isOpen || !gig) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.description.trim() || 
        !formData.category || !formData.price) {
      setError('All fields are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const updatedGig = await updateGig(gig.id, {
        userId: currentUser?.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        status: formData.status
      });
      
      onGigUpdated(updatedGig);
      onClose();
    } catch (error) {
      console.error('Error updating gig:', error);
      setError(error.message || 'Failed to update gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Edit Gig</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Gig Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a category</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Content Writing">Content Writing</option>
                <option value="Marketing">Marketing</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Music Production">Music Production</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditGigModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  gig: PropTypes.object.isRequired,
  onGigUpdated: PropTypes.func.isRequired
};

export default EditGigModal;
