import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Avatar,
  Skeleton,
} from "@mui/material";
import {
  CameraAlt as CameraAltIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { profileService } from "../profile.service";
import { systemApi } from "../../../api/system.api";

const InformationPage = () => {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    addressLine: "",
    wardName: "",
    provinceName: "",
    provinceCode: "",
    wardCode: "",
    avatarUrl: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError("");
      try {
        const data = await profileService.getProfile();
        if (mounted) {
          setProfile(data);
          setFormValues({
            fullName: data?.fullName || "",
            email: data?.email || "",
            phoneNumber: data?.phoneNumber || "",
            gender: data?.gender || "",
            dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
            addressLine: data?.address?.addressLine || "",
            wardName: data?.address?.wardName || "",
            provinceName: data?.address?.provinceName || "",
            provinceCode: data?.address?.provinceCode || "",
            wardCode: data?.address?.wardCode || "",
            avatarUrl: data?.avatarUrl || "",
          });
          setAvatarPreview(data?.avatarUrl || "");
        }
      } catch (error) {
        if (mounted) {
          setProfileError(
            t("profile.messages.fetchError") || "Không thể tải thông tin hồ sơ"
          );
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [t]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await systemApi.getProvinces();
        setProvinces(data.data || []);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (formValues.provinceCode) {
      const fetchWards = async () => {
        setLoadingWards(true);
        try {
          const data = await systemApi.getWards(formValues.provinceCode);
          setWards(data.data || []);
        } catch (error) {
          console.error("Failed to fetch wards:", error);
          setWards([]);
        } finally {
          setLoadingWards(false);
        }
      };
      fetchWards();
    } else {
      setWards([]);
      setFormValues((prev) => ({ ...prev, wardCode: "", wardName: "" }));
    }
  }, [formValues.provinceCode]);

  const handleFieldChange = (field, value) => {
    if (field === "provinceCode") {
      const selectedProvince = provinces.find((p) => p.code === value);
      setFormValues((prev) => ({
        ...prev,
        provinceCode: value,
        provinceName: selectedProvince?.name || "",
        wardCode: "",
        wardName: "",
      }));
    } else if (field === "wardCode") {
      const selectedWard = wards.find((w) => w.code === value);
      setFormValues((prev) => ({
        ...prev,
        wardCode: value,
        wardName: selectedWard?.name || "",
      }));
    } else {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAvatarFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setFormValues((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    const payload = {
      fullName: formValues.fullName?.trim(),
      phoneNumber: formValues.phoneNumber?.trim() || null,
      gender: formValues.gender || null,
      dateOfBirth: formValues.dateOfBirth || null,
      avatarUrl: formValues.avatarUrl || null,
      address: {
        addressLine: formValues.addressLine?.trim() || null,
        wardName: formValues.wardName?.trim() || null,
        provinceName: formValues.provinceName?.trim() || null,
        provinceCode: formValues.provinceCode?.trim() || null,
        wardCode: formValues.wardCode?.trim() || null,
      },
    };

    try {
      const updated = await profileService.updateProfile(payload);
      setProfile(updated);
      setSaveMessage(
        t("profile.messages.updateSuccess") || "Cập nhật thành công"
      );
    } catch (error) {
      setSaveError(
        error.response?.data?.message ||
          t("profile.messages.updateError") ||
          "Cập nhật thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <ContentSection>
        <HeaderBlock>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={300} height={24} sx={{ mt: 1 }} />
        </HeaderBlock>
        <SectionGrid>
          <TwoCols>
            <LeftCol>
              <AvatarCard>
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="text" width={150} height={20} />
              </AvatarCard>
            </LeftCol>
            <RightPanel>
              <BlockCard>
                <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
                <RowName>
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                </RowName>
              </BlockCard>
              <BlockCard>
                <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
                <Row>
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                </Row>
              </BlockCard>
              <BlockCard>
                <Skeleton variant="text" width={100} height={24} sx={{ mb: 2 }} />
                <Row>
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                </Row>
              </BlockCard>
            </RightPanel>
          </TwoCols>
          <ActionsRow>
            <Box sx={{ flex: 1 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          </ActionsRow>
        </SectionGrid>
      </ContentSection>
    );
  }

  if (profileError) {
    return (
      <ContentSection>
        <Typography variant="body2" color="error">
          {profileError}
        </Typography>
      </ContentSection>
    );
  }

  return (
      <ContentSection>
        <HeaderBlock>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {t("profile.personalInfo")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý thông tin cá nhân của bạn
          </Typography>
        </HeaderBlock>
        <SectionGrid>
          <TwoCols>
            <LeftCol>
              <AvatarCard>
                <AvatarContainer
                  component="label"
                  onClick={() => document.getElementById("avatar-input")?.click()}
                >
                  <Avatar
                    className="avatar-image"
                    src={avatarPreview || undefined}
                    alt={formValues.fullName || "Avatar"}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 36,
                      bgcolor: "#1a237e",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {formValues.fullName?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <AvatarOverlay className="avatar-overlay">
                    <CameraAltIcon sx={{ fontSize: 32, color: "#ffffff" }} />
                  </AvatarOverlay>
                  <input
                    id="avatar-input"
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) =>
                      handleAvatarFileChange(e.target.files?.[0])
                    }
                  />
                </AvatarContainer>
                <InfoText>
                  {formValues.fullName ||
                    t("common.notAvailable", "Không có tên")}
                </InfoText>
                <InfoSubText>
                  {formValues.email ||
                    t("common.notAvailable", "Không có email")}
                </InfoSubText>
              </AvatarCard>
            </LeftCol>

            <RightPanel>
              <BlockCard>
                <BlockTitle>Họ và tên</BlockTitle>
                <RowName>
                  <FieldItem narrow>
                    <TextField
                      label={t("profile.fields.gender")}
                      select
                      size="normal"
                      variant="outlined"
                      value={formValues.gender}
                      onChange={(e) =>
                        handleFieldChange("gender", e.target.value)
                      }
                      fullWidth
                    >
                      <MenuItem value="">
                        {t("common.notAvailable", "Không chọn")}
                      </MenuItem>
                      <MenuItem value="male">
                        {t("profile.genders.male")}
                      </MenuItem>
                      <MenuItem value="female">
                        {t("profile.genders.female")}
                      </MenuItem>
                    </TextField>
                  </FieldItem>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.fullName")}
                      size="normal"
                      variant="outlined"
                      value={formValues.fullName}
                      onChange={(e) =>
                        handleFieldChange("fullName", e.target.value)
                      }
                      fullWidth
                    />
                  </FieldItem>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.dateOfBirth")}
                      size="normal"
                      variant="outlined"
                      type="date"
                      placeholder="dd/mm/yyyy"
                      InputLabelProps={{ shrink: true }}
                      value={formValues.dateOfBirth}
                      onChange={(e) =>
                        handleFieldChange("dateOfBirth", e.target.value)
                      }
                      fullWidth
                    />
                  </FieldItem>
                </RowName>
              </BlockCard>

              <BlockCard>
                <BlockTitle>Liên hệ</BlockTitle>
                <Row>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.email")}
                      size="normal"
                      variant="outlined"
                      value={formValues.email}
                      fullWidth
                      disabled
                    />
                  </FieldItem>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.phoneNumber")}
                      size="normal"
                      variant="outlined"
                      value={formValues.phoneNumber}
                      onChange={(e) =>
                        handleFieldChange("phoneNumber", e.target.value)
                      }
                      fullWidth
                    />
                  </FieldItem>
                </Row>
              </BlockCard>

              <BlockCard>
                <BlockTitle>Địa chỉ</BlockTitle>
                <Row>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.addressProvince")}
                      size="normal"
                      variant="outlined"
                      select
                      value={formValues.provinceCode}
                      onChange={(e) =>
                        handleFieldChange("provinceCode", e.target.value)
                      }
                      fullWidth
                      disabled={loadingProvinces}
                    >
                      <MenuItem value="">
                        {t("common.notAvailable", "Không chọn")}
                      </MenuItem>
                      {provinces.map((province) => (
                        <MenuItem key={province.code} value={province.code}>
                          {province.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FieldItem>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.addressWard")}
                      size="normal"
                      variant="outlined"
                      select
                      value={formValues.wardCode}
                      onChange={(e) =>
                        handleFieldChange("wardCode", e.target.value)
                      }
                      fullWidth
                      disabled={!formValues.provinceCode || loadingWards}
                    >
                      <MenuItem value="">
                        {t("common.notAvailable", "Không chọn")}
                      </MenuItem>
                      {wards.map((ward) => (
                        <MenuItem key={ward.code} value={ward.code}>
                          {ward.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FieldItem>
                  <FieldItem>
                    <TextField
                      label={t("profile.fields.address")}
                      size="normal"
                      variant="outlined"
                      value={formValues.addressLine}
                      onChange={(e) =>
                        handleFieldChange("addressLine", e.target.value)
                      }
                      fullWidth
                    />
                  </FieldItem>
                </Row>
              </BlockCard>
            </RightPanel>
          </TwoCols>

          <ActionsRow>
            {saveError && (
              <Typography variant="body2" color="error">
                {saveError}
              </Typography>
            )}
            {saveMessage && (
              <Typography variant="body2" color="success.main">
                {saveMessage}
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? t("common.saving", "Đang lưu...")
                : t("profile.actions.save") || "Lưu"}
            </Button>
          </ActionsRow>
        </SectionGrid>
      </ContentSection>
  );
};

export default InformationPage;

const TwoCols = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 15px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const RightPanel = styled(Paper)`
  && {
    padding: 0;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
`;

const AvatarCard = styled(Paper)`
  && {
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    height: 100%;
    min-height: 100%;
  }
`;

const AvatarContainer = styled(Box)`
  position: relative;
  cursor: pointer;
  display: inline-block;
  
  &:hover {
    .avatar-overlay {
      opacity: 1;
    }
    
    .MuiAvatar-root {
      opacity: 0.5;
    }
  }
`;

const AvatarOverlay = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
`;

const InfoText = styled(Typography)`
  && {
    font-weight: 700;
    font-size: 16px;
    color: #111827;
    text-align: center;
    width: 100%;
  }
`;

const InfoSubText = styled(Typography)`
  && {
    font-weight: 500;
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    width: 100%;
  }
`;

const BlockCard = styled(Paper)`
  && {
    padding: 18px 22px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
`;

const BlockTitle = styled(Typography)`
  && {
    font-weight: 600;
    font-size: 15px;
    color: #111827;
    margin-bottom: 15px;
  }
`;

const Row = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
`;

const FieldItem = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RowName = styled(Box)`
  display: grid;
  grid-template-columns: 140px 1fr 220px;
  gap: 10px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ContentSection = styled(Box)`
  width: 100%;
  background: transparent;
  @media (max-width: 600px) {
    padding: 20px 16px;
  }
`;

const HeaderBlock = styled(Box)`
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 10px;
`;

const SectionGrid = styled(Box)`
  background: #f9fafb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ActionsRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
`;

