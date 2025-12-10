import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Tag,
  Divider,
  Image,
  Descriptions,
  Empty,
  message,
  List,
  Avatar,
} from 'antd';
import {
  ScanOutlined,
  StopOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { productService } from '../product.service';

const { Title, Text } = Typography;

const QRBarcodePage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | null
  const scannerInstanceRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount
      cleanupScanner();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const cleanupScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        // Stop scanner first if it's running
        try {
          await scannerInstanceRef.current.stop();
        } catch (stopErr) {
          // If stop fails, it might already be stopped, continue to clear
          console.warn('Scanner stop error (may already be stopped):', stopErr);
        }
        // Then clear
        try {
          await scannerInstanceRef.current.clear();
        } catch (clearErr) {
          // If clear fails, it might already be cleared
          console.warn('Scanner clear error (may already be cleared):', clearErr);
        }
      } catch (err) {
        // Ignore errors during cleanup
        console.warn('Error during scanner cleanup:', err);
      } finally {
        scannerInstanceRef.current = null;
      }
    }
  };

  const startScanner = async () => {
    if (isScanning) return;

    // Cleanup any existing scanner first
    await cleanupScanner();

    const scannerId = 'qr-barcode-scanner';
    setIsScanning(true);
    setError(null);

    try {
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerInstanceRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Make qrbox 60% of the smaller dimension to ensure it's square and smaller
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.6);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (!isMountedRef.current) return;

          // Prevent duplicate scans within 2 seconds
          if (lastScannedBarcode === decodedText) {
            return;
          }

          setLastScannedBarcode(decodedText);
          
          // Clear previous timeout
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
          }

          // Reset after 2 seconds to allow rescanning the same barcode
          scanTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setLastScannedBarcode(null);
            }
          }, 2000);

          // Fetch product data
          await fetchProductByBarcode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're normal during scanning)
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      if (isMountedRef.current) {
        setError('Không thể truy cập camera. Vui lòng cho phép truy cập camera và thử lại.');
        setIsScanning(false);
        scannerInstanceRef.current = null;
        message.error('Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập camera.');
      }
    }
  };

  const stopScanner = async () => {
    if (!scannerInstanceRef.current) return;

    try {
      // Stop scanner first
      try {
        await scannerInstanceRef.current.stop();
      } catch (stopErr) {
        // If stop fails, it might already be stopped, continue to clear
        console.warn('Scanner stop error (may already be stopped):', stopErr);
      }
      // Then clear
      try {
        await scannerInstanceRef.current.clear();
      } catch (clearErr) {
        // If clear fails, it might already be cleared
        console.warn('Scanner clear error (may already be cleared):', clearErr);
      }
      scannerInstanceRef.current = null;
      setIsScanning(false);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
      // Force cleanup even if there's an error
      scannerInstanceRef.current = null;
      setIsScanning(false);
    }
  };

  const fetchProductByBarcode = async (barcode) => {
    if (!barcode || !barcode.trim()) return;

    const trimmedBarcode = barcode.trim();
    
    setLoading(true);
    setError(null);
    setScanStatus(null);

    try {
      const result = await productService.getProductByBarcode(trimmedBarcode);
      
      // Use functional update to always get the latest productList
      setProductList((prevList) => {
        // Check if barcode already exists in the current list
        const exists = prevList.some((item) => {
          if (item.isBase) {
            return item.product?.baseBarcodes?.some(bc => bc.code === trimmedBarcode);
          } else {
            return item.variant?.barcodes?.some(bc => bc.code === trimmedBarcode);
          }
        });

        if (exists) {
          // Product already exists, don't add
          setScanStatus('success');
          setTimeout(() => {
            setScanStatus(null);
          }, 1000);
          return prevList; // Return unchanged list
        }

        // Add new product to list
        setScanStatus('success');
        setTimeout(() => {
          setScanStatus(null);
        }, 1000);
        return [{ ...result, scannedAt: new Date() }, ...prevList];
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      const errorMessage = err.response?.data?.message || 'Không tìm thấy sản phẩm với mã vạch này';
      setError(errorMessage);
      
      // Set error status
      setScanStatus('error');
      
      // Reset status after 1 second
      setTimeout(() => {
        setScanStatus(null);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatVariantAttributes = (variant) => {
    if (!variant?.attributes || variant.attributes.length === 0) {
      return 'Không có thuộc tính';
    }

    return variant.attributes
      .map((attr) => {
        const attrName = attr.attributeId?.name || 'N/A';
        const valueName = attr.valueId?.value || 'N/A';
        return `${attrName}: ${valueName}`;
      })
      .join(', ');
  };

  return (
      <Row gutter={[24, 24]}>
        {/* Cột trái - Camera Scanner */}
        <Col xs={24} md={10} lg={8}>
          <Card
            title={
              <Space>
                <ScanOutlined />
                <span>Camera quét mã vạch</span>
              </Space>
            }
            extra={
              <Space>
                {!isScanning ? (
                  <Button
                    type="primary"
                    icon={<ScanOutlined />}
                    onClick={startScanner}
                  >
                    Bắt đầu quét
                  </Button>
                ) : (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={stopScanner}
                  >
                    Dừng quét
                  </Button>
                )}
              </Space>
            }
            style={{ height: '100%' }}
          >
            <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
              <div
                id="qr-barcode-scanner"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              />
              <style>
                {scanStatus === 'success' && `
                  #qr-barcode-scanner svg line {
                    stroke: #52c41a !important;
                  }
                `}
                {scanStatus === 'error' && `
                  #qr-barcode-scanner svg line {
                    stroke: #ff4d4f !important;
                  }
                `}
              </style>

              {!isScanning && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    borderRadius: '8px',
                    zIndex: 1,
                  }}
                >
                  <ScanOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                  <Text style={{ color: '#fff', fontSize: '16px' }}>
                    Nhấn "Bắt đầu quét" để khởi động camera
                  </Text>
                </div>
              )}

              {error && (
                <Alert
                  message="Lỗi"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginTop: '16px' }}
                  closable
                  onClose={() => setError(null)}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Cột phải - Thông tin sản phẩm */}
        <Col xs={24} md={14} lg={16}>
          <Card
            title={
              <Space>
                <ShoppingOutlined />
                <span>Thông tin sản phẩm</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>Đang tìm kiếm sản phẩm...</Text>
                </div>
              </div>
            ) : productList.length > 0 ? (
              <List
                dataSource={productList}
                style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
                renderItem={(item, index) => {
                  const productData = item;
                  return (
                    <List.Item
                      key={index}
                      style={{
                        padding: '16px',
                        marginBottom: '16px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          productData.product?.images && productData.product.images.length > 0 ? (
                            <Avatar
                              src={productData.product.images[0]?.url || productData.product.images[0]}
                              shape="square"
                              size={80}
                              style={{ borderRadius: '8px' }}
                            />
                          ) : (
                            <Avatar
                              icon={<ShoppingOutlined />}
                              shape="square"
                              size={80}
                              style={{ borderRadius: '8px' }}
                            />
                          )
                        }
                        title={
                          <Space>
                            <Title level={5} style={{ margin: 0 }}>
                              {productData.product?.name || 'N/A'}
                            </Title>
                            <Tag color={productData.product?.status === 'active' ? 'green' : 'default'}>
                              {productData.product?.status === 'active' ? 'Đang hoạt động' : 
                               productData.product?.status === 'draft' ? 'Bản nháp' : 'Ngừng hoạt động'}
                            </Tag>
                            {productData.isBase ? (
                              <Tag color="blue">Sản phẩm cơ bản</Tag>
                            ) : (
                              <Tag color="purple">Sản phẩm có biến thể</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div>
                                <Text strong>SKU: </Text>
                                <Text>{productData.product?.sku || 'N/A'}</Text>
                                {productData.isBase ? (
                                  <>
                                    <Text strong style={{ marginLeft: '16px' }}>Mã vạch: </Text>
                                    <Text>{productData.product?.baseBarcodes?.[0]?.code || 'N/A'}</Text>
                                  </>
                                ) : (
                                  <>
                                    <Text strong style={{ marginLeft: '16px' }}>Mã vạch: </Text>
                                    <Text>{productData.variant?.barcodes?.[0]?.code || 'N/A'}</Text>
                                  </>
                                )}
                              </div>
                              <div>
                                <Text strong>Danh mục: </Text>
                                <Text>{productData.product?.categoryId?.name || 'Chưa phân loại'}</Text>
                                <Text strong style={{ marginLeft: '16px' }}>Thương hiệu: </Text>
                                <Text>{productData.product?.brandId?.name || 'Chưa có thương hiệu'}</Text>
                              </div>
                              {productData.isBase ? (
                                <div>
                                  <Text strong>Giá bán: </Text>
                                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                    {formatPrice(productData.product?.basePricing?.sale || 0)} VNĐ
                                  </Text>
                                  <Text strong style={{ marginLeft: '16px' }}>Tồn kho: </Text>
                                  <Text>{formatPrice(productData.product?.baseInventory?.stockOnHand || 0)}</Text>
                                </div>
                              ) : (
                                <div>
                                  <Text strong>Biến thể: </Text>
                                  <Text>{formatVariantAttributes(productData.variant)}</Text>
                                  <Text strong style={{ marginLeft: '16px' }}>Giá bán: </Text>
                                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                    {formatPrice(productData.variant?.pricing?.sale || 0)} VNĐ
                                  </Text>
                                  <Text strong style={{ marginLeft: '16px' }}>Tồn kho: </Text>
                                  <Text>{formatPrice(productData.variant?.inventory?.totalOnHand || 0)}</Text>
                                </div>
                              )}
                              {productData.scannedAt && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  Quét lúc: {new Date(productData.scannedAt).toLocaleString('vi-VN')}
                                </Text>
                              )}
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty
                description="Chưa có thông tin sản phẩm"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Text type="secondary">
                  Quét mã vạch để xem thông tin sản phẩm
                </Text>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>
  );
};

export default QRBarcodePage;

