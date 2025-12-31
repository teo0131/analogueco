import { useEffect, useRef } from 'react';

const scrollPositions: Record<string, number> = {};

export const useScrollPosition = (key: string) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = scrollPositions[key];
    if (savedPosition !== undefined && containerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = savedPosition;
        }
      });
    }
  }, [key]);

  // Save scroll position before unmount
  useEffect(() => {
    const container = containerRef.current;
    
    return () => {
      if (container) {
        scrollPositions[key] = container.scrollTop;
      }
    };
  }, [key]);

  // Also save on scroll to capture latest position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositions[key] = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [key]);

  return containerRef;
};

// Hook for window scroll (for pages that use window scrolling)
export const useWindowScrollPosition = (key: string) => {
  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = scrollPositions[key];
    if (savedPosition !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    }
  }, [key]);

  // Save scroll position on scroll and before unmount
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions[key] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollPositions[key] = window.scrollY;
      window.removeEventListener('scroll', handleScroll);
    };
  }, [key]);
};
