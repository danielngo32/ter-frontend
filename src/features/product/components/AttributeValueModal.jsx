import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Alert, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';

const AttributeValueModal = ({ open, onClose, onSuccess, attributeId = null, attributeValueId = null, onDelete }) => {
  const { t } = useTranslation('product');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    attributeId: attributeId || '',
    value: '',
  });

  const isEditMode = !!attributeValueId;

  useEffect(() => {
    if (open && attributeValueId) {
      fetchAttributeValue();
    } else if (open) {
      fetchAttributes();
      if (attributeId) {
        setFormData(prev => ({ ...prev, attributeId }));
      } else {
        setFormData({ attributeId: '', value: '' });
      }
      setErrors({});
    }
  }, [open, attributeId, attributeValueId]);

  const fetchAttributeValue = async () => {
    try {
      setLoading(true);
      const value = await productService.getAttributeValueById(attributeValueId);
      if (value) {
        setFormData({ 
          attributeId: value.attributeId?._id || value.attributeId || attributeId || '',
          value: value.value || '' 
        });
      }
      await fetchAttributes();
    } catch (error) {
      console.error('Failed to fetch attribute value:', error);
      setErrors({
        submit: error.response?.data?.message || 'Không thể tải thông tin giá trị',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      setLoadingAttributes(true);
      const data = await productService.listAttributes();
      setAttributes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoadingAttributes(false);
    }
  };

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
    if (!formData.attributeId) {
      newErrors.attributeId = t('attributeValue.create.errors.attributeRequired') || 'Thuộc tính là bắt buộc';
    }
    if (!formData.value.trim()) {
      newErrors.value = t('attributeValue.create.errors.valueRequired') || 'Giá trị là bắt buộc';
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
        attributeId: formData.attributeId,
        value: formData.value.trim(),
      };

      if (isEditMode) {
        const updatedValue = await productService.updateAttributeValue(attributeValueId, payload);
        onSuccess?.(updatedValue);
      } else {
        const newValue = await productService.createAttributeValue(payload);
        onSuccess?.(newValue);
      }
      handleClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} attribute value:`, error);
      let errorMessage = error.response?.data?.message || (isEditMode ? t('attributeValue.create.errors.submitError') || 'Không thể cập nhật giá trị' : t('attributeValue.create.errors.submitError') || 'Không thể tạo giá trị');
      
      if (error.response?.data?.message?.includes('already exists') || error.response?.status === 400) {
        errorMessage = t('attributeValue.create.errors.duplicate') || 'Giá trị thuộc tính đã tồn tại cho thuộc tính này';
      }
      
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await productService.deleteAttributeValue(attributeValueId);
      onDelete?.(attributeValueId);
      handleClose();
    } catch (error) {
      console.error('Failed to delete attribute value:', error);
      setErrors({
        submit: error.response?.data?.message || 'Không thể xóa giá trị',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !deleting) {
      setFormData({
        attributeId: attributeId || '',
        value: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={isEditMode ? (t('attributeValue.edit.title') || 'Chỉnh sửa giá trị thuộc tính') : (t('attributeValue.create.title') || 'Tạo giá trị thuộc tính')}
      okText={t('attributeValue.create.actions.save') || 'Lưu'}
      cancelText={t('attributeValue.create.actions.cancel') || 'Hủy'}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      zIndex={2100}
      getContainer={() => document.body}
      bodyStyle={{ paddingTop: 20 }}
      footer={[
        ...(isEditMode ? [
          <Popconfirm
            key="delete"
            title={t('attributeValue.delete.title') || 'Xóa giá trị thuộc tính?'}
            description={t('attributeValue.delete.description') || 'Bạn có chắc chắn muốn xóa giá trị này không?'}
            onConfirm={handleDelete}
            okText={t('attributeValue.delete.confirm') || 'Xóa'}
            cancelText={t('attributeValue.delete.cancel') || 'Hủy'}
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting} disabled={loading}>
              {t('attributeValue.delete.confirm') || 'Xóa'}
            </Button>
          </Popconfirm>
        ] : []),
        <Button key="cancel" onClick={handleClose} disabled={loading || deleting}>
          {t('attributeValue.create.actions.cancel') || 'Hủy'}
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading} disabled={deleting}>
          {t('attributeValue.create.actions.save') || 'Lưu'}
        </Button>,
      ]}
    >
      {errors.submit && (
        <Alert type="error" message={errors.submit} showIcon style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical">
        <Form.Item
          label={t('attributeValue.create.fields.attribute') || 'Thuộc tính'}
          required
          validateStatus={errors.attributeId ? 'error' : ''}
          help={errors.attributeId}
        >
          <Select
            value={formData.attributeId || undefined}
            onChange={(value) => handleChange('attributeId', value)}
            placeholder={t('attributeValue.create.fields.attributePlaceholder') || 'Chọn thuộc tính'}
            loading={loadingAttributes}
            disabled={!!attributeId || isEditMode}
            options={attributes.map(a => ({ label: a.name, value: a._id }))}
          />
        </Form.Item>

        <Form.Item
          label={t('attributeValue.create.fields.value') || 'Giá trị'}
          required
          validateStatus={errors.value ? 'error' : ''}
          help={errors.value}
        >
          <Input
            value={formData.value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder={t('attributeValue.create.fields.valuePlaceholder') || 'Nhập giá trị'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AttributeValueModal;

