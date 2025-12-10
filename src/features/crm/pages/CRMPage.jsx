import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Input, Space, Button, Tag, Modal, message, Popover, Checkbox } from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined, SlidersOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { crmService } from '../crm.service';
import CRMModal from '../components/CRMModal';
import CRMTable from '../components/CRMTable';
import ImportCRMModal from '../components/ImportCRMModal';
import ExportCRMModal from '../components/ExportCRMModal';

const { confirm } = Modal;

const CRMPage = () => {
  const { t } = useTranslation('crm');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState('create');
  const [duplicateContactAction, setDuplicateContactAction] = useState('upsert');
  const [exportColumns, setExportColumns] = useState([
    'name', 'gender', 'birthday', 'phone1', 'phone2', 'email1', 'email2',
    'addressLine', 'provinceName', 'wardName', 'note', 'lastActivityAt'
  ]);
  const [exportFilters, setExportFilters] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
  const VISIBLE_COLUMNS_STORAGE_KEY = 'crmTable.visibleColumns';
  const defaultVisibleColumns = {
    avatar: true,
    name: true,
    gender: true,
    phone1: true,
    phone2: true,
    email1: true,
    email2: true,
    birthday: true,
    province: true,
    ward: true,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
  };
  const loadVisibleColumns = () => {
    try {
      const raw = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
      if (!raw) return defaultVisibleColumns;
      const parsed = JSON.parse(raw);
      return { ...defaultVisibleColumns, ...parsed };
    } catch (err) {
      console.error('Failed to load visible columns from storage', err);
      return defaultVisibleColumns;
    }
  };
  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [sortedInfo, setSortedInfo] = useState({ columnKey: 'createdAt', order: 'descend' });
  const [filteredInfo, setFilteredInfo] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch (err) {
      console.error('Failed to save visible columns to storage', err);
    }
  }, [visibleColumns]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await crmService.getProvinces();
        setProvinces(Array.isArray(data) ? data : (data?.items || data?.data || []));
      } catch (error) {
        console.error('Failed to fetch provinces', error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const extractUsers = () => {
      try {
        const uniqueUsers = new Map();
        
        customers.forEach(customer => {
          if (customer.createdBy && typeof customer.createdBy === 'object') {
            const userId = customer.createdBy._id || customer.createdBy;
            if (userId && !uniqueUsers.has(userId)) {
              uniqueUsers.set(userId, customer.createdBy);
            }
          }
          if (customer.updatedBy && typeof customer.updatedBy === 'object') {
            const userId = customer.updatedBy._id || customer.updatedBy;
            if (userId && !uniqueUsers.has(userId)) {
              uniqueUsers.set(userId, customer.updatedBy);
            }
          }
        });
        
        setUsers(Array.from(uniqueUsers.values()));
      } catch (error) {
        console.error('Failed to extract users', error);
      }
    };
    extractUsers();
  }, [customers]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: search || undefined,
      };
      const resp = await crmService.listCustomers(params);
      const items = resp.items || resp.data || [];
      const total = resp.pagination?.total || items.length;
      setCustomers(items);
      setPagination((prev) => ({ ...prev, total }));
    } catch (error) {
      console.error('Failed to fetch customers', error);
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, search, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (record) => {
    confirm({
      title: t('actions.deleteTitle'),
      content: t('actions.deleteConfirm'),
      okType: 'danger',
      onOk: async () => {
        try {
          await crmService.deleteCustomer(record._id);
          message.success(t('messages.deleteSuccess'));
          fetchData();
        } catch (error) {
          message.error(error?.response?.data?.message || t('messages.deleteFailed'));
        }
      },
    });
  };

  const handleChangePage = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const getFilteredAndSortedCustomers = () => {
    let filtered = [...customers];

    Object.keys(filteredInfo).forEach((key) => {
      const filterValue = filteredInfo[key];
      if (!filterValue || filterValue.length === 0) return;

      filtered = filtered.filter((record) => {
        if (key === 'name') {
          return record.name?.toLowerCase().includes(filterValue[0]?.toLowerCase() || '');
        }
        if (key === 'gender') {
          return record.gender === filterValue[0];
        }
        if (key === 'phone1' || key === 'phone2') {
          return record[key]?.toLowerCase().includes(filterValue[0]?.toLowerCase() || '');
        }
        if (key === 'email1' || key === 'email2') {
          return record[key]?.toLowerCase().includes(filterValue[0]?.toLowerCase() || '');
        }
        if (key === 'birthday') {
          try {
            const range = JSON.parse(filterValue[0]);
            if (!range.from || !range.to) return true;
            const recordDate = record.birthday ? new Date(record.birthday).getTime() : null;
            if (!recordDate) return false;
            const from = new Date(range.from).getTime();
            const to = new Date(range.to).getTime();
            return recordDate >= from && recordDate <= to;
          } catch (e) {
            return true;
          }
        }
        if (key === 'province') {
          const addr = record.address || {};
          return addr.provinceCode === filterValue[0] || addr.provinceName === filterValue[0];
        }
        if (key === 'ward') {
          const addr = record.address || {};
          return addr.wardName?.toLowerCase().includes(filterValue[0]?.toLowerCase() || '');
        }
        if (key === 'createdBy' || key === 'updatedBy') {
          const user = record[key];
          if (!user) return false;
          const userId = typeof user === 'object' ? (user._id || user) : user;
          return userId?.toString() === filterValue[0];
        }
        return true;
      });
    });

    if (sortedInfo.columnKey && sortedInfo.order) {
      filtered.sort((a, b) => {
        const column = sortedInfo.columnKey;
        let aValue, bValue;

        switch (column) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'gender':
            const order = { male: 1, female: 2, other: 3 };
            aValue = order[a.gender] || 0;
            bValue = order[b.gender] || 0;
            break;
          case 'phone1':
          case 'phone2':
          case 'email1':
          case 'email2':
            aValue = a[column] || '';
            bValue = b[column] || '';
            break;
          case 'birthday':
            aValue = a.birthday ? new Date(a.birthday).getTime() : 0;
            bValue = b.birthday ? new Date(b.birthday).getTime() : 0;
            break;
          case 'province':
            aValue = a.address?.provinceName || '';
            bValue = b.address?.provinceName || '';
            break;
          case 'ward':
            aValue = a.address?.wardName || '';
            bValue = b.address?.wardName || '';
            break;
          case 'createdAt':
          case 'updatedAt':
            aValue = a[column] ? new Date(a[column]).getTime() : 0;
            bValue = b[column] ? new Date(b[column]).getTime() : 0;
            break;
          case 'createdBy':
          case 'updatedBy':
            const aUser = a[column];
            const bUser = b[column];
            aValue = (typeof aUser === 'object' ? aUser?.fullName : '') || '';
            bValue = (typeof bUser === 'object' ? bUser?.fullName : '') || '';
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortedInfo.order === 'ascend'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortedInfo.order === 'ascend' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  };

  const startImport = async () => {
    if (!importFile) {
      message.error(t('messages.noFile'));
      return;
    }
    try {
      setLoading(true);
      const result = await crmService.importCustomers(importFile, {
        mode: importMode,
        duplicateContactAction,
      });
      message.success(t('messages.importSuccess'));
      setImportOpen(false);
      setImportFile(null);
      fetchData();
      return result;
    } catch (error) {
      console.error('Import failed', error);
      message.error(error?.response?.data?.message || t('messages.importFailed'));
    } finally {
      setLoading(false);
    }
  };

  const exportColumnOptions = [
    { value: 'name', label: t('fields.name') },
    { value: 'gender', label: t('fields.gender') },
    { value: 'birthday', label: t('fields.birthday') },
    { value: 'phone1', label: t('fields.phone1') },
    { value: 'phone2', label: t('fields.phone2') },
    { value: 'email1', label: t('fields.email1') },
    { value: 'email2', label: t('fields.email2') },
    { value: 'addressLine', label: t('fields.addressLine') },
    { value: 'provinceName', label: t('fields.provinceName') },
    { value: 'wardName', label: t('fields.wardName') },
    { value: 'note', label: t('fields.note') },
    { value: 'lastActivityAt', label: t('fields.lastActivityAt') },
  ];

  const filterFieldOptions = [
    { value: 'name', label: t('exportModal.filters.fields.name') },
    { value: 'phone1', label: t('exportModal.filters.fields.phone1') },
    { value: 'phone2', label: t('exportModal.filters.fields.phone2') },
    { value: 'email1', label: t('exportModal.filters.fields.email1') },
    { value: 'email2', label: t('exportModal.filters.fields.email2') },
    { value: 'gender', label: t('exportModal.filters.fields.gender') },
    { value: 'provinceName', label: t('exportModal.filters.fields.provinceName') },
  ];

  const filterOperatorOptions = [
    { value: 'contains', label: t('exportModal.filters.operators.contains') },
    { value: 'equals', label: t('exportModal.filters.operators.equals') },
  ];

  const addExportFilter = () => {
    setExportFilters((prev) => [
      ...prev,
      { field: 'name', operator: 'contains', value: [], joiner: 'and' },
    ]);
  };

  const updateExportFilter = (index, key, value) => {
    setExportFilters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const removeExportFilter = (index) => {
    setExportFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const getValueSelectProps = (field) => {
    switch (field) {
      case 'gender':
        return {
          mode: 'multiple',
          options: [
            { value: 'male', label: t('gender.male') },
            { value: 'female', label: t('gender.female') },
            { value: 'other', label: t('gender.other') },
          ],
        };
      case 'provinceName':
        return {
          mode: 'multiple',
          showSearch: true,
          optionFilterProp: 'label',
          options: (provinces || []).map(p => ({
            value: p.fullName || p.name,
            label: p.fullName || p.name,
          })),
        };
      case 'name':
      case 'phone1':
      case 'phone2':
      case 'email1':
      case 'email2':
      default:
        return {
          mode: 'tags',
          showSearch: true,
          tokenSeparators: [','],
          placeholder: t('exportModal.filters.valuePlaceholder'),
        };
    }
  };

  const doExport = async () => {
    try {
      setLoading(true);
      const resp = await crmService.exportCustomers({
        columns: exportColumns,
        filters: exportFilters,
      });
      const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success(t('messages.exportSuccess'));
      setExportOpen(false);
    } catch (error) {
      console.error('Export failed', error);
      message.error(error?.response?.data?.message || t('messages.exportFailed'));
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      setDownloading(true);
      await crmService.downloadSampleFile();
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) return;
    
    confirm({
      title: t('actions.deleteSelectedTitle'),
      content: t('actions.deleteSelectedConfirm', { count: selectedRowKeys.length }),
      okType: 'danger',
      onOk: async () => {
        try {
          await crmService.deleteCustomersBulk(selectedRowKeys);
          message.success(t('messages.deleteSelectedSuccess', { count: selectedRowKeys.length }));
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          console.error('Failed to delete customers:', error);
          message.error(error?.response?.data?.message || t('messages.deleteSelectedFailed'));
        }
      },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('page.title')}
          </Typography.Title>
          {selectedRowKeys.length > 0 && (
            <>
              <Tag color="blue" closable onClose={() => setSelectedRowKeys([])}>
                {t('page.selected', { count: selectedRowKeys.length })}
              </Tag>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSelected}
              >
                {t('page.deleteSelected')}
              </Button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            placeholder={t('page.searchPlaceholder')}
            allowClear
            size="large"
            style={{ maxWidth: 400, flex: 1 }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingId(null); setModalOpen(true); }}
            style={{
              background: '#1A237E',
              borderColor: '#1A237E',
            }}
          >
            {t('page.add')}
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            style={{
              borderColor: '#1A237E',
              color: '#1A237E',
            }}
          >
            {t('page.import')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportOpen(true)}
            style={{
              borderColor: '#1A237E',
              color: '#1A237E',
            }}
          >
            {t('page.export')}
          </Button>
          <Popover
              content={
                <div style={{ width: 320, padding: '8px 0' }}>
                  <Checkbox.Group
                    value={Object.keys(visibleColumns).filter(key => visibleColumns[key])}
                    onChange={(checkedValues) => {
                      const newVisibleColumns = {};
                      Object.keys(visibleColumns).forEach(key => {
                        newVisibleColumns[key] = checkedValues.includes(key);
                      });
                      setVisibleColumns(newVisibleColumns);
                    }}
                    style={{ width: '100%' }}
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Checkbox value="avatar">{t('table.columns.avatar')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="name">{t('table.columns.name')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="gender">{t('table.columns.gender')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="phone1">{t('table.columns.phone1')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="phone2">{t('table.columns.phone2')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="email1">{t('table.columns.email1')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="email2">{t('table.columns.email2')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="birthday">{t('table.columns.birthday')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="province">{t('table.columns.province')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="ward">{t('table.columns.ward')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="createdAt">{t('table.columns.createdAt')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="createdBy">{t('table.columns.createdBy')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="updatedAt">{t('table.columns.updatedAt')}</Checkbox>
                      </Col>
                      <Col span={12}>
                        <Checkbox value="updatedBy">{t('table.columns.updatedBy')}</Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </div>
              }
              title={t('page.columnPicker.title')}
              trigger="click"
              open={columnPopoverVisible}
              onOpenChange={setColumnPopoverVisible}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<SlidersOutlined style={{ fontSize: '20px' }} />}
                style={{ color: '#1A237E' }}
              />
            </Popover>
        </div>
      </div>

      <CRMTable
        t={t}
        loading={loading}
        data={customers}
        pagination={pagination}
        onChangePage={handleChangePage}
        onView={(id) => window.location.assign(`/vi/crm/${id}`)}
        onEdit={(id) => { setEditingId(id); setModalOpen(true); }}
        onDelete={handleDelete}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        visibleColumns={visibleColumns}
        sortedInfo={sortedInfo}
        filteredInfo={filteredInfo}
        handleTableChange={handleTableChange}
        getFilteredAndSortedCustomers={getFilteredAndSortedCustomers}
        provinces={provinces}
        users={users}
        expandedRowKeys={expandedRowKeys}
        setExpandedRowKeys={setExpandedRowKeys}
      />

      <CRMModal
        open={modalOpen}
        customerId={editingId}
        mode={editingId ? 'edit' : 'create'}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setEditingId(null);
        }}
        onDelete={() => {
          fetchData();
          setEditingId(null);
        }}
      />

      <ImportCRMModal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportFile(null); }}
        onStartImport={startImport}
        file={importFile}
        setFile={setImportFile}
        mode={importMode}
        setMode={setImportMode}
        duplicateContactAction={duplicateContactAction}
        setDuplicateContactAction={setDuplicateContactAction}
        downloading={downloading}
        onDownloadSample={downloadSample}
        t={t}
      />

      <ExportCRMModal
        open={exportOpen}
        loading={loading}
        exportColumns={exportColumns}
        setExportColumns={setExportColumns}
        exportColumnOptions={exportColumnOptions}
        exportFilters={exportFilters}
        addExportFilter={addExportFilter}
        updateExportFilter={updateExportFilter}
        removeExportFilter={removeExportFilter}
        filterFieldOptions={filterFieldOptions}
        filterOperatorOptions={filterOperatorOptions}
        getValueSelectProps={getValueSelectProps}
        onClose={() => setExportOpen(false)}
        onExport={doExport}
        t={t}
      />
    </div>
  );
};

export default CRMPage;
