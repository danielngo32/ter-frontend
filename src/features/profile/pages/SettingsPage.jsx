import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Skeleton,
  Button,
  Alert,
  Snackbar,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useProfileLayout } from "../../../layouts/ProifleLayout";
import { profileService } from "../profile.service";

const SettingsPage = () => {
  const { t } = useTranslation("common");
  const { setHeaderTitle, setHeaderSubtitle } = useProfileLayout();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setHeaderTitle(t("profile.settings"));
    setHeaderSubtitle("Cài đặt tùy chọn và tùy chỉnh trải nghiệm của bạn");
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
        setIsOnline(data?.settings?.isOnline ?? true);
      } catch (error) {
        setMessage({ type: "error", text: "Không thể tải cài đặt" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleOnline = async (checked) => {
    setIsOnline(checked);
    setSaving(true);
    try {
      await profileService.updateSettings({ isOnline: checked });
      setMessage({ type: "success", text: "Cập nhật cài đặt thành công" });
    } catch (error) {
      setIsOnline(!checked);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Không thể cập nhật cài đặt",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
  return (
      <ContentSection>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={400} height={24} sx={{ mt: 1, mb: 3 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </ContentSection>
    );
  }

  return (
    <ContentSection>
      <SettingsCard>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Trạng thái trực tuyến
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cho phép người khác thấy bạn đang trực tuyến
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isOnline}
              onChange={(e) => handleToggleOnline(e.target.checked)}
              disabled={saving}
            />
          }
          label={isOnline ? "Đang hiển thị trực tuyến" : "Đang ẩn trạng thái"}
        />
      </SettingsCard>

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

export default SettingsPage;

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

const SettingsCard = styled(Paper)`
  && {
    padding: 24px;
    background: #ffffff;
  border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
`;
