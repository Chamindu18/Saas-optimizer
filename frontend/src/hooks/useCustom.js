import { useState, useEffect } from 'react';

// Hook for counting up numbers on dashboard metrics
export function useCountUp(target, duration = 800, delay = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const startTime = performance.now();
      const isNumeric = typeof target === 'number';
      const targetNumber = isNumeric ? target : parseFloat(target);

      const animateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (isNumeric) {
          setCount(Math.floor(targetNumber * progress));
        } else {
          // Format with commas
          const value = Math.floor(targetNumber * progress);
          setCount(value.toLocaleString());
        }

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          setCount(isNumeric ? targetNumber : targetNumber.toLocaleString());
        }
      };

      requestAnimationFrame(animateCount);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [target, duration, delay]);

  return count;
}
