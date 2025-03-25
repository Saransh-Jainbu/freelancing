import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Loader, Image, Camera, PlusCircle, Trash2, Clock, Zap, Repeat, CheckCircle } from 'lucide-react';
import { createGig } from '../../api/gigs';
import { uploadImage } from '../../api/upload';
import { API_URL } from '../../api/constants';

const NewGigModal = ({ isOpen, onClose, userId, onGigAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [packages, setPackages] = useState({
    basic: {
      price: '',
      delivery_days: 7,
      revisions: 1,
      features: ['Basic design', 'Source file']
    },
    standard: {
      price: '',
      delivery_days: 5,
      revisions: 3,
      features: ['Standard design', 'Source file', 'Responsive design']
    },
    premium: {
      price: '',
      delivery_days: 3,
      revisions: 5,
      features: ['Premium design', 'Source file', 'Responsive design', 'Priority support']
    }
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
  };

  const handlePackageChange = (packageType, field, value) => {
    setPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        [field]: value
      }
    }));
  };

  const handleAddFeature = (packageType) => {
    const newFeature = '';
    setPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        features: [...prev[packageType].features, newFeature]
      }
    }));
  };

  const handleFeatureChange = (packageType, index, value) => {
    setPackages(prev => {
      const newFeatures = [...prev[packageType].features];
      newFeatures[index] = value;
      return {
        ...prev,
        [packageType]: {
          ...prev[packageType],
          features: newFeatures
        }
      };
    });
  };

  const handleRemoveFeature = (packageType, index) => {
    setPackages(prev => {
      const newFeatures = [...prev[packageType].features];
      newFeatures.splice(index, 1);
      return {
        ...prev,
        [packageType]: {
          ...prev[packageType],
          features: newFeatures
        }
      };
    });
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
      
      // Create gig first
      const newGig = await createGig({
        userId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price
      });
      
      // If there's an image to upload, do it now
      let finalGig = newGig;
      if (imageFile && newGig.id) {
        setUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          
          const response = await fetch(`${API_URL}/api/gigs/${newGig.id}/image`, {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const imageData = await response.json();
            finalGig = {
              ...newGig,
              image_url: imageData.imageUrl
            };
          }
        } catch (imageError) {
          console.error('Error uploading gig image:', imageError);
          // Continue even if image upload fails
        } finally {
          setUploadingImage(false);
        }
      }
      
      onGigAdded(finalGig);
      onClose();
    } catch (error) {
      console.error('Error creating gig:', error);
      setError(error.message || 'Failed to create gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Create New Gig</h2>
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image upload area */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Gig Image
              </label>
              <div 
                onClick={handleImageClick}
                className="w-full h-40 bg-white/5 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={imagePreview} 
                      alt="Gig preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Image className="w-10 h-10 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">Click to upload an image</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF, max 5MB</p>
                  </>
                )}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Gig Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="I will design a professional website..."
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
                placeholder="$50"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your gig in detail..."
                rows="5"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Packages Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Packages</h3>
              
              {/* Package Tabs */}
              <div className="flex border-b border-white/10">
                {['basic', 'standard', 'premium'].map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setActiveTab(pkg)}
                    className={`px-6 py-3 font-medium capitalize transition ${
                      activeTab === pkg 
                      ? 'border-b-2 border-purple-500 text-white' 
                      : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
              
              {/* Active Package Form */}
              <div className="border border-white/10 rounded-lg p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Price ($)</label>
                    <input
                      type="number"
                      value={packages[activeTab].price}
                      onChange={(e) => handlePackageChange(activeTab, 'price', e.target.value)}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg"
                      placeholder="19.99"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-2">Delivery Time (days)</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={packages[activeTab].delivery_days}
                        onChange={(e) => handlePackageChange(activeTab, 'delivery_days', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg"
                        min="1"
                        max="30"
                        required
                      />
                      <Clock className="w-5 h-5 text-gray-400 -ml-8" />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-400 mb-2">Number of Revisions</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={packages[activeTab].revisions}
                      onChange={(e) => handlePackageChange(activeTab, 'revisions', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg"
                      min="0"
                      max="20"
                    />
                    <Repeat className="w-5 h-5 text-gray-400 -ml-8" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400">Features</label>
                    <button
                      type="button"
                      onClick={() => handleAddFeature(activeTab)}
                      className="text-purple-400 flex items-center gap-1 text-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Feature
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {packages[activeTab].features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(activeTab, idx, e.target.value)}
                          className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg"
                          placeholder="e.g. Logo in PNG format"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(activeTab, idx)}
                          className="p-2 text-red-400 hover:bg-white/5 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 italic">
                * Clients will choose from these packages when ordering your service.
              </div>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Gig
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

NewGigModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.number.isRequired,
  onGigAdded: PropTypes.func.isRequired
};

export default NewGigModal;
