import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Alert, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';

const AttributeModal = ({ open, onClose, onSuccess, attributeId = null, onDelete }) => {
  const { t } = useTranslation('product');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
  });

  const isEditMode = !!attributeId;

  useEffect(() => {
    if (open && attributeId) {
      fetchAttribute();
    } else if (open && !attributeId) {
      setFormData({ name: '' });
      setErrors({});
    }
  }, [open, attributeId]);

  const fetchAttribute = async () => {
    try {
      setLoading(true);
      const attribute = await productService.getAttributeById(attributeId);
      if (attribute) {
        setFormData({ name: attribute.name || '' });
      }
    } catch (error) {
      console.error('Failed to fetch attribute:', error);
      setErrors({
        submit: error.response?.data?.message || 'Không thể tải thông tin thuộc tính',
      });
    } finally {
      setLoading(false);
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
    if (!formData.name.trim()) {
      newErrors.name = t('attribute.create.errors.nameRequired') || 'Tên thuộc tính là bắt buộc';
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

      if (isEditMode) {
        const updatedAttribute = await productService.updateAttribute(attributeId, payload);
        onSuccess?.(updatedAttribute);
      } else {
        const newAttribute = await productService.createAttribute(payload);
        onSuccess?.(newAttribute);
      }
      handleClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} attribute:`, error);
      let errorMessage = error.response?.data?.message || (isEditMode ? t('attribute.create.errors.submitError') || 'Không thể cập nhật thuộc tính' : t('attribute.create.errors.submitError') || 'Không thể tạo thuộc tính');
      
      if (error.response?.data?.message?.includes('already exists') || error.response?.status === 400) {
        errorMessage = t('attribute.create.errors.duplicate') || 'Tên thuộc tính đã tồn tại';
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
      await productService.deleteAttribute(attributeId);
      onDelete?.(attributeId);
      handleClose();
    } catch (error) {
      console.error('Failed to delete attribute:', error);
      setErrors({
        submit: error.response?.data?.message || 'Không thể xóa thuộc tính',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !deleting) {
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
      title={isEditMode ? (t('attribute.edit.title') || 'Chỉnh sửa thuộc tính') : (t('attribute.create.title') || 'Tạo thuộc tính')}
      okText={t('attribute.create.actions.save') || 'Lưu'}
      cancelText={t('attribute.create.actions.cancel') || 'Hủy'}
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
            title={t('attribute.delete.title') || 'Xóa thuộc tính?'}
            description={t('attribute.delete.description') || 'Bạn có chắc chắn muốn xóa thuộc tính này không?'}
            onConfirm={handleDelete}
            okText={t('attribute.delete.confirm') || 'Xóa'}
            cancelText={t('attribute.delete.cancel') || 'Hủy'}
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting} disabled={loading}>
              {t('attribute.delete.confirm') || 'Xóa'}
            </Button>
          </Popconfirm>
        ] : []),
        <Button key="cancel" onClick={handleClose} disabled={loading || deleting}>
          {t('attribute.create.actions.cancel') || 'Hủy'}
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading} disabled={deleting}>
          {t('attribute.create.actions.save') || 'Lưu'}
        </Button>,
      ]}
    >
      {errors.submit && (
        <Alert type="error" message={errors.submit} showIcon style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical">
        <Form.Item
          label={t('attribute.create.fields.name') || 'Tên thuộc tính'}
          required
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name}
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('attribute.create.fields.namePlaceholder') || 'Nhập tên thuộc tính'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AttributeModal;

