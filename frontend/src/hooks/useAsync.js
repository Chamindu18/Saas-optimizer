/**
 * useAsync Hook
 * Manages async operations (API calls) with loading, error, and success states
 */

import { useState, useCallback, useEffect } from 'react';

export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Execute async function
  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setIsLoading(true);
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err);
      setStatus('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  // Execute immediately if flag is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error, isLoading };
}

export default useAsync;
