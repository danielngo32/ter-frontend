import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  InputAdornment,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Google as GoogleIcon,
  QrCode2 as QrCodeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import AuthLayout, {
  LogoContainer,
  Logo,
  LeftContent,
  StyledTitle,
  StyledSubtitle,
  IllustrationContainer,
  FormHeader,
  FormTitle,
  FooterLinks,
  FooterText,
  LinkText,
  SocialLoginContainer,
  GoogleButton,
  Divider,
} from '../../../layouts/AuthLayout';
import { authService } from '../auth.service';
import { authValidator } from '../auth.validator';
import { DEFAULT_LOCALE, normalizeLocale } from '../../../utils/locale';
import { isMainDomain, isSubdomain, buildSubdomainUrl, getSubdomain } from '../../../utils/subdomain';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{6,20}$/;

const isEmail = (str) => emailRegex.test(str);
const isPhone = (str) => phoneRegex.test(str);

const LoginPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('auth');
  const params = useParams();
  const routeLocale = normalizeLocale(params.locale);
  const localePrefix = `/${routeLocale || DEFAULT_LOCALE}`;

  const [formValues, setFormValues] = useState({
    slug: '',
    identifier: '',
    password: '',
    remember: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [displayedText, setDisplayedText] = useState('');
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const typingTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  const onMainDomain = useMemo(() => isMainDomain(), []);
  const onSubdomain = useMemo(() => isSubdomain(), []);
  const subdomainSlug = useMemo(() => getSubdomain(), []);
  const showSlugInput = onMainDomain;

  const titleText = t('login.title');
  const typingText = titleText || '';
  const subtitleList = useMemo(() => {
    const values = t('login.subtitles', { returnObjects: true, lng: i18n.language });
    return Array.isArray(values) ? values : [];
  }, [i18n.language, t]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateField = (name, value) => {
    let error = '';

    if (name === 'slug' && showSlugInput) {
      const trimmed = value?.trim();
      if (!trimmed) {
        error = t('validation.slug.required');
      }
    }

    if (name === 'identifier') {
      const trimmed = value?.trim();
      if (!trimmed) {
        error = t('login.messages.identifierRequired');
      } else if (!isEmail(trimmed) && !isPhone(trimmed)) {
        error = t('login.messages.identifierInvalid');
      }
    }

    if (name === 'password') {
      if (!value) {
        error = t('login.messages.passwordRequired');
      }
    }

    return error;
  };

  const handleFieldChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFieldBlur = (name) => {
    const error = validateField(name, formValues[name]);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const errors = {};

    if (showSlugInput) {
      errors.slug = validateField('slug', formValues.slug);
    }
    errors.identifier = validateField('identifier', formValues.identifier);
    errors.password = validateField('password', formValues.password);

    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const identifier = formValues.identifier?.trim();

      const loginData = {
        password: formValues.password,
      };

      if (onMainDomain) {
        const slug = formValues.slug?.trim();
        if (!slug) {
          showSnackbar(t('validation.slug.required'), 'error');
          setLoading(false);
          return;
        }
        loginData.slug = slug;
      } else if (onSubdomain && subdomainSlug) {
        loginData.slug = subdomainSlug;
      }

      if (isEmail(identifier)) {
        loginData.email = identifier;
      } else {
        loginData.phoneNumber = identifier;
      }

      const response = await authService.login(loginData);
      
      if (!response?.user) {
        showSnackbar(t('login.messages.error'), 'error');
        setLoading(false);
        return;
      }
      
      showSnackbar(t('login.messages.success'), 'success');

      let tenantSlug = formValues.slug?.trim();
      
      if (onMainDomain) {
        const currentLocale = routeLocale || DEFAULT_LOCALE;
        localStorage.setItem('preferredLocale', currentLocale);
        
        if (tenantSlug) {
          const subdomainUrl = buildSubdomainUrl(tenantSlug, `/${currentLocale}/dashboard`, true);
          window.location.replace(subdomainUrl);
          return;
        }
        tenantSlug = response?.tenantSlug || localStorage.getItem('tenantSlug') || response?.user?.tenantSlug;
        if (tenantSlug) {
          const subdomainUrl = buildSubdomainUrl(tenantSlug, `/${currentLocale}/dashboard`, true);
          window.location.replace(subdomainUrl);
          return;
        }
      }
      
      const currentLocale = routeLocale || DEFAULT_LOCALE;
      if (onSubdomain && subdomainSlug) {
        navigate(`/${currentLocale}/dashboard`, { replace: true });
      } else {
        const finalSlug = tenantSlug || subdomainSlug || response?.tenantSlug || localStorage.getItem('tenantSlug') || response?.user?.tenantSlug;
        if (finalSlug) {
          const subdomainUrl = buildSubdomainUrl(finalSlug, `/${currentLocale}/dashboard`, true);
          window.location.replace(subdomainUrl);
        } else {
          navigate(`/${currentLocale}/dashboard`, { replace: true });
        }
      }
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      const normalized = backendMessage?.toLowerCase() || '';
      if (normalized.includes('invalid credentials')) {
        showSnackbar(t('login.messages.invalidCredentials'), 'error');
      } else {
        showSnackbar(backendMessage || t('login.messages.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = 0;
    isDeletingRef.current = false;
    if (!typingText) {
      setDisplayedText('');
      setShowCursor(false);
      return undefined;
    }
    const typingSpeed = 80;
    const pauseTime = 2000;
    const deleteSpeed = 50;

    const typeText = () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (!isDeletingRef.current && currentIndexRef.current < typingText.length) {
        setDisplayedText(typingText.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        setShowCursor(true);
        typingTimeoutRef.current = setTimeout(typeText, typingSpeed);
      } else if (!isDeletingRef.current && currentIndexRef.current === typingText.length) {
        typingTimeoutRef.current = setTimeout(() => {
          isDeletingRef.current = true;
          setShowCursor(true);
          typeText();
        }, pauseTime);
      } else if (isDeletingRef.current && currentIndexRef.current > 0) {
        currentIndexRef.current--;
        setDisplayedText(typingText.slice(0, currentIndexRef.current));
        setShowCursor(true);
        typingTimeoutRef.current = setTimeout(typeText, deleteSpeed);
      } else if (isDeletingRef.current && currentIndexRef.current === 0) {
        isDeletingRef.current = false;
        currentIndexRef.current = 0;
        setDisplayedText('');
        typingTimeoutRef.current = setTimeout(() => {
          setShowCursor(true);
          typeText();
        }, 500);
      }
    };

    setDisplayedText('');
    typeText();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [typingText]);

  useEffect(() => {
    if (!subtitleList.length) {
      setCurrentSubtitleIndex(0);
      return undefined;
    }

    setCurrentSubtitleIndex(0);
    const carouselInterval = setInterval(() => {
      setCurrentSubtitleIndex((prevIndex) => (prevIndex + 1) % subtitleList.length);
    }, 5000);

    return () => clearInterval(carouselInterval);
  }, [subtitleList]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <AuthLayout
        leftSlot={
          <>
            <LogoContainer>
              <Logo src="/logo/logotext512.png" alt="TER Logo" />
            </LogoContainer>
            <LeftContent>
              <StyledTitle level={1}>
                {displayedText}
                {showCursor && displayedText.length < typingText.length && (
                  <span className="typing-cursor" />
                )}
              </StyledTitle>
              <StyledSubtitle>
                <div className="carousel-text" key={currentSubtitleIndex}>
                  <Typography>{subtitleList[currentSubtitleIndex] || ''}</Typography>
                </div>
              </StyledSubtitle>
              <IllustrationContainer>
                <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="60" fill="rgba(255, 255, 255, 0.15)" />
                  <circle cx="400" cy="150" r="80" fill="rgba(255, 255, 255, 0.1)" />
                  <rect x="150" y="200" width="200" height="120" rx="12" fill="rgba(255, 255, 255, 0.2)" />
                  <rect x="170" y="220" width="160" height="8" rx="4" fill="rgba(255, 255, 255, 0.4)" />
                  <rect x="170" y="240" width="120" height="8" rx="4" fill="rgba(255, 255, 255, 0.3)" />
                  <rect x="170" y="260" width="140" height="8" rx="4" fill="rgba(255, 255, 255, 0.3)" />
                  <circle cx="180" cy="290" r="12" fill="rgba(255, 255, 255, 0.3)" />
                  <circle cx="210" cy="290" r="12" fill="rgba(255, 255, 255, 0.3)" />
                  <circle cx="240" cy="290" r="12" fill="rgba(255, 255, 255, 0.3)" />
                  <path d="M250 100 L300 150 L350 100" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M50 250 L100 300 L150 250" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <rect x="80" y="320" width="100" height="60" rx="8" fill="rgba(255, 255, 255, 0.15)" />
                  <rect x="320" y="280" width="120" height="80" rx="8" fill="rgba(255, 255, 255, 0.15)" />
                </svg>
              </IllustrationContainer>
            </LeftContent>
          </>
        }
      >
        <FormHeader>
          <FormTitle>{t('login.form.title')}</FormTitle>
        </FormHeader>

        <SocialLoginContainer>
          <GoogleButton
            icon={<GoogleIcon />}
            onClick={() => {
              showSnackbar(
                t('common.socialComingSoon', { provider: t('login.form.social.google') }),
                'info'
              );
            }}
          >
            {t('login.form.social.google')}
          </GoogleButton>
          <QRButton
            icon={<QrCodeIcon />}
            onClick={() => navigate(`${localePrefix}/login-qr`)}
          >
            {t('login.form.qrLink')}
          </QRButton>
        </SocialLoginContainer>

        <Divider>
          <span>{t('login.form.divider')}</span>
        </Divider>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          {showSlugInput && (
            <TextField
              fullWidth
              label={t('login.form.slugPlaceholder')}
              variant="outlined"
              value={formValues.slug}
              onChange={(e) => {
                let value = e.target.value;
                if (value.endsWith('.ter.vn')) {
                  value = value.replace('.ter.vn', '');
                }
                handleFieldChange('slug', value);
              }}
              onBlur={() => handleFieldBlur('slug')}
              error={!!formErrors.slug}
              helperText={formErrors.slug}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="text.secondary">
                        .ter.vn
                      </Typography>
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label={t('login.form.identifierPlaceholder')}
            variant="outlined"
            value={formValues.identifier}
            onChange={(e) => handleFieldChange('identifier', e.target.value)}
            onBlur={() => handleFieldBlur('identifier')}
            error={!!formErrors.identifier}
            helperText={formErrors.identifier}
            autoComplete="username"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t('login.form.passwordPlaceholder')}
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={formValues.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            error={!!formErrors.password}
            helperText={formErrors.password}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formValues.remember}
                onChange={(e) => handleFieldChange('remember', e.target.checked)}
              />
            }
            label={t('login.form.rememberMe')}
            sx={{ mb: 2 }}
          />

          <MuiButton
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
          >
            {t('login.form.submit')}
          </MuiButton>

          <FooterLinks>
            <LinkText to={`${localePrefix}/forgot-password`}>
              {t('login.form.forgotPassword')}
            </LinkText>
            {onMainDomain && (
              <>
                <FooterText>
                  {t('login.form.noAccount')}{' '}
                  <LinkText to={`${localePrefix}/register`}>
                    {t('login.form.signUp')}
                  </LinkText>
                </FooterText>
              </>
            )}
          </FooterLinks>
        </Box>
      </AuthLayout>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default LoginPage;

const MuiButton = styled(Button)`
  && {
    width: 100%;
    height: 50px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
    border: none;
    font-weight: 600;
    font-size: 16px;
    text-transform: none;
    box-shadow: 0 4px 12px rgba(26, 35, 126, 0.3);
    touch-action: manipulation;

    &:hover {
      background: linear-gradient(135deg, #283593 0%, #3949ab 50%, #1a237e 100%);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      height: 48px;
      font-size: 15px;
      border-radius: 8px;
    }

    @media (max-width: 480px) {
      height: 46px;
      font-size: 15px;
    }
  }
`;

const QRButton = styled(GoogleButton)`
  && {
    flex: 1;
    justify-content: center;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;
