import React, { createContext, useContext, useMemo, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { normalizeLocale, DEFAULT_LOCALE } from "../utils/locale";
import Layout from "./Layout";
import styled from "styled-components";

const ProfileLayoutContext = createContext();

export const useProfileLayout = () => {
  const context = useContext(ProfileLayoutContext);
  if (!context) {
    throw new Error("useProfileLayout must be used within ProifleLayout");
  }
  return context;
};

const ProifleLayout = ({ children }) => {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const locale = normalizeLocale(params.locale || i18n.language || DEFAULT_LOCALE);
  const localePrefix = `/${locale}`;
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerSubtitle, setHeaderSubtitle] = useState("");

  const tabs = useMemo(() => [
    {
      id: "personal",
      label: "Thông tin",
      icon: <PersonIcon />,
      path: `${localePrefix}/me`,
    },
    {
      id: "settings",
      label: t("profile.tabs.settings"),
      icon: <SettingsIcon />,
      path: `${localePrefix}/me/settings`,
    },
    {
      id: "security",
      label: t("profile.tabs.security"),
      icon: <SecurityIcon />,
      path: `${localePrefix}/me/security`,
    },
    {
      id: "devices",
      label: t("profile.tabs.devices"),
      icon: <DevicesIcon />,
      path: `${localePrefix}/me/devices`,
    },
  ], [t, localePrefix]);

  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    for (const tab of tabs) {
      if (tab.id === "personal") {
        // Special handling for index route /me
        if (currentPath === `${localePrefix}/me` || currentPath === `${localePrefix}/me/`) {
          return tab.id;
        }
      } else if (currentPath === tab.path || currentPath.startsWith(tab.path + "/")) {
        return tab.id;
      }
    }
    return "personal";
  }, [location.pathname, tabs, localePrefix]);

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <Layout>
      <ProfileLayoutContext.Provider value={{ activeTab, tabs, setHeaderTitle, setHeaderSubtitle }}>
        <PageContainer>
          <LayoutContainer>
            <SidebarContainer>
              <SidebarContent>
                {tabs.map((tab) => (
                  <SidebarItem
                    key={tab.id}
                    $active={activeTab === tab.id}
                    onClick={() => handleTabClick(tab)}
                  >
                    <SidebarIcon $active={activeTab === tab.id}>
                      {tab.icon}
                    </SidebarIcon>
                    <SidebarLabel $active={activeTab === tab.id}>
                      {tab.label}
                    </SidebarLabel>
                  </SidebarItem>
                ))}
              </SidebarContent>
            </SidebarContainer>

            <ContentContainer>
              <ContentPaper elevation={0}>
                {headerTitle && (
                  <HeaderBlock>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      {headerTitle}
                    </Typography>
                    {headerSubtitle && (
                      <Typography variant="body2" color="text.secondary">
                        {headerSubtitle}
                      </Typography>
                    )}
                  </HeaderBlock>
                )}
                {children || <Outlet />}
              </ContentPaper>
            </ContentContainer>
          </LayoutContainer>
        </PageContainer>
      </ProfileLayoutContext.Provider>
    </Layout>
  );
};

export default ProifleLayout;

const PageContainer = styled(Box)`
  display: flex;
  width: calc(100% + 64px);
  margin-left: -32px;
  margin-right: -32px;
  margin-top: -32px;
  margin-bottom: -32px;
  min-height: calc(100vh - 112px);
  height: calc(100vh - 112px);
  background: #f9fafb;

  @media (max-width: 1200px) {
    width: calc(100% + 48px);
    margin-left: -24px;
    margin-right: -24px;
    margin-top: -24px;
    margin-bottom: -24px;
  }

  @media (max-width: 960px) {
    width: calc(100% + 32px);
    margin-left: -16px;
    margin-right: -16px;
    margin-top: -20px;
    margin-bottom: -20px;
  }
`;

const LayoutContainer = styled(Box)`
  display: flex;
  width: 100%;
  align-items: flex-start;

  @media (max-width: 960px) {
    flex-direction: column;
  }
`;

const SidebarContainer = styled(Box)`
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 112px;
  margin: 15px;
  height: calc(100vh - 142px);
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;
  border-radius: 12px;

  @media (max-width: 960px) {
    width: 100%;
    position: relative;
    top: 0;
    height: auto;
    max-height: none;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const SidebarContent = styled(Box)`
  display: flex;
  flex-direction: column;
  padding: 20px 15px;
  gap: 6px;
`;

const SidebarItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${(props) =>
    props.$active ? "rgba(26, 35, 126, 0.08)" : "transparent"};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: ${(props) => (props.$active ? "20px" : "0")};
    background: #1a237e;
    border-radius: 0 2px 2px 0;
    transition: all 0.15s ease;
  }

  &:hover {
    background: ${(props) =>
      props.$active ? "rgba(26, 35, 126, 0.12)" : "rgba(0, 0, 0, 0.02)"};
  }

  &:active {
    transform: scale(0.99);
  }
`;

const SidebarIcon = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  color: ${(props) => (props.$active ? "#1a237e" : "#1f2937")};
  transition: color 0.15s ease;

  svg {
    font-size: 20px;
  }

  ${SidebarItem}:hover & {
    color: ${(props) => (props.$active ? "#1a237e" : "#0f172a")};
  }
`;

const SidebarLabel = styled(Typography)`
  && {
    font-size: 14px;
    font-weight: ${(props) => (props.$active ? 600 : 400)};
    color: ${(props) => (props.$active ? "#1a237e" : "#111827")};
    transition: all 0.15s ease;
    line-height: 1.5;

    ${SidebarItem}:hover & {
      color: ${(props) => (props.$active ? "#1a237e" : "#0f172a")};
      font-weight: ${(props) => (props.$active ? "600" : "500")};
    }
  }
`;

const ContentContainer = styled(Box)`
  flex: 1;
  min-width: 0;
  margin: 15px 15px 15px 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
  height: calc(100vh - 142px);
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (max-width: 960px) {
    margin: 10px;
  }
`;

const ContentPaper = styled(Paper)`
  && {
    border-radius: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
`;

const HeaderBlock = styled(Box)`
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 10px;
`;

