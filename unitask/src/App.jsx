import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Target, Clock, Shield, TrendingUp, Code, Briefcase, Users, BookOpen } from 'lucide-react';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const cards = [
    { icon: Code, title: "Web Development", rate: "$30-50/hr" },
    { icon: Briefcase, title: "Business Consulting", rate: "$25-40/hr" },
    { icon: Users, title: "Social Media", rate: "$20-35/hr" },
    { icon: BookOpen, title: "Content Writing", rate: "$25-45/hr" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute top-0 -right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        ></div>
        <div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`
          }}
        ></div>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-500 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-blue-500 rounded-full animate-float animation-delay-4000"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/50 backdrop-blur-xl shadow-2xl' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              student.dev
            </span>
            <div className="flex gap-4">
              <button className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all hover:scale-105">
                Log In
              </button>
              <button className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-4 animate-fade-in-up">
            <span className="px-6 py-3 rounded-full text-sm bg-white/10 backdrop-blur-md border border-white/20">
              🚀 Join 10,000+ student freelancers
            </span>
          </div>
          <h1 className="text-7xl font-bold mb-6 leading-tight animate-fade-in-up animation-delay-200">
            Turn Your Skills Into
            <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              Income While Studying
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 animate-fade-in-up animation-delay-400">
            The ultimate platform for students to freelance, learn, and earn
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
            <button className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:scale-105 transition-all flex items-center">
              Start Earning
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/20">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Animated Cards Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <card.icon className="w-8 h-8 text-purple-500" />
                <span className="text-sm bg-purple-500/20 px-3 py-1 rounded-full">
                  {card.rate}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section with Parallax */}
      <div className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Active Students" },
              { value: "$2M+", label: "Earned by Students" },
              { value: "95%", label: "Success Rate" },
              { value: "4.9/5", label: "Client Rating" }
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:scale-105 transition-all"
              >
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl border border-white/10">
            <h2 className="text-4xl font-bold mb-6">Ready to Start?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Join the next generation of student freelancers
            </p>
            <button className="group px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition-all flex items-center mx-auto">
              Create Your Profile
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;