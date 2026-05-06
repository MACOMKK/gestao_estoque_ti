import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings({ mode: 'supabase', auth_required: true });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();

      if (currentUser?.status === 'inativo') {
        await base44.auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: 'inactive_user',
          message: 'Acesso bloqueado. Seu usuario esta inativo.'
        });
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      if (currentUser?.role !== 'admin') {
        await base44.auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: 'forbidden',
          message: 'Acesso negado. Apenas administradores podem acessar o painel.'
        });
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      setUser(null);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    }
  };

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    await base44.auth.login(email, password);
    const currentUser = await base44.auth.me();

    if (currentUser?.status === 'inativo') {
      await base44.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      setAuthError({
        type: 'inactive_user',
        message: 'Acesso bloqueado. Seu usuario esta inativo.'
      });
      throw new Error('Acesso bloqueado. Seu usuario esta inativo.');
    }

    if (currentUser?.role !== 'admin') {
      await base44.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      setAuthError({
        type: 'forbidden',
        message: 'Acesso negado. Apenas administradores podem acessar o painel.'
      });
      throw new Error('Acesso negado. Apenas administradores podem acessar o painel.');
    }

    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
