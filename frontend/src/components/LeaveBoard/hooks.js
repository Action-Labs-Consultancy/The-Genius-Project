import { useState, useEffect, useCallback, useRef } from 'react';

// Custom hook for optimized data fetching with caching and retry logic
export const useLeaveData = (user, isHR) => {
  const [data, setData] = useState({
    leaveRequests: [],
    allRequests: [],
    leaveBalances: {},
    publicHolidays: [],
    teamMembers: [],
    whoIsOffToday: [],
    teamLeaves: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // Cache key generator
  const getCacheKey = (endpoint, params = {}) => {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${paramString}`;
  };

  // Fetch with caching and retry logic
  const fetchWithCache = useCallback(async (url, options = {}) => {
    const cacheKey = getCacheKey(url, options.params);
    const cached = cacheRef.current[cacheKey];
    
    // Return cached data if still valid (5 minutes)
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current?.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache the response
        cacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };

        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }
        
        retries--;
        if (retries === 0) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      }
    }
  }, []);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:10000';
      
      // Prepare all fetch promises
      const promises = [
        fetchWithCache(`${API_BASE_URL}/api/leave/balances?user_id=${user.id}`),
        fetchWithCache(`${API_BASE_URL}/api/leave/requests?user_id=${user.id}`),
        fetchWithCache(`${API_BASE_URL}/api/leave/team?user_id=${user.id}`),
        fetchWithCache(`${API_BASE_URL}/api/leave/public-holidays`),
        fetchWithCache(`${API_BASE_URL}/api/leave/who-is-off-today`)
      ];

      // If HR, add additional requests
      if (isHR) {
        promises.push(
          fetchWithCache(`${API_BASE_URL}/api/leave/all-requests`),
          fetchWithCache(`${API_BASE_URL}/api/leave/team-members`)
        );
      }

      // Execute all promises
      const results = await Promise.allSettled(promises);

      // Process results
      const [
        balancesResult,
        requestsResult,
        teamResult,
        holidaysResult,
        whoIsOffResult,
        allRequestsResult,
        teamMembersResult
      ] = results;

      const newData = {
        leaveBalances: balancesResult.status === 'fulfilled' ? balancesResult.value : {},
        leaveRequests: requestsResult.status === 'fulfilled' ? requestsResult.value : [],
        teamLeaves: teamResult.status === 'fulfilled' ? teamResult.value : [],
        publicHolidays: holidaysResult.status === 'fulfilled' ? holidaysResult.value : [],
        whoIsOffToday: whoIsOffResult.status === 'fulfilled' ? whoIsOffResult.value : [],
        allRequests: (isHR && allRequestsResult?.status === 'fulfilled') ? allRequestsResult.value : [],
        teamMembers: (isHR && teamMembersResult?.status === 'fulfilled') ? teamMembersResult.value : []
      };

      setData(newData);
      setLastFetch(Date.now());

      // Check for any errors
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0 && errors.length === results.length) {
        throw new Error('Failed to fetch data');
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error.message);
        console.error('Error fetching leave data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isHR, fetchWithCache]);

  // Real-time updates
  useEffect(() => {
    fetchAllData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllData]);

  // Refresh specific data types
  const refreshData = useCallback(async (dataType) => {
    if (!user?.id) return;

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:10000';
      
      switch (dataType) {
        case 'requests':
          const requests = await fetchWithCache(`${API_BASE_URL}/api/leave/requests?user_id=${user.id}`);
          setData(prev => ({ ...prev, leaveRequests: requests }));
          
          if (isHR) {
            const allRequests = await fetchWithCache(`${API_BASE_URL}/api/leave/all-requests`);
            setData(prev => ({ ...prev, allRequests }));
          }
          break;
          
        case 'balances':
          const balances = await fetchWithCache(`${API_BASE_URL}/api/leave/balances?user_id=${user.id}`);
          setData(prev => ({ ...prev, leaveBalances: balances }));
          break;
          
        case 'team':
          const team = await fetchWithCache(`${API_BASE_URL}/api/leave/team?user_id=${user.id}`);
          setData(prev => ({ ...prev, teamLeaves: team }));
          break;
          
        case 'whoIsOff':
          const whoIsOff = await fetchWithCache(`${API_BASE_URL}/api/leave/who-is-off-today`);
          setData(prev => ({ ...prev, whoIsOffToday: whoIsOff }));
          break;
          
        default:
          await fetchAllData();
      }
    } catch (error) {
      console.error(`Error refreshing ${dataType}:`, error);
    }
  }, [user?.id, isHR, fetchWithCache, fetchAllData]);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Check if data is stale
  const isStale = useCallback(() => {
    return lastFetch && Date.now() - lastFetch > 300000; // 5 minutes
  }, [lastFetch]);

  return {
    ...data,
    loading,
    error,
    refreshData,
    clearCache,
    isStale: isStale(),
    lastFetch: lastFetch ? new Date(lastFetch) : null
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: null,
    averageRenderTime: 0,
    slowRenders: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => {
        const newRenderCount = prev.renderCount + 1;
        const newAverageRenderTime = 
          (prev.averageRenderTime * prev.renderCount + renderTime) / newRenderCount;
        
        return {
          renderCount: newRenderCount,
          lastRenderTime: renderTime,
          averageRenderTime: newAverageRenderTime,
          slowRenders: prev.slowRenders + (renderTime > 16 ? 1 : 0)
        };
      });
    };
  });

  return metrics;
};

// Local storage hook for preferences
export const usePreferences = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error storing preference:', error);
    }
  }, [key]);

  return [value, setStoredValue];
};

// Debounced search hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
