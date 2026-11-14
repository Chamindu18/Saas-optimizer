/**
 * useAsync Hook
 * Manages async operations (API calls) with loading, error, and success states
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState(immediate ? 'pending' : 'idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const functionRef = useRef(asyncFunction);
  functionRef.current = asyncFunction;
  const mountedRef = useRef(false);
  const requestRef = useRef(0);

  // Execute async function
  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setIsLoading(true);
    setError(null);
    const request = ++requestRef.current;

    try {
      const response = await functionRef.current(...args);
      if (mountedRef.current && request === requestRef.current) {
        setData(response);
        setStatus('success');
      }
      return response;
    } catch (err) {
      if (mountedRef.current && request === requestRef.current) {
        setError(err);
        setStatus('error');
      }
      return null;
    } finally {
      if (mountedRef.current && request === requestRef.current) setIsLoading(false);
    }
  }, []);

  // Execute immediately if flag is true
  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      void execute();
    }
    return () => { mountedRef.current = false; requestRef.current += 1; };
  }, [execute, immediate]);

  return { execute, status, data, error, isLoading };
}

export default useAsync;
