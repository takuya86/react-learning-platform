import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      logger.error('Error reading localStorage', {
        category: 'storage',
        context: { key, error },
      });
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        logger.error('Error setting localStorage', {
          category: 'storage',
          context: { key, error },
        });
      }
    },
    [key]
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          logger.error('Error parsing localStorage change', {
            category: 'storage',
            context: { key, error },
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
