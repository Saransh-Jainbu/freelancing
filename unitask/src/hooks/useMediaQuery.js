import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that listens to CSS media queries
 * @param {string} query - The CSS media query to match against
 * @returns {boolean} - Whether the media query matches
 */
const useMediaQuery = (query) => {
  // Initialize with the current match state
  const getMatches = (mediaQuery) => {
    // Check if window is defined (to support SSR)
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches;
    }
    return false;
  };
  
  const [matches, setMatches] = useState(getMatches(query));
  
  useEffect(() => {
    // Check if window is defined (to support SSR)
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    
    // Update matches state based on the query result
    const updateMatches = () => setMatches(mediaQuery.matches);
    
    // Call once to set initial value
    updateMatches();
    
    // Add listener for changes
    mediaQuery.addEventListener('change', updateMatches);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);
  
  return matches;
};

// Common breakpoint helpers based on Tailwind CSS defaults
export const useBreakpoints = () => {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2xl = useMediaQuery('(min-width: 1536px)');
  
  const isMobile = !isSm;
  const isTablet = isMd && !isLg;
  const isDesktop = isLg;
  
  return { isSm, isMd, isLg, isXl, is2xl, isMobile, isTablet, isDesktop };
};

export default useMediaQuery;
