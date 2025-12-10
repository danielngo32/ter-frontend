import React from 'react';
import { Modal, Button, Typography, Select, Space, Row, Col, Input } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ExportInventoryModal = ({
  open,
  loading,
  onClose,
  onExport,
  columns,
  setColumns,
  columnOptions,
  filters,
  setFilters,
  warehouseOptions,
}) => {
  const { t } = useTranslation('product');

  const handleFieldChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('inventoryExport.title')}
      width={720}
      zIndex={3001}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose}>{t('inventoryExport.actions.cancel')}</Button>,
        <Button key="export" type="primary" icon={<DownloadOutlined />} loading={loading} onClick={onExport}>
          {t('inventoryExport.actions.export')}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Typography.Text strong>{t('inventoryExport.columns.title')}</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 8 }}
            placeholder={t('inventoryExport.columns.placeholder')}
            value={columns}
            onChange={setColumns}
            options={columnOptions}
            maxTagCount="responsive"
          />
          <Space style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => setColumns(columnOptions.map(o => o.value))}>{t('inventoryExport.columns.selectAll')}</Button>
            <Button size="small" onClick={() => setColumns([])}>{t('inventoryExport.columns.clear')}</Button>
          </Space>
        </div>

        <div>
          <Typography.Text strong>{t('inventoryExport.filters.title')}</Typography.Text>
          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col span={12}>
              <Input
                placeholder={t('inventoryExport.filters.sku')}
                value={filters.sku || ''}
                onChange={(e) => handleFieldChange('sku', e.target.value)}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder={t('inventoryExport.filters.barcode')}
                value={filters.barcode || ''}
                onChange={(e) => handleFieldChange('barcode', e.target.value)}
              />
            </Col>
            <Col span={12} style={{ marginTop: 8 }}>
              <Input
                placeholder={t('inventoryExport.filters.variantSku')}
                value={filters.variantSku || ''}
                onChange={(e) => handleFieldChange('variantSku', e.target.value)}
              />
            </Col>
            <Col span={12} style={{ marginTop: 8 }}>
              <Input
                placeholder={t('inventoryExport.filters.variantBarcode')}
                value={filters.variantBarcode || ''}
                onChange={(e) => handleFieldChange('variantBarcode', e.target.value)}
              />
            </Col>
            <Col span={12} style={{ marginTop: 8 }}>
              <Select
                allowClear
                placeholder={t('inventoryExport.filters.warehouse')}
                value={filters.warehouseId || undefined}
                onChange={(v) => handleFieldChange('warehouseId', v)}
                style={{ width: '100%' }}
                options={(warehouseOptions || []).map((w) => ({
                  value: w._id || w.id,
                  label: `${w.name || ''}${w.code ? ` (${w.code})` : ''}`,
                }))}
              />
            </Col>
            <Col span={12} style={{ marginTop: 8 }}>
              <Input
                placeholder={t('inventoryExport.filters.search')}
                value={filters.search || ''}
                onChange={(e) => handleFieldChange('search', e.target.value)}
              />
            </Col>
          </Row>
        </div>
      </Space>
    </Modal>
  );
};

export default ExportInventoryModal;

