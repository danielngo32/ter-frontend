import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { authRoutes, ProtectedRoute } from './routes/auth.routes';
import { profileRoutes } from './routes/profile.routes';
import { mainRoutes } from './routes/main.routes';
import { productRoutes } from './routes/product.routes';
import { customerRoutes } from './routes/customer.routes';
import LoadingSpinner from './components/LoadingSpinner';
import {
  detectPreferredLocale,
  normalizeLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  stripLocaleFromPath,
} from './utils/locale';
import { getSubdomain, isSubdomain, getBaseHostname, isMainDomain } from './utils/subdomain';
import { authService } from './features/auth/auth.service';
import i18n from './i18n/i18n';
import './styles/App.css';


const AUTH_SEGMENTS = ['login', 'register', 'forgot-password', 'login-qr'];

const isAuthPath = (subPath) => {
  if (!subPath) return false;
  return AUTH_SEGMENTS.some(
    (segment) => subPath === segment || subPath.startsWith(`${segment}/`)
  );
};

const LocaleLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useParams();
  const normalizedLocale = normalizeLocale(locale || DEFAULT_LOCALE);
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const subdomain = getSubdomain();
    if (!subdomain || !isSubdomain()) {
      setCheckingSubdomain(false);
      return;
    }
    
    const currentSubPath = stripLocaleFromPath(location.pathname);
    const isAuthRoute = AUTH_SEGMENTS.some(
      (segment) => currentSubPath === segment || currentSubPath.startsWith(`${segment}/`)
    );
    if (isAuthRoute) {
      setCheckingSubdomain(false);
      return;
    }
    
    const user = authService.getCurrentUser();
    if (user) {
      setCheckingSubdomain(false);
      return;
    }
    
    setCheckingSubdomain(true);
    
    const checkTenant = async () => {
      try {
        const response = await authService.checkTenantSlug(subdomain);
        if (response.available) {
          const baseHostname = getBaseHostname() || 'localhost';
          const protocol = window.location.protocol;
          const port = window.location.port ? `:${window.location.port}` : '';
          const mainDomainUrl = `${protocol}//${baseHostname}${port}${location.pathname}`;
          window.location.href = mainDomainUrl;
        } else {
          setCheckingSubdomain(false);
        }
      } catch (error) {
        setCheckingSubdomain(false);
      }
    };
    
    checkTenant();
  }, [location.pathname]);

  useEffect(() => {
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('preferredLocale') : null;
    let finalLocale = normalizedLocale;
    
    if (savedLocale && SUPPORTED_LOCALES.includes(normalizeLocale(savedLocale))) {
      finalLocale = normalizeLocale(savedLocale);
    }
    
    if (!SUPPORTED_LOCALES.includes(finalLocale)) {
      const preferred = detectPreferredLocale();
      const remainder = stripLocaleFromPath(location.pathname);
      navigate(`/${preferred}/${remainder}`, { replace: true });
      return;
    }

    const pathHasLocale = SUPPORTED_LOCALES.some(loc => location.pathname.startsWith(`/${loc}/`) || location.pathname === `/${loc}`);
    
    if (savedLocale && !pathHasLocale) {
      const remainder = stripLocaleFromPath(location.pathname);
      navigate(`/${savedLocale}${remainder}`, { replace: true });
      return;
    }
    
    if (i18n.language !== finalLocale) {
      i18n.changeLanguage(finalLocale);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('preferredLocale', finalLocale);
    }
  }, [normalizedLocale, location.pathname, navigate]);

  useEffect(() => {
    let frameId;
    if (location.pathname !== prevPath) {
      const currentSubPath = stripLocaleFromPath(location.pathname);
      const previousSubPath = stripLocaleFromPath(prevPath);
      const isAuthRoute = isAuthPath(currentSubPath);
      const wasAuthRoute = isAuthPath(previousSubPath);

      if (!isAuthRoute && !wasAuthRoute) {
        setLoading(true);
        frameId = window.requestAnimationFrame(() => {
          setPrevPath(location.pathname);
          setLoading(false);
        });
        return () => {
          if (frameId) {
            window.cancelAnimationFrame(frameId);
          }
        };
      }

      setPrevPath(location.pathname);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [location.pathname, prevPath]);

  if (loading || checkingSubdomain) {
    return <LoadingSpinner />;
  }

  const isMain = typeof window !== 'undefined' ? isMainDomain() : false;

  return (
    <Routes location={location}>
      {authRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      {!isMain && mainRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedRoute>{route.element}</ProtectedRoute>}
        >
          {route.children?.map((childRoute) => (
            <Route
              key={childRoute.path || 'index'}
              index={childRoute.index}
              path={childRoute.path}
              element={childRoute.element}
            />
          ))}
        </Route>
      ))}
      {!isMain && profileRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedRoute>{route.element}</ProtectedRoute>}
        >
          {route.children?.map((childRoute) => (
            <Route
              key={childRoute.path || 'index'}
              index={childRoute.index}
              path={childRoute.path}
              element={childRoute.element}
            />
          ))}
        </Route>
      ))}
      {!isMain && productRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedRoute>{route.element}</ProtectedRoute>}
        >
          {route.children?.map((childRoute) => (
            <Route
              key={childRoute.path || 'index'}
              index={childRoute.index}
              path={childRoute.path}
              element={childRoute.element}
            />
          ))}
        </Route>
      ))}
      {!isMain && customerRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedRoute>{route.element}</ProtectedRoute>}
        >
          {route.children?.map((childRoute) => (
            <Route
              key={childRoute.path || 'index'}
              index={childRoute.index}
              path={childRoute.path}
              element={childRoute.element}
            />
          ))}
        </Route>
      ))}
      {!isMain && <Route path="*" element={<Navigate to={`/${normalizedLocale}/login`} replace />} />}
      {isMain && <Route path="*" element={<Navigate to={`/${normalizedLocale}/login`} replace />} />}
    </Routes>
  );
};

const LocaleRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const preferred = detectPreferredLocale();
    navigate(`/${preferred}/login`, { replace: true });
  }, [navigate]);
  return <LoadingSpinner />;
};

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
      light: '#3949ab',
      dark: '#283593',
    },
    background: {
      default: '#f7f9fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1a237e',
            borderRadius: 8,
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LocaleRedirect />} />
            <Route path="/:locale/*" element={<LocaleLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
