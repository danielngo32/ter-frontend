import React from 'react';
import { Modal, Button, Typography, Select, Space, Row, Col } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';

const ExportCRMModal = ({
  open,
  loading,
  exportColumns,
  setExportColumns,
  exportColumnOptions,
  exportFilters,
  addExportFilter,
  updateExportFilter,
  removeExportFilter,
  filterFieldOptions,
  filterOperatorOptions,
  getValueSelectProps,
  onClose,
  onExport,
  t,
}) => {
  return (
    <Modal
      title={t('exportModal.title')}
      open={open}
      onCancel={onClose}
      width={900}
      zIndex={3001}
      maskClosable={false}
      getContainer={false}
      style={{ top: '7vh' }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('exportModal.actions.cancel')}
        </Button>,
        <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={onExport} loading={loading}>
          {t('exportModal.actions.export')}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%', paddingTop: 25, paddingBottom: 25}} size="large">
        <div>
          <Typography.Text strong>{t('exportModal.columns.title')}</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%', marginTop: 8 }}
            placeholder={t('exportModal.columns.placeholder')}
            value={exportColumns}
            onChange={(vals) => setExportColumns(vals)}
            options={exportColumnOptions}
            maxTagCount="responsive"
          />
          <Space style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => setExportColumns(exportColumnOptions.map(o => o.value))}>
              {t('exportModal.columns.selectAll')}
            </Button>
            <Button size="small" onClick={() => setExportColumns([])}>
              {t('exportModal.columns.clear')}
            </Button>
          </Space>
        </div>

        <div>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>{t('exportModal.filters.title')}</Typography.Text>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addExportFilter}>
              {t('exportModal.filters.add')}
            </Button>
          </Space>

          {exportFilters.length === 0 && (
            <Typography.Text type="secondary" style={{ marginTop: 8 }}>
              {t('exportModal.filters.empty')}
            </Typography.Text>
          )}

          <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size="middle">
            {exportFilters.map((filter, index) => (
              <Row key={index} gutter={12} align="middle">
                <Col span={4}>
                  {index === 0 ? (
                    <Typography.Text type="secondary">{t('exportModal.filters.where')}</Typography.Text>
                  ) : (
                    <Select
                      value={filter.joiner || 'and'}
                      onChange={(val) => updateExportFilter(index, 'joiner', val)}
                      options={[
                        { value: 'and', label: t('exportModal.filters.joiner.and') },
                        { value: 'or', label: t('exportModal.filters.joiner.or') },
                      ]}
                      style={{ width: '100%' }}
                    />
                  )}
                </Col>
                <Col span={6}>
                  <Select
                    value={filter.field}
                    onChange={(val) => updateExportFilter(index, 'field', val)}
                    options={filterFieldOptions}
                    placeholder={t('exportModal.filters.fieldPlaceholder')}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={5}>
                  <Select
                    value={filter.operator}
                    onChange={(val) => updateExportFilter(index, 'operator', val)}
                    options={filterOperatorOptions}
                    placeholder={t('exportModal.filters.operatorPlaceholder')}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={7}>
                  <Select
                    {...getValueSelectProps(filter.field)}
                    value={filter.value}
                    onChange={(val) => updateExportFilter(index, 'value', val)}
                    style={{ width: '100%' }}
                    placeholder={t('exportModal.filters.valuePlaceholder')}
                  />
                </Col>
                <Col span={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button danger type="text" onClick={() => removeExportFilter(index)}>
                    {t('exportModal.filters.remove')}
                  </Button>
                </Col>
              </Row>
            ))}
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default ExportCRMModal;

