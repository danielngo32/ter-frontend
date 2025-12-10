import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import React from 'react';
import { authService } from '../features/auth/auth.service';
import LoginPage from '../features/auth/pages/LoginPage';
import LoginQRPage from '../features/auth/pages/LoginQRPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES, stripLocaleFromPath } from '../utils/locale';
import { isMainDomain, buildSubdomainUrl } from '../utils/subdomain';

const useRouteLocale = () => {
  const { locale } = useParams();
  return normalizeLocale(locale || DEFAULT_LOCALE);
};

export const PublicRoute = ({ children }) => {
  const locale = useRouteLocale();
  const isAuthenticated = authService.isAuthenticated();
  const isMain = typeof window !== 'undefined' ? isMainDomain() : false;
  
  if (isAuthenticated && !isMain) {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/forgot-password') || currentPath.includes('/login-qr')) {
    return <Navigate to={`/${locale}/dashboard`} replace />;
    }
  }
  
  return children;
};

export const ProtectedRoute = ({ children }) => {
  const locale = useRouteLocale();
  const isMain = typeof window !== 'undefined' ? isMainDomain() : false;
  
  // Always check localStorage first - this is synchronous and fast
  const currentUser = authService.getCurrentUser();
  const isAuthenticatedFromStorage = !!currentUser;
  
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticatedFromStorage);
  const [isChecking, setIsChecking] = useState(false);
  const hasCheckedRef = React.useRef(isAuthenticatedFromStorage);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAuthenticated && !isMain) return;
    if (!isMain) return;
    
    const redirectToSubdomain = async () => {
      let tenantSlug = localStorage.getItem('tenantSlug') || authService.getCurrentUser()?.tenantSlug;
      
      if (!tenantSlug) {
        try {
          const profile = await authService.getProfile();
          if (profile?.tenantSlug) {
            tenantSlug = profile.tenantSlug;
            localStorage.setItem('tenantSlug', tenantSlug);
            const user = authService.getCurrentUser();
            if (user) {
              const updatedUser = { ...user, tenantSlug };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          return;
        }
      }
      
      if (tenantSlug) {
        const savedLocale = localStorage.getItem('preferredLocale') || locale;
        const currentPath = window.location.pathname;
        const pathWithLocale = currentPath.startsWith(`/${savedLocale}/`) 
          ? currentPath 
          : `/${savedLocale}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;
        const subdomainUrl = buildSubdomainUrl(tenantSlug, pathWithLocale, true);
        window.location.href = subdomainUrl;
      }
    };
    
    if (isAuthenticated && isMain) {
    redirectToSubdomain();
    }
  }, [locale, isMain, isAuthenticated]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMain) {
      hasCheckedRef.current = true;
      return;
    }
    
    // If already authenticated from localStorage, NEVER check again
    // This is the key fix - if user exists in localStorage, trust it
    if (isAuthenticatedFromStorage) {
      setIsAuthenticated(true);
      hasCheckedRef.current = true;
      return;
    }
    
    // Only check if we haven't checked yet AND not authenticated from storage
    if (!hasCheckedRef.current) {
      setIsChecking(true);
    
    const checkAuth = async () => {
      try {
          // Double check localStorage (in case it was updated)
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setIsAuthenticated(true);
            hasCheckedRef.current = true;
            setIsChecking(false);
            return;
          }
          
          // If not in localStorage, check with API
        const profile = await authService.getProfile();
        if (profile) {
          setIsAuthenticated(true);
            hasCheckedRef.current = true;
        } else {
          setIsAuthenticated(false);
            hasCheckedRef.current = true;
        }
      } catch (error) {
        setIsAuthenticated(false);
          hasCheckedRef.current = true;
      } finally {
        setIsChecking(false);
      }
    };
    
    const savedLocale = localStorage.getItem('preferredLocale');
    if (savedLocale) {
      const currentPath = window.location.pathname;
      const pathHasLocale = SUPPORTED_LOCALES.some(loc => currentPath.startsWith(`/${loc}/`) || currentPath === `/${loc}`);
      if (!pathHasLocale) {
        const remainder = stripLocaleFromPath(currentPath);
        const pathWithLocale = `/${savedLocale}${remainder}`;
        window.history.replaceState({}, '', pathWithLocale);
  }
    }
    
    checkAuth();
    }
  }, [isMain, isAuthenticatedFromStorage]);
  
  // Early return if authenticated from storage - no checking needed
  if (!isMain && isAuthenticatedFromStorage) {
    return children;
  }
  
  if (isMain && isAuthenticated) {
    return null;
  }
  
  if (isChecking) {
    return null;
  }
  
  if (!isMain && isAuthenticated) {
    return children;
  }
  
  if (!isAuthenticated && hasCheckedRef.current) {
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('preferredLocale') || locale : locale;
    return <Navigate to={`/${savedLocale}/login`} replace />;
  }
  
  return children;
};

export const authRoutes = [
  {
    path: 'login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: 'login-qr',
    element: (
      <PublicRoute>
        <LoginQRPage />
      </PublicRoute>
    ),
  },
  {
    path: 'register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: 'forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
];
