import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Target, Clock, Shield, TrendingUp, Code, Briefcase, Users, BookOpen, Star, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const elements = document.querySelectorAll('[data-scroll]');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top <= window.innerHeight * 0.8;
        setIsVisible(prev => ({ ...prev, [el.dataset.scroll]: isVisible }));
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const cards = [
    { 
      icon: Code, 
      title: "Web Development",
      rate: "$30-50/hr",
      description: "Build modern websites and applications",
      gradient: "from-blue-500 to-purple-500"
    },
    { 
      icon: Briefcase, 
      title: "Business Consulting",
      rate: "$25-40/hr",
      description: "Help businesses grow and succeed",
      gradient: "from-purple-500 to-pink-500"
    },
    { 
      icon: Users, 
      title: "Social Media",
      rate: "$20-35/hr",
      description: "Manage and grow social presence",
      gradient: "from-pink-500 to-orange-500"
    },
    { 
      icon: BookOpen, 
      title: "Content Writing",
      rate: "$25-45/hr",
      description: "Create engaging content that converts",
      gradient: "from-orange-500 to-yellow-500"
    },
  ];

  const features = [
    { icon: Clock, title: "Flexible Hours", description: "Work on your own schedule" },
    { icon: Target, title: "Weekly Payments", description: "Get paid consistently" },
    { icon: TrendingUp, title: "Skill Development", description: "Learn as you earn" },
    { icon: Shield, title: "Community Support", description: "Connect with other students" },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text hover:scale-105 transition-all cursor-pointer group">
              student.dev
              <div className="h-0.5 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-purple-400 to-pink-600" />
            </span>
            <div className="hidden md:flex items-center gap-8 text-sm">
              {['Services', 'About', 'Testimonials', 'Contact'].map((item) => (
                <a 
                  key={item} 
                  href="#" 
                  className="relative group overflow-hidden"
                >
                  <span className="relative z-10 hover:text-purple-400 transition-colors">{item}</span>
                  <div className="absolute inset-0 h-0.5 w-full bg-gradient-to-r from-purple-400 to-pink-500 -bottom-0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </a>
              ))}
            </div>
            <div className="flex gap-4">
              <button className="group relative px-6 py-2 rounded-full overflow-hidden">
                <span className="relative z-10">Log In</span>
                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all transform scale-x-0 group-hover:scale-x-100 origin-left" />
              </button>
              <button className="relative px-6 py-2 rounded-full overflow-hidden group">
                <span className="relative z-10">Sign Up</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <div 
            className={`inline-block mb-4 transform transition-all duration-700 ${
              isVisible.badge ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} 
            data-scroll="badge"
          >
            <span className="px-6 py-3 rounded-full text-sm bg-white/5 border border-white/10 flex items-center gap-2 group hover:bg-white/10 transition-all">
              <Star className="w-4 h-4 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
              Join 10,000+ student freelancers
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <h1 
            className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transform transition-all duration-700 ${
              isVisible.title ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} 
            data-scroll="title"
          >
            Turn Your Skills Into
            <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text animate-gradient-x">
              Income While Studying
            </span>
          </h1>
          <p 
            className={`text-xl text-gray-400 mb-8 max-w-2xl mx-auto transform transition-all duration-700 delay-200 ${
              isVisible.description ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} 
            data-scroll="description"
          >
            The ultimate platform for students to freelance, learn, and earn. Join a community of ambitious students turning their skills into success stories.
          </p>
          <div 
            className={`flex flex-col md:flex-row items-center justify-center gap-4 transform transition-all duration-700 delay-300 ${
              isVisible.buttons ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} 
            data-scroll="buttons"
          >
            <button className="group relative w-full md:w-auto px-8 py-4 rounded-full overflow-hidden">
              <span className="relative z-10 flex items-center justify-center font-medium">
                Start Earning Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
            </button>
            <button className="relative w-full md:w-auto px-8 py-4 rounded-full overflow-hidden group">
              <span className="relative z-10 font-medium">Explore Platform</span>
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all transform scale-x-0 group-hover:scale-x-100 origin-left" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 px-4" data-scroll="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us?</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto transform transition-all duration-500 hover:w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:scale-105 transition-all hover:bg-white/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <feature.icon className="w-8 h-8 mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2 relative z-10">{feature.title}</h3>
                <p className="text-gray-400 relative z-10">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Cards */}
      <div className="py-20 px-4" data-scroll="services">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-500 hover:scale-105 border border-white/5 hover:border-white/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} opacity-80 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm bg-white/5 px-3 py-1 rounded-full group-hover:bg-white/10 transition-colors">
                    {card.rate}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-400 mb-4">{card.description}</p>
                <div className={`h-1 w-20 bg-gradient-to-r ${card.gradient} rounded-full group-hover:w-full transition-all duration-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4" data-scroll="cta">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already turning their skills into income. Your success story starts here.
              </p>
              <button className="group relative px-8 py-4 rounded-full overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Create Your Profile
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              student.dev
            </span>
            <p className="text-gray-400">Empowering students to turn their skills into successful careers.</p>
            <div className="flex gap-4">
              {['twitter', 'github', 'linkedin', 'instagram'].map((social) => (
                <a 
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-2">
              {['Find Work', 'Create Profile', 'Success Stories', 'Resources'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Resources</h3>
            <ul className="space-y-2">
              {['Help Center', 'Blog', 'Tutorials', 'FAQ'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Get the latest opportunities and tips.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-grow border border-white/5 placeholder-gray-500"
              />
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 student.dev. All rights reserved.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <a 
                  key={link}
                  href="#"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient-x {
          animation: gradient-x 15s linear infinite;
          background-size: 200% auto;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;