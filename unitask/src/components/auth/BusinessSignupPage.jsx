import { Link } from 'react-router-dom';
import BusinessSignupForm from './BusinessSignupForm';
import { Building, Users, Briefcase, CheckCircle } from 'lucide-react';

const BusinessSignupPage = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Join UniTask as a Business
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Find skilled freelancers for your projects and work with the best talent from around the world.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Building className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Post Project Requirements</h3>
                  <p className="text-gray-400">
                    Create detailed project descriptions and let freelancers bid with competitive proposals.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Choose from Top Talent</h3>
                  <p className="text-gray-400">
                    Review proposals and freelancer profiles to find the perfect match for your project.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Manage Projects Seamlessly</h3>
                  <p className="text-gray-400">
                    Communicate, share files, and track progress all in one place.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Get Quality Work Done</h3>
                  <p className="text-gray-400">
                    Only pay for work that meets your standards and expectations.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:underline">
                Sign in here
              </Link>
              
              <div className="mt-2">
                Looking to work as a freelancer?{' '}
                <Link to="/signup" className="text-purple-400 hover:underline">
                  Sign up as a freelancer
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="flex items-center">
            <BusinessSignupForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSignupPage;
