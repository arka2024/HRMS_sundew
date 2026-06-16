import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../services/api.client';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isServiceUnavailable: boolean;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsServiceUnavailable(false);

    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setIsServiceUnavailable(err.isServiceUnavailable);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, isServiceUnavailable, refetch };
}
