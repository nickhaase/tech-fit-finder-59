import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { featureFlagInitializer } from '@/services/featureFlagInitializer';

export const AuthBootstrap = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize feature flags at app startup and wait for completion
      console.log('🚀 Starting app initialization...');
      await featureFlagInitializer.initialize();
      console.log('✅ App initialization complete');
    };

    initializeApp();
    
    // Check for auth tokens in URL hash (for password reset, magic links, etc.)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && refreshToken) {
      // Set the session with the tokens from URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to authenticate. Please try again.",
            variant: "destructive"
          });
        } else if (data.session?.user?.email === 'nick@getmaintainx.com') {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          toast({
            title: "Authentication successful",
            description: "Redirecting to admin panel...",
          });
          
          // Redirect to admin
          navigate('/admin');
        } else {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          toast({
            title: "Access denied",
            description: "Only admin users can access this area.",
            variant: "destructive"
          });
        }
      });
    }

    // Set up auth state listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email === 'nick@getmaintainx.com') {
          navigate('/admin');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return null; // This component doesn't render anything
};