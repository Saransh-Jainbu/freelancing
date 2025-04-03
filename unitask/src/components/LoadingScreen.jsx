import { Loader } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
      <p className="text-gray-400">Loading...</p>
    </div>
  );
};

export default LoadingScreen;
