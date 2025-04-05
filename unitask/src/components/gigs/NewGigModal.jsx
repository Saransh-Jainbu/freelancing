import { useState } from 'react';
import { X, Upload, Plus, Trash, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';

const NewGigModal = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formStep, setFormStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    subcategory: '',
    tags: [],
    basePrice: '',
    deliveryTime: 1,
    revisionCount: 1,
    images: [],
    packages: [
      {
        packageType: 'basic',
        title: 'Basic Package',
        description: 'Basic service delivery',
        price: '',
        deliveryTime: 1,
        revisionCount: 1,
        features: []
      }
    ]
  });

  // Categories for selection
  const categories = [
    { id: 'web-development', name: 'Web Development' },
    { id: 'mobile-development', name: 'Mobile Development' },
    { id: 'design', name: 'Design' },
    { id: 'writing', name: 'Writing & Translation' },
    { id: 'video', name: 'Video & Animation' },
    { id: 'music', name: 'Music & Audio' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'data', name: 'Data Science & Analytics' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      if (formData.tags.length < 5 && !formData.tags.includes(e.target.value.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, e.target.value.trim()]
        }));
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Maximum 5 images
      const newImages = files.slice(0, 5 - formData.images.length);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePackageChange = (index, field, value) => {
    setFormData(prev => {
      const updatedPackages = [...prev.packages];
      updatedPackages[index] = {
        ...updatedPackages[index],
        [field]: value
      };
      return {
        ...prev,
        packages: updatedPackages
      };
    });
  };

  const handlePackageFeatureAdd = (packageIndex, feature) => {
    if (feature.trim()) {
      setFormData(prev => {
        const updatedPackages = [...prev.packages];
        updatedPackages[packageIndex] = {
          ...updatedPackages[packageIndex],
          features: [...updatedPackages[packageIndex].features, feature.trim()]
        };
        return {
          ...prev,
          packages: updatedPackages
        };
      });
      return true;
    }
    return false;
  };

  const removePackageFeature = (packageIndex, featureIndex) => {
    setFormData(prev => {
      const updatedPackages = [...prev.packages];
      updatedPackages[packageIndex] = {
        ...updatedPackages[packageIndex],
        features: updatedPackages[packageIndex].features.filter((_, i) => i !== featureIndex)
      };
      return {
        ...prev,
        packages: updatedPackages
      };
    });
  };

  const validateStep1 = () => {
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill out all required fields');
      return false;
    }
    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters long');
      return false;
    }
    if (formData.description.length < 50) {
      setError('Description must be at least 50 characters long');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.basePrice || formData.basePrice <= 0) {
      setError('Please enter a valid base price');
      return false;
    }
    if (formData.deliveryTime < 1) {
      setError('Delivery time must be at least 1 day');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (formStep === 1 && validateStep1()) {
      setError('');
      setFormStep(2);
    } else if (formStep === 2 && validateStep2()) {
      setError('');
      setFormStep(3);
    }
  };

  const prevStep = () => {
    setError('');
    setFormStep(formStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Create FormData object for file upload
      const formDataObj = new FormData();
      formDataObj.append('userId', currentUser.id);
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('category', formData.category);
      formDataObj.append('subcategory', formData.subcategory);
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('basePrice', formData.basePrice);
      formDataObj.append('deliveryTime', formData.deliveryTime);
      formDataObj.append('revisionCount', formData.revisionCount);
      formDataObj.append('packages', JSON.stringify(formData.packages));
      
      // Append images
      formData.images.forEach((image, index) => {
        formDataObj.append(`image${index}`, image);
      });
      
      const response = await fetch(`${API_URL}/api/gigs`, {
        method: 'POST',
        body: formDataObj,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create gig');
      }
      
      if (onSuccess) {
        onSuccess(data.gig);
      }
    } catch (error) {
      console.error('Error creating gig:', error);
      setError(error.message || 'Failed to create gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create New Gig</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Step {formStep} of 3</span>
            <div className="w-2/3 bg-gray-800 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full" 
                style={{ width: `${(formStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {formStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Gig Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                placeholder="I will..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Clearly describe the service you're offering (max 80 characters)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                placeholder="e.g., Website Development, Logo Design..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                rows="4"
                placeholder="Describe your service in detail..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Min. 50 characters. Include what's offered, your process, and any other relevant details.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tags (up to 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <div key={tag} className="bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="text-sm">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Press Enter to add tags"
                onKeyDown={handleTagInput}
                disabled={formData.tags.length >= 5}
              />
              <p className="mt-1 text-xs text-gray-500">
                Add relevant keywords to help buyers find your gig
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-2 hover:opacity-90"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-wrap -mx-2">
              <div className="w-full md:w-1/3 px-2 mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Base Price ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="5"
                />
              </div>
              
              <div className="w-full md:w-1/3 px-2 mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Delivery (days) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="1"
                />
              </div>
              
              <div className="w-full md:w-1/3 px-2 mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Revisions
                </label>
                <input
                  type="number"
                  name="revisionCount"
                  value={formData.revisionCount}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  placeholder="1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Gig Images (Up to 5)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {formData.images.length < 5 && (
                  <label className="aspect-video bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500">
                    <Upload className="w-6 h-6 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Add high-quality images showcasing your work. First image will be the main thumbnail.
              </p>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-white/10 hover:bg-white/20 rounded-lg px-6 py-2"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-2 hover:opacity-90"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {formStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Package Options</h3>
              
              <div className="space-y-8">
                {formData.packages.map((pkg, index) => {
                  const packageTypes = ['basic', 'standard', 'premium'];
                  const currentType = packageTypes[index] || 'basic';
                  
                  return (
                    <div key={index} className="bg-black/30 border border-white/10 rounded-lg p-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Package Title
                        </label>
                        <input
                          type="text"
                          value={pkg.title}
                          onChange={(e) => handlePackageChange(index, 'title', e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                          placeholder={`${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Package`}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Package Description
                        </label>
                        <textarea
                          value={pkg.description}
                          onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                          rows="2"
                          placeholder="Describe what's included in this package..."
                        ></textarea>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                            min="1"
                            step="1"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                            placeholder={index === 0 ? formData.basePrice : ''}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Delivery (days)
                          </label>
                          <input
                            type="number"
                            value={pkg.deliveryTime}
                            onChange={(e) => handlePackageChange(index, 'deliveryTime', e.target.value)}
                            min="1"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                            placeholder={index === 0 ? formData.deliveryTime : ''}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Revisions
                          </label>
                          <input
                            type="number"
                            value={pkg.revisionCount}
                            onChange={(e) => handlePackageChange(index, 'revisionCount', e.target.value)}
                            min="0"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                            placeholder={index === 0 ? formData.revisionCount : ''}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Features
                        </label>
                        <div className="space-y-2 mb-2">
                          {pkg.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2">
                              <span className="bg-gray-800 px-3 py-1 rounded-full text-sm flex-grow">
                                {feature}
                              </span>
                              <button
                                type="button"
                                onClick={() => removePackageFeature(index, featureIndex)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add feature and press Enter"
                            className="flex-grow bg-black/30 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (handlePackageFeatureAdd(index, e.target.value)) {
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.target.previousSibling;
                              if (handlePackageFeatureAdd(index, input.value)) {
                                input.value = '';
                              }
                            }}
                            className="bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-white/10 hover:bg-white/20 rounded-lg px-6 py-2"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-2 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : 'Create Gig'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewGigModal;
