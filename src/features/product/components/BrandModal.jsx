import React, { useState } from 'react';
import { Modal, Form, Input, Select, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';

const BrandModal = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation('product');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('brand.create.errors.nameRequired');
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      await productService.createBrand(payload);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create brand:', error);
      setErrors({
        submit: error.response?.data?.message || t('brand.create.errors.submitError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={t('brand.create.title')}
      okText={t('brand.create.actions.save')}
      cancelText={t('brand.create.actions.cancel')}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      zIndex={2100}
      getContainer={() => document.body}
      bodyStyle={{ paddingTop: 20 }}
    >
      {errors.submit && (
        <Alert type="error" message={errors.submit} showIcon style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical">
        <Form.Item
          label={t('brand.create.fields.name')}
          required
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name}
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('brand.create.fields.namePlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BrandModal;
