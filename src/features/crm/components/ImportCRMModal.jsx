import React, { useRef } from 'react';
import { Modal, Button, Typography, Row, Col, Space } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ImportCRMModal = ({
  open,
  onClose,
  onStartImport,
  file,
  setFile,
  mode,
  setMode,
  duplicateContactAction,
  setDuplicateContactAction,
  downloading,
  onDownloadSample,
  t,
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isAllowed = ['.csv', '.xlsx', '.xls'].some((ext) => selectedFile.name.toLowerCase().endsWith(ext));
      if (!isAllowed) {
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Modal
      title={t('import.title')}
      open={open}
      onCancel={() => {
        onClose();
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={onDownloadSample} loading={downloading}>
          {t('import.downloadSample')}
        </Button>,
        <Button key="select" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
          {file ? file.name : t('import.chooseFile')}
        </Button>,
        <Button key="cancel" onClick={() => {
          onClose();
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}>
          {t('actions.cancel')}
        </Button>,
        <Button key="import" type="primary" onClick={onStartImport} disabled={!file}>
          {t('import.start')}
        </Button>,
      ]}
      width={700}
      zIndex={2000}
      style={{ top: '7vh' }}
      maskClosable={false}
      destroyOnClose
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('import.guide.title')}</Typography.Title>
        <ol style={{ paddingLeft: 20, marginTop: 4, lineHeight: '1.6', marginBottom: 0 }}>
          <li>{t('import.guide.step1')}</li>
          <li>{t('import.guide.step2')}</li>
          <li>{t('import.guide.step3')}</li>
          <li>{t('import.guide.step4')}</li>
        </ol>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5}>{t('import.options.mode.title')}</Typography.Title>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="create"
                  checked={mode === 'create'}
                  onChange={(e) => setMode(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {t('import.modeCreate')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="upsert"
                  checked={mode === 'upsert'}
                  onChange={(e) => setMode(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {t('import.modeUpsert')}
              </label>
            </Space>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5}>{t('import.options.duplicateContact.title')}</Typography.Title>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="stop"
                  checked={duplicateContactAction === 'stop'}
                  onChange={(e) => setDuplicateContactAction(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {t('import.optionStop')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="skip"
                  checked={duplicateContactAction === 'skip'}
                  onChange={(e) => setDuplicateContactAction(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {t('import.optionSkip')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="upsert"
                  checked={duplicateContactAction === 'upsert'}
                  onChange={(e) => setDuplicateContactAction(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {t('import.optionUpsert')}
              </label>
            </Space>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default ImportCRMModal;
