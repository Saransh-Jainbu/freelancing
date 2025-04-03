import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Navigation />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
