import { useEffect } from 'react';

/**
 * Custom hook for infinite scroll
 * Calls callback when scrolling to top of container
 */
const useInfiniteScroll = (containerRef, callback, hasMore = true) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !hasMore) return;

        const handleScroll = () => {
            // Check if scrolled to top (with small threshold)
            if (container.scrollTop < 100) {
                callback();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef, callback, hasMore]);
};

export default useInfiniteScroll;
