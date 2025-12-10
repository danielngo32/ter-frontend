import React from 'react';
import { Table, Typography, Tag, Button } from 'antd';
import { useTranslation } from 'react-i18next';

const InventoryTable = ({
  data,
  loading,
  pagination,
  onPaginationChange,
  onUpdate,
  rowSelection,
}) => {
  const { t } = useTranslation('product');

  const columns = [
    {
      title: t('inventoryTable.columns.product'),
      dataIndex: 'productName',
      key: 'productName',
      width: 220,
      render: (value, record) => (
        <div>
          <Typography.Text strong>{value || '-'}</Typography.Text>
          <div style={{ color: '#888', fontSize: 12 }}>
            {t('inventoryTable.labels.sku')}: {record.sku || '-'} | {t('inventoryTable.labels.barcode')}: {record.barcode || '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('inventoryTable.columns.variant'),
      dataIndex: 'variantSku',
      key: 'variantSku',
      width: 220,
      render: (_, record) => {
        if (record.variantSku || record.variantBarcode) {
          return (
            <div>
              <Typography.Text>{record.variantSku || '-'}</Typography.Text>
              <div style={{ color: '#888', fontSize: 12 }}>
                {t('inventoryTable.labels.barcode')}: {record.variantBarcode || '-'}
              </div>
            </div>
          );
        }
        return <Typography.Text type="secondary">{t('inventoryTable.labels.noVariant')}</Typography.Text>;
      },
    },
    {
      title: t('inventoryTable.columns.warehouse'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text>{record.warehouseName || '-'}</Typography.Text>
          <div style={{ color: '#888', fontSize: 12 }}>
            {record.warehouseCode || ''}
          </div>
        </div>
      ),
    },
    {
      title: t('inventoryTable.columns.stockOnHand'),
      dataIndex: 'stockOnHand',
      key: 'stockOnHand',
      width: 110,
      sorter: (a, b) => (a.stockOnHand || 0) - (b.stockOnHand || 0),
      render: (val) => (val !== undefined && val !== null ? val : 0),
    },
    {
      title: t('inventoryTable.columns.brand'),
      dataIndex: 'brandName',
      key: 'brandName',
      width: 150,
      render: (val) => val || '-',
    },
    {
      title: t('inventoryTable.columns.category'),
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 160,
      render: (val) => val || '-',
    },
    {
      title: t('inventoryTable.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const map = {
          active: { color: 'green', label: t('inventoryTable.status.active') },
          inactive: { color: 'default', label: t('inventoryTable.status.inactive') },
          draft: { color: 'orange', label: t('inventoryTable.status.draft') },
        };
        const info = map[status] || map.active;
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: t('inventoryTable.columns.updatedAt'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      sorter: (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
      render: (val) => {
        if (!val) return '-';
        const date = new Date(val);
        return date.toLocaleString();
      },
    },
    {
      title: t('inventoryTable.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Button type="primary" onClick={() => onUpdate && onUpdate(record)}>
          {t('inventoryTable.actions.update')}
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <style>{`
        .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5 !important;
        }
        .ant-table-tbody > tr.ant-table-row-selected > td {
          background-color: #e6f7ff !important;
        }
        .ant-table-tbody > tr.ant-table-row-selected:hover > td {
          background-color: #bae7ff !important;
        }
      `}</style>
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(row) =>
          `${row.productId || row.sku}-${row.variantSku || 'base'}-${row.warehouseId || 'nowh'}`
        }
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50', '100'],
          showTotal: (total, range) =>
            t('inventoryTable.pagination.total', { from: range[0], to: range[1], total }),
          onChange: (page, pageSize) => onPaginationChange(page, pageSize),
          onShowSizeChange: (page, size) => onPaginationChange(page, size),
          style: { padding: '5px 20px 5px 20px' },
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default InventoryTable;

