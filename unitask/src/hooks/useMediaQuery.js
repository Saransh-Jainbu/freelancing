import { useState, useEffect } from 'react';

// Custom hook to handle responsive design
export const useMediaQuery = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    // Update width on window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Return some common breakpoints
  return {
    isMobile: windowWidth < 768, // < 768px
    isTablet: windowWidth >= 768 && windowWidth < 1024, // 768px - 1023px
    isDesktop: windowWidth >= 1024, // >= 1024px
    width: windowWidth
  };
};

// Create breakpoint-specific hooks
export const useIsMobile = () => {
  const { isMobile } = useMediaQuery();
  return isMobile;
};

export const useIsTablet = () => {
  const { isTablet } = useMediaQuery();
  return isTablet;
};

export const useIsDesktop = () => {
  const { isDesktop } = useMediaQuery();
  return isDesktop;
};

// Hook to check if width is at least a certain breakpoint
export const useBreakpointAtLeast = (breakpoint) => {
  const { width } = useMediaQuery();
  
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  
  return width >= (breakpoints[breakpoint] || 0);
};

// Export the useBreakpoints hook that's being imported in Navigation.jsx
export const useBreakpoints = () => {
  const { isMobile, isTablet, isDesktop, width } = useMediaQuery();
  return { isMobile, isTablet, isDesktop, width };
};
