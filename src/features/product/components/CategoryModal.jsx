import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, TreeSelect, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';

const CategoryModal = ({ open, onClose, onSuccess, parentCategoryId = null }) => {
  const { t } = useTranslation('product');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    parentCategoryId: parentCategoryId || null,
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await productService.listCategories();
      setCategories(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const buildCategoryTreeData = useMemo(() => {
    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), { 
        title: cat.name,
        value: cat._id.toString(),
        key: cat._id.toString(),
        children: []
      });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId.toString());
        if (parent) {
          parent.children.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }, [categories]);

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
      newErrors.name = t('category.create.errors.nameRequired');
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
        parentCategoryId: formData.parentCategoryId || undefined,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      await productService.createCategory(payload);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to create category:', error);
      setErrors({
        submit: error.response?.data?.message || t('category.create.errors.submitError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        parentCategoryId: parentCategoryId || null,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={t('category.create.title')}
      okText={t('category.create.actions.save')}
      cancelText={t('category.create.actions.cancel')}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      zIndex={2100}
      bodyStyle={{ paddingTop: 20 }}
      getContainer={() => document.body}
    >
      {errors.submit && (
        <Alert type="error" message={errors.submit} showIcon style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical">
        <Form.Item
          label={t('category.create.fields.name')}
          required
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name}
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('category.create.fields.namePlaceholder')}
          />
        </Form.Item>

        <Form.Item label={t('category.create.fields.parentCategory') || 'Danh mục cha'}>
          <TreeSelect
            allowClear
            value={formData.parentCategoryId || undefined}
            placeholder={t('category.create.fields.parentCategoryPlaceholder') || 'Chọn danh mục cha (tùy chọn)'}
            treeData={buildCategoryTreeData}
            treeDefaultExpandAll
            onChange={(value) => handleChange('parentCategoryId', value || null)}
            loading={loadingCategories}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryModal;
