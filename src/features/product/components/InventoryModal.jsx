import React, { useEffect } from 'react';
import { Modal, Button, Form, Input, Select, Space, InputNumber, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const InventoryModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  compact = false,
  presetItems = [],
  warehouses = [],
}) => {
  const { t } = useTranslation('product');
  const [form] = Form.useForm();

  useEffect(() => {
    if (compact && presetItems && presetItems.length > 0) {
      form.setFieldsValue({
        compactMode: 'set',
        compactWarehouse: presetItems[0]?.warehouseId || presetItems[0]?.warehouseCode || undefined,
        compactStock: 0,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [compact, presetItems, form, open]);

  const handleFinish = async (values) => {
    if (compact) {
      if (!presetItems || presetItems.length === 0) {
        message.error(t('inventoryBulk.errors.noItem'));
        return;
      }
      if (!values.compactWarehouse) {
        message.error(t('inventoryPage.quickUpdate.validation.warehouse'));
        return;
      }
      const items = (presetItems || []).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        barcode: item.barcode,
        variantSku: item.variantSku,
        variantBarcode: item.variantBarcode,
        warehouseId: values.compactWarehouse,
        stockOnHand: values.compactStock,
        mode: values.compactMode,
        applyTo: item.variantSku || item.variantBarcode ? 'variant' : 'base',
      }));
      await onSubmit({
        mode: values.compactMode,
        applyTo: 'mixed',
        items,
      });
      form.resetFields();
      return;
    }

    if (!values.items || values.items.length === 0) {
      message.error(t('inventoryBulk.errors.noItem'));
      return;
    }
    await onSubmit({
      mode: values.mode,
      applyTo: values.applyTo,
      items: values.items,
    });
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={compact ? t('inventoryPage.quickUpdate.title') : t('inventoryBulk.title')}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      width={900}
      zIndex={3001}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={() => {
          form.resetFields();
          onClose();
        }}>
          {t('inventoryBulk.actions.cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
          {t('inventoryBulk.actions.submit')}
        </Button>,
      ]}
      style={{ top: '6vh' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          mode: 'set',
          applyTo: 'mixed',
          items: [{}],
        }}
        onFinish={handleFinish}
      >
        {compact ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Typography.Text strong>{t('inventoryBulk.fields.mode')}</Typography.Text>
              <Select
                name="compactMode"
                value={form.getFieldValue('compactMode')}
                onChange={(v) => form.setFieldsValue({ compactMode: v })}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: 'set', label: t('inventoryBulk.options.mode.set') },
                  { value: 'increment', label: t('inventoryBulk.options.mode.increment') },
                  { value: 'decrement', label: t('inventoryBulk.options.mode.decrement') },
                ]}
              />
            </div>
            <div>
              <Typography.Text strong>{t('inventoryBulk.fields.warehouse')}</Typography.Text>
              <Select
                value={form.getFieldValue('compactWarehouse')}
                onChange={(v) => form.setFieldsValue({ compactWarehouse: v })}
                style={{ width: '100%', marginTop: 8 }}
                placeholder={t('inventoryPage.quickUpdate.placeholders.warehouse')}
                options={(warehouses || []).map((w) => ({
                  value: w._id || w.id || w.code,
                  label: `${w.name || ''}${w.code ? ` (${w.code})` : ''}`,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </div>
            <div>
              <Typography.Text strong>{t('inventoryBulk.fields.stock')}</Typography.Text>
              <InputNumber
                min={0}
                style={{ width: '100%', marginTop: 8 }}
                value={form.getFieldValue('compactStock')}
                onChange={(v) => form.setFieldsValue({ compactStock: v })}
              />
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: 6, padding: 8 }}>
              {(presetItems || []).map((item, idx) => (
                <div key={idx} style={{ padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
                  <Typography.Text strong>{item.productName || '-'}</Typography.Text>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {t('inventoryTable.labels.sku')}: {item.sku || '-'} | {t('inventoryTable.labels.barcode')}: {item.barcode || '-'}
                  </div>
                  {item.variantSku || item.variantBarcode ? (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {t('inventoryTable.columns.variant')}: {item.variantSku || '-'} | {t('inventoryTable.labels.barcode')}: {item.variantBarcode || '-'}
                    </div>
                  ) : null}
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {t('inventoryPage.quickUpdate.currentWarehouse')}: {item.warehouseName || '-'} {item.warehouseCode ? `(${item.warehouseCode})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </Space>
        ) : (
          <>
            <Space size="middle" style={{ width: '100%', marginBottom: 12 }}>
              <Form.Item name="mode" label={t('inventoryBulk.fields.mode')} style={{ marginBottom: 0 }}>
                <Select
                  style={{ width: 200 }}
                  options={[
                    { value: 'set', label: t('inventoryBulk.options.mode.set') },
                    { value: 'increment', label: t('inventoryBulk.options.mode.increment') },
                    { value: 'decrement', label: t('inventoryBulk.options.mode.decrement') },
                  ]}
                />
              </Form.Item>
              <Form.Item name="applyTo" label={t('inventoryBulk.fields.applyTo')} style={{ marginBottom: 0 }}>
                <Select
                  style={{ width: 220 }}
                  options={[
                    { value: 'mixed', label: t('inventoryBulk.options.applyTo.mixed') },
                    { value: 'base', label: t('inventoryBulk.options.applyTo.base') },
                    { value: 'variant', label: t('inventoryBulk.options.applyTo.variant') },
                  ]}
                />
              </Form.Item>
            </Space>

            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      style={{
                        padding: 12,
                        border: '1px solid #e8e8e8',
                        borderRadius: 6,
                        marginBottom: 12,
                        background: '#fafafa',
                      }}
                    >
                      <Space align="start" wrap style={{ width: '100%' }}>
                        <Form.Item
                          label={t('inventoryBulk.fields.sku')}
                          name={[field.name, 'sku']}
                          fieldKey={[field.fieldKey, 'sku']}
                        >
                          <Input placeholder={t('inventoryBulk.placeholders.sku')} style={{ width: 160 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.barcode')}
                          name={[field.name, 'barcode']}
                          fieldKey={[field.fieldKey, 'barcode']}
                        >
                          <Input placeholder={t('inventoryBulk.placeholders.barcode')} style={{ width: 180 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.variantSku')}
                          name={[field.name, 'variantSku']}
                          fieldKey={[field.fieldKey, 'variantSku']}
                        >
                          <Input placeholder={t('inventoryBulk.placeholders.variantSku')} style={{ width: 160 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.variantBarcode')}
                          name={[field.name, 'variantBarcode']}
                          fieldKey={[field.fieldKey, 'variantBarcode']}
                        >
                          <Input placeholder={t('inventoryBulk.placeholders.variantBarcode')} style={{ width: 180 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.warehouse')}
                          name={[field.name, 'warehouseCode']}
                          fieldKey={[field.fieldKey, 'warehouseCode']}
                          rules={[{ required: true, message: t('inventoryBulk.validation.warehouse') }]}
                        >
                          <Input placeholder={t('inventoryBulk.placeholders.warehouse')} style={{ width: 160 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.stock')}
                          name={[field.name, 'stockOnHand']}
                          fieldKey={[field.fieldKey, 'stockOnHand']}
                          rules={[{ required: true, message: t('inventoryBulk.validation.stock') }]}
                        >
                          <InputNumber min={0} style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.modeRow')}
                          name={[field.name, 'mode']}
                          fieldKey={[field.fieldKey, 'mode']}
                        >
                          <Select
                            allowClear
                            style={{ width: 140 }}
                            options={[
                              { value: 'set', label: t('inventoryBulk.options.mode.set') },
                              { value: 'increment', label: t('inventoryBulk.options.mode.increment') },
                              { value: 'decrement', label: t('inventoryBulk.options.mode.decrement') },
                            ]}
                            placeholder={t('inventoryBulk.placeholders.inherit')}
                          />
                        </Form.Item>
                        <Form.Item
                          label={t('inventoryBulk.fields.applyToRow')}
                          name={[field.name, 'applyTo']}
                          fieldKey={[field.fieldKey, 'applyTo']}
                        >
                          <Select
                            allowClear
                            style={{ width: 150 }}
                            options={[
                              { value: 'mixed', label: t('inventoryBulk.options.applyTo.mixed') },
                              { value: 'base', label: t('inventoryBulk.options.applyTo.base') },
                              { value: 'variant', label: t('inventoryBulk.options.applyTo.variant') },
                            ]}
                            placeholder={t('inventoryBulk.placeholders.inherit')}
                          />
                        </Form.Item>
                        <Button danger type="link" onClick={() => remove(field.name)}>
                          {t('inventoryBulk.actions.remove')}
                        </Button>
                      </Space>
                    </div>
                  ))}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                    {t('inventoryBulk.actions.addRow')}
                  </Button>
                </>
              )}
            </Form.List>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default InventoryModal;

