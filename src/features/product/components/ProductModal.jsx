import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  TreeSelect,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Switch,
  Upload,
  Tag,
  Divider,
  Card,
  Collapse,
  Alert,
  Spin,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  EditOutlined,
  CloseOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Html5Qrcode } from 'html5-qrcode';
import { productService } from '../product.service';
import CategoryModal from './CategoryModal';
import BrandModal from './BrandModal';
import AttributeModal from './AttributeModal';
import AttributeValueModal from './AttributeValueModal';

const { Panel } = Collapse;

const CreateProductDialog = ({ open, onClose, onSuccess, productId = null, mode = 'create', onDelete }) => {
  const { t } = useTranslation('product');
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [errors, setErrors] = useState({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [attributeModalOpen, setAttributeModalOpen] = useState(false);
  const [attributeValueModalOpen, setAttributeValueModalOpen] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState(null);
  const [editingAttributeValueId, setEditingAttributeValueId] = useState(null);
  const [selectedAttributeIdForValue, setSelectedAttributeIdForValue] = useState(null);
  const [attributeModalContext, setAttributeModalContext] = useState({ variantIndex: null, attrIndex: null });
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [bulkEditData, setBulkEditData] = useState({
    cost: '',
    sale: '',
    stockOnHand: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    description: '',
    images: [],
    imageFiles: [],
    variants: [],
    baseBarcodes: [],
    basePricing: { cost: 0, sale: 0, currency: 'VND' },
    baseInventory: { stockOnHand: 0 },
    allowSellOutOfStock: false,
    hasVariants: false,
    status: 'active',
  });

  const [baseBarcode, setBaseBarcode] = useState('');
  const [variantBarcodes, setVariantBarcodes] = useState({});
  const [brandSearch, setBrandSearch] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  // Scanner for variants
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [scanningVariantIndex, setScanningVariantIndex] = useState(null);
  // Scanner for base (non-variant)
  const [isScanningBase, setIsScanningBase] = useState(false);
  const [scannerInstanceBase, setScannerInstanceBase] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const stopVariantScanner = useCallback(async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.stop();
        await scannerInstance.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setScannerInstance(null);
    setIsScanning(false);
    setScanningVariantIndex(null);
    Modal.destroyAll();
  }, [scannerInstance]);

  const stopBaseScanner = useCallback(async () => {
    if (scannerInstanceBase) {
      try {
        await scannerInstanceBase.stop();
        await scannerInstanceBase.clear();
      } catch (e) {
        console.error('Error stopping base scanner:', e);
      }
    }
    setScannerInstanceBase(null);
    setIsScanningBase(false);
    Modal.destroyAll();
  }, [scannerInstanceBase]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchBrands();
      fetchAttributes();
      if (mode === 'edit' && productId) {
        loadProduct(productId);
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await productService.listCategories();
      setCategories(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await productService.listBrands();
      setBrands(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      setLoadingAttributes(true);
      const attrs = await productService.listAttributes();
      const attrsArray = Array.isArray(attrs) ? attrs : (attrs?.items || attrs?.data || []);
      setAttributes(attrsArray);
      
      const values = await productService.listAttributeValues();
      const valuesArray = Array.isArray(values) ? values : (values?.items || values?.data || []);
      setAttributeValues(valuesArray);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const mapProductToForm = (product) => {
    const hasVariants = product.hasVariants;
    const baseBarcodes = product.baseBarcodes || [];
    const primaryBarcode = baseBarcodes.find(b => b.isPrimary) || baseBarcodes[0] || null;

    setBaseBarcode(primaryBarcode?.code || '');
    setVariantBarcodes({});

    const images = (product.images || []).map((img, idx) => ({
      url: img.url || img,
      isPrimary: idx === 0 || img.isPrimary,
    }));

    const mappedVariants = hasVariants
      ? (product.variants || []).map((v, idx) => {
          const primaryVariantBarcode = v.barcodes?.[0]?.code || '';
          setVariantBarcodes((prev) => ({ ...prev, [idx]: primaryVariantBarcode }));
          return {
            sku: v.sku || '',
            barcodes: v.barcodes || [],
            attributes: v.attributes || [],
            pricing: {
              cost: v.pricing?.cost || 0,
              sale: v.pricing?.sale || 0,
              currency: 'VND',
            },
            inventory: {
              totalOnHand: v.inventory?.totalOnHand || 0,
              warehouses: v.inventory?.warehouses || [],
            },
            status: v.status || 'active',
            metadata: v.metadata || {},
            allowSellOutOfStock: v.allowSellOutOfStock || false,
          };
        })
      : [];

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.categoryId?._id || product.categoryId || '',
      brandId: product.brandId?._id || product.brandId || '',
      description: product.description || '',
      images,
      imageFiles: [],
      variants: mappedVariants,
      baseBarcodes: hasVariants ? [] : (product.baseBarcodes || []),
      basePricing: {
        cost: product.basePricing?.cost || 0,
        sale: product.basePricing?.sale || 0,
        currency: 'VND',
      },
      baseInventory: {
        stockOnHand: product.baseInventory?.stockOnHand || 0,
      },
      allowSellOutOfStock: product.allowSellOutOfStock || false,
      hasVariants: hasVariants || false,
      status: product.status || 'active',
    });
    setVariantAttributes([]); // Keep as is; user can adjust
  };

  const loadProduct = async (id) => {
    try {
      setLoadingProduct(true);
      const data = await productService.getProductById(id);
      if (data) {
        mapProductToForm(data);
      }
    } catch (error) {
      console.error('Failed to load product', error);
    } finally {
      setLoadingProduct(false);
    }
  };

  const buildCategoryTreeData = useMemo(() => {
    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), { 
        title: cat.name,
        value: cat._id.toString(),
        key: cat._id.toString(),
        children: []
      });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId.toString());
        if (parent) {
          parent.children.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }, [categories]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands;
    const searchLower = brandSearch.toLowerCase();
    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(searchLower)
    );
  }, [brands, brandSearch]);

  const imageFileList = useMemo(() => {
    return formData.images.map((img, index) => ({
      uid: `img-${index}`,
      name: `Image ${index + 1}`,
      status: 'done',
      url: typeof img === 'string' ? img : img.url,
    }));
  }, [formData.images]);

  const generateVariantSku = (index) => {
    if (!formData.sku) return '';
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `${formData.sku}-${paddedIndex}`;
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BC${timestamp}${random}`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => {
        const newData = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
        if (field === 'basePricing.cost' && value !== null && value !== undefined) {
          if (prev.basePricing.sale === 0 || prev.basePricing.sale === prev.basePricing.cost) {
            newData[parent].sale = value;
          }
        }
        return newData;
      });
    } else {
      setFormData((prev) => {
        // Special handling when toggling hasVariants to keep base barcode for non-variant products
        if (field === 'hasVariants') {
          const newData = {
            ...prev,
            [field]: value,
          };

          if (value === true) {
            // Switching to variants mode: clear base barcodes and ensure at least one variant
            newData.baseBarcodes = [];
            if (prev.variants.length === 0 && prev.sku.trim()) {
              const firstVariant = {
                sku: generateVariantSku(0),
                barcodes: [],
                attributes: [],
                pricing: {
                  cost: 0,
                  sale: 0,
                  currency: 'VND',
                },
            inventory: {
              totalOnHand: 0,
              warehouses: [],
            },
                status: 'active',
                metadata: {},
                allowSellOutOfStock: false,
              };
              newData.variants = [firstVariant];
              setVariantBarcodes({ 0: '' });
            }
          } else {
            // Switching back to non-variant: clear variants and restore base barcode from state
            newData.variants = [];
            const trimmedBarcode = baseBarcode.trim();
            newData.baseBarcodes = trimmedBarcode
              ? [{
                  code: trimmedBarcode,
                  isPrimary: true,
                }]
              : [];
          }
          return newData;
        }

        const newData = {
          ...prev,
          [field]: value,
        };
        return newData;
      });
    }
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const setBaseBarcodeState = useCallback((value) => {
    const normalized = `${value ?? ''}`;
    const trimmed = normalized.trim();
    setBaseBarcode(trimmed);
    setFormData((prev) => ({
      ...prev,
      baseBarcodes: trimmed
        ? [{
            code: trimmed,
            isPrimary: true,
          }]
        : [],
    }));
  }, []);

  const handleBaseBarcodeChange = (value) => {
    setBaseBarcodeState(value);
  };

  const formatVariantDisplay = (variant) => {
    if (!variant.attributes || variant.attributes.length === 0) {
      return '';
    }
    const displayParts = variant.attributes.map(attr => {
      const selectedAttr = attributes.find(a => {
        const aId = a._id?.toString();
        const attrId = attr.attributeId?.toString();
        return aId === attrId;
      });
      const selectedValue = attributeValues.find(v => {
        const vId = v._id?.toString();
        const attrValueId = attr.valueId?.toString();
        return vId === attrValueId;
      });
      if (selectedAttr && selectedValue) {
        return `${selectedAttr.name}: ${selectedValue.value}`;
      }
      return '';
    }).filter(Boolean);
    return displayParts.join(' - ');
  };

  const handleVariantBarcodeScan = async (variantIndex) => {
    if (isScanning) {
      if (scannerInstance) {
        try {
          await scannerInstance.stop();
          await scannerInstance.clear();
        } catch (e) {
          console.error('Error stopping scanner:', e);
        }
        setScannerInstance(null);
        setIsScanning(false);
        setScanningVariantIndex(null);
      }
      return;
    }

    const scannerId = `barcode-scanner-${Date.now()}`;
    setIsScanning(true);
    setScanningVariantIndex(variantIndex);

    let html5QrCode = null;

    const cleanup = async () => {
      if (html5QrCode) {
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
        } catch (e) {
          console.error('Error stopping scanner:', e);
        }
      }
      setScannerInstance(null);
      setIsScanning(false);
      setScanningVariantIndex(null);
      Modal.destroyAll();
    };

    Modal.info({
      title: t('productModal.scanner.title'),
      icon: null,
      content: (
        <div>
          <div id={scannerId} style={{ width: '100%', marginTop: 16, minHeight: '300px' }}></div>
        </div>
      ),
      width: 500,
      maskClosable: false,
      closable: true,
      footer: null,
      onCancel: cleanup,
    });

    setTimeout(async () => {
      const element = document.getElementById(scannerId);
      if (!element) {
        Modal.error({ 
          title: t('productModal.scanner.errorTitle'),
          content: t('productModal.scanner.initError')
        });
        setIsScanning(false);
        setScanningVariantIndex(null);
        Modal.destroyAll();
        return;
      }

      html5QrCode = new Html5Qrcode(scannerId);
      setScannerInstance(html5QrCode);

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleVariantBarcodeChange(variantIndex, decodedText);
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              setScannerInstance(null);
              setIsScanning(false);
              setScanningVariantIndex(null);
              Modal.destroyAll();
            }).catch((err) => {
              console.error('Error stopping scanner:', err);
            });
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        Modal.error({ 
          title: t('productModal.scanner.cameraErrorTitle'), 
          content: t('productModal.scanner.cameraErrorContent') 
        });
        setScannerInstance(null);
        setIsScanning(false);
        setScanningVariantIndex(null);
        Modal.destroyAll();
      }
    }, 100)
  };

  const handleBaseBarcodeScan = async () => {
    if (isScanningBase) {
      if (scannerInstanceBase) {
        try {
          await scannerInstanceBase.stop();
          await scannerInstanceBase.clear();
        } catch (e) {
          console.error('Error stopping base scanner:', e);
        }
        setScannerInstanceBase(null);
        setIsScanningBase(false);
      }
      return;
    }

    const scannerId = `barcode-scanner-base-${Date.now()}`;
    setIsScanningBase(true);

    let html5QrCode = null;

    const cleanup = async () => {
      if (html5QrCode) {
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
        } catch (e) {
          console.error('Error stopping base scanner:', e);
        }
      }
      setScannerInstanceBase(null);
      setIsScanningBase(false);
      Modal.destroyAll();
    };

    Modal.info({
      title: t('productModal.scanner.title'),
      icon: null,
      content: (
        <div>
          <div id={scannerId} style={{ width: '100%', marginTop: 16, minHeight: '300px' }}></div>
        </div>
      ),
      width: 500,
      maskClosable: false,
      closable: true,
      footer: null,
      onCancel: cleanup,
    });

    setTimeout(async () => {
      const element = document.getElementById(scannerId);
      if (!element) {
        Modal.error({ 
          title: t('productModal.scanner.errorTitle'), 
          content: t('productModal.scanner.initError') 
        });
        setIsScanningBase(false);
        Modal.destroyAll();
        return;
      }

      html5QrCode = new Html5Qrcode(scannerId);
      setScannerInstanceBase(html5QrCode);

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setBaseBarcodeState(decodedText);
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              setScannerInstanceBase(null);
              setIsScanningBase(false);
              Modal.destroyAll();
            }).catch((err) => {
              console.error('Error stopping base scanner:', err);
            });
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        );
      } catch (err) {
        console.error('Error starting base scanner:', err);
        Modal.error({ 
          title: t('productModal.scanner.cameraErrorTitle'), 
          content: t('productModal.scanner.cameraErrorContent') 
        });
        setScannerInstanceBase(null);
        setIsScanningBase(false);
        Modal.destroyAll();
      }
    }, 100)
  };

  const handleVariantBarcodeChange = (variantIndex, value) => {
    const normalized = `${value ?? ''}`;
    const trimmed = normalized.trim();
    setVariantBarcodes((prev) => ({
      ...prev,
      [variantIndex]: normalized,
    }));
    if (trimmed) {
      handleVariantChange(variantIndex, 'barcodes', [{
        code: trimmed,
        isPrimary: true,
      }]);
    } else {
      handleVariantChange(variantIndex, 'barcodes', []);
    }
  };

  const handleImageSelect = (file, fileList) => {
    if (!file.type || !file.type.startsWith('image/')) {
      Modal.error({ title: t('productModal.upload.invalidTitle'), content: t('productModal.upload.imageOnly') });
      return Upload.LIST_IGNORE;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      Modal.error({ title: t('productModal.upload.tooLargeTitle'), content: t('productModal.upload.tooLargeContent', { name: file.name, max: 2 }) });
      return Upload.LIST_IGNORE;
    }

    const currentCount = formData.imageFiles.length;
    const remainingSlots = 5 - currentCount;
    
    if (remainingSlots <= 0) {
      Modal.error({ 
        title: t('productModal.upload.limitTitle'), 
        content: t('productModal.upload.limitContent') 
      });
      return Upload.LIST_IGNORE;
    }

    const filesInCurrentSelection = fileList.filter(f => 
      f.originFileObj && f.status !== 'done' && f.status !== 'removed'
    ).length;

    if (filesInCurrentSelection > remainingSlots) {
      Modal.warning({ 
        title: t('productModal.upload.tooManyTitle'), 
        content: t('productModal.upload.tooManyContent', { selected: filesInCurrentSelection, remaining: remainingSlots }) 
      });
      return Upload.LIST_IGNORE;
    }

    const previewUrl = URL.createObjectURL(file);
    const isFirstImage = formData.images.length === 0;
    setFormData((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, file],
      images: [...prev.images, {
        url: previewUrl,
        isPrimary: isFirstImage,
      }],
    }));

    return false;
  };

  const handleCustomFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentCount = formData.imageFiles.length;
    const remainingSlots = 5 - currentCount;

    if (remainingSlots <= 0) {
      Modal.warning({ 
        title: t('productModal.upload.limitTitle'), 
        content: t('productModal.upload.limitContentExisting') 
      });
      event.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const invalidFiles = [];
    const validFiles = [];

    filesToProcess.forEach((file) => {
      if (!file.type || !file.type.startsWith('image/')) {
        invalidFiles.push({ name: file.name || t('productModal.upload.unknownName'), reason: t('productModal.upload.reasonNotImage') });
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        invalidFiles.push({ name: file.name || t('productModal.upload.unknownName'), reason: t('productModal.upload.reasonTooLarge', { max: 2 }) });
        return;
      }

      validFiles.push(file);
    });

    if (files.length > remainingSlots) {
      Modal.warning({ 
        title: t('productModal.upload.tooManyTitle'), 
        content: t('productModal.upload.tooManyContent', { selected: files.length, remaining: remainingSlots }) 
      });
    }

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => `- ${f.name} (${f.reason})`).join('\n');
      Modal.warning({ 
        title: t('productModal.upload.invalidListTitle'), 
        content: t('productModal.upload.invalidListContent', { files: invalidNames }) 
      });
    }

    if (validFiles.length > 0) {
      const newImageFiles = [];
      const newImages = [];

      const existingImagesCount = formData.images.length;
      validFiles.forEach((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        newImageFiles.push(file);
        newImages.push({
          url: previewUrl,
          isPrimary: existingImagesCount === 0 && index === 0,
        });
      });
    
    setFormData((prev) => ({
      ...prev,
        imageFiles: [...prev.imageFiles, ...newImageFiles],
        images: [...prev.images, ...newImages],
    }));
    }
    
    event.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      const newImageFiles = [...prev.imageFiles];
      
      const imageToRemove = newImages[index];
      const imageUrl = typeof imageToRemove === 'string' ? imageToRemove : imageToRemove.url;
      
      if (imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      
      newImages.splice(index, 1);
      newImageFiles.splice(index, 1);

      if (newImages.length > 0 && imageToRemove?.isPrimary) {
        newImages[0].isPrimary = true;
      }
      
      return {
        ...prev,
        images: newImages,
        imageFiles: newImageFiles,
      };
    });
  };

  const handleAddVariant = () => {
    const index = formData.variants.length;
    const newVariant = {
      sku: generateVariantSku(index),
      barcodes: [],
      attributes: [],
      pricing: {
        cost: 0,
        sale: 0,
        currency: 'VND',
      },
      inventory: {
        totalOnHand: 0,
        totalAllocated: 0,
        warehouses: [],
      },
      status: 'active',
      metadata: {},
      allowSellOutOfStock: false,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
    setVariantBarcodes((prev) => ({
      ...prev,
      [index]: '',
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants.splice(index, 1);

      return {
        ...prev,
        variants: newVariants,
      };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
        const newVariants = [...prev.variants];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newVariants[index] = {
          ...newVariants[index],
          [parent]: {
            ...newVariants[index][parent],
            [child]: value,
          },
        };
        if (field === 'pricing.cost' && value !== null && value !== undefined) {
          const currentSale = newVariants[index].pricing?.sale || 0;
          const currentCost = prev.variants[index].pricing?.cost || 0;
          if (currentSale === 0 || currentSale === currentCost) {
            newVariants[index].pricing.sale = value;
          }
        }
      } else {
        newVariants[index] = {
          ...newVariants[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        variants: newVariants,
      };
    });
  };


  const generateAllVariants = () => {
    if (variantAttributes.length === 0) {
      Modal.warning({
        title: t('productModal.variantGen.noAttributeTitle'),
        content: t('productModal.variantGen.noAttributeContent'),
      });
      return;
    }

    const attributeValueLists = variantAttributes
      .filter(attr => attr.attributeId && attr.valueIds && attr.valueIds.length > 0)
      .map(attr => {
        const values = attributeValues.filter(v => attr.valueIds.includes(v._id));
        return values.map(v => ({
          attributeId: attr.attributeId,
          valueId: v._id,
        }));
      });

    if (attributeValueLists.length === 0) {
      Modal.warning({
        title: t('productModal.variantGen.noValueTitle'),
        content: t('productModal.variantGen.noValueContent'),
      });
      return;
    }

    const combinations = attributeValueLists.reduce((acc, current) => {
      if (acc.length === 0) {
        return current.map(item => [item]);
      }
      const result = [];
      acc.forEach(combination => {
        current.forEach(item => {
          result.push([...combination, item]);
        });
      });
      return result;
    }, []);

    if (combinations.length === 0) {
      Modal.warning({
        title: t('productModal.variantGen.cannotGenerateTitle'),
        content: t('productModal.variantGen.noValueContent'),
      });
      return;
    }

    const newVariants = combinations.map((combination, index) => {
      const existingCount = formData.variants.length;
      return {
        sku: generateVariantSku(existingCount + index),
        barcodes: [],
        attributes: combination,
        pricing: {
          cost: 0,
          sale: 0,
          currency: 'VND',
        },
        inventory: {
          totalOnHand: 0,
          totalAllocated: 0,
          warehouses: [],
        },
        status: 'active',
        metadata: {},
        allowSellOutOfStock: false,
      };
    });

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));

    const newVariantBarcodes = {};
    newVariants.forEach((_, idx) => {
      const actualIndex = formData.variants.length + idx;
      newVariantBarcodes[actualIndex] = '';
    });
    setVariantBarcodes((prev) => ({ ...prev, ...newVariantBarcodes }));

    Modal.success({
      title: t('productModal.variantGen.successTitle'),
      content: t('productModal.variantGen.successContent', { count: newVariants.length }),
    });
  };

  const handleAddVariantAttribute = () => {
    setVariantAttributes([...variantAttributes, { attributeId: '', valueIds: [] }]);
  };

  const handleRemoveVariantAttribute = (index) => {
    setVariantAttributes(variantAttributes.filter((_, i) => i !== index));
  };

  const handleVariantAttributeChange = (index, field, value) => {
    const newAttributes = [...variantAttributes];
    if (field === 'attributeId') {
      newAttributes[index] = { attributeId: value, valueIds: [] };
    } else if (field === 'valueIds') {
      newAttributes[index] = { ...newAttributes[index], valueIds: value };
    }
    setVariantAttributes(newAttributes);
  };

  const handleVariantAddBarcode = (variantIndex) => {
    const newBarcode = {
      code: generateBarcode(),
      isPrimary: formData.variants[variantIndex].barcodes.length === 0,
    };
    handleVariantChange(variantIndex, 'barcodes', [...formData.variants[variantIndex].barcodes, newBarcode]);
  };

  const handleVariantRemoveBarcode = (variantIndex, barcodeIndex) => {
    const newBarcodes = formData.variants[variantIndex].barcodes.filter((_, i) => i !== barcodeIndex);
    handleVariantChange(variantIndex, 'barcodes', newBarcodes);
  };

  const handleBulkEdit = () => {
    const updates = {};
    if (bulkEditData.cost !== '') updates.cost = parseFloat(bulkEditData.cost) || 0;
    if (bulkEditData.sale !== '') updates.sale = parseFloat(bulkEditData.sale) || 0;
    if (bulkEditData.stockOnHand !== '') updates.stockOnHand = parseFloat(bulkEditData.stockOnHand) || 0;

    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => ({
        ...variant,
        pricing: {
          ...variant.pricing,
          ...(updates.cost !== undefined && { cost: updates.cost }),
          ...(updates.sale !== undefined && { sale: updates.sale }),
        },
        inventory: {
          ...variant.inventory,
          ...(updates.stockOnHand !== undefined && { totalOnHand: updates.stockOnHand }),
        },
      })),
    }));

    setBulkEditOpen(false);
    setBulkEditData({ cost: '', sale: '', stockOnHand: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('productModal.errors.nameRequired');
    }
    if (!formData.sku.trim()) {
      newErrors.sku = t('productModal.errors.skuRequired');
    }
    if (formData.hasVariants) {
      if (formData.variants.length === 0) {
        newErrors.variants = t('productModal.errors.variantsRequired');
      }
      formData.variants.forEach((variant, index) => {
        if (!variant.sku.trim()) {
          newErrors[`variant_${index}_sku`] = t('productModal.errors.variantSkuRequired');
        }
      });
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setActiveTab('info');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: formData.categoryId || undefined,
        brandId: formData.brandId || undefined,
        description: formData.description && formData.description.trim() ? formData.description.trim() : undefined,
        variants: formData.hasVariants ? formData.variants.map((v) => ({
          sku: v.sku.trim(),
          barcodes: v.barcodes || [],
          attributes: v.attributes || [],
          pricing: {
            cost: parseFloat(v.pricing?.cost) || 0,
            sale: parseFloat(v.pricing?.sale) || 0,
            currency: 'VND',
          },
          inventory: {
            totalOnHand: parseFloat(v.inventory?.totalOnHand) || 0,
            warehouses: v.inventory?.warehouses || [],
          },
          status: v.status || 'active',
          metadata: v.metadata || {},
          allowSellOutOfStock: v.allowSellOutOfStock || false,
        })) : [],
        baseBarcodes: formData.hasVariants ? [] : formData.baseBarcodes,
        basePricing: {
          cost: parseFloat(formData.basePricing.cost) || 0,
          sale: parseFloat(formData.basePricing.sale) || 0,
          currency: 'VND',
        },
        baseInventory: {
          stockOnHand: parseFloat(formData.baseInventory.stockOnHand) || 0,
        },
        allowSellOutOfStock: formData.allowSellOutOfStock,
        hasVariants: formData.hasVariants,
        status: formData.status,
      };

      // Ensure base barcode is applied for non-variant products even if state desync
      if (!formData.hasVariants) {
        const trimmedBase = baseBarcode.trim();
        if (trimmedBase && (!payload.baseBarcodes || payload.baseBarcodes.length === 0)) {
          payload.baseBarcodes = [{
            code: trimmedBase,
            isPrimary: true,
          }];
        }
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      if (formData.imageFiles.length > 0) {
        payload.images = [];
      } else {
        const images = formData.images.map((img, index) => {
          if (typeof img === 'string') {
            return { url: img, isPrimary: index === 0 };
          }
          return img;
        });

        if (images.length > 0 && !images.some(img => img.isPrimary)) {
          images[0].isPrimary = true;
        }

        payload.images = images;
      }

      const files = {
        productImages: formData.imageFiles,
      };

      if (mode === 'edit' && productId) {
        await productService.updateProduct(productId, payload, files);
        onSuccess?.();
        onClose();
      } else {
        await productService.createProduct(payload, files);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      setErrors({ submit: error.response?.data?.message || t('productModal.errors.submit') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!(mode === 'edit' && productId)) return;
    Modal.confirm({
      title: t('productModal.deleteModal.title'),
      content: t('productModal.deleteModal.content'),
      okText: t('productModal.common.delete'),
      okType: 'danger',
      cancelText: t('productModal.common.cancel'),
      onOk: async () => {
        try {
          await productService.deleteProduct(productId);
          onDelete?.();
          onClose();
        } catch (error) {
          console.error('Failed to delete product:', error);
          setErrors({ submit: error.response?.data?.message || t('productModal.errors.delete') });
        }
      },
    });
  };

  const resetForm = useCallback(async () => {
    await stopVariantScanner();
    await stopBaseScanner();

    formData.images.forEach((image) => {
      const imageUrl = typeof image === 'string' ? image : image.url;
      if (imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    });

    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      brandId: '',
      description: '',
      images: [],
      imageFiles: [],
      variants: [],
      baseBarcodes: [],
      basePricing: { cost: 0, sale: 0, currency: 'VND' },
      baseInventory: { stockOnHand: 0 },
      allowSellOutOfStock: false,
      hasVariants: false,
      status: 'active',
    });
    setActiveTab('info');
    setErrors({});
    setBaseBarcode('');
    setVariantBarcodes({});
    setBrandSearch('');
    setVariantAttributes([]);
    setIsProcessingBatch(false);
  }, [formData.images, stopBaseScanner, stopVariantScanner]);

  const handleClose = async () => {
    if (!loading) {
      await resetForm();
      onClose();
    }
  };

  useEffect(() => {
    if (!open && mode === 'create') {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedCategory = categories.find((c) => c._id === formData.categoryId);
  const selectedBrand = brands.find((b) => b._id === formData.brandId);


  return (
    <>
      <style>{`
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-select-selector,
        .ant-input-number {
          border: 1px solid #d9d9d9 !important;
          box-shadow: none !important;
        }
        .ant-input-affix-wrapper .ant-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .ant-input:focus,
        .ant-input-focused,
        .ant-input-affix-wrapper-focused,
        .ant-select-focused .ant-select-selector,
        .ant-input-number-focused,
        .ant-input:hover,
        .ant-input-affix-wrapper:hover:not(.ant-input-affix-wrapper-disabled),
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
        .ant-input-number:hover:not(.ant-input-number-disabled) {
          border: 1px solid #1A237E !important;
          box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2) !important;
        }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border: 1px solid #1A237E !important;
          box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2) !important;
        }
        .ant-input-affix-wrapper:focus .ant-input,
        .ant-input-affix-wrapper-focused .ant-input {
          border: none !important;
          box-shadow: none !important;
        }
        .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover {
          border: 1px solid #1A237E !important;
          box-shadow: none !important;
        }
        .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover .ant-input {
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <Modal
      open={open}
        onCancel={handleClose}
        width="70%"
        footer={null}
        closable={false}
        bodyStyle={{ padding: 0, height: '85vh', display: 'flex', flexDirection: 'column' }}
        style={{ top: '5vh' }}
        zIndex={2000}
        getContainer={() => document.body}
        maskClosable={false}
    >
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          gap: 12,
        }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#1f2937' }}>
            {mode === 'edit' ? t('productModal.header.editTitle') : t('productModal.header.createTitle')}
          </Typography.Title>
          <Space>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleClose}
              disabled={loading}
              style={{ color: '#64748b' }}
            />
          </Space>
        </div>

        <div style={{ padding: '0 16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginTop: 0 }}
            items={[
              { key: 'info', label: t('productModal.tabs.info') },
              { key: 'description', label: t('productModal.tabs.description') },
            ]}
          />
        </div>

        <div style={{ padding: '0 16px 16px', flex: 1, overflow: 'auto', height: '100%' }}>
        {errors.submit && (
            <Alert type="error" message={errors.submit} showIcon style={{ marginTop: 16 }} />
        )}

          {activeTab === 'info' && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={24}>
                  <Col span={16}>
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={<span>{t('productModal.fields.sku.label')} <span style={{ color: '#ff4d4f' }}>*</span></span>}
                            validateStatus={errors.sku ? 'error' : ''}
                            help={errors.sku}
                          >
                            <Input
                              value={formData.sku}
                              onChange={(e) => handleChange('sku', e.target.value)}
                              placeholder={t('productModal.fields.sku.placeholder')}
                />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={t('productModal.fields.status.label')}>
                            <Select
                              value={formData.status}
                              onChange={(value) => handleChange('status', value)}
                              options={[
                                { value: 'draft', label: t('productModal.fields.status.options.draft') },
                                { value: 'active', label: t('productModal.fields.status.options.active') },
                                { value: 'inactive', label: t('productModal.fields.status.options.inactive') },
                              ]}
                />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            label={<span>{t('productModal.fields.name.label')} <span style={{ color: '#ff4d4f' }}>*</span></span>}
                            validateStatus={errors.name ? 'error' : ''}
                            help={errors.name}
                          >
                            <Input
                              value={formData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              placeholder={t('productModal.fields.name.placeholder')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label={t('productModal.fields.category.label')}>
                            <TreeSelect
                              showSearch
                              allowClear
                              value={selectedCategory ? selectedCategory._id : undefined}
                              placeholder={t('productModal.fields.category.placeholder')}
                              treeData={buildCategoryTreeData}
                              treeDefaultExpandAll
                              onChange={(value) => {
                                handleChange('categoryId', value || '');
                              }}
                              notFoundContent={loadingCategories ? <Spin size="small" /> : t('productModal.fields.category.notFound')}
                              dropdownRender={(menu) => (
                                <>
                                  <div style={{ padding: 8 }}>
                  <Button
                                      type="dashed"
                                      icon={<PlusOutlined />}
                                      block
                    onClick={() => setCategoryModalOpen(true)}
                                    >
                                      {t('productModal.fields.category.addNew')}
                  </Button>
                                  </div>
                                  <Divider style={{ margin: 0 }} />
                                  {menu}
                                </>
                              )}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item label={t('productModal.fields.brand.label')}>
                  <Select
                              showSearch
                              allowClear
                              value={selectedBrand ? selectedBrand._id : undefined}
                              placeholder={t('productModal.fields.brand.placeholder')}
                              onSearch={(value) => setBrandSearch(value)}
                              onChange={(value) => {
                                handleChange('brandId', value || '');
                                setBrandSearch('');
                              }}
                              notFoundContent={loadingBrands ? <Spin size="small" /> : (brandSearch ? t('productModal.fields.brand.notFound') : null)}
                              filterOption={false}
                              options={filteredBrands.map((item) => ({
                                label: item.name,
                                value: item._id,
                              }))}
                              dropdownRender={(menu) => (
                                <>
                                  <div style={{ padding: 8 }}>
                                    <Button
                                      type="dashed"
                                      icon={<PlusOutlined />}
                                      block
                                      onClick={() => setBrandModalOpen(true)}
                                    >
                                      {t('productModal.fields.brand.addNew')}
                                    </Button>
                                  </div>
                                  <Divider style={{ margin: 0 }} />
                                  {menu}
                                </>
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                  <Col span={6}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: '235px', flexShrink: 0 }}>
                        {formData.images.length > 0 ? (
                          <div style={{ 
                            width: '235px',
                            height: '235px',
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            overflow: 'hidden',
                          position: 'relative',
                            backgroundColor: '#f9fafb',
                          }}>
                            <img
                              src={typeof formData.images[0] === 'string' ? formData.images[0] : formData.images[0]?.url}
                              alt={t('productModal.images.mainAlt')}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveImage(0)}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: '#fff',
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ position: 'relative', width: '235px', height: '235px' }}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              style={{ 
                            position: 'absolute',
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 1
                              }}
                              onChange={handleCustomFileSelect}
                            />
                            <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                              height: '100%',
                              border: '1px dashed #d9d9d9',
                              borderRadius: '8px',
                              backgroundColor: '#fafafa',
                              pointerEvents: 'none'
                            }}>
                              <UploadOutlined style={{ fontSize: 32, color: '#64748b' }} />
                              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{t('productModal.images.add')}</div>
                              <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                                {t('productModal.images.sizeHint')}
                              </Typography.Text>
                              {formData.imageFiles.length > 0 && (
                                <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                                  {t('productModal.images.remaining', { count: 5 - formData.imageFiles.length })}
                                </Typography.Text>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, width: '52px', height: '235px', justifyContent: 'space-between' }}>
                        {Array.from({ length: 4 }).map((_, index) => {
                          const imageIndex = index + 1;
                          const hasImage = formData.images.length > imageIndex;
                          const smallSize = (235 - 3 * 8) / 4;
                          
                          if (hasImage) {
                            return (
                              <div
                                key={imageIndex}
                                style={{
                                  width: `${smallSize}px`,
                                  height: `${smallSize}px`,
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  backgroundColor: '#f9fafb',
                                }}
                              >
                                <img
                                  src={typeof formData.images[imageIndex] === 'string' ? formData.images[imageIndex] : formData.images[imageIndex].url}
                                  alt={t('productModal.images.thumbnailAlt', { index: imageIndex + 1 })}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveImage(imageIndex)}
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#fff',
                                    padding: '2px 4px',
                                    minWidth: 'auto',
                                    height: 'auto',
                      }}
                                />
                              </div>
                            );
                          } else if (formData.images.length < 5) {
                            return (
                              <div key={`upload-${imageIndex}`} style={{ position: 'relative', width: `${smallSize}px`, height: `${smallSize}px` }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                                  style={{ 
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer',
                                    zIndex: 1
                                  }}
                                  onChange={handleCustomFileSelect}
                      />
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  height: '100%',
                                  border: '1px dashed #d9d9d9',
                                  borderRadius: '8px',
                                  backgroundColor: '#fafafa',
                                  pointerEvents: 'none'
                                }}>
                                  <UploadOutlined style={{ fontSize: 20, color: '#64748b' }} />
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div
                                key={`empty-${imageIndex}`}
                                style={{
                                  width: `${smallSize}px`,
                                  height: `${smallSize}px`,
                                  border: '1px dashed #e5e7eb',
                                  borderRadius: '8px',
                                  backgroundColor: '#f9fafb',
                                }}
                              />
                            );
                          }
                        })}
                      </div>
                    </div>
                  </Col>
                </Row>

              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingRight: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Typography.Text strong>{t('productModal.variants.toggleLabel')}</Typography.Text>
                    <Switch
                      checked={formData.hasVariants}
                      onChange={(checked) => handleChange('hasVariants', checked)}
                      checkedChildren={t('productModal.common.yes')}
                      unCheckedChildren={t('productModal.common.no')}
                />
                  </div>
                  {formData.hasVariants && (
                    <Space>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setVariantAttributes([])}
                        disabled={variantAttributes.length === 0}
                      >
                        {t('productModal.variants.deleteAllAttrs')}
                      </Button>
                      <Button
                        type="primary"
                        onClick={generateAllVariants}
                        disabled={variantAttributes.length === 0 || !variantAttributes.some(attr => attr.attributeId && attr.valueIds && attr.valueIds.length > 0)}
                      >
                        {t('productModal.variants.generateAll')}
                      </Button>
                    </Space>
                  )}
                </div>

                  {!formData.hasVariants && (
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item label={t('productModal.fields.barcode.label')}>
                            <Input
                              value={baseBarcode}
                              placeholder={t('productModal.fields.barcode.placeholder')}
                              onChange={(e) => handleBaseBarcodeChange(e.target.value)}
                              allowClear
                              suffix={
                                <Button
                                  type="text"
                                  icon={<CameraOutlined />}
                                  onClick={handleBaseBarcodeScan}
                                  style={{ padding: 0, height: 'auto' }}
                                  title={t('productModal.fields.barcode.scan')}
                                />
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label={t('productModal.fields.stockOnHand.label')}>
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                  value={formData.baseInventory.stockOnHand}
                              onChange={(value) => handleChange('baseInventory.stockOnHand', value || 0)}
                              formatter={(value) => formatNumber(value)}
                              parser={(value) => parseFloat(parseNumber(value)) || 0}
                />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label={t('productModal.fields.cost.label')}>
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                  value={formData.basePricing.cost}
                              onChange={(value) => handleChange('basePricing.cost', value || 0)}
                              formatter={(value) => formatNumber(value)}
                              parser={(value) => parseFloat(parseNumber(value)) || 0}
                              addonAfter="VNĐ"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item label={t('productModal.fields.sale.label')}>
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                  value={formData.basePricing.sale}
                              onChange={(value) => handleChange('basePricing.sale', value || 0)}
                              formatter={(value) => formatNumber(value)}
                              parser={(value) => parseFloat(parseNumber(value)) || 0}
                              addonAfter="VNĐ"
                />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item>
                            <Space>
                              <Switch
                                checked={formData.allowSellOutOfStock}
                                onChange={(checked) => handleChange('allowSellOutOfStock', checked)}
                    />
                              <Typography.Text>
                                {t('productModal.fields.allowSellOutOfStock')}
                              </Typography.Text>
                            </Space>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  )}

                  {formData.hasVariants && (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa', marginLeft: 0, marginRight: 0 }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {variantAttributes.map((attr, index) => (
                            <Row gutter={12} key={index} align="middle">
                              <Col span={6}>
                                <Select
                                  placeholder={t('productModal.variants.selectAttribute')}
                                  value={attr.attributeId}
                                  onChange={(value) => handleVariantAttributeChange(index, 'attributeId', value)}
                                  showSearch
                                  style={{ width: '100%' }}
                                  optionLabelProp="label"
                                  options={attributes.map(a => ({ 
                                    label: a.name,
                                    value: a._id,
                                    title: a.name
                                  }))}
                                  optionRender={(option) => (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <span>{option.label}</span>
                                      <EditOutlined 
                                        style={{ color: '#1890ff', cursor: 'pointer', marginLeft: 8 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setEditingAttributeId(option.value);
                                          setAttributeModalContext({ variantIndex: null, attrIndex: null });
                                          setAttributeModalOpen(true);
                                        }}
                                      />
                                    </div>
                                  )}
                                  dropdownRender={(menu) => (
                                    <>
                                      <div style={{ padding: 8 }}>
                                        <Button
                                          type="dashed"
                                          icon={<PlusOutlined />}
                                          block
                                          onClick={() => {
                                            setEditingAttributeId(null);
                                            setAttributeModalContext({ variantIndex: null, attrIndex: null });
                                            setAttributeModalOpen(true);
                                          }}
                                        >
                                          {t('productModal.variants.addAttribute')}
                                        </Button>
                                      </div>
                                      <Divider style={{ margin: 0 }} />
                                      {menu}
                                    </>
                                  )}
                                />
                              </Col>
                              <Col span={16}>
                                <Select
                                  mode="multiple"
                                  placeholder={t('productModal.variants.selectValue')}
                                  value={attr.valueIds}
                                  onChange={(value) => handleVariantAttributeChange(index, 'valueIds', value)}
                                  disabled={!attr.attributeId}
                                  showSearch
                                  style={{ width: '100%' }}
                                  tagRender={(props) => {
                                    const { label, value: valueId, closable, onClose } = props;
                                    const selectedValue = attributeValues.find(v => {
                                      const vId = v._id?.toString();
                                      const id = valueId?.toString();
                                      return vId === id;
                                    });
                                    const displayValue = selectedValue?.value || label;
                                    return (
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          margin: '2px 4px',
                                          padding: '2px 8px',
                                          background: '#f0f0f0',
                                          border: '1px solid #d9d9d9',
                                          borderRadius: '4px',
                                          fontSize: '14px',
                                        }}
                                      >
                                        {displayValue}
                                        {closable && (
                                          <span
                                            onClick={onClose}
                                            style={{
                                              marginLeft: '4px',
                                              cursor: 'pointer',
                                            }}
                                          >
                                            ×
                                          </span>
                                        )}
                                      </span>
                                    );
                                  }}
                                  options={attributeValues
                                    .filter(v => {
                                      const vAttrId = v.attributeId?._id?.toString() || v.attributeId?.toString();
                                      const attrId = attr.attributeId?.toString();
                                      return vAttrId === attrId;
                                    })
                                    .map(v => ({ 
                                      label: v.value,
                                      value: v._id,
                                      title: v.value
                                    }))}
                                  optionRender={(option) => (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      <span>{option.label}</span>
                                      <EditOutlined 
                                        style={{ color: '#1890ff', cursor: 'pointer', marginLeft: 8 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                          e.preventDefault();
                                          setEditingAttributeValueId(option.value);
                                          const selectedValue = attributeValues.find(v => v._id?.toString() === option.value?.toString());
                                          const vAttrId = selectedValue?.attributeId?._id?.toString() || selectedValue?.attributeId?.toString();
                                          setSelectedAttributeIdForValue(vAttrId);
                                          setAttributeModalContext({ variantIndex: null, attrIndex: null });
                                          setAttributeValueModalOpen(true);
                                        }}
                                      />
                                    </div>
                                  )}
                                  dropdownRender={(menu) => (
                                    <>
                                      <div style={{ padding: 8 }}>
                                        <Button
                                          type="dashed"
                                          icon={<PlusOutlined />}
                                          block
                                          disabled={!attr.attributeId}
                                          onClick={() => {
                                            setEditingAttributeValueId(null);
                                            setSelectedAttributeIdForValue(attr.attributeId);
                                            setAttributeModalContext({ variantIndex: null, attrIndex: null });
                                            setAttributeValueModalOpen(true);
                                          }}
                                        >
                                          {t('productModal.variants.addValue')}
                    </Button>
                                      </div>
                                      <Divider style={{ margin: 0 }} />
                                      {menu}
                                    </>
                                  )}
                                />
                              </Col>
                              <Col span={2}>
                                <Button
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveVariantAttribute(index)}
                                />
                              </Col>
                            </Row>
                          ))}
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddVariantAttribute}
                            block
                          >
                            {t('productModal.variants.addAttribute')}
                          </Button>
                        </Space>
                      </div>

                      <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Typography.Text strong>
                            {t('productModal.variants.listTitle', { count: formData.variants.length })}
                          </Typography.Text>
                          {errors.variants && (
                            <Typography.Text type="danger" style={{ marginLeft: 8 }}>
                              {errors.variants}
                            </Typography.Text>
                          )}
                        </div>
                        {formData.variants.length > 0 && (
                          <Tooltip title={t('productModal.bulkEdit.title')}>
                            <Button icon={<EditOutlined />} onClick={() => setBulkEditOpen(true)}>
                              {t('productModal.bulkEdit.title')}
                            </Button>
                          </Tooltip>
                        )}
                      </Space>

                      {formData.variants.length === 0 && (
                        <Card
                          bordered
                          style={{ background: '#f8fafc', borderStyle: 'dashed', textAlign: 'center' }}
                        >
                          <Typography.Text type="secondary">
                            {t('productModal.variants.empty')}
                          </Typography.Text>
                        </Card>
                      )}

                      {formData.variants.length > 0 && (
                        <Collapse accordion defaultActiveKey={['0']} expandIconPosition="end">
                          {formData.variants.map((variant, index) => (
                            <Panel
                              header={(
                                <Space>
                                  <Typography.Text strong>{t('productModal.variants.panelTitle', { index: index + 1 })}</Typography.Text>
                                  {variant.sku && (
                                    <Typography.Text type="secondary">({variant.sku})</Typography.Text>
                                  )}
                                </Space>
                              )}
                              key={String(index)}
                              extra={(
                                <Popconfirm
                                  title={t('productModal.variants.deleteVariant.title')}
                                  onConfirm={() => handleRemoveVariant(index)}
                                  okText={t('productModal.common.delete')}
                                  cancelText={t('productModal.common.cancel')}
                                >
                                  <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                </Popconfirm>
                              )}
                            >
                              <Form layout="vertical">
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Form.Item
                                      label={<span>{t('productModal.fields.sku.label')} <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                      validateStatus={errors[`variant_${index}_sku`] ? 'error' : ''}
                                      help={errors[`variant_${index}_sku`]}
                                    >
                                      <Input
                                        value={variant.sku}
                                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                        placeholder={t('productModal.fields.sku.placeholder')}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item label={t('productModal.variants.variantLabel')}>
                                      <Input
                                        value={formatVariantDisplay(variant)}
                                        readOnly
                                        placeholder={t('productModal.variants.variantPlaceholder')}
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item label={t('productModal.fields.status.label')}>
                                      <Select
                                        value={variant.status || 'active'}
                                        onChange={(value) => handleVariantChange(index, 'status', value)}
                                        options={[
                                          { value: 'active', label: t('productModal.fields.status.options.active') },
                                          { value: 'inactive', label: t('productModal.fields.status.options.inactive') },
                                        ]}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={6}>
                                    <Form.Item label={t('productModal.fields.barcode.label')}>
                                      <Input
                                        value={variantBarcodes[index] || (variant.barcodes?.[0]?.code || '')}
                                        placeholder={t('productModal.fields.barcode.placeholder')}
                                        onChange={(e) => handleVariantBarcodeChange(index, e.target.value)}
                                        allowClear
                                        suffix={
                                          <Button
                                            type="text"
                                            icon={<CameraOutlined />}
                                            onClick={() => handleVariantBarcodeScan(index)}
                                            style={{ padding: 0, height: 'auto' }}
                                            title={t('productModal.fields.barcode.scan')}
                                          />
                                        }
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={6}>
                                    <Form.Item label={t('productModal.fields.stockOnHand.label')}>
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        value={variant.inventory?.totalOnHand || 0}
                                        onChange={(value) => handleVariantChange(index, 'inventory.totalOnHand', value || 0)}
                                        formatter={(value) => formatNumber(value)}
                                        parser={(value) => parseFloat(parseNumber(value)) || 0}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={6}>
                                    <Form.Item label={t('productModal.fields.cost.label')}>
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        value={variant.pricing?.cost || 0}
                                        onChange={(value) => handleVariantChange(index, 'pricing.cost', value || 0)}
                                        formatter={(value) => formatNumber(value)}
                                        parser={(value) => parseFloat(parseNumber(value)) || 0}
                                        addonAfter="VNĐ"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={6}>
                                    <Form.Item label={t('productModal.fields.sale.label')}>
                                      <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        value={variant.pricing?.sale || 0}
                                        onChange={(value) => handleVariantChange(index, 'pricing.sale', value || 0)}
                                        formatter={(value) => formatNumber(value)}
                                        parser={(value) => parseFloat(parseNumber(value)) || 0}
                                        addonAfter="VNĐ"
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>

                                <Row gutter={16}>
                                  <Col span={24}>
                                    <Form.Item>
                                      <Space>
                                        <Switch
                                          checked={variant.allowSellOutOfStock || false}
                                          onChange={(checked) => handleVariantChange(index, 'allowSellOutOfStock', checked)}
                                        />
                                        <Typography.Text>
                                          {t('productModal.fields.allowSellOutOfStock')}
                                        </Typography.Text>
                                      </Space>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Form>
                            </Panel>
                          ))}
                        </Collapse>
                      )}
                    </Space>
                  )}
              </Space>
            </Space>
          )}

          {activeTab === 'description' && (
            <div style={{ marginTop: 12 }}>
              <style>{`
                .ck-editor__editable_inline {
                  min-height: 430px;
                }
              `}</style>
              <CKEditor
                editor={ClassicEditor}
                data={formData.description || ''}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  handleChange('description', data);
                }}
                config={{
                  placeholder: t('productModal.fields.descriptionPlaceholder'),
                  toolbar: {
                    items: [
                      'heading',
                      '|',
                      'bold',
                      'italic',
                      'link',
                      'bulletedList',
                      'numberedList',
                      '|',
                      'outdent',
                      'indent',
                      '|',
                      'blockQuote',
                      'insertTable',
                      'undo',
                      'redo',
                    ],
                  },
                }}
              />
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          backgroundColor: '#ffffff',
        }}>
          <div>
            {mode === 'edit' && productId && (
              <Button
                danger
                type="primary"
                onClick={handleDeleteProduct}
                disabled={loading}
                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
              >
                {t('productModal.common.delete')}
              </Button>
            )}
          </div>
          <Space>
            <Button onClick={handleClose} disabled={loading}>
              {t('productModal.common.cancel')}
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {t('productModal.common.save')}
            </Button>
          </Space>
        </div>
      </Modal>

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={async () => {
          await fetchCategories();
          setCategoryModalOpen(false);
        }}
      />

      <BrandModal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSuccess={async () => {
          await fetchBrands();
          setBrandModalOpen(false);
        }}
      />

      <AttributeModal
        open={attributeModalOpen}
        attributeId={editingAttributeId}
        onClose={() => {
          setAttributeModalOpen(false);
          setEditingAttributeId(null);
          setAttributeModalContext({ variantIndex: null, attrIndex: null });
        }}
        onSuccess={async (attribute) => {
          await fetchAttributes();
          if (attributeModalContext.variantIndex !== null && attributeModalContext.attrIndex !== null) {
            const variant = formData.variants[attributeModalContext.variantIndex];
            const newAttrs = [...variant.attributes];
            if (editingAttributeId) {
              newAttrs[attributeModalContext.attrIndex] = { 
                ...newAttrs[attributeModalContext.attrIndex], 
                attributeId: attribute._id 
              };
            } else {
              newAttrs[attributeModalContext.attrIndex] = { attributeId: attribute._id, valueId: '' };
            }
            handleVariantChange(attributeModalContext.variantIndex, 'attributes', newAttrs);
          }
          setAttributeModalOpen(false);
          setEditingAttributeId(null);
          setAttributeModalContext({ variantIndex: null, attrIndex: null });
        }}
        onDelete={async (deletedId) => {
          await fetchAttributes();
          if (attributeModalContext.variantIndex !== null && attributeModalContext.attrIndex !== null) {
            const variant = formData.variants[attributeModalContext.variantIndex];
            if (variant.attributes[attributeModalContext.attrIndex]?.attributeId === deletedId) {
              const newAttrs = [...variant.attributes];
              newAttrs[attributeModalContext.attrIndex] = { attributeId: '', valueId: '' };
              handleVariantChange(attributeModalContext.variantIndex, 'attributes', newAttrs);
            }
          }
        }}
      />

      <AttributeValueModal
        open={attributeValueModalOpen}
        attributeId={selectedAttributeIdForValue}
        attributeValueId={editingAttributeValueId}
        onClose={() => {
          setAttributeValueModalOpen(false);
          setEditingAttributeValueId(null);
          setSelectedAttributeIdForValue(null);
          setAttributeModalContext({ variantIndex: null, attrIndex: null });
        }}
        onSuccess={async (value) => {
          await fetchAttributes();
          if (attributeModalContext.variantIndex !== null && attributeModalContext.attrIndex !== null) {
            const variant = formData.variants[attributeModalContext.variantIndex];
            const newAttrs = [...variant.attributes];
            newAttrs[attributeModalContext.attrIndex] = { ...newAttrs[attributeModalContext.attrIndex], valueId: value._id };
            handleVariantChange(attributeModalContext.variantIndex, 'attributes', newAttrs);
          }
          setAttributeValueModalOpen(false);
          setEditingAttributeValueId(null);
          setSelectedAttributeIdForValue(null);
          setAttributeModalContext({ variantIndex: null, attrIndex: null });
        }}
        onDelete={async (deletedId) => {
          await fetchAttributes();
          if (attributeModalContext.variantIndex !== null && attributeModalContext.attrIndex !== null) {
            const variant = formData.variants[attributeModalContext.variantIndex];
            if (variant.attributes[attributeModalContext.attrIndex]?.valueId === deletedId) {
              const newAttrs = [...variant.attributes];
              newAttrs[attributeModalContext.attrIndex] = { 
                ...newAttrs[attributeModalContext.attrIndex], 
                valueId: '' 
              };
              handleVariantChange(attributeModalContext.variantIndex, 'attributes', newAttrs);
            }
          }
        }}
      />

      <Modal
        open={bulkEditOpen}
        onCancel={() => setBulkEditOpen(false)}
        title={t('productModal.bulkEdit.title')}
        okText={t('productModal.bulkEdit.apply')}
        cancelText={t('productModal.common.cancel')}
        onOk={handleBulkEdit}
        confirmLoading={false}
      >
        <Form layout="vertical">
          <Form.Item label={t('productModal.bulkEdit.cost')}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={bulkEditData.cost}
              onChange={(value) => setBulkEditData({ ...bulkEditData, cost: value || '' })}
              placeholder={t('productModal.bulkEdit.placeholder')}
              formatter={(value) => formatNumber(value)}
              parser={(value) => parseFloat(parseNumber(value)) || 0}
              addonAfter="VNĐ"
            />
          </Form.Item>
          <Form.Item label={t('productModal.bulkEdit.sale')}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={bulkEditData.sale}
              onChange={(value) => setBulkEditData({ ...bulkEditData, sale: value || '' })}
              placeholder={t('productModal.bulkEdit.placeholder')}
              formatter={(value) => formatNumber(value)}
              parser={(value) => parseFloat(parseNumber(value)) || 0}
              addonAfter="VNĐ"
            />
          </Form.Item>
          <Form.Item label={t('productModal.bulkEdit.stockOnHand')}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={bulkEditData.stockOnHand}
              onChange={(value) => setBulkEditData({ ...bulkEditData, stockOnHand: value || '' })}
              placeholder={t('productModal.bulkEdit.placeholder')}
              formatter={(value) => formatNumber(value)}
              parser={(value) => parseFloat(parseNumber(value)) || 0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateProductDialog;
