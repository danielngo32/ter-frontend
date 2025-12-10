import React from 'react';
import { Modal, Button, Typography, Space, Select, Upload, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ImportInventoryModal = ({
  open,
  onClose,
  onDownloadSample,
  onImport,
  loading,
}) => {
  const { t } = useTranslation('product');
  const [file, setFile] = React.useState(null);
  const [applyTo, setApplyTo] = React.useState('mixed');
  const [mode, setMode] = React.useState('set');

  const beforeUpload = (f) => {
    const valid =
      f.type === 'text/csv' ||
      f.type === 'application/vnd.ms-excel' ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.name.endsWith('.csv') ||
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls');
    if (!valid) {
      message.error(t('inventoryImport.invalidType'));
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    return false;
  };

  const handleImportClick = async () => {
    if (!file) {
      message.error(t('inventoryImport.noFile'));
      return;
    }
    await onImport(file, { applyTo, mode });
    setFile(null);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        setFile(null);
        onClose();
      }}
      title={t('inventoryImport.title')}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={onDownloadSample}>
          {t('inventoryImport.actions.downloadSample')}
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          onClick={handleImportClick}
        >
          {t('inventoryImport.actions.start')}
        </Button>,
      ]}
      width={700}
      zIndex={3001}
      maskClosable={false}
      getContainer={false}
      style={{ top: '8vh' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Typography.Text strong>{t('inventoryImport.mode.label')}</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Select
              value={mode}
              onChange={setMode}
              options={[
                { value: 'set', label: t('inventoryImport.mode.set') },
                { value: 'increment', label: t('inventoryImport.mode.increment') },
                { value: 'decrement', label: t('inventoryImport.mode.decrement') },
              ]}
              style={{ width: 220 }}
            />
          </div>
        </div>

        <div>
          <Typography.Text strong>{t('inventoryImport.applyTo.label')}</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Select
              value={applyTo}
              onChange={setApplyTo}
              options={[
                { value: 'mixed', label: t('inventoryImport.applyTo.mixed') },
                { value: 'base', label: t('inventoryImport.applyTo.base') },
                { value: 'variant', label: t('inventoryImport.applyTo.variant') },
              ]}
              style={{ width: 280 }}
            />
          </div>
        </div>

        <div>
          <Typography.Text strong>{t('inventoryImport.file.label')}</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Upload beforeUpload={beforeUpload} maxCount={1} fileList={file ? [file] : []} onRemove={() => setFile(null)}>
              <Button icon={<UploadOutlined />}>{t('inventoryImport.file.choose')}</Button>
            </Upload>
            {file && (
              <Typography.Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                {file.name}
              </Typography.Text>
            )}
          </div>
        </div>

        <div>
          <Typography.Text type="secondary">
            {t('inventoryImport.note')}
          </Typography.Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ImportInventoryModal;

