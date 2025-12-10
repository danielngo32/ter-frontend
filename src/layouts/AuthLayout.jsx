import React from 'react';
import { Row, Col, Typography, Form, Button, Dropdown } from 'antd';
import styled, { keyframes } from 'styled-components';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  normalizeLocale,
  SUPPORTED_LOCALES,
  replaceLocaleInPath,
  DEFAULT_LOCALE,
  getLocaleLabel,
} from '../utils/locale';

const { Title: AntTitle } = Typography;

const FlagIcon = ({ locale }) => {
  if (locale === 'vi') {
    return (
      <svg width="32" height="32" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="28" fill="#DA251D" />
        <path
          d="M28 12.6l3.29 10.13h10.68l-8.66 6.28 3.29 10.13L28 32.45l-8.66 6.28 3.29-10.13-8.67-6.28h10.68L28 12.6z"
          fill="#FFEB3B"
        />
      </svg>
    );
  }

  return (
    <svg width="32" height="32" viewBox="0 0 56 56">
      <defs>
        <clipPath id="usa-circle">
          <circle cx="28" cy="28" r="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#usa-circle)">
        <rect width="56" height="56" fill="#fff" />
        {[...Array(9)].map((_, idx) => (
          <rect key={idx} y={idx * 6.22} width="56" height="3.11" fill="#D32F2F" />
        ))}
        <rect width="22" height="22" fill="#1E3A8A" />
        {[...Array(9)].map((_, row) =>
          [...Array(6)].map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={2 + col * 3.2 + (row % 2 === 1 ? 1.6 : 0)}
              cy={2 + row * 2.4}
              r={0.5}
              fill="#fff"
            />
          ))
        )}
      </g>
    </svg>
  );
};

const AuthLayout = ({ leftSlot, children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const currentLocale = normalizeLocale(params.locale || i18n.language || DEFAULT_LOCALE);

  const [menuOpen, setMenuOpen] = React.useState(false);

  const selectedLabel = getLocaleLabel(currentLocale, t);

  const handleMenuClick = (nextLocale) => {
    if (nextLocale === currentLocale) {
      setMenuOpen(false);
      return;
    }

    i18n.changeLanguage(nextLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('preferredLocale', nextLocale);
    }
    const newPath = replaceLocaleInPath(nextLocale, location.pathname);
    navigate(newPath + location.search, { replace: true });
    setMenuOpen(false);
  };

  return (
    <LayoutWrapper>
      <Row>
        <Col xs={0} md={12}>
          <LeftSection>{leftSlot}</LeftSection>
        </Col>
        <Col xs={24} md={12}>
          <RightSection>
            <LanguageWrapper>
              <Dropdown
                open={menuOpen}
                onOpenChange={setMenuOpen}
                trigger={['click']}
                placement="bottomRight"
                dropdownRender={() => (
                  <LanguageMenu>
                    {SUPPORTED_LOCALES.map((localeKey) => (
                      <LanguageMenuItem
                        key={localeKey}
                        $active={localeKey === currentLocale}
                        onClick={() => handleMenuClick(localeKey)}
                      >
                        <LanguageFlag>
                          <FlagIcon locale={localeKey} />
                        </LanguageFlag>
                        <span>{getLocaleLabel(localeKey, t)}</span>
                      </LanguageMenuItem>
                    ))}
                  </LanguageMenu>
                )}
              >
                <LanguageTrigger>
                  <LanguageFlag>
                    <FlagIcon locale={currentLocale} />
                  </LanguageFlag>
                  <LanguageLabel>{selectedLabel}</LanguageLabel>
                </LanguageTrigger>
              </Dropdown>
            </LanguageWrapper>
            <ContentWrapper>{children}</ContentWrapper>
          </RightSection>
        </Col>
      </Row>
    </LayoutWrapper>
  );
};

export default AuthLayout;

const LayoutWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f7f9fb;
  position: relative;

  @media (max-width: 768px) {
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
`;

const LeftSection = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 64px 56px 64px;
  background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
  color: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    padding: 0 48px 48px 48px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const RightSection = styled.div`
  height: 100vh;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 48px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 1024px) {
    padding: 48px 40px;
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    padding: 32px 24px 48px 24px;
    overflow-y: visible;
  }

  @media (max-width: 480px) {
    padding: 24px 20px 40px 20px;
  }
`;

const LanguageWrapper = styled.div`
  position: absolute;
  top: 32px;
  right: 48px;

  @media (max-width: 1024px) {
    right: 40px;
  }

  @media (max-width: 768px) {
    position: static;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  margin: 96px auto 0;
  padding-bottom: 40px;

  @media (max-width: 1024px) {
    margin-top: 64px;
  }

  @media (max-width: 768px) {
    margin-top: 0;
    max-width: 100%;
    padding-bottom: 32px;
  }

  @media (max-width: 480px) {
    padding-bottom: 24px;
  }
`;

const LanguageTrigger = styled.button.attrs({ type: 'button' })`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: #111827;

  &:hover {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.15);
  }
`;

const LanguageFlag = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const LanguageLabel = styled.span`
  white-space: nowrap;
`;

const LanguageMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow:
    0 20px 45px rgba(15, 23, 42, 0.15),
    0 8px 18px rgba(15, 23, 42, 0.08);
  min-width: 180px;
`;

const LanguageMenuItem = styled.button.attrs({ type: 'button' })`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: ${({ $active }) => ($active ? 'rgba(26, 35, 126, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1a237e' : '#111827')};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(26, 35, 126, 0.08);
    color: #1a237e;
  }
`;

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const slideUpFade = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); opacity: 0.8; }
  50% { transform: translateY(-10px); opacity: 1; }
`;

export const LogoContainer = styled.div`
  flex-shrink: 0;
  z-index: 1;
`;

export const Logo = styled.img`
  height: 120px;
  filter: brightness(0) invert(1);

  @media (max-width: 768px) {
    height: 80px;
  }

  @media (max-width: 480px) {
    height: 64px;
  }
`;

export const LeftContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 24px;
  color: #ffffff;
  z-index: 1;
`;

export const StyledTitle = styled(AntTitle)`
  && {
    font-size: 48px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 24px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    letter-spacing: -1.5px;
  }

  .typing-cursor {
    display: inline-block;
    width: 3px;
    height: 1em;
    background-color: #ffffff;
    margin-left: 4px;
    animation: ${blink} 1s infinite;
  }

  @media (max-width: 768px) {
    && {
      font-size: 36px;
    }
  }
`;

export const StyledSubtitle = styled.div`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  max-width: 520px;
  min-height: 54px;
  position: relative;
  overflow: hidden;

  .carousel-text {
    animation: ${slideUpFade} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .ant-typography {
    color: inherit !important;
    margin: 0 !important;
  }

  @media (max-width: 1024px) {
    font-size: 16px;
    margin-bottom: 32px;
    min-height: 48px;
  }

  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 24px;
    min-height: 44px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
    min-height: 40px;
  }
`;

export const IllustrationContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin-top: 40px;
  z-index: 1;

  svg {
    width: 100%;
    height: auto;
  }

  circle, rect, path, polygon, ellipse {
    animation: ${float} 6s ease-in-out infinite;
  }

  @media (max-width: 1024px) {
    max-width: 400px;
    margin-top: 32px;
  }

  @media (max-width: 768px) {
    max-width: 350px;
    margin-top: 24px;
  }

  @media (max-width: 480px) {
    max-width: 280px;
    margin-top: 20px;
  }
`;

export const FormHeader = styled.div`
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 32px;
  }

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

export const FormTitle = styled.h1`
  font-size: 30px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;


export const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-form-item:has(.ant-checkbox-wrapper) {
    margin-bottom: 12px;
  }

  .ant-input-affix-wrapper {
    border-radius: 10px;
    border: 1.5px solid #e5e7eb;
    padding: 12px 16px;
    background: #fafafa;
    transition: all 0.3s ease;
    font-size: 16px;

    &:hover {
      border-color: #1a237e;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(26, 35, 126, 0.08);
    }

    &.ant-input-affix-wrapper-focused {
      border-color: #1a237e;
      box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.06);
      background: #ffffff;
    }

    .ant-input {
      color: #000000;
      font-size: 16px;
      padding-left: 8px;
    }

    .ant-input-prefix {
      margin-right: 3px;
    }
  }

  .ant-input-password .anticon {
    color: #666666;
    transition: color 0.2s ease;

    &:hover {
      color: #1a237e;
    }
  }

  @media (max-width: 768px) {
    .ant-form-item {
      margin-bottom: 20px;
    }

    .ant-input-affix-wrapper {
      padding: 10px 14px;
      font-size: 16px;

      .ant-input {
        font-size: 16px;
      }
    }
  }

  @media (max-width: 480px) {
    .ant-form-item {
      margin-bottom: 18px;
    }

    .ant-input-affix-wrapper {
      padding: 10px 12px;
      border-radius: 8px;
    }
  }
`;

export const SubmitButton = styled(Button)`
  width: 100%;
  height: 50px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
  border: none;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(26, 35, 126, 0.3);
  touch-action: manipulation;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #283593 0%, #3949ab 50%, #1a237e 100%);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
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
`;

export const BackButton = styled(Button)`
  margin-bottom: 16px;
  padding: 0;
  height: auto;
  border: none !important;
  box-shadow: none !important;
  color: #1a237e;
  font-weight: 500;
  background: transparent !important;

  &:hover {
    color: #283593;
  }

  .anticon {
    margin-right: 4px;
  }
`;

export const FooterLinks = styled.div`
  text-align: center;
  margin-top: 24px;
`;

export const FooterText = styled.div`
  font-size: 14px;
  color: #666666;
  margin-top: 12px;
`;

export const LinkText = styled(Link)`
  color: #000000;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: #333333;
    text-decoration: underline;
  }
`;

export const SocialLoginContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const SocialButton = styled(Button)`
  flex: 1;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 15px;
  border: 1.5px solid #e5e7eb;
  transition: all 0.2s ease;
  touch-action: manipulation;
  padding: 0 16px;
  white-space: nowrap;

  .anticon {
    font-size: 20px;
    margin-right: 8px;
    flex-shrink: 0;
  }

  svg {
    font-size: 20px;
    margin-right: 8px;
    flex-shrink: 0;
  }


  &:hover {
    border-color: #1a237e;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: 48px;
    font-size: 15px;
    border-radius: 10px;
    padding: 14px 14px;

    .anticon {
      font-size: 20px;
      margin-right: 8px;
    }

    svg {
      font-size: 20px;
      margin-right: 8px;
    }
  }

  @media (max-width: 480px) {
    height: auto;
    min-height: 48px;
    font-size: 15px;
    width: 100%;
    border-radius: 10px;
    padding: 14px 16px;
  }
`;

export const GoogleButton = styled(SocialButton)`
  background: #ffffff;
  color: #000000;

  &:hover {
    background: #f9fafb;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  text-align: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e5e7eb;
  }

  span {
    padding: 0 16px;
    color: #64748b;
    font-size: 14px;
  }
`;