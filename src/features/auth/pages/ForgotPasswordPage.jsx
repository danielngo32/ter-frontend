import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Popover,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
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
} from '../../../layouts/AuthLayout';
import { authService } from '../auth.service';
import { DEFAULT_LOCALE, normalizeLocale } from '../../../utils/locale';
import { isMainDomain, isSubdomain, getSubdomain } from '../../../utils/subdomain';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const routeLocale = normalizeLocale(params.locale);
  const localePrefix = `/${routeLocale || DEFAULT_LOCALE}`;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingSlug, setPendingSlug] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrengthAnchor, setPasswordStrengthAnchor] = useState(null);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const typingTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const { t, i18n } = useTranslation('auth');

  const onMainDomain = useMemo(() => isMainDomain(), []);
  const onSubdomain = useMemo(() => isSubdomain(), []);
  const subdomainSlug = useMemo(() => getSubdomain(), []);
  const showSlugInput = onMainDomain;

  const [formValues, setFormValues] = useState({
    slug: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const titleText = t('forgot.title');
  const typingText = titleText || '';
  const subtitleList = useMemo(() => {
    const values = t('forgot.subtitles', { returnObjects: true, lng: i18n.language });
    return Array.isArray(values) ? values : [];
  }, [i18n.language, t]);

  const stepTitle = useMemo(
    () => t(`forgot.steps.step${currentStep}.title`, { lng: i18n.language }),
    [currentStep, i18n.language, t]
  );

  const passwordStrength = useMemo(() => ({
    minLength: passwordValue.length >= 6,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
  }), [passwordValue]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const validateField = (name, value) => {
    let error = '';

    if (name === 'slug' && showSlugInput) {
      const trimmed = value?.trim();
      if (!trimmed) {
        error = t('validation.slug.required');
      } else {
        if (trimmed.length < 2) {
          error = t('validation.slug.min');
        } else if (trimmed.length > 100) {
          error = t('validation.slug.max');
        } else {
          const slugRegex = /^[a-z0-9-]+$/;
          if (!slugRegex.test(trimmed)) {
            error = t('validation.slug.invalid');
          }
        }
      }
    }

    if (name === 'email') {
      const trimmed = value?.trim();
      if (!trimmed) {
        error = t('validation.email.required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          error = t('validation.email.invalid');
        }
      }
    }

    if (name === 'newPassword') {
      if (!value) {
        error = t('validation.password.required');
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        error = t('validation.confirmPassword.required');
      } else if (value !== formValues.newPassword) {
        error = t('validation.confirmPassword.mismatch');
      }
    }

    return error;
  };

  const handleFieldChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') {
      setPasswordValue(value);
    }
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
    errors.email = validateField('email', formValues.email);

    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const onStep1Submit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const email = formValues.email?.trim();
    let slug = formValues.slug?.trim();

    if (onMainDomain) {
      if (!slug) {
        setFormErrors(prev => ({ ...prev, slug: t('validation.slug.required') }));
        showSnackbar(t('validation.slug.required'), 'error');
        setLoading(false);
        return;
      }
      const slugError = validateField('slug', slug);
      if (slugError) {
        setFormErrors(prev => ({ ...prev, slug: slugError }));
        showSnackbar(slugError, 'error');
        setLoading(false);
        return;
      }
    } else if (onSubdomain && subdomainSlug) {
      slug = subdomainSlug;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email, slug);
      setPendingEmail(email);
      setPendingSlug(slug || '');
      showSnackbar(t('forgot.messages.codeSent'), 'success');
      setCurrentStep(2);
    } catch (error) {
      if (error.response?.status === 404) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.includes('Tenant not found')) {
          if (showSlugInput) {
            setFormErrors(prev => ({ ...prev, slug: t('validation.slug.notFound') }));
          }
          showSnackbar(t('validation.slug.notFound'), 'error');
        } else if (errorMessage.includes('Email not found')) {
          setFormErrors(prev => ({ ...prev, email: t('forgot.messages.emailNotFound') }));
          showSnackbar(t('forgot.messages.emailNotFound'), 'error');
        } else {
          showSnackbar(errorMessage || t('forgot.messages.error'), 'error');
        }
      } else {
        showSnackbar(error.response?.data?.message || t('forgot.messages.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const onStep2Finish = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showSnackbar(t('forgot.messages.codeRequired'), 'error');
      return;
    }
    
    setLoading(true);
    try {
      await authService.verifyCode(pendingEmail, otpValue, 'reset');
      showSnackbar(t('forgot.messages.codeVerified'), 'success');
      setCurrentStep(3);
    } catch (error) {
      let errorMessage = t('forgot.messages.codeInvalid');
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes('Verification code expired')) {
          errorMessage = t('forgot.messages.codeExpired');
        } else if (backendMessage.includes('Invalid or expired verification code')) {
          errorMessage = t('forgot.messages.codeInvalid');
        } else {
          errorMessage = backendMessage;
        }
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onStep3Submit = async (e) => {
    e.preventDefault();

    const otpValue = otp.join('');
    const newPasswordError = validateField('newPassword', formValues.newPassword);
    const confirmPasswordError = validateField('confirmPassword', formValues.confirmPassword);

    if (newPasswordError || confirmPasswordError) {
      setFormErrors({ newPassword: newPasswordError, confirmPassword: confirmPasswordError });
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(pendingEmail, otpValue, formValues.newPassword);
      showSnackbar(t('forgot.messages.resetSuccess'), 'success');
      navigate(localePrefix);
    } catch (error) {
      let errorMessage = t('forgot.messages.resetError');
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes('New password cannot be the same as current password')) {
          errorMessage = t('forgot.messages.samePassword');
        } else if (backendMessage.includes('Invalid or expired verification code')) {
          errorMessage = t('forgot.messages.codeInvalid');
        } else {
          errorMessage = backendMessage;
        }
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    try {
      const slug = pendingSlug || (onMainDomain ? formValues.slug?.trim() : (onSubdomain ? subdomainSlug : null));
      await authService.requestPasswordReset(pendingEmail, slug);
      showSnackbar(t('forgot.messages.codeResent'), 'info');
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('forgot.messages.error');
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-forgot-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-forgot-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) {
        setOtp(['', '', '', '', '', '']);
      }
    } else {
    navigate(`${localePrefix}/login`);
    }
  };

  const renderPasswordStrength = () => (
    <PasswordStrengthContainer>
      <StrengthItem $valid={passwordStrength.minLength}>
        {passwordStrength.minLength ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: '#52c41a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
        )}
        {t('validation.passwordStrength.minLength')}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.number}>
        {passwordStrength.number ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: '#52c41a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
        )}
        {t('validation.passwordStrength.number')}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.uppercase}>
        {passwordStrength.uppercase ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: '#52c41a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
        )}
        {t('validation.passwordStrength.uppercase')}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.special}>
        {passwordStrength.special ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: '#52c41a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
        )}
        {t('validation.passwordStrength.special')}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.lowercase}>
        {passwordStrength.lowercase ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: '#52c41a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: '#ff4d4f' }} />
        )}
        {t('validation.passwordStrength.lowercase')}
      </StrengthItem>
    </PasswordStrengthContainer>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box component="form" onSubmit={onStep1Submit} sx={{ width: '100%' }}>
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
              label={t('forgot.form.emailPlaceholder')}
              variant="outlined"
              type="email"
              value={formValues.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              autoComplete="email"
              sx={{ mb: 2 }}
            />

            <MuiSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              >
                {t('forgot.steps.step1.button')}
            </MuiSubmitButton>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', marginBottom: '32px' }}>
              <Typography
                variant="body1"
                sx={{ fontSize: '16px', color: '#64748b' }}
              >
                {t('forgot.verify.description', {
                  email: pendingEmail || '',
                })}
              </Typography>
            </Box>

            <OTPContainer>
              {otp.map((value, index) => (
                <OTPInput
                  key={index}
                  id={`otp-forgot-${index}`}
                  inputProps={{ maxLength: 1 }}
                  value={value}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  autoFocus={index === 0}
                />
              ))}
            </OTPContainer>

            <MuiSubmitButton
              variant="contained"
              onClick={onStep2Finish}
              fullWidth
              size="large"
              disabled={loading}
            >
              {t('forgot.steps.step2.button')}
            </MuiSubmitButton>

            <FooterLinks sx={{ marginTop: '24px' }}>
              <Typography
                variant="body2"
                sx={{ fontSize: '14px', color: '#666666' }}
              >
                {t('forgot.verify.resendPrompt')}{' '}
                <Link
                  to="#"
                  onClick={handleResendCode}
                  style={{ color: '#1a237e', fontWeight: 600 }}
                >
                  {t('forgot.verify.resendLink')}
                </Link>
              </Typography>
            </FooterLinks>
          </Box>
        );

      case 3:
        return (
          <Box component="form" onSubmit={onStep3Submit} sx={{ width: '100%' }}>
            <Box sx={{ position: 'relative', mb: 1 }}>
              <TextField
                fullWidth
                label={t('forgot.form.newPasswordPlaceholder')}
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                value={formValues.newPassword}
                onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                onFocus={(e) => setPasswordStrengthAnchor(e.currentTarget)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(() => {
                      setPasswordStrengthAnchor(null);
                    }, 200);
                  }
                }}
                error={!!formErrors.newPassword}
                helperText={formErrors.newPassword}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Popover
                open={Boolean(passwordStrengthAnchor)}
                anchorEl={passwordStrengthAnchor}
                onClose={() => setPasswordStrengthAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                disableAutoFocus
                disableEnforceFocus
                onMouseDown={(e) => e.preventDefault()}
                PaperProps={{
                  sx: {
                    width: passwordStrengthAnchor
                      ? passwordStrengthAnchor.offsetWidth
                      : 'auto',
                    mt: 0.5,
                  },
                }}
              >
                <Box sx={{ p: 2 }} onMouseDown={(e) => e.preventDefault()}>
                  {renderPasswordStrength()}
                </Box>
              </Popover>
            </Box>

            <TextField
              fullWidth
              label={t('forgot.form.confirmPasswordPlaceholder')}
              variant="outlined"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formValues.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
              onBlur={() => handleFieldBlur('confirmPassword')}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <MuiSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              >
                {t('forgot.steps.step3.button')}
            </MuiSubmitButton>
          </Box>
        );

      default:
        return null;
    }
  };

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
                  <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="50" fill="rgba(255, 255, 255, 0.15)" />
                <circle cx="400" cy="120" r="60" fill="rgba(255, 255, 255, 0.1)" />
                <ellipse cx="250" cy="200" rx="100" ry="60" fill="rgba(255, 255, 255, 0.2)" />
                <path d="M150 250 Q250 200 350 250" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M200 300 Q250 250 300 300" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <rect x="120" y="280" width="160" height="80" rx="8" fill="rgba(255, 255, 255, 0.18)" />
                <rect x="140" y="300" width="120" height="8" rx="4" fill="rgba(255, 255, 255, 0.4)" />
                <rect x="140" y="320" width="100" height="8" rx="4" fill="rgba(255, 255, 255, 0.3)" />
                <rect x="140" y="340" width="110" height="8" rx="4" fill="rgba(255, 255, 255, 0.3)" />
                <circle cx="160" cy="360" r="12" fill="rgba(255, 255, 255, 0.3)" />
                <circle cx="190" cy="360" r="12" fill="rgba(255, 255, 255, 0.3)" />
                <circle cx="220" cy="360" r="12" fill="rgba(255, 255, 255, 0.3)" />
              </svg>
            </IllustrationContainer>
          </LeftContent>
          </>
        }
      >
        {currentStep > 1 && (
          <MuiBackButton
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
              {t('common.actions.back')}
          </MuiBackButton>
        )}

            <FormHeader>
          <FormTitle>{stepTitle}</FormTitle>
            </FormHeader>

        {renderStepContent()}

            <FooterLinks>
              <FooterText>
                {t('forgot.footer.remember')}{' '}
            <LinkText to={`${localePrefix}/login`}>{t('forgot.footer.signIn')}</LinkText>
              </FooterText>
            </FooterLinks>
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

export default ForgotPasswordPage;

const PasswordStrengthContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  margin-top: 8px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    gap: 8px 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const StrengthItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.$valid ? '#52c41a' : '#ff4d4f'};

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const OTPContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 18px;
  }
`;

const OTPInput = styled(TextField)`
  && {
  width: 50px;

    .MuiOutlinedInput-root {
  height: 60px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  border-radius: 10px;

      input {
        text-align: center;
        padding: 0;
      }

      &:focus-within {
    border-color: #1a237e;
    box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.06);
      }
  }

  @media (max-width: 768px) {
    width: 46px;

      .MuiOutlinedInput-root {
    height: 56px;
    font-size: 22px;
    border-radius: 8px;
      }
  }

  @media (max-width: 480px) {
    width: 42px;

      .MuiOutlinedInput-root {
    height: 52px;
    font-size: 20px;
    border-radius: 8px;
  }
    }
  }
`;

const MuiSubmitButton = styled(Button)`
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

const MuiBackButton = styled(Button)`
  && {
    padding: 0;
    height: auto;
    border: none !important;
    box-shadow: none !important;
    color: #1a237e;
    font-weight: 500;
    background: transparent !important;
    text-transform: none;

    &:hover {
      color: #283593;
      background: transparent !important;
    }
  }
`;
