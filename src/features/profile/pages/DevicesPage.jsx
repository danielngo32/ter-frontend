import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Chip,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Devices as DevicesIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  Tablet as TabletIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useProfileLayout } from "../../../layouts/ProifleLayout";
import { profileService } from "../profile.service";

const DevicesPage = () => {
  const { t } = useTranslation("common");
  const { setHeaderTitle, setHeaderSubtitle } = useProfileLayout();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [revokePassword, setRevokePassword] = useState("");
  const [showRevokePassword, setShowRevokePassword] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setHeaderTitle(t("profile.devices"));
    setHeaderSubtitle("Xem và quản lý các thiết bị đã đăng nhập");
    return () => {
      setHeaderTitle("");
      setHeaderSubtitle("");
    };
  }, [t, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await profileService.listDevices();
      setDevices(data || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Không thể tải danh sách thiết bị",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    setRevokingDeviceId(deviceId);
    setLoadingAction(true);
    try {
      await profileService.revokeDevice(deviceId);
      setMessage({ type: "success", text: "Đã thu hồi thiết bị thành công" });
      fetchDevices();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Không thể thu hồi thiết bị",
      });
    } finally {
      setLoadingAction(false);
      setRevokingDeviceId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!revokePassword) {
      setMessage({ type: "error", text: "Vui lòng nhập mật khẩu" });
      return;
    }
    setLoadingAction(true);
    try {
      await profileService.revokeAllDevices(revokePassword);
      setShowRevokeAll(false);
      setRevokePassword("");
      setMessage({ type: "success", text: "Đã thu hồi tất cả thiết bị thành công" });
      fetchDevices();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Mật khẩu không đúng",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const getDeviceIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case "mobile":
      case "android":
      case "ios":
        return <PhoneIcon />;
      case "tablet":
        return <TabletIcon />;
      case "desktop":
      case "web":
        return <ComputerIcon />;
      default:
        return <DevicesIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <ContentSection>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={400} height={24} sx={{ mt: 1, mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mb: 2 }} />
        ))}
      </ContentSection>
    );
  }

  return (
    <ContentSection>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {devices.length} thiết bị đã đăng nhập
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => setShowRevokeAll(true)}
          disabled={devices.length === 0}
        >
          Đăng xuất tất cả
        </Button>
      </Box>

      {devices.length === 0 ? (
        <EmptyState>
          <DevicesIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Chưa có thiết bị nào
          </Typography>
        </EmptyState>
      ) : (
        <DevicesList>
          {devices.map((device) => (
            <DeviceCard key={device.deviceId}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                <Box sx={{ color: "primary.main" }}>{getDeviceIcon(device.platform)}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {device.deviceName || "Thiết bị không tên"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {device.platform || "Không xác định"}
                  </Typography>
                  {device.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      📍 {device.location}
                    </Typography>
                  )}
                  {device.ipAddress && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      IP: {device.ipAddress}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Lần cuối: {formatDate(device.lastSeenAt)}
                  </Typography>
                  {device.activeSessionsCount > 0 && (
                    <Chip
                      label={`${device.activeSessionsCount} phiên đăng nhập`}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {device.isRevoked ? (
                  <Chip label="Đã thu hồi" color="error" size="small" />
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRevokeDevice(device.deviceId)}
                    disabled={loadingAction && revokingDeviceId === device.deviceId}
                  >
                    Thu hồi
                  </Button>
                )}
              </Box>
            </DeviceCard>
          ))}
        </DevicesList>
      )}

      <Dialog open={showRevokeAll} onClose={() => !loadingAction && setShowRevokeAll(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đăng xuất tất cả thiết bị</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn sẽ bị đăng xuất khỏi tất cả thiết bị. Vui lòng nhập mật khẩu để xác nhận.
          </Alert>
          <TextField
            label="Mật khẩu"
            type={showRevokePassword ? "text" : "password"}
            value={revokePassword}
            onChange={(e) => setRevokePassword(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowRevokePassword(!showRevokePassword)} edge="end">
                    {showRevokePassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRevokeAll(false)} disabled={loadingAction}>
            Hủy
          </Button>
          <Button onClick={handleRevokeAll} variant="contained" color="error" disabled={loadingAction || !revokePassword}>
            Đăng xuất tất cả
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!message.text}
        autoHideDuration={6000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setMessage({ type: "", text: "" })}
          severity={message.type === "error" ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </ContentSection>
  );
};

export default DevicesPage;

const ContentSection = styled(Box)`
  width: 100%;
  background: transparent;
  @media (max-width: 600px) {
    padding: 20px 16px;
  }
`;

const DevicesList = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DeviceCard = styled(Paper)`
  && {
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

const EmptyState = styled(Box)`
  padding: 60px 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
`;
