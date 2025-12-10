import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Button,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
  Typography,
  Popover,
  Paper,
} from '@mui/material';
import {
  ShoppingCart,
  Notifications,
  Settings,
  Logout,
  Person,
  ExpandMore,
  Store,
  Folder,
  Message,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { authService } from '../features/auth/auth.service';
import { profileService } from '../features/profile/profile.service';
import { normalizeLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES, getLocaleLabel, replaceLocaleInPath } from '../utils/locale';
import styled from '@emotion/styled';

const FlagIcon = ({ locale, size = 20 }) => {
  if (locale === 'vi') {
    return (
      <svg width={size} height={size} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="28" fill="#DA251D" />
        <path
          d="M28 12.6l3.29 10.13h10.68l-8.66 6.28 3.29 10.13L28 32.45l-8.66 6.28 3.29-10.13-8.67-6.28h10.68L28 12.6z"
          fill="#FFEB3B"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <defs>
        <clipPath id={`usa-circle-${size}`}>
          <circle cx="28" cy="28" r="28" />
        </clipPath>
      </defs>
      <g clipPath={`url(#usa-circle-${size})`}>
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

const TopHeaderBar = styled(AppBar)({
  backgroundColor: '#ffffff',
  color: '#1f2937',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  borderBottom: '1px solid #e5e7eb',
  zIndex: 1300,
});

const PrimaryNavBar = styled(AppBar)({
  backgroundColor: '#1a237e',
  color: '#ffffff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  zIndex: 1299,
  top: '56px',
});

const Logo = styled.img({
  height: '70px',
  marginLeft: '10px',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
  '&:hover': {
    opacity: 0.8,
  },
});

const LanguageButton = styled(Button)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: 'transparent',
  color: '#64748b',
  fontSize: '13px',
  fontWeight: 500,
  textTransform: 'none',
  minWidth: 'auto',
  border: '1px solid transparent',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
});

const HeaderIconButton = styled(IconButton)({
  color: '#64748b',
  padding: '8px',
  '&:hover': {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
  },
});

const NavMenuItem = styled(Button)(({ active }) => ({
  color: '#ffffff',
  fontSize: '14px',
  textTransform: 'none',
  padding: '12px 16px',
  borderRadius: '6px',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
  fontWeight: active ? 600 : 500,
  minWidth: 'auto',
  position: 'relative',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)',
  },
}));

const SalesButton = styled(Button)({
  backgroundColor: '#ffffff',
  color: '#1a237e',
  fontWeight: 600,
  fontSize: '14px',
  textTransform: 'none',
  padding: '7px 14px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f9fafb',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
  },
});

const NewBadge = styled(Box)({
  position: 'absolute',
  top: '6px',
  right: '6px',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 5px',
  borderRadius: '8px',
  lineHeight: '1.2',
  letterSpacing: '0.3px',
});

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: '#f9fafb',
  minHeight: 'calc(100vh - 112px)',
  padding: '32px',
  marginTop: '112px',
  [theme.breakpoints.down('lg')]: {
    padding: '24px',
  },
  [theme.breakpoints.down('md')]: {
    padding: '20px 16px',
    marginTop: '104px',
  },
}));

const LanguageMenu = styled(Menu)({
  '& .MuiPaper-root': {
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginTop: '8px',
    minWidth: '160px',
  },
});

const LanguageMenuItem = styled(MenuItem)(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 16px',
  borderRadius: '8px',
  margin: '4px 8px',
  backgroundColor: active ? 'rgba(26, 35, 126, 0.08)' : 'transparent',
  color: active ? '#1a237e' : '#1f2937',
  fontWeight: active ? 600 : 500,
  fontSize: '14px',
  '&:hover': {
    backgroundColor: 'rgba(26, 35, 126, 0.08)',
  },
}));

const ProfileMenu = styled(Menu)({
  '& .MuiPaper-root': {
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginTop: '8px',
    minWidth: '200px',
  },
});

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { t, i18n } = useTranslation('common');
  const locale = normalizeLocale(params.locale || i18n.language || DEFAULT_LOCALE);
  const localePrefix = `/${locale}`;

  const [anchorEl, setAnchorEl] = useState(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);
  const [productsMenuAnchor, setProductsMenuAnchor] = useState(null);
  const [productsMenuTimeout, setProductsMenuTimeout] = useState(null);
  const [user, setUser] = useState(profileService.getCurrentUser());
  const isOwner = user?.role === 'owner';

  const menuItems = [
    { key: 'dashboard', label: t('nav.dashboard'), path: `${localePrefix}/dashboard` },
    { key: 'products', label: t('nav.products'), path: `${localePrefix}/products`, hasSubmenu: true },
    { key: 'orders', label: t('nav.orders'), path: `${localePrefix}/orders` },
    { key: 'customers', label: t('nav.customers'), path: `${localePrefix}/customers` },
    { key: 'employees', label: t('nav.employees'), path: `${localePrefix}/employees` },
    { key: 'cashbook', label: t('nav.cashbook'), path: `${localePrefix}/cashbook` },
    { key: 'reports', label: t('nav.reports'), path: `${localePrefix}/reports` },
    { key: 'onlineSales', label: t('nav.onlineSales'), path: `${localePrefix}/online-sales` },
  ];

  const productsSubmenu = {
    column1: {
      title: t('nav.products') || 'Hàng hóa',
      items: [
        { label: t('nav.products.list') || 'Danh sách hàng hóa', path: `${localePrefix}/products` },
        { label: t('nav.products.categories') || 'Danh mục', path: `${localePrefix}/products/categories` },
        { label: t('nav.products.brands') || 'Thương hiệu', path: `${localePrefix}/products/brands` },
        { label: t('nav.products.promotions') || 'Khuyến mãi', path: `${localePrefix}/products/promotions` },
      ],
    },
    column2: {
      title: t('nav.products.warehouse') || 'Kho hàng',
      items: [
        { label: t('nav.products.warehouses') || 'Danh sách kho', path: `${localePrefix}/products/warehouses` },
        { label: t('nav.products.inventory') || 'Tồn kho', path: `${localePrefix}/products/inventory` },
      ],
    },
    column3: {
      title: t('nav.products.tools') || 'Công cụ',
      items: [
        { label: t('nav.products.barcodeScanner') || 'Quét mã vạch', path: `${localePrefix}/products/barcode-scanner` },
      ],
    },
  };

  const handleProfileMenuOpen = async (event) => {
    setAnchorEl(event.currentTarget);
    try {
      const profile = await profileService.getProfile();
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (newLocale) => {
    i18n.changeLanguage(newLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('preferredLocale', newLocale);
    }
    const newPath = replaceLocaleInPath(newLocale, location.pathname);
    navigate(newPath + location.search, { replace: true });
    handleLanguageMenuClose();
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await authService.logout();
    navigate(`${localePrefix}/login`);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleProductsMenuOpen = (event) => {
    if (productsMenuTimeout) {
      clearTimeout(productsMenuTimeout);
      setProductsMenuTimeout(null);
    }
    setProductsMenuAnchor(event.currentTarget);
  };

  const handleProductsMenuClose = () => {
    const timeout = setTimeout(() => {
      setProductsMenuAnchor(null);
    }, 200);
    setProductsMenuTimeout(timeout);
  };

  const handleProductsMenuMouseEnter = () => {
    if (productsMenuTimeout) {
      clearTimeout(productsMenuTimeout);
      setProductsMenuTimeout(null);
    }
  };

  const handleProductsSubmenuClick = (path) => {
    handleNavigate(path);
    handleProductsMenuClose();
  };

  useEffect(() => {
    return () => {
      if (productsMenuTimeout) {
        clearTimeout(productsMenuTimeout);
      }
    };
  }, [productsMenuTimeout]);

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === `${localePrefix}/dashboard`) {
      return currentPath === path || currentPath === `${localePrefix}/` || currentPath === localePrefix;
    }
    return currentPath.startsWith(path);
  };

  return (
    <Box>
      <TopHeaderBar position="fixed">
        <Toolbar 
          sx={{ 
            minHeight: '56px !important',
            height: '56px',
            justifyContent: 'space-between', 
            px: { xs: 2, md: 3 },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Logo 
              src="/logo/logotext512.png" 
              alt="TER Logo" 
              onClick={() => handleNavigate(`${localePrefix}/dashboard`)} 
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeaderIconButton size="small">
              <Badge badgeContent={0} color="error" variant="dot">
                <Notifications sx={{ fontSize: '20px' }} />
              </Badge>
            </HeaderIconButton>
            
            <HeaderIconButton 
              size="small"
              onClick={() => handleNavigate(`${localePrefix}/messages`)}
            >
              <Badge badgeContent={0} color="error" variant="dot">
                <Message sx={{ fontSize: '20px' }} />
              </Badge>
            </HeaderIconButton>
            
            {!isMobile && (
              <>
                <HeaderIconButton 
                  size="small"
                  onClick={() => handleNavigate(`${localePrefix}/files`)}
                >
                  <Folder sx={{ fontSize: '20px' }} />
                </HeaderIconButton>
                
                <LanguageButton
                  endIcon={<ExpandMore sx={{ fontSize: '16px' }} />}
                  onClick={handleLanguageMenuOpen}
                >
                  <FlagIcon locale={locale} size={18} />
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                    {getLocaleLabel(locale, t)}
                  </Typography>
                </LanguageButton>
              </>
            )}
            
            {isOwner && (
              <HeaderIconButton 
                size="small" 
                onClick={() => handleNavigate(`${localePrefix}/settings`)}
              >
                <Settings sx={{ fontSize: '20px' }} />
              </HeaderIconButton>
            )}
            
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ 
                padding: '2px',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Avatar 
                src={user?.avatarUrl}
                alt={user?.fullName || 'User'}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#1a237e',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </TopHeaderBar>

      <PrimaryNavBar position="fixed">
        <Toolbar 
          sx={{ 
            minHeight: '56px !important',
            height: '56px',
            justifyContent: 'space-between', 
            px: { xs: 1.5, md: 3 },
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              flex: 1,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
            }}
          >
            {menuItems.map((item) => (
              <Box key={item.key} sx={{ position: 'relative', flexShrink: 0 }}>
                <NavMenuItem
                  active={isActive(item.path)}
                  onClick={item.hasSubmenu ? handleProductsMenuOpen : () => handleNavigate(item.path)}
                  onMouseEnter={item.hasSubmenu ? handleProductsMenuOpen : undefined}
                >
                  {item.label}
                </NavMenuItem>
                {item.badge && (
                  <NewBadge>{item.badge}</NewBadge>
                )}
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexShrink: 0 }}>
            <SalesButton
              startIcon={<ShoppingCart sx={{ fontSize: '18px' }} />}
              onClick={() => handleNavigate(`${localePrefix}/sales`)}
            >
              {t('nav.sales')}
            </SalesButton>
          </Box>
        </Toolbar>
      </PrimaryNavBar>

      <MainContent>
        {children || <Outlet />}
      </MainContent>

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box 
          sx={{ 
            px: 2, 
            py: 1.5, 
            borderBottom: '1px solid #e5e7eb',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#f9fafb',
            },
          }}
          onClick={() => {
            handleNavigate(`${localePrefix}/me`);
            handleProfileMenuClose();
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              src={user?.avatarUrl}
              alt={user?.fullName || 'User'}
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#1a237e',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1f2937',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.fullName || 'User'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {user?.tenant?.slug && user?.role === 'owner' && (
          <MenuItem 
            onClick={() => { 
              handleNavigate(`${localePrefix}/store/profile`); 
              handleProfileMenuClose(); 
            }}
            sx={{ py: 1.5, px: 2 }}
          >
            <ListItemIcon>
              <Store fontSize="small" />
            </ListItemIcon>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: '#1f2937',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.25,
                }}
              >
                {user.tenant.slug}.ter.vn
              </Typography>
              {user?.role && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#64748b',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {t(`roles.${user.role}`, user.role)}
                </Typography>
              )}
            </Box>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={t('nav.logout')}
            primaryTypographyProps={{ fontSize: '14px' }}
          />
        </MenuItem>
      </ProfileMenu>

      <LanguageMenu
        anchorEl={languageMenuAnchor}
        open={Boolean(languageMenuAnchor)}
        onClose={handleLanguageMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {SUPPORTED_LOCALES.map((localeKey) => (
          <LanguageMenuItem
            key={localeKey}
            active={localeKey === locale}
            onClick={() => handleLanguageChange(localeKey)}
          >
            <FlagIcon locale={localeKey} size={20} />
            <Typography variant="body2" sx={{ fontSize: '14px' }}>
              {getLocaleLabel(localeKey, t)}
            </Typography>
          </LanguageMenuItem>
        ))}
      </LanguageMenu>

      <Popover
        open={Boolean(productsMenuAnchor)}
        anchorEl={productsMenuAnchor}
        onClose={handleProductsMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            minWidth: '600px',
            maxWidth: '700px',
            p: 0,
          },
          onMouseEnter: handleProductsMenuMouseEnter,
          onMouseLeave: handleProductsMenuClose,
        }}
        disableRestoreFocus
      >
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            gap: 2,
            backgroundColor: '#ffffff',
          }}
          onMouseEnter={handleProductsMenuMouseEnter}
          onMouseLeave={handleProductsMenuClose}
        >
          {Object.values(productsSubmenu).map((column, colIndex) => (
            <Box
              key={colIndex}
              sx={{
                flex: 1,
                minWidth: 0,
                ...(colIndex < Object.keys(productsSubmenu).length - 1 && {
                  borderRight: '1px solid #e5e7eb',
                  pr: 2,
                }),
                ...(colIndex > 0 && {
                  pl: 2,
                }),
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {column.title}
              </Typography>
              {column.items.map((subItem, itemIndex) => (
                <MenuItem
                  key={itemIndex}
                  onClick={() => handleProductsSubmenuClick(subItem.path)}
                  sx={{
                    py: 1.25,
                    px: 1.5,
                    borderRadius: '6px',
                    mb: 0.5,
                    color: '#1f2937',
                    fontSize: '14px',
                    fontWeight: 400,
                    transition: 'all 0.15s ease',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: '#e5e7eb',
                      color: '#1a237e',
                      fontWeight: 500,
                    },
                  }}
                >
                  {subItem.label}
                </MenuItem>
              ))}
            </Box>
          ))}
        </Paper>
      </Popover>
    </Box>
  );
};

export default Layout;
