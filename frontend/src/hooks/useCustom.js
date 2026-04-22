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

// Hook for simplified API calls
export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          ...options,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error };
}

// Hook for role-based access
export function useRole() {
  const [role, setRole] = useState('viewer');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(user.role || 'viewer');
  }, []);

  return { role };
}
