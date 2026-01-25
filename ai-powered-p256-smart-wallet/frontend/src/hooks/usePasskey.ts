import { useState, useEffect, useCallback } from 'react';
import { PasskeyService, RegisterResponse, LoginResponse } from '@/services/passkey';

interface UsePasskeyReturn {
  isSupported: boolean;
  isPlatformAuthenticatorAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  register: (username: string) => Promise<RegisterResponse | null>;
  login: (username: string) => Promise<LoginResponse | null>;
  clearError: () => void;
}

/**
 * Custom hook for Passkey authentication
 */
export function usePasskey(): UsePasskeyReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = PasskeyService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const platformAvailable = await PasskeyService.isPlatformAuthenticatorAvailable();
        setIsPlatformAuthenticatorAvailable(platformAvailable);
      }
    };

    checkSupport();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const register = useCallback(async (username: string): Promise<RegisterResponse | null> => {
    if (!username.trim()) {
      setError('Username is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await PasskeyService.register(username);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string): Promise<LoginResponse | null> => {
    if (!username.trim()) {
      setError('Username is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await PasskeyService.login(username);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isPlatformAuthenticatorAvailable,
    isLoading,
    error,
    register,
    login,
    clearError,
  };
}
