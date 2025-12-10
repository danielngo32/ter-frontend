import React from 'react';
import {
  Typography,
  Button,
  Input,
  Space,
  Table,
  Avatar,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

const BirthdayRangeFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters, t }) => {
  const [dateRange, setDateRange] = React.useState(null);
  
  React.useEffect(() => {
    if (selectedKeys[0]) {
      try {
        const parsed = JSON.parse(selectedKeys[0]);
        if (parsed.from && parsed.to) {
          setDateRange([dayjs(parsed.from), dayjs(parsed.to)]);
        }
      } catch (e) {
        setDateRange(null);
      }
    } else {
      setDateRange(null);
    }
  }, [selectedKeys]);

  const parseBirthdayRange = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length !== 2) return null;
    return {
      from: dates[0] ? dates[0].startOf('day').toISOString() : null,
      to: dates[1] ? dates[1].endOf('day').toISOString() : null,
    };
  };

  return (
    <div style={{ padding: 8 }}>
      <RangePicker
        format="DD/MM/YYYY"
        value={dateRange}
        onChange={(dates) => {
          setDateRange(dates);
          if (dates && dates[0] && dates[1]) {
            const range = parseBirthdayRange(dates);
            setSelectedKeys([JSON.stringify(range)]);
          } else {
            setSelectedKeys([]);
          }
        }}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <Space>
        <Button
          type="primary"
          onClick={() => confirm()}
          icon={<FilterOutlined />}
          size="small"
          style={{ width: 90 }}
        >
          {t('table.filters.apply')}
        </Button>
        <Button
          onClick={() => {
            setDateRange(null);
            clearFilters();
            confirm();
          }}
          size="small"
          style={{ width: 90 }}
        >
          {t('table.filters.reset')}
        </Button>
      </Space>
    </div>
  );
};

const CRMTable = ({
  loading,
  data,
  pagination,
  onChangePage,
  onView,
  onEdit,
  onDelete,
  selectedRowKeys,
  onSelectChange,
  visibleColumns,
  sortedInfo,
  filteredInfo,
  handleTableChange,
  getFilteredAndSortedCustomers,
  provinces,
  users,
  t,
  expandedRowKeys,
  setExpandedRowKeys,
}) => {
  const formatBirthday = (date) => {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY');
  };

  const allColumns = [
    {
      title: '',
      key: 'avatar',
      dataIndex: 'avatar',
      width: 70,
      render: (_, record) => (
        <Avatar
          src={record.avatarUrl}
          size={48}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#f0f0f0' }}
        />
      ),
    },
    {
      title: t('table.columns.name'),
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
            placeholder={t('table.filters.name')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.name?.toLowerCase().includes(value.toLowerCase());
      },
      render: (_, record) => (
        <Typography.Text strong>{record.name || '-'}</Typography.Text>
      ),
    },
    {
      title: t('table.columns.gender'),
      key: 'gender',
      dataIndex: 'gender',
      width: 120,
      sorter: (a, b) => {
        const order = { male: 1, female: 2, other: 3 };
        return (order[a.gender] || 0) - (order[b.gender] || 0);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('table.filters.gender')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            options={[
              { label: t('gender.male'), value: 'male' },
              { label: t('gender.female'), value: 'female' },
              { label: t('gender.other'), value: 'other' },
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.gender === value;
      },
      render: (g) => t(`gender.${g || 'other'}`),
    },
    {
      title: t('table.columns.phone1'),
      key: 'phone1',
      dataIndex: 'phone1',
      width: 150,
      sorter: (a, b) => {
        const aPhone = a.phone1 || '';
        const bPhone = b.phone1 || '';
        return aPhone.localeCompare(bPhone);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('table.filters.phone')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.phone1?.toLowerCase().includes(value.toLowerCase());
      },
      render: (val) => val || '-',
    },
    {
      title: t('table.columns.phone2'),
      key: 'phone2',
      dataIndex: 'phone2',
      width: 150,
      sorter: (a, b) => {
        const aPhone = a.phone2 || '';
        const bPhone = b.phone2 || '';
        return aPhone.localeCompare(bPhone);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('table.filters.phone')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.phone2?.toLowerCase().includes(value.toLowerCase());
      },
      render: (val) => val || '-',
    },
    {
      title: t('table.columns.email1'),
      key: 'email1',
      dataIndex: 'email1',
      width: 200,
      sorter: (a, b) => {
        const aEmail = a.email1 || '';
        const bEmail = b.email1 || '';
        return aEmail.localeCompare(bEmail);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('table.filters.email')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.email1?.toLowerCase().includes(value.toLowerCase());
      },
      render: (val) => val || '-',
    },
    {
      title: t('table.columns.email2'),
      key: 'email2',
      dataIndex: 'email2',
      width: 200,
      sorter: (a, b) => {
        const aEmail = a.email2 || '';
        const bEmail = b.email2 || '';
        return aEmail.localeCompare(bEmail);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('table.filters.email')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        return record.email2?.toLowerCase().includes(value.toLowerCase());
      },
      render: (val) => val || '-',
    },
    {
      title: t('table.columns.birthday'),
      key: 'birthday',
      dataIndex: 'birthday',
      width: 140,
      sorter: (a, b) => {
        const aDate = a.birthday ? new Date(a.birthday).getTime() : 0;
        const bDate = b.birthday ? new Date(b.birthday).getTime() : 0;
        return aDate - bDate;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <BirthdayRangeFilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          t={t}
        />
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        try {
          const range = JSON.parse(value);
          if (!range.from || !range.to) return true;
          const recordDate = record.birthday ? new Date(record.birthday).getTime() : null;
          if (!recordDate) return false;
          const from = new Date(range.from).getTime();
          const to = new Date(range.to).getTime();
          return recordDate >= from && recordDate <= to;
        } catch (e) {
          return true;
        }
      },
      render: (d) => formatBirthday(d),
    },
    {
      title: t('table.columns.province'),
      key: 'province',
      dataIndex: 'province',
      width: 180,
      sorter: (a, b) => {
        const aProvince = a.address?.provinceName || '';
        const bProvince = b.address?.provinceName || '';
        return aProvince.localeCompare(bProvince);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder={t('table.filters.province')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={provinces?.map(province => ({
              label: province.fullName || province.name,
              value: province.code || province._id,
            })) || []}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const addr = record.address || {};
        return addr.provinceCode === value || addr.provinceName === value;
      },
      render: (_, record) => {
        const addr = record.address || {};
        return <Typography.Text>{addr.provinceName || '-'}</Typography.Text>;
      },
    },
    {
      title: t('table.columns.ward'),
      key: 'ward',
      dataIndex: 'ward',
      width: 180,
      sorter: (a, b) => {
        const aWard = a.address?.wardName || '';
        const bWard = b.address?.wardName || '';
        return aWard.localeCompare(bWard);
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('table.filters.ward')}
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
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value) return true;
        const addr = record.address || {};
        return addr.wardName?.toLowerCase().includes(value.toLowerCase());
      },
      render: (_, record) => {
        const addr = record.address || {};
        return <Typography.Text>{addr.wardName || '-'}</Typography.Text>;
      },
    },
    {
      title: t('table.columns.createdAt'),
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
      title: t('table.columns.createdBy'),
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
            placeholder={t('table.filters.createdBy')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users?.map(user => ({
              label: user.fullName || user.email || '-',
              value: user._id || user,
            })) || []}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
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
            <Typography.Text>{fullName}</Typography.Text>
          </Space>
        );
      },
    },
    {
      title: t('table.columns.updatedAt'),
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
      title: t('table.columns.updatedBy'),
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
            placeholder={t('table.filters.updatedBy')}
            value={selectedKeys[0] || undefined}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            style={{ width: '100%', marginBottom: 8 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users?.map(user => ({
              label: user.fullName || user.email || '-',
              value: user._id || user,
            })) || []}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FilterOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.apply')}
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              {t('table.filters.reset')}
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
            <Typography.Text>{fullName}</Typography.Text>
          </Space>
        );
      },
    },
  ];

  const columns = allColumns.filter(col => visibleColumns[col.key]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      onSelectChange(newSelectedRowKeys);
    },
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
        dataSource={getFilteredAndSortedCustomers()}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total || getFilteredAndSortedCustomers().length,
          showSizeChanger: true,
          showTotal: (total, range) => t('table.pagination.total', { from: range[0], to: range[1], total }),
          pageSizeOptions: ['10', '25', '50', '100'],
          onChange: (page, pageSize) => {
            onChangePage(page, pageSize);
          },
          onShowSizeChange: (current, size) => {
            onChangePage(1, size);
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
            const addr = record.address || {};
            return (
              <div style={{ padding: '10px', background: '#fafafa' }}>
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => onView(record._id)}
                  >
                    {t('table.actions.view')}
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record)}
                  >
                    {t('table.actions.delete')}
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record._id)}
                    style={{
                      backgroundColor: '#1A237E',
                      color: '#fff',
                      borderColor: '#1A237E',
                    }}
                  >
                    {t('table.actions.edit')}
                  </Button>
                </div>
                <Row gutter={16}>
                  <Col span={6}>
                    {record.avatarUrl && (
                      <div style={{ marginBottom: '10px' }}>
                        <Avatar
                          src={record.avatarUrl}
                          size={120}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: '#f0f0f0' }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col span={18}>
                    <Row gutter={12}>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.gender')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{t(`gender.${record.gender || 'other'}`)}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.birthday')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{formatBirthday(record.birthday)}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.phone1')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{record.phone1 || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.phone2')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{record.phone2 || '-'}</Typography.Text>
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12} style={{ marginTop: 12 }}>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.email1')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{record.email1 || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.email2')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{record.email2 || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.province')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{addr.provinceName || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.ward')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{addr.wardName || '-'}</Typography.Text>
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12} style={{ marginTop: 12 }}>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.addressLine')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{addr.addressLine || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.note')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>{record.note || '-'}</Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.lastActivityAt')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>
                            {record.lastActivityAt ? dayjs(record.lastActivityAt).format('DD/MM/YYYY HH:mm') : '-'}
                          </Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.createdAt')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>
                            {record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
                          </Typography.Text>
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12} style={{ marginTop: 12 }}>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.createdBy')}</Typography.Text>
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
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.updatedAt')}</Typography.Text>
                        <div style={{ marginTop: '2px' }}>
                          <Typography.Text style={{ fontSize: '13px' }}>
                            {record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm') : '-'}
                          </Typography.Text>
                        </div>
                      </Col>
                      <Col span={6}>
                        <Typography.Text type="secondary" style={{ fontSize: '11px' }}>{t('table.expanded.updatedBy')}</Typography.Text>
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

export default CRMTable;
