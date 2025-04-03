import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import { Search, ArrowRight, Code, Briefcase, MessageSquare, Star } from 'lucide-react';

const HomePage = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to search results page
    if (searchTerm.trim()) {
      window.location.href = `/gigs?search=${encodeURIComponent(searchTerm)}`;
    }
  };
  
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              Connect with Top Freelancers & Projects
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The marketplace for students and professionals to offer services, find projects, and collaborate.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Search for services or projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
            </form>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/gigs"
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                Browse Services
              </Link>
              <Link
                to="/projects"
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Code className="w-5 h-5" />
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Categories */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Popular Categories</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {[
              { name: 'Web Development', icon: '💻' },
              { name: 'Design', icon: '🎨' },
              { name: 'Mobile Apps', icon: '📱' },
              { name: 'Writing', icon: '✍️' },
              { name: 'Video Editing', icon: '🎬' },
              { name: 'Data Science', icon: '📊' }
            ].map((category, index) => (
              <Link
                key={index}
                to={`/gigs?category=${category.name.toLowerCase().replace(' ', '-')}`}
                className="bg-gray-800/80 hover:bg-gray-800 border border-white/5 rounded-lg p-4 text-center transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-medium text-gray-200">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">How UniTask Works</h2>
          <p className="text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Join our community and start offering or finding services in just a few simple steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 mb-4">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Find & Connect</h3>
              <p className="text-gray-400">
                Discover freelancers or projects that match your needs and connect directly.
              </p>
            </div>
            
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 mb-4">
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Collaborate</h3>
              <p className="text-gray-400">
                Use our tools to communicate, share files, and track project progress.
              </p>
            </div>
            
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 mb-4">
                <Star className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Complete & Review</h3>
              <p className="text-gray-400">
                Finish the project and leave reviews to build your platform reputation.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals and start offering your services or find the perfect talent for your projects.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-8 py-3 font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-8 py-3 font-medium hover:opacity-90 transition-opacity"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-lg transition-colors"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
