import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const isAuthenticated = computed(() => !!user.value);
  const token = useCookie<string | null>('auth-token', {
    default: () => null,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  const setUser = (userData: any) => {
    user.value = userData;
  };

  const setToken = (tokenValue: string | null) => {
    token.value = tokenValue;
  };

  const login = async (email: string, password: string) => {
    try {
      const { $fetch } = useNuxtApp();
      const response = await ($fetch as any)('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      });

      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { $fetch } = useNuxtApp();
      const response = await ($fetch as any)('/api/auth/register', {
        method: 'POST',
        body: {
          email,
          password,
          name
        }
      });

      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      const { $fetch } = useNuxtApp();
      await ($fetch as any)('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      user.value = null;
      token.value = null;
      await navigateTo('/login');
    }
  };

  const verifyToken = async () => {
    if (!token.value) {
      return false;
    }

    try {
      const { $fetch } = useNuxtApp();
      const response = await ($fetch as any)('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      user.value = null;
      token.value = null;
      return false;
    }
  };

  return {
    user: readonly(user),
    isAuthenticated,
    token: readonly(token),
    setUser,
    setToken,
    login,
    register,
    logout,
    verifyToken
  };
});