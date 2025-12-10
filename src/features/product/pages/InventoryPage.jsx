import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Input, Button, Space, Select, message, Modal, InputNumber } from 'antd';
import { DownloadOutlined, UploadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';
import InventoryTable from '../components/InventoryTable';
import ImportInventoryModal from '../components/ImportInventoryModal';
import ExportInventoryModal from '../components/ExportInventoryModal';
import InventoryModal from '../components/InventoryModal';

const InventoryPage = () => {
  const { t } = useTranslation('product');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState();
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickRecord, setQuickRecord] = useState(null);
  const [quickMode, setQuickMode] = useState('set');
  const [quickWarehouseId, setQuickWarehouseId] = useState();
  const [quickStock, setQuickStock] = useState(0);
  const [quickLoading, setQuickLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [compactBulkItems, setCompactBulkItems] = useState([]);

  const [exportColumns, setExportColumns] = useState([
    'productName',
    'sku',
    'barcode',
    'variantSku',
    'variantBarcode',
    'warehouseName',
    'warehouseCode',
    'stockOnHand',
    'brandName',
    'categoryName',
    'status',
    'updatedAt',
  ]);
  const [exportFilters, setExportFilters] = useState({
    sku: '',
    variantSku: '',
    barcode: '',
    variantBarcode: '',
    warehouseId: '',
    search: '',
  });

  const columnOptions = [
    { value: 'productId', label: t('inventoryExport.columns.productId') },
    { value: 'productName', label: t('inventoryExport.columns.productName') },
    { value: 'sku', label: t('inventoryExport.columns.sku') },
    { value: 'barcode', label: t('inventoryExport.columns.barcode') },
    { value: 'variantSku', label: t('inventoryExport.columns.variantSku') },
    { value: 'variantBarcode', label: t('inventoryExport.columns.variantBarcode') },
    { value: 'warehouseId', label: t('inventoryExport.columns.warehouseId') },
    { value: 'warehouseName', label: t('inventoryExport.columns.warehouseName') },
    { value: 'warehouseCode', label: t('inventoryExport.columns.warehouseCode') },
    { value: 'stockOnHand', label: t('inventoryExport.columns.stockOnHand') },
    { value: 'brandName', label: t('inventoryExport.columns.brandName') },
    { value: 'categoryName', label: t('inventoryExport.columns.categoryName') },
    { value: 'status', label: t('inventoryExport.columns.status') },
    { value: 'updatedAt', label: t('inventoryExport.columns.updatedAt') },
  ];

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await productService.getWarehouses();
      setWarehouses(res?.data || res || []);
    } catch (error) {
      console.error('Failed to load warehouses', error);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: search || undefined,
        warehouseId: warehouseId || undefined,
      };
      const res = await productService.listInventory(params);
      const items = res.items || res.data || res || [];
      const total = res.pagination?.total || res.total || items.length;
      setData(items);
      setPagination((prev) => ({ ...prev, total }));
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      message.error(t('inventoryPage.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, search, warehouseId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const res = await productService.exportInventory({
        columns: exportColumns,
        ...Object.fromEntries(
          Object.entries(exportFilters).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ),
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error) {
      console.error('Export failed', error);
      message.error(t('inventoryPage.messages.exportError'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (file, opts) => {
    try {
      setImportLoading(true);
      const result = await productService.importInventory(file, opts);
      message.success(t('inventoryPage.messages.importSuccess', { success: result.success, total: result.total }));
      fetchInventory();
      setImportModalOpen(false);
    } catch (error) {
      console.error('Import failed', error);
      const msg = error.response?.data?.message || t('inventoryPage.messages.importError');
      message.error(msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleBulk = async (payload) => {
    try {
      setBulkLoading(true);
      const result = await productService.bulkInventoryUpdate(payload);
      message.success(t('inventoryPage.messages.bulkSuccess', { success: result.data?.success || result.success }));
      fetchInventory();
      setBulkModalOpen(false);
    } catch (error) {
      console.error('Bulk update failed', error);
      const msg = error.response?.data?.message || t('inventoryPage.messages.bulkError');
      message.error(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkFromSelection = () => {
    if (selectedRows.length < 2) return;
    setCompactBulkItems(selectedRows);
    setBulkModalOpen(true);
  };

  const handleQuickUpdateOpen = (record) => {
    setQuickRecord(record);
    setQuickMode('set');
    setQuickWarehouseId(record.warehouseId || record.warehouseID || record.warehouseCode);
    setQuickStock(record.stockOnHand || 0);
    setQuickModalOpen(true);
  };

  const handleQuickUpdate = async () => {
    if (!quickRecord) return;
    if (!quickWarehouseId) {
      message.error(t('inventoryPage.quickUpdate.validation.warehouse'));
      return;
    }
    setQuickLoading(true);
    try {
      const applyTo = quickRecord.variantSku || quickRecord.variantBarcode ? 'variant' : 'base';
      const payload = {
        mode: quickMode,
        applyTo,
        items: [
          {
            productId: quickRecord.productId,
            sku: quickRecord.sku,
            barcode: quickRecord.barcode,
            variantSku: quickRecord.variantSku,
            variantBarcode: quickRecord.variantBarcode,
            warehouseId: quickWarehouseId,
            stockOnHand: quickStock,
            mode: quickMode,
            applyTo,
          },
        ],
      };
      const result = await productService.bulkInventoryUpdate(payload);
      message.success(t('inventoryPage.messages.bulkSuccess', { success: result.data?.success || result.success }));
      setQuickModalOpen(false);
      setQuickRecord(null);
      fetchInventory();
    } catch (error) {
      console.error('Quick update failed', error);
      const msg = error.response?.data?.message || t('inventoryPage.messages.bulkError');
      message.error(msg);
    } finally {
      setQuickLoading(false);
    }
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('inventoryPage.title')}
          </Typography.Title>
          <Input
            placeholder={t('inventoryPage.searchPlaceholder')}
            allowClear
            style={{ maxWidth: 360, flex: 1 }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
          />
          <Select
            allowClear
            placeholder={t('inventoryPage.warehousePlaceholder')}
            style={{ width: 220 }}
            value={warehouseId}
            onChange={(v) => {
              setWarehouseId(v);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            options={(warehouses || []).map((w) => ({
              value: w._id || w.id,
              label: `${w.name || ''}${w.code ? ` (${w.code})` : ''}`,
            }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<ReloadOutlined />} onClick={fetchInventory}>{t('inventoryPage.actions.refresh')}</Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
            style={{ borderColor: '#1A237E', color: '#1A237E' }}
          >
            {t('inventoryPage.actions.import')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportModalOpen(true)}
            style={{ borderColor: '#1A237E', color: '#1A237E' }}
          >
            {t('inventoryPage.actions.export')}
          </Button>
          {selectedRowKeys.length >= 2 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleBulkFromSelection}
              style={{ background: '#1A237E', borderColor: '#1A237E' }}
            >
              {t('inventoryPage.actions.bulk')}
            </Button>
          )}
        </div>
      </div>

      <InventoryTable
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onUpdate={handleQuickUpdateOpen}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
      />

      <ImportInventoryModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onDownloadSample={productService.downloadInventorySample}
        onImport={handleImport}
        loading={importLoading}
      />

      <ExportInventoryModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        loading={exportLoading}
        onExport={handleExport}
        columns={exportColumns}
        setColumns={setExportColumns}
        columnOptions={columnOptions}
        filters={exportFilters}
        setFilters={setExportFilters}
        warehouseOptions={warehouses}
      />

      <InventoryModal
        open={bulkModalOpen}
        onClose={() => {
          setBulkModalOpen(false);
          setCompactBulkItems([]);
        }}
        onSubmit={handleBulk}
        loading={bulkLoading}
        compact
        presetItems={compactBulkItems}
        warehouses={warehouses}
      />

      <Modal
        open={quickModalOpen}
        title={t('inventoryPage.quickUpdate.title')}
        onCancel={() => {
          setQuickModalOpen(false);
          setQuickRecord(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setQuickModalOpen(false);
            setQuickRecord(null);
          }}>
            {t('inventoryPage.quickUpdate.actions.cancel')}
          </Button>,
          <Button key="save" type="primary" loading={quickLoading} onClick={handleQuickUpdate}>
            {t('inventoryPage.quickUpdate.actions.save')}
          </Button>,
        ]}
        width={480}
        zIndex={3100}
        maskClosable={false}
      >
        {quickRecord && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Typography.Text strong>{quickRecord.productName || '-'}</Typography.Text>
              <div style={{ color: '#888', fontSize: 12 }}>
                {t('inventoryTable.labels.sku')}: {quickRecord.sku || '-'} | {t('inventoryTable.labels.barcode')}: {quickRecord.barcode || '-'}
              </div>
              {quickRecord.variantSku || quickRecord.variantBarcode ? (
                <div style={{ color: '#888', fontSize: 12 }}>
                  {t('inventoryTable.columns.variant')}: {quickRecord.variantSku || '-'} | {t('inventoryTable.labels.barcode')}: {quickRecord.variantBarcode || '-'}
                </div>
              ) : null}
              <div style={{ color: '#888', fontSize: 12 }}>
                {t('inventoryPage.quickUpdate.currentWarehouse')}: {quickRecord.warehouseName || '-'} {quickRecord.warehouseCode ? `(${quickRecord.warehouseCode})` : ''}
              </div>
            </div>

            <div>
              <Typography.Text strong>{t('inventoryPage.quickUpdate.fields.mode')}</Typography.Text>
              <Select
                value={quickMode}
                onChange={setQuickMode}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: 'set', label: t('inventoryBulk.options.mode.set') },
                  { value: 'increment', label: t('inventoryBulk.options.mode.increment') },
                  { value: 'decrement', label: t('inventoryBulk.options.mode.decrement') },
                ]}
              />
            </div>

            <div>
              <Typography.Text strong>{t('inventoryPage.quickUpdate.fields.warehouse')}</Typography.Text>
              <Select
                value={quickWarehouseId}
                onChange={setQuickWarehouseId}
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
              <Typography.Text strong>{t('inventoryPage.quickUpdate.fields.stock')}</Typography.Text>
              <InputNumber
                min={0}
                style={{ width: '100%', marginTop: 8 }}
                value={quickStock}
                onChange={(val) => setQuickStock(val || 0)}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;

