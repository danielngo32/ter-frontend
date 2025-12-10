import React, { useState, useEffect, useRef, useMemo } from "react";
import { message } from "antd";
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
} from "@mui/material";
import {
  Google as GoogleIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
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
  SocialLoginContainer,
  GoogleButton,
  Divider,
  LinkText,
} from "../../../layouts/AuthLayout";
import { authService } from "../auth.service";
import { authValidator } from "../auth.validator";
import { DEFAULT_LOCALE, normalizeLocale } from "../../../utils/locale";
import { buildSubdomainUrl } from "../../../utils/subdomain";
import Captcha from "../../../components/Captcha";

const RegisterPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const routeLocale = normalizeLocale(params.locale);
  const localePrefix = `/${routeLocale || DEFAULT_LOCALE}`;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const prevStepRef = useRef(1);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrengthAnchor, setPasswordStrengthAnchor] = useState(null);
  const [captchaValue, setCaptchaValue] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    captcha: "",
    fullName: "",
    tenantName: "",
    slug: "",
    parentCategory: "",
    businessCategory: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const typingTimeoutRef = useRef(null);
  const slugCheckTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const { t, i18n } = useTranslation("auth");

  const titleText = t("register.title");
  const typingText = titleText || "";
  const subtitleList = useMemo(() => {
    const values = t("register.subtitles", {
      returnObjects: true,
      lng: i18n.language,
    });
    return Array.isArray(values) ? values : [];
  }, [i18n.language, t]);

  const stepTitle = useMemo(
    () => t(`register.steps.step${currentStep}.title`, { lng: i18n.language }),
    [currentStep, i18n.language, t]
  );

  const passwordStrength = useMemo(
    () => ({
    minLength: passwordValue.length >= 6,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
    }),
    [passwordValue]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = 0;
    isDeletingRef.current = false;
    if (!typingText) {
      setDisplayedText("");
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
      
      if (
        !isDeletingRef.current &&
        currentIndexRef.current < typingText.length
      ) {
        setDisplayedText(typingText.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        setShowCursor(true);
        typingTimeoutRef.current = setTimeout(typeText, typingSpeed);
      } else if (
        !isDeletingRef.current &&
        currentIndexRef.current === typingText.length
      ) {
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
        setDisplayedText("");
        typingTimeoutRef.current = setTimeout(() => {
          setShowCursor(true);
          typeText();
        }, 500);
      }
    };
    
    setDisplayedText("");
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
      setCurrentSubtitleIndex(
        (prevIndex) => (prevIndex + 1) % subtitleList.length
      );
    }, 5000);

    return () => clearInterval(carouselInterval);
  }, [subtitleList]);

  useEffect(() => {
    if (currentStep === 3) {
      loadParentCategories().then(() => {
        if (formValues.parentCategory) {
          setSelectedParentId(formValues.parentCategory);
        }
      });
    }
    if (currentStep === 1 && prevStepRef.current > 1) {
      setFormValues((prev) => ({ ...prev, captcha: "" }));
      setCaptchaValue("");
    }
    prevStepRef.current = currentStep;
    
    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
    };
  }, [currentStep, formValues.parentCategory]);

  useEffect(() => {
    if (selectedParentId) {
      loadSubCategories(selectedParentId);
    } else {
      setSubCategories([]);
    }
  }, [selectedParentId]);

  const loadParentCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await authService.getParentBusinessCategories();
      setParentCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error(t("register.messages.categoryLoadError"));
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubCategories = async (parentId) => {
    if (!parentId) {
      setSubCategories([]);
      return;
    }
    setLoadingSubCategories(true);
    try {
      const response = await authService.getSubBusinessCategories(parentId);
      setSubCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error(t("register.messages.categoryLoadError"));
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    try {
      const response = await authService.checkTenantSlug(slug);
      setSlugAvailable(response.available === true);
    } catch (error) {
      if (error.response?.status === 409) {
        setSlugAvailable(false);
      } else {
        setSlugAvailable(null);
      }
    } finally {
      setCheckingSlug(false);
    }
  };

  const generateSlugFromName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTenantNameChange = (e) => {
    const tenantName = e.target.value;
    setFormValues((prev) => ({ ...prev, tenantName }));
    const generatedSlug = generateSlugFromName(tenantName);
    
    if (generatedSlug) {
      setFormValues((prev) => ({ ...prev, slug: generatedSlug }));
      
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
      
      slugCheckTimeoutRef.current = setTimeout(() => {
        if (generatedSlug.length >= 2) {
          checkSlugAvailability(generatedSlug);
        } else {
          setSlugAvailable(null);
        }
      }, 500);
    } else {
      setFormValues((prev) => ({ ...prev, slug: "" }));
      setSlugAvailable(null);
    }
  };

  const generateSlug = async () => {
    if (!formValues.tenantName) {
      message.warning(t("register.messages.slugTaken"));
      return;
    }
    setLoading(true);
    try {
      const response = await authService.generateTenantSlug(
        formValues.tenantName
      );
      setFormValues((prev) => ({ ...prev, slug: response.slug }));
      await checkSlugAvailability(response.slug);
    } catch (error) {
      message.error(
        error.response?.data?.message || t("register.messages.slugCheckError")
      );
    } finally {
      setLoading(false);
    }
  };

  const validateField = async (name, value) => {
    let error = "";
    try {
      if (name === "email") {
        await authValidator.email({}, value);
      } else if (name === "password") {
        await authValidator.password({}, value);
      } else if (name === "fullName") {
        await authValidator.fullName({}, value);
      } else if (name === "tenantName") {
        await authValidator.tenantName({}, value);
      } else if (name === "slug") {
        await authValidator.slug({}, value);
      } else if (name === "parentCategory") {
        if (!value) {
          throw new Error(t("validation.parentCategory.required"));
        }
      } else if (name === "businessCategory") {
        await authValidator.businessCategory({}, value);
      }
    } catch (err) {
      error = err.message || err;
    }
    return error;
  };

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      setPasswordValue(value);
    }
    if (value && value.length > 0) {
      validateField(name, value).then((error) => {
        setFormErrors((prev) => ({ ...prev, [name]: error }));
      });
    } else {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const onStep1Submit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!captchaValue || !captchaValue.trim()) {
      message.error(t("register.messages.captchaInvalid"));
      return;
    }
    
    const inputCaptcha = (formValues.captcha || "").trim();
    const expectedCaptcha = captchaValue.trim();
    
    if (!inputCaptcha || inputCaptcha !== expectedCaptcha) {
      setFormValues((prev) => ({ ...prev, captcha: "" }));
      setCaptchaValue("");
      setFormErrors((prev) => ({ ...prev, captcha: t("register.messages.captchaInvalid") }));
      message.error(t("register.messages.captchaInvalid"));
      return;
    }

    const [emailError, passwordError] = await Promise.all([
      validateField("email", formValues.email),
      validateField("password", formValues.password),
    ]);
    if (emailError || passwordError) {
      setFormErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);
    try {
      await authService.registerStep1({
        email: formValues.email,
        password: formValues.password,
      });
      setIsSubmitted(false);
      setCurrentStep(2);
    } catch (error) {
      let errorMessage = t("register.messages.registerError");
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (
          errorData.message === "Validation failed" &&
          errorData.details &&
          Array.isArray(errorData.details)
        ) {
          const passwordErrors = errorData.details.filter(
            (detail) =>
              detail.toLowerCase().includes("password") ||
              detail.toLowerCase().includes("uppercase") ||
              detail.toLowerCase().includes("lowercase") ||
              detail.toLowerCase().includes("number") ||
              detail.toLowerCase().includes("special") ||
              detail.toLowerCase().includes("length")
          );
          
          if (passwordErrors.length > 0) {
            errorMessage = t("validation.password.invalid");
          } else if (errorData.details.length > 0) {
            errorMessage = errorData.details[0];
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onStep2Submit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    const [fullNameError, tenantNameError, slugError] = await Promise.all([
      validateField("fullName", formValues.fullName),
      validateField("tenantName", formValues.tenantName),
      validateField("slug", formValues.slug),
    ]);
    
    if (fullNameError || tenantNameError || slugError) {
      setFormErrors({ 
        fullName: fullNameError, 
        tenantName: tenantNameError, 
        slug: slugError 
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      await authService.registerStep2({
        email: formValues.email,
        fullName: formValues.fullName,
        tenantName: formValues.tenantName,
        slug: formValues.slug,
      });
      setIsSubmitted(false);
      setCurrentStep(3);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || t("register.messages.registerError");
      if (error.response?.status === 409 || errorMessage.includes("slug")) {
        message.error(t("register.messages.slugTaken"));
      } else {
      message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onStep3Submit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    const [parentCategoryError, businessCategoryError] = await Promise.all([
      validateField("parentCategory", formValues.parentCategory),
      validateField("businessCategory", formValues.businessCategory),
    ]);
    
    if (parentCategoryError || businessCategoryError) {
      setFormErrors({ 
        parentCategory: parentCategoryError, 
        businessCategory: businessCategoryError 
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      await authService.registerStep3({
        email: formValues.email,
        businessCategoryId: formValues.businessCategory,
      });
      setIsSubmitted(false);
      setPendingEmail(formValues.email);
      setCurrentStep(4);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || t("register.messages.registerError");
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1 || currentStep === 4) {
      setSelectedParentId(null);
      setSubCategories([]);
    }
  }, [currentStep]);

  const onStep4Finish = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      message.error(t("register.messages.codeRequired"));
      return;
    }

    setLoading(true);
    try {
      const email = formValues.email || pendingEmail;
      const response = await authService.registerStep4({
        email,
        code: otpValue,
      });
      
      if (!response?.user) {
        message.error(t('register.messages.error'));
        setLoading(false);
        return;
      }

      if (response.subdomainUrl) {
        window.location.href = `${response.subdomainUrl}${localePrefix}/dashboard`;
      } else if (response.slug) {
        const subdomainUrl = buildSubdomainUrl(
          response.slug,
          `${localePrefix}/dashboard`
        );
        window.location.replace(subdomainUrl);
      } else {
      navigate(localePrefix);
      }
    } catch (error) {
      let errorMessage = t("register.messages.verifyError");
      
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (
          backendMessage.includes("Invalid or expired verification code") ||
          backendMessage.includes("Invalid verification code")
        ) {
          errorMessage = t("register.messages.codeInvalid");
        } else if (backendMessage.includes("Verification code expired")) {
          errorMessage = t("register.messages.codeExpired");
        } else if (backendMessage.includes("No pending registration found")) {
          errorMessage = t("register.messages.noPendingRegistration");
        } else {
          errorMessage = backendMessage;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    try {
      await authService.resendRegistrationCode(pendingEmail);
      message.info(t("register.messages.codeResent"));
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || t("register.messages.resendError");
      message.error(errorMessage);
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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setSlugAvailable(null);
      }
    } else {
      navigate(`${localePrefix}/login`);
    }
  };

  const renderPasswordStrength = () => (
    <PasswordStrengthContainer>
      <StrengthItem $valid={passwordStrength.minLength}>
        {passwordStrength.minLength ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: "#52c41a" }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: "#ff4d4f" }} />
        )}
        {t("validation.passwordStrength.minLength")}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.number}>
        {passwordStrength.number ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: "#52c41a" }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: "#ff4d4f" }} />
        )}
        {t("validation.passwordStrength.number")}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.uppercase}>
        {passwordStrength.uppercase ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: "#52c41a" }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: "#ff4d4f" }} />
        )}
        {t("validation.passwordStrength.uppercase")}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.special}>
        {passwordStrength.special ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: "#52c41a" }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: "#ff4d4f" }} />
        )}
        {t("validation.passwordStrength.special")}
      </StrengthItem>
      <StrengthItem $valid={passwordStrength.lowercase}>
        {passwordStrength.lowercase ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: "#52c41a" }} />
        ) : (
          <CancelIcon sx={{ fontSize: 16, color: "#ff4d4f" }} />
        )}
        {t("validation.passwordStrength.lowercase")}
      </StrengthItem>
    </PasswordStrengthContainer>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box component="form" onSubmit={onStep1Submit} sx={{ width: "100%" }}>
            <TextField
              fullWidth
              label={t("register.fields.email")}
              variant="outlined"
                type="email"
              value={formValues.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              error={!!formErrors.email && formValues.email.length > 0}
              helperText={
                formErrors.email && formValues.email.length > 0
                  ? formErrors.email
                  : ""
              }
                autoComplete="email"
              sx={{ mb: 2 }}
            />

            <Box sx={{ position: "relative", mb: 1}}>
              <TextField
                fullWidth
                label={t("register.fields.password")}
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={formValues.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                onFocus={(e) => setPasswordStrengthAnchor(e.currentTarget)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTimeout(() => {
                      setPasswordStrengthAnchor(null);
                    }, 200);
                  }
                }}
                error={!!formErrors.password && (isSubmitted || formValues.password.length > 0)}
                helperText={
                  formErrors.password && (isSubmitted || formValues.password.length > 0)
                    ? formErrors.password
                    : ""
                }
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
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
                  vertical: "bottom",
                  horizontal: "left",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                disableAutoFocus
                disableEnforceFocus
                onMouseDown={(e) => e.preventDefault()}
                PaperProps={{
                  sx: {
                    width: passwordStrengthAnchor
                      ? passwordStrengthAnchor.offsetWidth
                      : "auto",
                    mt: 0.5,
                  },
                }}
              >
                <Box sx={{ p: 2 }} onMouseDown={(e) => e.preventDefault()}>
                  {renderPasswordStrength()}
                </Box>
              </Popover>
            </Box>

            <Box sx={{ mb: 3 }}>
              <CaptchaRow>
                <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', mr: 1 }}>
                  {t("register.fields.captcha")}
                </Typography>
                <CaptchaWrapper>
                  <Captcha
                    value={captchaValue}
                    onChange={(value) => {
                      setCaptchaValue(value);
                    }}
                    onRefresh={() => {
                      setFormValues((prev) => ({ ...prev, captcha: "" }));
                      setCaptchaValue("");
                    }}
                  />
                </CaptchaWrapper>
                <TextField
                  size="small"
                  placeholder={t("register.captcha.inputPlaceholder")}
                  value={formValues.captcha}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 4);
                    setFormValues((prev) => ({ ...prev, captcha: value }));
                  }}
                  sx={{ width: 200, ml: 2 }}
                />
              </CaptchaRow>
            </Box>

            <MuiSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              >
              {t("register.steps.step1.button")}
            </MuiSubmitButton>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={onStep2Submit} sx={{ width: "100%" }}>
            <TextField
              fullWidth
              label={t("register.fields.fullName")}
              variant="outlined"
              value={formValues.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
                error={!!formErrors.fullName && (isSubmitted || formValues.fullName.length > 0)}
                helperText={
                  formErrors.fullName && (isSubmitted || formValues.fullName.length > 0)
                    ? formErrors.fullName
                    : ""
                }
                autoComplete="name"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t("register.fields.tenantName")}
              variant="outlined"
              value={formValues.tenantName}
                onChange={handleTenantNameChange}
               error={
                 !!formErrors.tenantName && (isSubmitted || formValues.tenantName.length > 0)
               }
               helperText={
                 formErrors.tenantName && (isSubmitted || formValues.tenantName.length > 0)
                   ? formErrors.tenantName
                   : ""
               }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label={t("register.fields.slug")}
              variant="outlined"
              value={formValues.slug}
                onChange={(e) => {
                let value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "");
                value = value.replace(/\.ter\.vn$/g, "");
                handleFieldChange("slug", value);
                  
                  if (slugCheckTimeoutRef.current) {
                    clearTimeout(slugCheckTimeoutRef.current);
                  }
                  
                  slugCheckTimeoutRef.current = setTimeout(() => {
                    if (value.length >= 2) {
                      checkSlugAvailability(value);
                    } else {
                      setSlugAvailable(null);
                    }
                  }, 500);
                }}
               error={
                 (!!formErrors.slug && (isSubmitted || formValues.slug.length > 0)) ||
                 slugAvailable === false
               }
               helperText={
                 (formErrors.slug && (isSubmitted || formValues.slug.length > 0)
                   ? formErrors.slug
                   : "") ||
                 (slugAvailable === false
                   ? t("register.messages.slugTaken")
                   : "")
               }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {checkingSlug ? (
                      <CircularProgress size={16} />
                    ) : slugAvailable === true ? (
                      <CheckCircleIcon
                        sx={{ color: "#52c41a", fontSize: 16 }}
                      />
                    ) : slugAvailable === false ? (
                      <CancelIcon sx={{ color: "#ff4d4f", fontSize: 16 }} />
                    ) : null}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      .ter.vn
                    </Typography>
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
                disabled={slugAvailable === false}
              >
              {t("register.steps.step2.button")}
            </MuiSubmitButton>
          </Box>
        );

      case 3:
        return (
          <Box component="form" onSubmit={onStep3Submit} sx={{ width: "100%" }}>
            {loadingCategories ? (
              <Box sx={{ textAlign: "center", padding: "40px" }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="parent-category-select-label">
                    {t("register.fields.parentCategory")}
                  </InputLabel>
                  <Select
                    labelId="parent-category-select-label"
                    id="parent-category-select"
                    value={formValues.parentCategory || ""}
                    label={t("register.fields.parentCategory")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormValues((prev) => ({
                        ...prev,
                        parentCategory: value,
                        businessCategory: "",
                      }));
                      setSelectedParentId(value);
                    }}
                    disabled={loadingCategories}
                    error={!!formErrors.parentCategory}
                  >
                    {parentCategories.map((parent) => (
                      <MenuItem key={parent._id} value={parent._id}>
                        {i18n.language === "vi" ? parent.nameVi : parent.nameEn}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.parentCategory && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.75 }}
                    >
                      {formErrors.parentCategory}
                    </Typography>
                  )}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="business-category-select-label">
                    {t("register.fields.businessCategory")}
                  </InputLabel>
                  <Select
                    labelId="business-category-select-label"
                    id="business-category-select"
                    value={formValues.businessCategory || ""}
                    label={t("register.fields.businessCategory")}
                    onChange={(e) => {
                      setFormValues((prev) => ({
                        ...prev,
                        businessCategory: e.target.value,
                      }));
                    }}
                    disabled={!selectedParentId || loadingSubCategories}
                    error={!!formErrors.businessCategory}
                  >
                    {subCategories.map((sub) => (
                      <MenuItem key={sub._id} value={sub._id}>
                        {i18n.language === "vi" ? sub.nameVi : sub.nameEn}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.businessCategory && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.75 }}
                    >
                      {formErrors.businessCategory}
                    </Typography>
                  )}
                </FormControl>
              </>
            )}

            <MuiSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={
                !formValues.parentCategory ||
                !formValues.businessCategory
              }
              >
              {t("register.steps.step3.button")}
            </MuiSubmitButton>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Box sx={{ textAlign: "center", marginBottom: "32px" }}>
              <Typography
                variant="body1"
                sx={{ fontSize: "16px", color: "#64748b" }}
              >
                {t("register.verify.description", {
                  email: pendingEmail || "",
                })}
              </Typography>
            </Box>

            <OTPContainer>
              {otp.map((value, index) => (
                <OTPInput
                  key={index}
                  id={`otp-${index}`}
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
              onClick={onStep4Finish}
              fullWidth
              size="large"
            >
              {t("register.steps.step4.button")}
            </MuiSubmitButton>

            <FooterLinks sx={{ marginTop: "24px" }}>
              <Typography
                variant="body2"
                sx={{ fontSize: "14px", color: "#666666" }}
              >
                {t("register.verify.resendPrompt")}{" "}
                <Link
                  to="#"
                  onClick={handleResendCode}
                  style={{ color: "#1a237e", fontWeight: 600 }}
                >
                  {t("register.verify.resendLink")}
                </Link>
              </Typography>
            </FooterLinks>
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
        type: "spring",
        stiffness: 300, 
        damping: 30,
        mass: 0.8,
      }}
      style={{ width: "100%", height: "100%" }}
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
                  <Typography>
                    {subtitleList[currentSubtitleIndex] || ""}
                  </Typography>
                </div>
              </StyledSubtitle>
              <IllustrationContainer>
                <svg
                  viewBox="0 0 500 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="grad2"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: "rgba(255, 255, 255, 0.3)",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: "rgba(255, 255, 255, 0.1)",
                          stopOpacity: 1,
                        }}
                      />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="rgba(255, 255, 255, 0.15)"
                  />
                  <circle
                    cx="420"
                    cy="120"
                    r="70"
                    fill="rgba(255, 255, 255, 0.1)"
                  />
                  <polygon
                    points="200,150 250,200 200,250 150,200"
                    fill="rgba(255, 255, 255, 0.2)"
                  />
                  <rect
                    x="120"
                    y="240"
                    width="180"
                    height="100"
                    rx="10"
                    fill="rgba(255, 255, 255, 0.18)"
                  />
                  <rect
                    x="140"
                    y="260"
                    width="140"
                    height="8"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.4)"
                  />
                  <rect
                    x="140"
                    y="280"
                    width="100"
                    height="8"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
                  <rect
                    x="140"
                    y="300"
                    width="120"
                    height="8"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
                  <path
                    d="M300 80 L350 130 L400 80"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 200 L100 250 L150 200"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <rect
                    x="280"
                    y="280"
                    width="140"
                    height="90"
                    rx="8"
                    fill="rgba(255, 255, 255, 0.15)"
                  />
                  <circle
                    cx="160"
                    cy="320"
                    r="15"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
                  <circle
                    cx="190"
                    cy="320"
                    r="15"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
                  <circle
                    cx="220"
                    cy="320"
                    r="15"
                    fill="rgba(255, 255, 255, 0.3)"
                  />
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
            {t("common.actions.back")}
          </MuiBackButton>
        )}

        <FormHeader>
          <FormTitle>{stepTitle}</FormTitle>
        </FormHeader>

        {currentStep === 1 && (
          <>
            <SocialLoginContainer>
              <GoogleButton
                icon={<GoogleIcon />}
                onClick={() => {
                  message.info(
                    t("common.socialComingSoon", {
                      provider: t("register.social.google"),
                    })
                  );
                }}
              >
                {t("register.social.google")}
              </GoogleButton>
            </SocialLoginContainer>

            <Divider>
              <span>{t("register.social.divider")}</span>
            </Divider>
          </>
        )}

        {renderStepContent()}

        {currentStep === 1 && (
          <FooterLinks>
            <FooterText>
              {t("register.footer.haveAccount")}{" "}
              <LinkText to={`${localePrefix}/login`}>
                {t("register.footer.signIn")}
              </LinkText>
            </FooterText>
          </FooterLinks>
        )}
      </AuthLayout>
    </motion.div>
  );
};

export default RegisterPage;

const OTPContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
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
  color: ${(props) => (props.$valid ? "#52c41a" : "#ff4d4f")};

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const CaptchaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  flex-wrap: nowrap;
  overflow: hidden;
`;

const CaptchaWrapper = styled.div`
  margin-left: 10px;
  margin-right: 40px;
  flex-shrink: 0;
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
      background: linear-gradient(
        135deg,
        #283593 0%,
        #3949ab 50%,
        #1a237e 100%
      );
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
