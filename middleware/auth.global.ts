import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Only protect dashboard routes
  if (!to.path.startsWith('/dashboard')) {
    return;
  }

  // Check if user is authenticated
  const { $fetch } = useNuxtApp();
  
  try {
    // Try to get current user from session/cookie
    const token = useCookie<string | null>('auth-token');
    
    if (!token.value) {
      throw new Error('No auth token found');
    }

    // Verify token with auth service
    const user = await ($fetch as any)('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!user) {
      throw new Error('Invalid token');
    }

    // Store user in state for dashboard use
    const authStore = useAuthStore();
    authStore.setUser(user);
    
  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Clear invalid token
    const token = useCookie<string | null>('auth-token');
    token.value = null;
    
    // Redirect to login page
    return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath));
  }
});