import React from 'react';
import { Modal, Button, Typography, Checkbox, Row, Col, Space } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ImportProductsModal = ({
  importConfigModalVisible,
  setImportConfigModalVisible,
  importModalVisible,
  setImportModalVisible,
  setImportResult,
  sheetSelectionModalVisible,
  setSheetSelectionModalVisible,
  selectedFile,
  setSelectedFile,
  sheetNames,
  setSheetNames,
  selectedSheets,
  setSelectedSheets,
  importOptions,
  setImportOptions,
  importResult,
  importLoading,
  fileInputRef,
  handleDownloadSample,
  handleStartImport,
}) => {
  const { t } = useTranslation('product');
  return (
    <>
      <Modal
        title={t('importModal.sheet.title')}
        open={sheetSelectionModalVisible}
        onCancel={() => {
          setSheetSelectionModalVisible(false);
          setSelectedFile(null);
          setSheetNames([]);
          setSelectedSheets([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setSheetSelectionModalVisible(false);
            setSelectedFile(null);
            setSheetNames([]);
            setSelectedSheets([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}>
            {t('importModal.actions.cancel')}
          </Button>,
          <Button key="confirm" type="primary" onClick={() => {
            if (selectedSheets.length === 0) {
              return;
            }
            setSheetSelectionModalVisible(false);
            setImportConfigModalVisible(true);
          }} disabled={selectedSheets.length === 0}>
            {t('importModal.actions.continue')}
          </Button>,
        ]}
        width={500}
        zIndex={3001}
        maskClosable={false}
        getContainer={false}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text>{t('importModal.sheet.description', { count: sheetNames.length })}</Typography.Text>
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          {sheetNames.map((sheetName) => (
            <Checkbox
              key={sheetName}
              checked={selectedSheets.includes(sheetName)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSheets([...selectedSheets, sheetName]);
                } else {
                  setSelectedSheets(selectedSheets.filter(s => s !== sheetName));
                }
              }}
            >
              {sheetName}
            </Checkbox>
          ))}
        </Space>
      </Modal>

      <Modal
        title={t('importModal.config.title')}
        open={importConfigModalVisible}
        onCancel={() => {
          setImportConfigModalVisible(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownloadSample}>
            {t('importModal.actions.downloadSample')}
          </Button>,
          <Button key="select" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
            {selectedFile ? selectedFile.name : t('importModal.actions.chooseFile')}
          </Button>,
          <Button key="cancel" onClick={() => {
            setImportConfigModalVisible(false);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}>
            {t('importModal.actions.cancel')}
          </Button>,
          <Button key="import" type="primary" onClick={handleStartImport} loading={importLoading} disabled={(!selectedFile && !fileInputRef.current?.files?.[0]) || (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) && selectedSheets.length === 0)}>
            {t('importModal.actions.startImport')}
          </Button>,
        ]}
        width={1200}
        zIndex={2000}
        style={{ top: '7vh' }}
        maskClosable={false}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>{t('importModal.guide.title')}</Typography.Title>
          <ol style={{ paddingLeft: 20, marginTop: 4, lineHeight: '1.6', marginBottom: 0 }}>
            <li>{t('importModal.guide.step1')}</li>
            <li>{t('importModal.guide.step2')}</li>
            <li>{t('importModal.guide.step3')}</li>
            <li>{t('importModal.guide.step4')}</li>
            <li>{t('importModal.guide.step5')}</li>
            <li>{t('importModal.guide.step6')}</li>
          </ol>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.duplicateSku.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="stop"
                    checked={importOptions.duplicateSkuAction === 'stop'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.stop')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={importOptions.duplicateSkuAction === 'skip'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.skip')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="replace"
                    checked={importOptions.duplicateSkuAction === 'replace'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.replace')}
                </label>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.duplicateCategory.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="link"
                    checked={importOptions.duplicateCategoryAction === 'link'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateCategoryAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.link')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="create"
                    checked={importOptions.duplicateCategoryAction === 'create'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateCategoryAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.create')}
                </label>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.invalidImageUrl.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={importOptions.invalidImageUrlAction === 'skip'}
                    onChange={(e) => setImportOptions({ ...importOptions, invalidImageUrlAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.invalidImageUrl.skip')}
                </label>
              </Space>
            </div>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.duplicateBarcode.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="stop"
                    checked={importOptions.duplicateBarcodeAction === 'stop'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateBarcodeAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.stop')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={importOptions.duplicateBarcodeAction === 'skip'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateBarcodeAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.skip')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="replace"
                    checked={importOptions.duplicateBarcodeAction === 'replace'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateBarcodeAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.duplicateBarcode.replace')}
                </label>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.duplicateBrand.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="link"
                    checked={importOptions.duplicateBrandAction === 'link'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateBrandAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.link')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="create"
                    checked={importOptions.duplicateBrandAction === 'create'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateBrandAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.create')}
                </label>
              </Space>
            </div>
          </Col>

          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.duplicateVariantSku.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="stop"
                    checked={importOptions.duplicateVariantSkuAction === 'stop'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateVariantSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.stop')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={importOptions.duplicateVariantSkuAction === 'skip'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateVariantSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.skip')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="replace"
                    checked={importOptions.duplicateVariantSkuAction === 'replace'}
                    onChange={(e) => setImportOptions({ ...importOptions, duplicateVariantSkuAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.replace')}
                </label>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={5}>{t('importModal.options.missingRequired.title')}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="stop"
                    checked={importOptions.missingRequiredFieldAction === 'stop'}
                    onChange={(e) => setImportOptions({ ...importOptions, missingRequiredFieldAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.stop')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="skip"
                    checked={importOptions.missingRequiredFieldAction === 'skip'}
                    onChange={(e) => setImportOptions({ ...importOptions, missingRequiredFieldAction: e.target.value })}
                    style={{ marginRight: 8 }}
                  />
                  {t('importModal.options.common.skip')}
                </label>
              </Space>
            </div>
          </Col>
        </Row>
      </Modal>

      <Modal
        title={t('importModal.result.title')}
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportResult(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setImportModalVisible(false);
            setImportResult(null);
          }}>
            {t('importModal.actions.close')}
          </Button>,
        ]}
        width={700}
        zIndex={3001}
        getContainer={false}
      >
        {importResult && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>
                {t('importModal.result.summary.total', { total: importResult.total })} | 
                <span style={{ color: '#52c41a', marginLeft: 8 }}>
                  {t('importModal.result.summary.success', { success: importResult.success })}
                </span>
                <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                  {t('importModal.result.summary.failed', { failed: importResult.failed })}
                </span>
              </Typography.Text>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Typography.Text strong style={{ color: '#ff4d4f' }}>
                  {t('importModal.result.errors.title')}
                </Typography.Text>
                <div
                  style={{
                    maxHeight: 300,
                    overflowY: 'auto',
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: '#fff2f0',
                    border: '1px solid #ffccc7',
                    borderRadius: 4,
                  }}
                >
                  {importResult.errors.map((error, index) => (
                    <div key={index} style={{ marginBottom: 4, fontSize: 13 }}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.products && importResult.products.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Typography.Text strong style={{ color: '#52c41a' }}>
                    {t('importModal.result.products.title', { count: importResult.products.length })}
                </Typography.Text>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 4,
                  }}
                >
                  {importResult.products.map((product, index) => (
                    <div key={index} style={{ marginBottom: 4, fontSize: 13 }}>
                        {product.name} ({product.sku})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImportProductsModal;

