import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Search, 
  Briefcase, 
  GraduationCap, 
  ChevronRight,
  Filter,
  CalendarDays,
  Star,
  Building,
  MapPin,
  Loader,
  AlertCircle
} from 'lucide-react';
import { API_URL } from '../../constants';

const LearningResources = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [internships, setInternships] = useState([]);
  const [error, setError] = useState(null);

  // Resource categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'programming', name: 'Programming' },
    { id: 'design', name: 'Design' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'business', name: 'Business' },
  ];

  // Mock learning resources data
  const learningResources = [
    {
      id: 1,
      title: 'Full Stack Web Development Bootcamp',
      provider: 'Codecademy',
      category: 'programming',
      type: 'course',
      url: 'https://www.codecademy.com',
      image: 'https://placehold.co/800x400/232957/white?text=Web+Development',
      rating: 4.8,
      description: 'Learn modern full stack development with React, Node.js, and MongoDB. Build real-world projects and deploy them.',
      tags: ['React', 'Node.js', 'MongoDB', 'JavaScript']
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      provider: 'Udemy',
      category: 'design',
      type: 'course',
      url: 'https://www.udemy.com',
      image: 'https://placehold.co/800x400/2e2957/white?text=UI/UX+Design',
      rating: 4.5,
      description: 'Master the principles of user experience and interface design. Create stunning designs with Figma and Adobe XD.',
      tags: ['Figma', 'Adobe XD', 'Design Thinking']
    },
    {
      id: 3,
      title: 'Digital Marketing Mastery',
      provider: 'Coursera',
      category: 'marketing',
      type: 'course',
      url: 'https://www.coursera.org',
      image: 'https://placehold.co/800x400/572937/white?text=Digital+Marketing',
      rating: 4.7,
      description: 'Learn SEO, social media marketing, and paid advertising strategies to grow any business online.',
      tags: ['SEO', 'Social Media', 'Google Ads']
    },
    {
      id: 4,
      title: 'Entrepreneurship 101',
      provider: 'edX',
      category: 'business',
      type: 'course',
      url: 'https://www.edx.org',
      image: 'https://placehold.co/800x400/293757/white?text=Entrepreneurship',
      rating: 4.6,
      description: 'Learn how to validate ideas, create business plans, and launch successful startups from scratch.',
      tags: ['Business Model', 'Startup', 'Validation']
    },
    {
      id: 5,
      title: 'Data Science for Beginners',
      provider: 'DataCamp',
      category: 'programming',
      type: 'course',
      url: 'https://www.datacamp.com',
      image: 'https://placehold.co/800x400/573729/white?text=Data+Science',
      rating: 4.9,
      description: 'Learn Python, data analysis, and machine learning from the ground up with practical examples.',
      tags: ['Python', 'Machine Learning', 'Data Analysis']
    },
    {
      id: 6,
      title: 'Mobile App Development with Flutter',
      provider: 'Pluralsight',
      category: 'programming',
      type: 'course',
      url: 'https://www.pluralsight.com',
      image: 'https://placehold.co/800x400/295737/white?text=Flutter',
      rating: 4.7,
      description: 'Build beautiful cross-platform mobile apps using Flutter and Dart programming language.',
      tags: ['Flutter', 'Dart', 'Mobile Development']
    },
  ];

  useEffect(() => {
    if (activeTab === 'internships') {
      setLoading(true);
      setError(null);
      fetch(`${API_URL}/internships`)
        .then((response) => response.json())
        .then((data) => {
          setInternships(data);
          setLoading(false);
        })
        .catch((error) => {
          setError(`Failed to fetch internships: ${error.message}`);
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Filter resources based on category and search query
  const filteredResources = learningResources.filter(resource => {
    const matchesCategory = filterCategory === 'all' || resource.category === filterCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter internships based on search query
  const filteredInternships = internships.filter(internship => {
    return internship.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           internship.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
           internship.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Learning Resources & Opportunities
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Boost your skills with these curated resources and find internships to kickstart your career
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-6 py-3 rounded-md flex items-center gap-2 ${
                activeTab === 'resources'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Learning Resources
            </button>
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-6 py-3 rounded-md flex items-center gap-2 ${
                activeTab === 'internships'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Internships
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-2/3 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'resources' ? "Search for courses, tutorials..." : "Search internships by title, company..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            
            {activeTab === 'resources' && (
              <div className="w-full md:w-1/3">
                <div className="flex items-center gap-3">
                  <Filter className="text-gray-400 w-5 h-5 flex-shrink-0" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Resources Section */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <div key={resource.id} className="group bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={resource.image} 
                      alt={resource.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-black/80 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" fill="#EAB308" />
                      <span>{resource.rating}</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-medium bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                          {categories.find(c => c.id === resource.category)?.name || resource.category}
                        </span>
                        <span className="ml-2 text-xs font-medium bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          {resource.type}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">{resource.provider}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 h-14">{resource.title}</h3>
                    
                    <p className="text-gray-400 text-sm mb-5 line-clamp-3 h-18">{resource.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded-md text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Access Resource
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No resources found</h3>
                <p className="text-gray-400">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        )}

        {/* Internships Section */}
        {activeTab === 'internships' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-20">
                <Loader className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold mb-2">Loading internships...</h3>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error</h3>
                <p className="text-gray-400">{error}</p>
              </div>
            ) : filteredInternships.length > 0 ? (
              filteredInternships.map((internship) => (
                <div 
                  key={internship.id} 
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-start gap-4">
                        <div className="p-4 bg-white/5 rounded-xl">
                          <Building className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{internship.title}</h3>
                          <p className="text-purple-400 mb-2">{internship.company}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {internship.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" />
                              {internship.type}
                            </div>
                            <div>{internship.stipend}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-400 mb-2">Posted {internship.posted}</span>
                      <span className="text-sm text-white mb-4">Apply by: {internship.deadline}</span>
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center gap-1">
                        Apply Now
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-300 mb-4">{internship.description}</p>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Requirements:</h4>
                      <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                        {internship.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No internships found</h3>
                <p className="text-gray-400">Try adjusting your search query</p>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/10 rounded-2xl p-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Want to share a resource or post an internship?</h2>
              <p className="text-lg text-gray-400 mb-8">
                Help fellow students discover valuable learning materials and opportunities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Submit a Resource
                </button>
                <button className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Post an Internship
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningResources;