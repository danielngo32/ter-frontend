import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Skeleton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useProfileLayout } from "../../../layouts/ProifleLayout";
import { profileService } from "../profile.service";
import { QRCodeSVG } from "qrcode.react";

const SecurityPage = () => {
  const { t } = useTranslation("common");
  const { setHeaderTitle, setHeaderSubtitle } = useProfileLayout();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setHeaderTitle(t("profile.security"));
    setHeaderSubtitle("Quản lý mật khẩu và bảo mật tài khoản");
    return () => {
      setHeaderTitle("");
      setHeaderSubtitle("");
    };
  }, [t, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
        setTwoFactorEnabled(data?.security?.twoFactorEnabled || false);
      } catch (error) {
        setMessage({ type: "error", text: "Không thể tải thông tin bảo mật" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSetup2FA = async () => {
    setLoadingAction(true);
    try {
      const data = await profileService.setup2FA();
      setOtpauthUrl(data.data?.otpauthUrl || "");
      setSecretKey(data.data?.secretKey || "");
      setShow2FASetup(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Không thể thiết lập 2FA",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: "error", text: "Mã xác thực phải có 6 chữ số" });
      return;
    }
    setLoadingAction(true);
    try {
      const data = await profileService.verifyAndEnable2FA(verificationCode);
      setRecoveryCodes(data.data?.recoveryCodes || []);
      setShowRecoveryCodes(true);
      setShow2FASetup(false);
      setTwoFactorEnabled(true);
      setVerificationCode("");
      setMessage({ type: "success", text: "Bật xác thực 2 bước thành công" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Mã xác thực không đúng",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setMessage({ type: "error", text: "Vui lòng nhập mật khẩu" });
      return;
    }
    setLoadingAction(true);
    try {
      await profileService.disable2FA(disablePassword);
      setTwoFactorEnabled(false);
      setShowDisable2FA(false);
      setDisablePassword("");
      setMessage({ type: "success", text: "Tắt xác thực 2 bước thành công" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Mật khẩu không đúng",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" });
      return;
    }
    setLoadingAction(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Đổi mật khẩu thất bại",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <ContentSection>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={400} height={24} sx={{ mt: 1, mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </ContentSection>
    );
  }

  return (
    <ContentSection>
      <SecurityCard>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <LockIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Đổi mật khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cập nhật mật khẩu của bạn để bảo vệ tài khoản
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setShowChangePassword(true)}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Đổi mật khẩu
        </Button>
      </SecurityCard>

      <SecurityCard>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <SecurityIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Xác thực 2 bước (2FA)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {twoFactorEnabled
                ? "Xác thực 2 bước đã được bật"
                : "Thêm lớp bảo mật bổ sung cho tài khoản của bạn"}
            </Typography>
          </Box>
        </Box>
        {twoFactorEnabled ? (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDisable2FA(true)}
            >
              Tắt 2FA
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={handleSetup2FA}
            disabled={loadingAction}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Bật 2FA
          </Button>
        )}
      </SecurityCard>

      <Dialog open={show2FASetup} onClose={() => !loadingAction && setShow2FASetup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thiết lập xác thực 2 bước</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy, v.v.)
            </Typography>
            {otpauthUrl && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <QRCodeSVG value={otpauthUrl} size={200} />
              </Box>
            )}
            {secretKey && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Hoặc nhập mã thủ công:
                </Typography>
                <TextField
                  value={secretKey}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}
            <TextField
              label="Mã xác thực 6 chữ số"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              fullWidth
              inputProps={{ maxLength: 6 }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShow2FASetup(false)} disabled={loadingAction}>
            Hủy
          </Button>
          <Button onClick={handleVerify2FA} variant="contained" disabled={loadingAction || verificationCode.length !== 6}>
            Xác thực
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showRecoveryCodes} onClose={() => setShowRecoveryCodes(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mã khôi phục</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Lưu các mã này ở nơi an toàn. Bạn sẽ không thể xem lại chúng.
          </Alert>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
            {recoveryCodes.map((code, index) => (
              <TextField
                key={index}
                value={code}
                InputProps={{
                  readOnly: true,
                }}
                size="small"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecoveryCodes(false)} variant="contained">
            Đã lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDisable2FA} onClose={() => !loadingAction && setShowDisable2FA(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tắt xác thực 2 bước</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn cần nhập mật khẩu để tắt 2FA
          </Alert>
          <TextField
            label="Mật khẩu"
            type={showDisablePassword ? "text" : "password"}
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowDisablePassword(!showDisablePassword)} edge="end">
                    {showDisablePassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisable2FA(false)} disabled={loadingAction}>
            Hủy
          </Button>
          <Button onClick={handleDisable2FA} variant="contained" color="error" disabled={loadingAction || !disablePassword}>
            Tắt 2FA
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showChangePassword} onClose={() => !loadingAction && setShowChangePassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <TextField
            label="Mật khẩu hiện tại"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Mật khẩu mới"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            error={confirmPassword && newPassword !== confirmPassword}
            helperText={confirmPassword && newPassword !== confirmPassword ? "Mật khẩu không khớp" : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangePassword(false)} disabled={loadingAction}>
            Hủy
          </Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={loadingAction}>
            Đổi mật khẩu
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

export default SecurityPage;

const ContentSection = styled(Box)`
  width: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 20px;
  @media (max-width: 600px) {
    padding: 20px 16px;
  }
`;

const SecurityCard = styled(Paper)`
  && {
    padding: 24px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
`;
