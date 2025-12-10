import React from 'react';
import {
  Typography,
  Button,
  Input,
  Space,
  Table,
  Tag,
  Avatar,
  Modal,
  Image,
  Row,
  Col,
  Popover,
  Select,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PictureOutlined,
  FilterOutlined,
  CopyOutlined,
  PrinterOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { confirm } = Modal;

const ProductTable = ({
  products,
  loading,
  pagination,
  setPagination,
  selectedRowKeys,
  setSelectedRowKeys,
  visibleColumns,
  handleDelete,
  handleEdit,
  handleView,
  handleTableChange,
  sortedInfo,
  filteredInfo,
  getFilteredAndSortedProducts,
  getNumericValue,
  brands,
  users,
  t,
  fetchProducts,
  productService,
  expandedRowKeys,
  setExpandedRowKeys,
  detailActionPopoverVisible,
  setDetailActionPopoverVisible,
}) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\./g, ',');
  };

  const formatStock = (stock) => {
    if (stock === null || stock === undefined) return '-';
    return stock.toLocaleString('vi-VN');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { label: t('productTable.status.active'), color: 'success' },
      inactive: { label: t('productTable.status.inactive'), color: 'default' },
      draft: { label: t('productTable.status.draft'), color: 'warning' },
    };
    const statusInfo = statusMap[status] || statusMap.active;
    return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
  };

  const RangeFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters, placeholderMin, placeholderMax }) => {
    const [min, max] = selectedKeys[0] ? selectedKeys[0].split('-').map(v => v ? parseFloat(v) : null) : [null, null];
    const [minValue, setMinValue] = React.useState(min?.toString() || '');
    const [maxValue, setMaxValue] = React.useState(max?.toString() || '');

    React.useEffect(() => {
      if (selectedKeys[0]) {
        const [newMin, newMax] = selectedKeys[0].split('-').map(v => v ? parseFloat(v) : null);
        setMinValue(newMin?.toString() || '');
        setMaxValue(newMax?.toString() || '');
      } else {
        setMinValue('');
        setMaxValue('');
      }
    }, [selectedKeys]);

    return (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={placeholderMin || t('productTable.filters.rangeMin')}
          value={minValue}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setMinValue(val);
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Input
          placeholder={placeholderMax || t('productTable.filters.rangeMax')}
          value={maxValue}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setMaxValue(val);
          }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              const minNum = minValue ? parseFloat(minValue) : null;
              const maxNum = maxValue ? parseFloat(maxValue) : null;
              setSelectedKeys([`${minNum || ''}-${maxNum || ''}`]);
              confirm();
            }}
            icon={<FilterOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('productTable.filters.rangeApply')}
          </Button>
          <Button
            onClick={() => {
              setMinValue('');
              setMaxValue('');
              clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            {t('productTable.filters.rangeReset')}
          </Button>
        </Space>
      </div>
    );
  };

  const allColumns = [
    {
      title: '',
      key: 'image',
      dataIndex: 'image',
      width: 70,
      render: (_, record) => {
        let imageUrl = null;
        if (record.images && Array.isArray(record.images) && record.images.length > 0) {
          const firstImage = record.images[0];
          if (typeof firstImage === 'string') {
            imageUrl = firstImage;
          } else if (firstImage && typeof firstImage === 'object' && firstImage !== null) {
            imageUrl = firstImage.url || null;
          }
        }
        return (
          <Avatar
            src={imageUrl}
            shape="square"
            size={48}
            icon={<PictureOutlined />}
            style={{ backgroundColor: '#f0f0f0' }}
          />
        );
      },
    },
    {
      title: t('productTable.columns.name'),
      key: 'name',
      dataIndex: 'name',
      width: 200,
      sorter: (a, b) => {
        const aName = a.name || '';
        const bName = b.name || '';
        return aName.localeCompare(bName);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('productTable.filters.name')}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.name?.toLowerCase().includes(value.toLowerCase());
      },
      render: (_, record) => {
        const variantCount = record.hasVariants && record.variants?.length > 0
          ? record.variants.length
          : 0;

        return (
          <Typography.Text strong>
            {record.name}
            {variantCount > 0 && (
              <span style={{ fontWeight: 'normal', color: '#666' }}>
                {' '}{t('productTable.expanded.variants', { count: variantCount })}
              </span>
            )}
          </Typography.Text>
        );
      },
    },
    {
      title: t('productTable.columns.sku'),
      key: 'sku',
      dataIndex: 'sku',
      width: 160,
      sorter: (a, b) => {
        const aSku = a.sku || '';
        const bSku = b.sku || '';
        return aSku.localeCompare(bSku);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('productTable.filters.sku')}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.sku?.toLowerCase().includes(value.toLowerCase());
      },
      render: (_, record) => (
        <Typography.Text>{record.sku || '-'}</Typography.Text>
      ),
    },
    {
      title: t('productTable.columns.barcode'),
      key: 'barcode',
      dataIndex: 'barcode',
      width: 170,
      sorter: (a, b) => {
        const aBarcode = a.hasVariants ? '' : (a.baseBarcodes?.[0]?.code || '');
        const bBarcode = b.hasVariants ? '' : (b.baseBarcodes?.[0]?.code || '');
        return aBarcode.localeCompare(bBarcode);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('productTable.filters.barcode')}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        if (record.hasVariants) return false;
        const barcode = record.baseBarcodes?.[0]?.code || '';
        return barcode.toLowerCase().includes(value.toLowerCase());
      },
      render: (_, record) => {
        if (record.hasVariants) {
          return <Typography.Text>-</Typography.Text>;
        }
        const barcode = record.baseBarcodes?.[0]?.code;
        return <Typography.Text>{barcode || '-'}</Typography.Text>;
      },
    },
    {
      title: t('productTable.columns.salePrice'),
      key: 'salePrice',
      dataIndex: 'salePrice',
      width: 160,
      sorter: (a, b) => {
        const aValue = getNumericValue(a, 'salePrice') || 0;
        const bValue = getNumericValue(b, 'salePrice') || 0;
        return aValue - bValue;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <RangeFilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholderMin={`${t('productTable.filters.rangeMin')} (VNĐ)`}
          placeholderMax={`${t('productTable.filters.rangeMax')} (VNĐ)`}
        />
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const [min, max] = value.split('-').map(v => v ? parseFloat(v) : null);
        const recordValue = getNumericValue(record, 'salePrice');
        if (recordValue === null) return false;
        if (min !== null && recordValue < min) return false;
        if (max !== null && recordValue > max) return false;
        return true;
      },
      render: (_, record) => {
        if (record.hasVariants && record.variants?.length > 0) {
          const prices = record.variants
            .map(v => v.pricing?.sale)
            .filter(price => price !== null && price !== undefined);

          if (prices.length === 0) {
            return <Typography.Text strong>-</Typography.Text>;
          }

          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          if (minPrice === maxPrice) {
            return (
              <Typography.Text strong>
                {formatCurrency(minPrice)}
              </Typography.Text>
            );
          }

          return (
            <Typography.Text strong>
              {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
            </Typography.Text>
          );
        }

        const price = record.basePricing?.sale;
        return (
          <Typography.Text strong>
            {formatCurrency(price)}
          </Typography.Text>
        );
      },
    },
    {
      title: t('productTable.columns.costPrice'),
      key: 'costPrice',
      dataIndex: 'costPrice',
      width: 160,
      sorter: (a, b) => {
        const aValue = getNumericValue(a, 'costPrice') || 0;
        const bValue = getNumericValue(b, 'costPrice') || 0;
        return aValue - bValue;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <RangeFilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholderMin={`${t('productTable.filters.rangeMin')} (VNĐ)`}
          placeholderMax={`${t('productTable.filters.rangeMax')} (VNĐ)`}
        />
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const [min, max] = value.split('-').map(v => v ? parseFloat(v) : null);
        const recordValue = getNumericValue(record, 'costPrice');
        if (recordValue === null) return false;
        if (min !== null && recordValue < min) return false;
        if (max !== null && recordValue > max) return false;
        return true;
      },
      render: (_, record) => {
        if (record.hasVariants && record.variants?.length > 0) {
          const costs = record.variants
            .map(v => v.pricing?.cost)
            .filter(cost => cost !== null && cost !== undefined);

          if (costs.length === 0) {
            return '-';
          }

          const minCost = Math.min(...costs);
          const maxCost = Math.max(...costs);

          if (minCost === maxCost) {
            return formatCurrency(minCost);
          }

          return `${formatCurrency(minCost)} - ${formatCurrency(maxCost)}`;
        }

        const cost = record.basePricing?.cost;
        return formatCurrency(cost);
      },
    },
    {
      title: t('productTable.columns.brand'),
      key: 'brand',
      dataIndex: 'brand',
      width: 170,
      sorter: (a, b) => {
        const aBrand = a.brandId || a.brand;
        const bBrand = b.brandId || b.brand;
        const aName = aBrand?.name || '';
        const bName = bBrand?.name || '';
        return aName.localeCompare(bName);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('productTable.filters.brand')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={brands.map(brand => ({
              label: brand.name,
              value: brand._id,
            }))}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const brand = record.brandId || record.brand;
        return brand?._id?.toString() === value;
      },
      render: (_, record) => {
        const brand = record.brandId || record.brand;
        return <Typography.Text>{brand?.name || '-'}</Typography.Text>;
      },
    },
    {
      title: t('productTable.columns.stock'),
      key: 'stock',
      dataIndex: 'stock',
      width: 140,
      sorter: (a, b) => {
        const aValue = getNumericValue(a, 'stock') || 0;
        const bValue = getNumericValue(b, 'stock') || 0;
        return aValue - bValue;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <RangeFilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholderMin={t('productTable.filters.rangeMin')}
          placeholderMax={t('productTable.filters.rangeMax')}
        />
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const [min, max] = value.split('-').map(v => v ? parseFloat(v) : null);
        const recordValue = getNumericValue(record, 'stock');
        if (recordValue === null) return false;
        if (min !== null && recordValue < min) return false;
        if (max !== null && recordValue > max) return false;
        return true;
      },
      render: (_, record) => {
        if (record.hasVariants && record.variants?.length > 0) {
          const stocks = record.variants
            .map(v => v.inventory?.totalOnHand || 0)
            .filter(stock => stock !== null && stock !== undefined);

          if (stocks.length === 0) {
            return '-';
          }

          const minStock = Math.min(...stocks);
          const maxStock = Math.max(...stocks);

          if (minStock === maxStock) {
            return formatStock(minStock);
          }

          return `${formatStock(minStock)} - ${formatStock(maxStock)}`;
        }

        const stock = record.baseInventory?.stockOnHand || 0;
        return formatStock(stock);
      },
    },
    {
      title: t('productTable.columns.allocated'),
      key: 'allocated',
      dataIndex: 'allocated',
      width: 150,
      sorter: (a, b) => {
        const aValue = getNumericValue(a, 'allocated') || 0;
        const bValue = getNumericValue(b, 'allocated') || 0;
        return aValue - bValue;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <RangeFilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          placeholderMin={t('productTable.filters.rangeMin')}
          placeholderMax={t('productTable.filters.rangeMax')}
        />
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const [min, max] = value.split('-').map(v => v ? parseFloat(v) : null);
        const recordValue = getNumericValue(record, 'allocated');
        if (recordValue === null) return false;
        if (min !== null && recordValue < min) return false;
        if (max !== null && recordValue > max) return false;
        return true;
      },
      render: (_, record) => {
        const allocated = record.hasVariants
          ? record.variants?.reduce((sum, v) => sum + (v.inventory?.totalAllocated || 0), 0)
          : record.baseInventory?.stockAllocated || 0;
        return formatStock(allocated);
      },
    },
    {
      title: t('productTable.columns.status'),
      key: 'status',
      dataIndex: 'status',
      width: 150,
      sorter: (a, b) => {
        const statusOrder = { 'active': 1, 'inactive': 2, 'draft': 3 };
        return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('productTable.filters.status')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            options={[
              { label: t('productTable.status.active'), value: 'active' },
              { label: t('productTable.status.inactive'), value: 'inactive' },
              { label: t('productTable.status.draft'), value: 'draft' },
            ]}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.status === value;
      },
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: t('productTable.columns.createdAt'),
      key: 'createdAt',
      dataIndex: 'createdAt',
      width: 160,
      sorter: (a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate;
      },
      render: (_, record) => {
        if (!record.createdAt) return '-';
        const date = new Date(record.createdAt);
        return (
          <Typography.Text>
            {date.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography.Text>
        );
      },
    },
    {
      title: t('productTable.columns.createdBy'),
      key: 'createdBy',
      dataIndex: 'createdBy',
      width: 180,
      sorter: (a, b) => {
        const aCreator = a.createdBy;
        const bCreator = b.createdBy;
        const aName = (typeof aCreator === 'object' ? aCreator?.fullName : '') || '';
        const bName = (typeof bCreator === 'object' ? bCreator?.fullName : '') || '';
        return aName.localeCompare(bName);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('productTable.filters.createdBy')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map(user => ({
              label: user.fullName || user.email || '-',
              value: user._id || user,
            }))}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const creator = record.createdBy;
        if (!creator) return false;
        const creatorId = typeof creator === 'object' ? (creator._id || creator) : creator;
        return creatorId?.toString() === value;
      },
      render: (_, record) => {
        const creator = record.createdBy;
        if (!creator) return '-';
        const creatorObj = typeof creator === 'object' ? creator : null;
        if (!creatorObj) return '-';

        const fullName = creatorObj.fullName;
        const avatarUrl = creatorObj.avatarUrl;

        if (!fullName) return '-';

        return (
          <Space size="small">
            <Avatar
              src={avatarUrl}
              size="small"
              icon={<UserOutlined />}
            />
            <Typography.Text>
              {fullName}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: t('productTable.columns.updatedAt'),
      key: 'updatedAt',
      dataIndex: 'updatedAt',
      width: 190,
      sorter: (a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return aDate - bDate;
      },
      render: (_, record) => {
        if (!record.updatedAt) return '-';
        const date = new Date(record.updatedAt);
        return (
          <Typography.Text>
            {date.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography.Text>
        );
      },
    },
    {
      title: t('productTable.columns.updatedBy'),
      key: 'updatedBy',
      dataIndex: 'updatedBy',
      width: 180,
      sorter: (a, b) => {
        const aUpdater = a.updatedBy;
        const bUpdater = b.updatedBy;
        const aName = (typeof aUpdater === 'object' ? aUpdater?.fullName : '') || '';
        const bName = (typeof bUpdater === 'object' ? bUpdater?.fullName : '') || '';
        return aName.localeCompare(bName);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('productTable.filters.updatedBy')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map(user => ({
              label: user.fullName || user.email || '-',
              value: user._id || user,
            }))}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeApply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('productTable.filters.rangeReset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const updater = record.updatedBy;
        if (!updater) return false;
        const updaterId = typeof updater === 'object' ? (updater._id || updater) : updater;
        return updaterId?.toString() === value;
      },
      render: (_, record) => {
        const updater = record.updatedBy;
        if (!updater) return '-';
        const updaterObj = typeof updater === 'object' ? updater : null;
        if (!updaterObj) return '-';

        const fullName = updaterObj.fullName;
        const avatarUrl = updaterObj.avatarUrl;

        if (!fullName) return '-';

        return (
          <Space size="small">
            <Avatar
              src={avatarUrl}
              size="small"
              icon={<UserOutlined />}
            />
            <Typography.Text>
              {fullName}
            </Typography.Text>
          </Space>
        );
      },
    },
  ];

  const columns = allColumns.filter(col => visibleColumns[col.key]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleCopyProduct = async (record) => {
    confirm({
      title: 'Xác nhận sao chép',
      content: `Bạn có chắc chắn muốn sao chép sản phẩm "${record.name}"?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await productService.copyProduct(record._id);
          fetchProducts();
        } catch (error) {
          console.error('Failed to copy product:', error);
        }
      },
    });
  };

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await productService.updateProduct(record._id, { status: newStatus });
      setDetailActionPopoverVisible(prev => ({ ...prev, [record._id]: false }));
      fetchProducts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
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
        dataSource={getFilteredAndSortedProducts()}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total || getFilteredAndSortedProducts().length,
          showSizeChanger: true,
          showTotal: (total, range) => t('productTable.pagination.total', { from: range[0], to: range[1], total }),
          pageSizeOptions: ['10', '25', '50', '100'],
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          },
          onShowSizeChange: (current, size) => {
            setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
          },
          style: { padding: '5px 20px 5px 20px' },
        }}
        rowSelection={rowSelection}
        scroll={{ x: 'max-content' }}
        onChange={handleTableChange}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => {
            if (expanded) {
              setExpandedRowKeys([record._id]);
            } else {
              setExpandedRowKeys([]);
            }
          },
          expandedRowRender: (record) => {
            const category = record.categoryId || record.category;
            const brand = record.brandId || record.brand;
            let mainImage = null;
            if (record.images && record.images.length > 0) {
              const firstImage = record.images[0];
              if (typeof firstImage === 'string') {
                mainImage = firstImage;
              } else if (firstImage && firstImage.url) {
                mainImage = firstImage.url;
              }
            }

            const handlePrintBarcode = () => {
              // Placeholder for print barcode functionality
            };

            const detailActionMenu = [
              {
                key: 'view',
                label: t('productTable.actions.view'),
                icon: <EyeOutlined />,
                onClick: () => handleView(record._id),
              },
            ];

            if (record.status === 'active') {
              detailActionMenu.push({
                key: 'deactivate',
                label: t('productTable.actions.deactivate'),
                onClick: () => {
                  confirm({
                    title: t('productTable.confirm.deactivateTitle'),
                    content: t('productTable.confirm.deactivateMessage', { name: record.name }),
                    okText: t('productTable.actions.deactivate'),
                    cancelText: t('productTable.confirm.deleteTitle'),
                    onOk: () => handleUpdateStatus(record, 'inactive'),
                  });
                  setDetailActionPopoverVisible(prev => ({ ...prev, [record._id]: false }));
                },
              });
            } else if (record.status === 'inactive') {
              detailActionMenu.push({
                key: 'activate',
                label: t('productTable.actions.activate'),
                onClick: () => {
                  setDetailActionPopoverVisible(prev => ({ ...prev, [record._id]: false }));
                  handleUpdateStatus(record, 'active');
                },
              });
            } else if (record.status === 'draft') {
              detailActionMenu.push({
                key: 'activate',
                label: t('productTable.actions.markActive'),
                onClick: () => {
                  setDetailActionPopoverVisible(prev => ({ ...prev, [record._id]: false }));
                  handleUpdateStatus(record, 'active');
                },
              });
            }

            return (
              <div style={{ padding: '10px', background: '#fafafa' }}>
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                  {detailActionMenu.length > 0 ? (
                    <Popover
                      content={
                        <div style={{ minWidth: 150 }}>
                          {detailActionMenu.map((item, idx) => {
                            if (item.type === 'divider') {
                              return <div key={idx} style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />;
                            }
                            return (
                              <div
                                key={item.key || idx}
                                onClick={item.onClick}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: item.danger ? '#ff4d4f' : '#000',
                                  fontSize: '14px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      }
                      trigger="click"
                      open={detailActionPopoverVisible[record._id]}
                      onOpenChange={(open) => {
                        setDetailActionPopoverVisible(prev => ({ ...prev, [record._id]: open }));
                      }}
                      placement="bottomLeft"
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popover>
                  ) : null}
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record._id, record.name)}
                  >
                    {t('productTable.actions.delete')}
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyProduct(record)}
                    style={{
                      borderColor: '#1A237E',
                      color: '#1A237E',
                    }}
                  >
                    {t('productTable.actions.copy')}
                  </Button>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrintBarcode}
                    style={{
                      borderColor: '#1A237E',
                      color: '#1A237E',
                    }}
                  >
                    {t('productTable.actions.printBarcode')}
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record._id)}
                    style={{
                      backgroundColor: '#1A237E',
                      color: '#fff',
                      borderColor: '#1A237E',
                    }}
                  >
                    {t('productTable.actions.edit')}
                  </Button>
                </div>
                <Row gutter={16}>
                  <Col span={5}>
                    {mainImage && (
                      <div style={{ marginBottom: '10px' }}>
                        <Image
                          src={mainImage}
                          alt={record.name}
                          style={{ width: '100%', maxWidth: '200px', borderRadius: '6px' }}
                        />
                      </div>
                    )}
                    {record.images && record.images.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {record.images.slice(1, 5).map((img, idx) => {
                          let imgUrl = null;
                          if (typeof img === 'string') {
                            imgUrl = img;
                          } else if (img && img.url) {
                            imgUrl = img.url;
                          }
                          return imgUrl ? (
                            <Image
                              key={idx}
                              src={imgUrl}
                              alt={`${record.name} ${idx + 2}`}
                              width={50}
                              height={50}
                              style={{ borderRadius: '4px', objectFit: 'cover' }}
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  </Col>
                  <Col span={18}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.sku')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            <Typography.Text style={{ fontSize: '13px' }}>{record.sku || '-'}</Typography.Text>
                        </div>
                        </Col>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.status')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            {getStatusTag(record.status)}
                      </div>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.category')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            <Typography.Text style={{ fontSize: '13px' }}>{category?.name || '-'}</Typography.Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.brand')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            <Typography.Text style={{ fontSize: '13px' }}>{brand?.name || '-'}</Typography.Text>
                          </div>
                        </Col>
                      </Row>

                      {!record.hasVariants && (
                        <Row gutter={12}>
                          <Col span={6}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.barcode')}</Typography.Text>
                            <div style={{ marginTop: '2px' }}>
                              <Typography.Text style={{ fontSize: '13px' }}>{record.baseBarcodes?.[0]?.code || '-'}</Typography.Text>
                            </div>
                          </Col>
                          <Col span={6}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.cost')}</Typography.Text>
                            <div style={{ marginTop: '2px' }}>
                              <Typography.Text style={{ fontSize: '13px' }}>{formatCurrency(record.basePricing?.cost)}</Typography.Text>
                            </div>
                          </Col>
                          <Col span={6}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.sale')}</Typography.Text>
                            <div style={{ marginTop: '2px' }}>
                              <Typography.Text strong style={{ fontSize: '13px' }}>{formatCurrency(record.basePricing?.sale)}</Typography.Text>
                            </div>
                          </Col>
                          <Col span={6}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.stock')}</Typography.Text>
                            <div style={{ marginTop: '2px' }}>
                              <Typography.Text style={{ fontSize: '13px' }}>{formatStock(record.baseInventory?.stockOnHand || 0)}</Typography.Text>
                            </div>
                          </Col>
                        </Row>
                      )}

                      {!record.hasVariants && (
                        <Row gutter={12}>
                          <Col span={12}>
                            <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.allowSellOut')}</Typography.Text>
                            <div style={{ marginTop: '2px' }}>
                              <Tag color={record.allowSellOutOfStock ? 'green' : 'default'}>
                                {record.allowSellOutOfStock ? t('productTable.expanded.yes') : t('productTable.expanded.no')}
                              </Tag>
                            </div>
                          </Col>
                        </Row>
                      )}

                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.description')}</Typography.Text>
                        <div style={{ marginTop: '4px' }}>
                          {record.description ? (
                            <div style={{ fontSize: '13px', maxHeight: '100px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: record.description }} />
                          ) : (
                            <Typography.Text type="secondary" style={{ fontSize: '13px' }}>{t('productTable.expanded.noDescription')}</Typography.Text>
                          )}
                        </div>
                      </div>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.createdAt')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            <Typography.Text style={{ fontSize: '13px' }}>
                              {record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : '-'}
                            </Typography.Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.createdBy')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            {record.createdBy && typeof record.createdBy === 'object' ? (
                              <Space size="small">
                                <Avatar
                                  src={record.createdBy.avatarUrl}
                                  size="small"
                                  icon={<UserOutlined />}
                                />
                                <Typography.Text style={{ fontSize: '13px' }}>{record.createdBy.fullName || '-'}</Typography.Text>
                              </Space>
                            ) : (
                              <Typography.Text style={{ fontSize: '13px' }}>-</Typography.Text>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.updatedAt')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            <Typography.Text style={{ fontSize: '13px' }}>
                              {record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : '-'}
                            </Typography.Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.updatedBy')}</Typography.Text>
                          <div style={{ marginTop: '2px' }}>
                            {record.updatedBy && typeof record.updatedBy === 'object' ? (
                              <Space size="small">
                                <Avatar
                                  src={record.updatedBy.avatarUrl}
                                  size="small"
                                  icon={<UserOutlined />}
                                />
                                <Typography.Text style={{ fontSize: '13px' }}>{record.updatedBy.fullName || '-'}</Typography.Text>
                              </Space>
                            ) : (
                              <Typography.Text style={{ fontSize: '13px' }}>-</Typography.Text>
                            )}
                          </div>
                        </Col>
                      </Row>

                      {record.hasVariants && record.variants && record.variants.length > 0 && (
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: '11px', marginBottom: '6px', display: 'block' }}>
                            {t('productTable.expanded.variants', { count: record.variants.length })}
                          </Typography.Text>
                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {record.variants.map((variant, idx) => (
                              <div
                                key={variant._id || idx}
                                style={{
                                  padding: '8px',
                                  marginBottom: '6px',
                                  background: '#fff',
                                  borderRadius: '4px',
                                  border: '1px solid #e8e8e8',
                                }}
                              >
                                <Row gutter={12}>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.sku')}</Typography.Text>
                                    <div><Typography.Text style={{ fontSize: '13px' }}>{variant.sku || '-'}</Typography.Text></div>
                                  </Col>
                                  <Col span={4}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.barcode')}</Typography.Text>
                                    <div><Typography.Text style={{ fontSize: '13px' }}>{variant.barcodes?.[0]?.code || '-'}</Typography.Text></div>
                                  </Col>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.cost')}</Typography.Text>
                                    <div><Typography.Text style={{ fontSize: '13px' }}>{formatCurrency(variant.pricing?.cost)}</Typography.Text></div>
                                  </Col>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.sale')}</Typography.Text>
                                    <div><Typography.Text strong style={{ fontSize: '13px' }}>{formatCurrency(variant.pricing?.sale)}</Typography.Text></div>
                                  </Col>
                                  <Col span={2}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.stock')}</Typography.Text>
                                    <div><Typography.Text style={{ fontSize: '13px' }}>{formatStock(variant.inventory?.totalOnHand)}</Typography.Text></div>
                                  </Col>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.allocated')}</Typography.Text>
                                    <div><Typography.Text style={{ fontSize: '13px' }}>{formatStock(variant.inventory?.totalAllocated)}</Typography.Text></div>
                                  </Col>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.status')}</Typography.Text>
                                    <div style={{ marginTop: '2px' }}>
                                      {getStatusTag(record.status)}
                                    </div>
                                  </Col>
                                  <Col span={3}>
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('productTable.expanded.variant.allowSellOut')}</Typography.Text>
                                    <div style={{ marginTop: '2px' }}>
                                      <Tag color={record.allowSellOutOfStock ? 'green' : 'default'}>
                                        {record.allowSellOutOfStock ? t('productTable.expanded.yes') : t('productTable.expanded.no')}
                                      </Tag>
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Space>
                  </Col>
                </Row>
              </div>
            );
          },
          rowExpandable: () => true,
        }}
      />
    </div>
  );
};

export default ProductTable;
