import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Button,
  Typography,
  Box,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AuthLayout, {
  LogoContainer,
  Logo,
  LeftContent,
  StyledTitle,
  StyledSubtitle,
  IllustrationContainer,
  FormHeader,
  FormTitle,
} from '../../../layouts/AuthLayout';
import { DEFAULT_LOCALE, normalizeLocale } from '../../../utils/locale';
import { authService } from '../auth.service';

const QR_LIFETIME = 30;
const DEVICE_ID_KEY = 'terDeviceId';

const getDeviceId = () => {
  if (typeof window === 'undefined') return null;
  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    const randomPart =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    deviceId = `web-${randomPart}`;
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const LoginQRPage = () => {
  const [challengeId, setChallengeId] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [expiresIn, setExpiresIn] = useState(QR_LIFETIME);
  const [status, setStatus] = useState('idle');
  const [qrSize, setQrSize] = useState(240);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const countdownRef = useRef(null);
  const pollRef = useRef(null);
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const params = useParams();
  const routeLocale = normalizeLocale(params.locale);
  const localePrefix = `/${routeLocale || DEFAULT_LOCALE}`;

  const titleText = t('loginQR.title');
  const subtitleList = useMemo(() => {
    const values = t('loginQR.subtitles', { returnObjects: true, lng: i18n.language });
    return Array.isArray(values) ? values : [];
  }, [i18n.language, t]);

  const [displayedText, setDisplayedText] = useState('');
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const typingTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

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
    const updateSizes = () => {
      if (window.innerWidth <= 480) {
        setQrSize(200);
      } else if (window.innerWidth <= 768) {
        setQrSize(220);
      } else {
        setQrSize(240);
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  useEffect(() => {
    currentIndexRef.current = 0;
    isDeletingRef.current = false;
    if (!titleText) {
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

      if (!isDeletingRef.current && currentIndexRef.current < titleText.length) {
        setDisplayedText(titleText.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current += 1;
        setShowCursor(true);
        typingTimeoutRef.current = setTimeout(typeText, typingSpeed);
      } else if (!isDeletingRef.current && currentIndexRef.current === titleText.length) {
        typingTimeoutRef.current = setTimeout(() => {
          isDeletingRef.current = true;
          typeText();
        }, pauseTime);
      } else if (isDeletingRef.current && currentIndexRef.current > 0) {
        currentIndexRef.current -= 1;
        setDisplayedText(titleText.slice(0, currentIndexRef.current));
        setShowCursor(true);
        typingTimeoutRef.current = setTimeout(typeText, deleteSpeed);
      } else if (isDeletingRef.current && currentIndexRef.current === 0) {
        isDeletingRef.current = false;
        typingTimeoutRef.current = setTimeout(typeText, 500);
      }
    };

    setDisplayedText('');
    typeText();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [titleText]);

  useEffect(() => {
    if (!subtitleList.length) {
      setCurrentSubtitleIndex(0);
      return undefined;
    }
    setCurrentSubtitleIndex(0);
    const carouselInterval = setInterval(
      () => setCurrentSubtitleIndex((prev) => (prev + 1) % subtitleList.length),
      5000
    );
    return () => clearInterval(carouselInterval);
  }, [subtitleList]);

  const handleBackToPassword = useCallback(() => {
    navigate(`${localePrefix}/login`);
  }, [navigate, localePrefix]);

  const initializeChallenge = useCallback(async () => {
    try {
      setStatus('loading');
      const response = await authService.createQrChallenge({
        deviceId: getDeviceId(),
        platform: 'web',
      });
      setChallengeId(response.challengeId);
      setQrValue(response.qrValue || response.challengeId);
      setExpiresIn(Math.floor((response.ttl || QR_LIFETIME * 1000) / 1000));
      setStatus('pending');
      setSnackbar({ open: false, message: '', severity: 'info' });
      } catch (error) {
      showSnackbar(t('login.messages.error'), 'error');
        setStatus('error');
      }
  }, [t]);

  useEffect(() => {
    initializeChallenge();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [initializeChallenge]);

  useEffect(() => {
    if (status !== 'pending') {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return undefined;
    }
    countdownRef.current = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (!challengeId || status !== 'pending') {
      if (pollRef.current) clearInterval(pollRef.current);
      return undefined;
    }
    pollRef.current = setInterval(async () => {
      try {
        const response = await authService.pollQrChallenge(challengeId);
        if (response.status === 'approved') {
          setStatus('approved');
          showSnackbar(t('login.messages.success'), 'success');
          clearInterval(pollRef.current);
          clearInterval(countdownRef.current);
          navigate(localePrefix);
        } else if (response.status === 'expired') {
          setStatus('expired');
        }
      } catch (error) {
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [challengeId, status, navigate, localePrefix, t]);

  const handleRefresh = () => {
    initializeChallenge();
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
        mass: 0.8,
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
                {showCursor && displayedText.length < titleText.length && (
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
                    <linearGradient id="grad-qr" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.1)', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="160" y="120" width="180" height="180" rx="16" fill="rgba(255,255,255,0.18)" />
                  <rect x="185" y="145" width="60" height="60" rx="8" fill="rgba(255,255,255,0.35)" />
                  <rect x="255" y="145" width="60" height="60" rx="8" fill="rgba(255,255,255,0.2)" />
                  <rect x="185" y="215" width="60" height="60" rx="8" fill="rgba(255,255,255,0.2)" />
                  <rect x="255" y="215" width="60" height="60" rx="8" fill="rgba(255,255,255,0.35)" />
                  <circle cx="120" cy="110" r="50" fill="rgba(255, 255, 255, 0.15)" />
                  <circle cx="420" cy="100" r="65" fill="rgba(255, 255, 255, 0.08)" />
                  <path d="M100 260 Q180 210 260 260" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M190 320 Q250 280 310 320" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </IllustrationContainer>
            </LeftContent>
          </>
        }
      >
        <MuiBackButton
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToPassword}
          sx={{ mb: 2 }}
        >
          {t('common.actions.back')}
        </MuiBackButton>

        <FormHeader>
          <FormTitle>{t('loginQR.panel.title')}</FormTitle>
        </FormHeader>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <QrWrapper>
            {status === 'expired' ? (
              <ExpiredContainer>
                <QRCodeSVG value={qrValue || 'pending'} size={qrSize} />
                <ExpiredOverlay>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    {t('loginQR.panel.expired')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    sx={{
                      background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #283593 0%, #3949ab 50%, #1a237e 100%)',
                      },
                    }}
                  >
                  {t('loginQR.panel.refresh')}
                </Button>
                </ExpiredOverlay>
              </ExpiredContainer>
            ) : (
              <>
                <QRCodeSVG value={qrValue || 'pending'} size={qrSize} />
            {status === 'pending' && <CountdownBadge>{Math.max(expiresIn, 0)}</CountdownBadge>}
              </>
            )}
          </QrWrapper>
          <Description>{t('loginQR.panel.description')}</Description>
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

export default LoginQRPage;

const Description = styled.p`
  margin-top: 16px;
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  text-align: center;
  padding: 0 16px;

  @media (max-width: 768px) {
    font-size: 14px;
    margin-top: 12px;
    padding: 0 12px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    margin-top: 10px;
    padding: 0 8px;
    line-height: 1.5;
  }
`;

const QrWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    transform: scale(0.9);
  }

  @media (max-width: 480px) {
    transform: scale(0.85);
  }
`;

const ExpiredContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ExpiredOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const CountdownBadge = styled.div`
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #ffffff;
  color: #1a237e;
  font-weight: 600;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 8px;
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
