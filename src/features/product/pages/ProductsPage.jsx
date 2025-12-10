import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Typography,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Popover,
  Checkbox,
  Select,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { productService } from '../product.service';
import { normalizeLocale } from '../../../utils/locale';
import ProductModal from '../components/ProductModal';
import ProductTable from '../components/ProductTable';
import ImportProductsModal from '../components/ImportProductsModal';
import ExportProductsModal from '../components/ExportProductsModal';

const { confirm } = Modal;

const ProductsPage = () => {
  const { locale } = useParams();
  const currentLocale = normalizeLocale(locale);
  const { t } = useTranslation('product');
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
  const [detailActionPopoverVisible, setDetailActionPopoverVisible] = useState({});
  const VISIBLE_COLUMNS_STORAGE_KEY = 'productTable.visibleColumns';
  const defaultVisibleColumns = {
    image: true,
    name: true,
    sku: true,
    barcode: true,
    salePrice: true,
    costPrice: true,
    brand: true,
    stock: true,
    allocated: true,
    status: true,
    createdAt: true,
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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch (err) {
      console.error('Failed to save visible columns to storage', err);
    }
  }, [visibleColumns]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importConfigModalVisible, setImportConfigModalVisible] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importOptions, setImportOptions] = useState({
    duplicateSkuAction: 'stop',
    duplicateBarcodeAction: 'stop',
    duplicateCategoryAction: 'link',
    duplicateBrandAction: 'link',
    duplicateVariantSkuAction: 'stop',
    missingRequiredFieldAction: 'skip',
    invalidImageUrlAction: 'skip',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [sheetSelectionModalVisible, setSheetSelectionModalVisible] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [filters, setFilters] = useState({
    name: null,
    sku: null,
    barcode: null,
    brand: null,
    status: null,
    createdBy: null,
    updatedBy: null,
    salePriceMin: null,
    salePriceMax: null,
    costPriceMin: null,
    costPriceMax: null,
    stockMin: null,
    stockMax: null,
    allocatedMin: null,
    allocatedMax: null,
  });
  const [sortedInfo, setSortedInfo] = useState({});
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportColumns, setExportColumns] = useState([
    'name', 'sku', 'barcode',
    'categoryId', 'categoryName', 'parentCategoryId', 'parentCategoryName',
    'brandId', 'brandName',
    'description',
    'status', 'allowSellOutOfStock', 'hasVariants',
    'cost', 'sale', 'stockOnHand',
    'variantSku', 'variantBarcode', 'variantAttributes',
    'variantCost', 'variantSale', 'variantStockOnHand',
    'imageMain', 'image1', 'image2', 'image3', 'image4',
    'createdAt', 'updatedAt',
    'createdById', 'createdByName', 'createdByEmail', 'createdByAvatar',
    'updatedById', 'updatedByName', 'updatedByEmail', 'updatedByAvatar'
  ]);
  const [exportFilters, setExportFilters] = useState([]);
  const [exportCategories, setExportCategories] = useState([]);

  const fetchBrands = useCallback(async () => {
    try {
      const brandsList = await productService.listBrands();
      setBrands(brandsList || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesResp = await productService.listCategories({ limit: 1000 });
      const items = categoriesResp?.data || categoriesResp?.items || categoriesResp?.categories || categoriesResp || [];
      setExportCategories(items);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const productsList = await productService.listProducts({ limit: 1000 });
      const allProducts = productsList.products || productsList.items || [];
      const uniqueUsers = new Map();
      
      allProducts.forEach(product => {
        if (product.createdBy && typeof product.createdBy === 'object') {
          const userId = product.createdBy._id || product.createdBy;
          if (userId && !uniqueUsers.has(userId)) {
            uniqueUsers.set(userId, product.createdBy);
          }
        }
        if (product.updatedBy && typeof product.updatedBy === 'object') {
          const userId = product.updatedBy._id || product.updatedBy;
          if (userId && !uniqueUsers.has(userId)) {
            uniqueUsers.set(userId, product.updatedBy);
          }
        }
      });
      
      setUsers(Array.from(uniqueUsers.values()));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
    fetchUsers();
    fetchCategories();
  }, [fetchBrands, fetchUsers, fetchCategories]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
      };
      const response = await productService.listProducts(params);
      const items = response.products || response.items || (Array.isArray(response) ? response : []);
      const total = response.pagination?.total || response.total || items.length;
      
      setProducts(items);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      message.error(t('productsPage.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchTerm, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  const handleSearchChange = (e) => {
    setSearchInputValue(e.target.value);
  };

  const handleDelete = (productId, productName) => {
    confirm({
      title: t('productsPage.delete.title'),
      content: t('productsPage.delete.message', { name: productName }),
      okText: t('productsPage.delete.confirm'),
      cancelText: t('productsPage.delete.cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          await productService.deleteProduct(productId);
          message.success(t('productsPage.messages.deleteSuccess'));
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
          message.error(t('productsPage.messages.deleteError'));
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) return;
    
    confirm({
      title: t('productsPage.deleteSelected.title'),
      content: t('productsPage.deleteSelected.content', { count: selectedRowKeys.length }),
      okText: t('productsPage.deleteSelected.confirm'),
      cancelText: t('productsPage.deleteSelected.cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          await productService.deleteProductsBulk(selectedRowKeys);
          message.success(t('productsPage.messages.deleteSelectedSuccess', { count: selectedRowKeys.length }));
          setSelectedRowKeys([]);
          fetchProducts();
        } catch (error) {
          console.error('Failed to delete products:', error);
          const errorMessage = error.response?.data?.message || t('productsPage.messages.deleteSelectedError');
          message.error(errorMessage);
        }
      },
    });
  };

  const handleView = (productId) => {
    navigate(`/${currentLocale}/products/${productId}`);
  };

  const handleEdit = (productId) => {
    setEditingProductId(productId);
    setProductModalOpen(true);
  };

  const handleDownloadSample = async () => {
    try {
      await productService.downloadSampleFile();
      message.success(t('productsPage.messages.downloadSampleSuccess'));
    } catch (error) {
      console.error('Failed to download sample file:', error);
      message.error(t('productsPage.messages.downloadSampleError'));
    }
  };

  const handleImportClick = () => {
    setImportConfigModalVisible(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      message.error(t('productsPage.import.invalidType'));
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Nếu là file Excel, đọc sheet names
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheets = workbook.SheetNames || [];
        
        if (sheets.length > 0) {
          setSheetNames(sheets);
          setSelectedSheets(sheets); // Mặc định chọn tất cả
          setSheetSelectionModalVisible(true);
        } else {
          message.warning(t('productsPage.import.noSheet'));
        }
      } catch (error) {
        console.error('Failed to read Excel file:', error);
        message.error(t('productsPage.import.readError'));
      }
    } else {
      // CSV file, không cần chọn sheet
      setImportConfigModalVisible(true);
    }
  };

  const handleStartImport = async () => {
    const file = selectedFile || fileInputRef.current?.files?.[0];
    if (!file) {
      message.error(t('productsPage.import.noFile'));
      return;
    }

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isExcel = fileExtension === '.xlsx' || fileExtension === '.xls';
    
    if (isExcel && selectedSheets.length === 0) {
      message.error(t('productsPage.import.noSheetSelected'));
      return;
    }

    setImportConfigModalVisible(false);
    setSheetSelectionModalVisible(false);
    setImportLoading(true);

    try {
      const options = {
        ...importOptions,
        ...(isExcel && selectedSheets.length > 0 ? { selectedSheets } : {}),
      };
      const result = await productService.importProducts(file, options);
      setImportResult(result.data || result);
      setImportModalVisible(true);
      
      if (result.data?.success > 0 || result.success > 0) {
        message.success(t('productsPage.messages.importSuccess', { count: result.data?.success || result.success }));
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to import products:', error);
      const errorMessage = error.response?.data?.message || t('productsPage.messages.importError');
      message.error(errorMessage);
    } finally {
      setImportLoading(false);
      setSelectedFile(null);
      setSheetNames([]);
      setSelectedSheets([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const params = {
        columns: exportColumns,
        filters: exportFilters,
      };
      const response = await productService.exportProducts(params);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success(t('productsPage.messages.exportSuccess'));
      setExportModalVisible(false);
    } catch (error) {
      console.error('Failed to export products:', error);
      const errorMessage = error.response?.data?.message || t('productsPage.messages.exportError');
      message.error(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const exportColumnOptions = [
    { value: 'name', label: t('productsPage.export.columns.name') },
    { value: 'sku', label: t('productsPage.export.columns.sku') },
    { value: 'barcode', label: t('productsPage.export.columns.barcode') },
    { value: 'categoryId', label: t('productsPage.export.columns.categoryId') },
    { value: 'categoryName', label: t('productsPage.export.columns.categoryName') },
    { value: 'parentCategoryId', label: t('productsPage.export.columns.parentCategoryId') },
    { value: 'parentCategoryName', label: t('productsPage.export.columns.parentCategoryName') },
    { value: 'brandId', label: t('productsPage.export.columns.brandId') },
    { value: 'brandName', label: t('productsPage.export.columns.brandName') },
    { value: 'description', label: t('productsPage.export.columns.description') },
    { value: 'status', label: t('productsPage.export.columns.status') },
    { value: 'allowSellOutOfStock', label: t('productsPage.export.columns.allowSellOutOfStock') },
    { value: 'hasVariants', label: t('productsPage.export.columns.hasVariants') },
    { value: 'cost', label: t('productsPage.export.columns.cost') },
    { value: 'sale', label: t('productsPage.export.columns.sale') },
    { value: 'stockOnHand', label: t('productsPage.export.columns.stockOnHand') },
    { value: 'variantSku', label: t('productsPage.export.columns.variantSku') },
    { value: 'variantBarcode', label: t('productsPage.export.columns.variantBarcode') },
    { value: 'variantAttributes', label: t('productsPage.export.columns.variantAttributes') },
    { value: 'variantCost', label: t('productsPage.export.columns.variantCost') },
    { value: 'variantSale', label: t('productsPage.export.columns.variantSale') },
    { value: 'variantStockOnHand', label: t('productsPage.export.columns.variantStockOnHand') },
    { value: 'imageMain', label: t('productsPage.export.columns.imageMain') },
    { value: 'image1', label: t('productsPage.export.columns.image1') },
    { value: 'image2', label: t('productsPage.export.columns.image2') },
    { value: 'image3', label: t('productsPage.export.columns.image3') },
    { value: 'image4', label: t('productsPage.export.columns.image4') },
    { value: 'createdAt', label: t('productsPage.export.columns.createdAt') },
    { value: 'updatedAt', label: t('productsPage.export.columns.updatedAt') },
    { value: 'createdById', label: t('productsPage.export.columns.createdById') },
    { value: 'createdByName', label: t('productsPage.export.columns.createdByName') },
    { value: 'createdByEmail', label: t('productsPage.export.columns.createdByEmail') },
    { value: 'createdByAvatar', label: t('productsPage.export.columns.createdByAvatar') },
    { value: 'updatedById', label: t('productsPage.export.columns.updatedById') },
    { value: 'updatedByName', label: t('productsPage.export.columns.updatedByName') },
    { value: 'updatedByEmail', label: t('productsPage.export.columns.updatedByEmail') },
    { value: 'updatedByAvatar', label: t('productsPage.export.columns.updatedByAvatar') },
  ];

  const filterFieldOptions = [
    { value: 'name', label: t('productsPage.export.filters.fields.name') },
    { value: 'sku', label: t('productsPage.export.filters.fields.sku') },
    { value: 'barcode', label: t('productsPage.export.filters.fields.barcode') },
    { value: 'status', label: t('productsPage.export.filters.fields.status') },
    { value: 'brandId', label: t('productsPage.export.filters.fields.brandId') },
    { value: 'categoryId', label: t('productsPage.export.filters.fields.categoryId') },
  ];

  const filterOperatorOptions = [
    { value: 'contains', label: t('productsPage.export.filters.operators.contains') },
    { value: 'equals', label: t('productsPage.export.filters.operators.equals') },
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
      case 'status':
        return {
          mode: 'multiple',
          options: [
            { value: 'active', label: 'active' },
            { value: 'inactive', label: 'inactive' },
            { value: 'draft', label: 'draft' },
          ],
        };
      case 'brandId':
        return {
          mode: 'multiple',
          showSearch: true,
          optionFilterProp: 'label',
          options: (brands || []).map(b => ({
            value: b._id || b.id || b.value,
            label: b.name || b.label || b.value,
          })),
        };
      case 'categoryId':
        return {
          mode: 'multiple',
          showSearch: true,
          optionFilterProp: 'label',
          options: (exportCategories || []).map(c => ({
            value: c._id || c.id || c.value,
            label: c.name || c.label || c.value,
          })),
        };
      case 'name':
      case 'sku':
      case 'barcode':
      default:
        return {
          mode: 'tags',
          showSearch: true,
          tokenSeparators: [','],
          placeholder: t('productsPage.export.filters.valuePlaceholder'),
        };
    }
  };

  const getNumericValue = (record, field) => {
    if (record.hasVariants && record.variants?.length > 0) {
      const values = record.variants
        .map(v => {
          if (field === 'salePrice') return v.pricing?.sale;
          if (field === 'costPrice') return v.pricing?.cost;
          if (field === 'stock') return v.inventory?.totalOnHand || 0;
          if (field === 'allocated') return 0;
          return null;
        })
        .filter(val => val !== null && val !== undefined);
      
      if (values.length === 0) return null;
      return field === 'salePrice' || field === 'costPrice' 
        ? Math.min(...values) 
        : values.reduce((sum, val) => sum + val, 0);
    }
    
    if (field === 'salePrice') return record.basePricing?.sale;
    if (field === 'costPrice') return record.basePricing?.cost;
    if (field === 'stock') return record.baseInventory?.stockOnHand || 0;
    if (field === 'allocated') return 0;
    return null;
  };

  const handleTableChange = (pagination, tableFilters, sorter) => {
    setSortedInfo(sorter);
    setFilteredInfo(tableFilters);
  };

  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Search locally across name, sku, barcode (base + variants)
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((record) => {
        const nameMatch = record.name?.toLowerCase().includes(q);
        const skuMatch = record.sku?.toLowerCase().includes(q);
        const baseBarcode = record.baseBarcodes?.[0]?.code || '';
        const baseBarcodeMatch = baseBarcode.toLowerCase().includes(q);
        const variantBarcodeMatch = (record.variants || []).some(v =>
          (v.barcodes || []).some(bc => bc.code?.toLowerCase().includes(q))
        );
        return nameMatch || skuMatch || baseBarcodeMatch || variantBarcodeMatch;
      });
    }
    const currentFilters = filteredInfo || {};
    const currentSorter = sortedInfo || {};

    if (currentFilters.name) {
      const nameFilter = currentFilters.name[0];
      if (nameFilter) {
        filtered = filtered.filter(record => 
          record.name?.toLowerCase().includes(nameFilter.toLowerCase())
        );
      }
    }

    if (currentFilters.sku) {
      const skuFilter = currentFilters.sku[0];
      if (skuFilter) {
        filtered = filtered.filter(record => 
          record.sku?.toLowerCase().includes(skuFilter.toLowerCase())
        );
      }
    }

    if (currentFilters.barcode) {
      const barcodeFilter = currentFilters.barcode[0];
      if (barcodeFilter) {
        filtered = filtered.filter(record => {
          if (record.hasVariants) return false;
          const barcode = record.baseBarcodes?.[0]?.code;
          return barcode?.toLowerCase().includes(barcodeFilter.toLowerCase());
        });
      }
    }

    if (currentFilters.brand) {
      filtered = filtered.filter(record => {
        const brand = record.brandId || record.brand;
        return brand?._id?.toString() === currentFilters.brand[0];
      });
    }

    if (currentFilters.status) {
      filtered = filtered.filter(record => 
        record.status === currentFilters.status[0]
      );
    }

    if (currentFilters.createdBy) {
      filtered = filtered.filter(record => {
        const creator = record.createdBy;
        if (!creator) return false;
        const creatorId = typeof creator === 'object' ? (creator._id || creator) : creator;
        return creatorId?.toString() === currentFilters.createdBy[0];
      });
    }

    if (currentFilters.updatedBy) {
      filtered = filtered.filter(record => {
        const updater = record.updatedBy;
        if (!updater) return false;
        const updaterId = typeof updater === 'object' ? (updater._id || updater) : updater;
        return updaterId?.toString() === currentFilters.updatedBy[0];
      });
    }

    if (currentFilters.salePrice) {
      const [min, max] = currentFilters.salePrice;
      filtered = filtered.filter(record => {
        const value = getNumericValue(record, 'salePrice');
        if (value === null) return false;
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
      });
    }

    if (currentFilters.costPrice) {
      const [min, max] = currentFilters.costPrice;
      filtered = filtered.filter(record => {
        const value = getNumericValue(record, 'costPrice');
        if (value === null) return false;
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
      });
    }

    if (currentFilters.stock) {
      const [min, max] = currentFilters.stock;
      filtered = filtered.filter(record => {
        const value = getNumericValue(record, 'stock');
        if (value === null) return false;
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
      });
    }

    if (currentFilters.allocated) {
      const [min, max] = currentFilters.allocated;
      filtered = filtered.filter(record => {
        const value = getNumericValue(record, 'allocated');
        if (value === null) return false;
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
      });
    }

    if (currentSorter.columnKey) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (currentSorter.columnKey) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'sku':
            aValue = a.sku || '';
            bValue = b.sku || '';
            break;
          case 'barcode':
            aValue = a.hasVariants ? '' : (a.baseBarcodes?.[0]?.code || '');
            bValue = b.hasVariants ? '' : (b.baseBarcodes?.[0]?.code || '');
            break;
          case 'salePrice':
            aValue = getNumericValue(a, 'salePrice') || 0;
            bValue = getNumericValue(b, 'salePrice') || 0;
            break;
          case 'costPrice':
            aValue = getNumericValue(a, 'costPrice') || 0;
            bValue = getNumericValue(b, 'costPrice') || 0;
            break;
          case 'stock':
            aValue = getNumericValue(a, 'stock') || 0;
            bValue = getNumericValue(b, 'stock') || 0;
            break;
          case 'allocated':
            aValue = getNumericValue(a, 'allocated') || 0;
            bValue = getNumericValue(b, 'allocated') || 0;
            break;
          case 'createdAt':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          case 'updatedAt':
            aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            break;
          default:
            return 0;
        }
        
        if (typeof aValue === 'string') {
          return currentSorter.order === 'ascend' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return currentSorter.order === 'ascend' 
          ? aValue - bValue
          : bValue - aValue;
      });
    }

    return filtered;
  };



  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('productsPage.title')}
          </Typography.Title>
          {selectedRowKeys.length > 0 && (
            <>
              <Tag color="blue" closable onClose={() => setSelectedRowKeys([])}>
                {t('productsPage.toolbar.selected', { count: selectedRowKeys.length })}
              </Tag>
          <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteSelected}
              >
                {t('productsPage.toolbar.deleteSelected')}
              </Button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Input
            placeholder={t('productsPage.toolbar.searchPlaceholder')}
              allowClear
              size="large"
              style={{ maxWidth: 400, flex: 1 }}
              value={searchInputValue}
              onChange={handleSearchChange}
                />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProductId(null);
              setProductModalOpen(true);
            }}
            style={{
              background: '#1A237E',
              borderColor: '#1A237E',
            }}
          >
            {t('productsPage.toolbar.add')}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{ display: 'none' }}
          />
          <Button
            icon={<UploadOutlined />}
            onClick={handleImportClick}
            style={{
              borderColor: '#1A237E',
              color: '#1A237E',
            }}
          >
            {t('productsPage.toolbar.import')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportModalVisible(true)}
            style={{
              borderColor: '#1A237E',
              color: '#1A237E',
            }}
          >
            {t('productsPage.toolbar.export')}
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
                      <Checkbox value="image">{t('productTable.columns.image')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="name">{t('productTable.columns.name')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="sku">{t('productTable.columns.sku')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="barcode">{t('productTable.columns.barcode')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="salePrice">{t('productTable.columns.salePrice')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="costPrice">{t('productTable.columns.costPrice')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="brand">{t('productTable.columns.brand')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="stock">{t('productTable.columns.stock')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="allocated">{t('productTable.columns.allocated')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="status">{t('productTable.columns.status')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="createdAt">{t('productTable.columns.createdAt')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="createdBy">{t('productTable.columns.createdBy')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="updatedAt">{t('productTable.columns.updatedAt')}</Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="updatedBy">{t('productTable.columns.updatedBy')}</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </div>
            }
            title={t('productsPage.columnPicker.title')}
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

      <ProductTable
        products={products}
        loading={loading}
        pagination={pagination}
        setPagination={setPagination}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        visibleColumns={visibleColumns}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        handleView={handleView}
        handleTableChange={handleTableChange}
        sortedInfo={sortedInfo}
        filteredInfo={filteredInfo}
        getFilteredAndSortedProducts={getFilteredAndSortedProducts}
        getNumericValue={getNumericValue}
        brands={brands}
        users={users}
        t={t}
        fetchProducts={fetchProducts}
        productService={productService}
        expandedRowKeys={expandedRowKeys}
        setExpandedRowKeys={setExpandedRowKeys}
        detailActionPopoverVisible={detailActionPopoverVisible}
        setDetailActionPopoverVisible={setDetailActionPopoverVisible}
      />

      <ProductModal
        open={productModalOpen}
        productId={editingProductId}
        mode={editingProductId ? 'edit' : 'create'}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProductId(null);
        }}
          onSuccess={() => {
          message.success(
            editingProductId
              ? (t('messages.updateSuccess') || 'Cập nhật sản phẩm thành công')
              : (t('messages.createSuccess') || 'Tạo sản phẩm thành công')
          );
            fetchProducts();
          setEditingProductId(null);
        }}
        onDelete={() => {
          message.success(t('messages.deleteSuccess') || 'Xóa sản phẩm thành công');
          fetchProducts();
          setEditingProductId(null);
        }}
      />

      <ExportProductsModal
        open={exportModalVisible}
        loading={exportLoading}
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
        onClose={() => setExportModalVisible(false)}
        onExport={handleExport}
      />

      <ImportProductsModal
        importConfigModalVisible={importConfigModalVisible}
        setImportConfigModalVisible={setImportConfigModalVisible}
        importModalVisible={importModalVisible}
        setImportModalVisible={setImportModalVisible}
        setImportResult={setImportResult}
        sheetSelectionModalVisible={sheetSelectionModalVisible}
        setSheetSelectionModalVisible={setSheetSelectionModalVisible}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        sheetNames={sheetNames}
        setSheetNames={setSheetNames}
        selectedSheets={selectedSheets}
        setSelectedSheets={setSelectedSheets}
        importOptions={importOptions}
        setImportOptions={setImportOptions}
        importResult={importResult}
        importLoading={importLoading}
        fileInputRef={fileInputRef}
        handleDownloadSample={handleDownloadSample}
        handleStartImport={handleStartImport}
      />
    </div>
  );
};

export default ProductsPage;
