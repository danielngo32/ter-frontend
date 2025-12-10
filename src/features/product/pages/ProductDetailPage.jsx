import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Image,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  Empty,
} from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { productService } from '../product.service';
import ProductModal from '../components/ProductModal';
import { normalizeLocale } from '../../../utils/locale';

const statusTag = (status) => {
  const map = {
    active: { color: 'green', label: 'Đang bán' },
    inactive: { color: 'default', label: 'Ngừng bán' },
    draft: { color: 'orange', label: 'Nháp' },
  };
  const info = map[status] || map.active;
  return <Tag color={info.color}>{info.label}</Tag>;
};

const currency = (v) => {
  if (v === null || v === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};

const ProductDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const locale = normalizeLocale(params.locale);
  const productId = params.productId;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product detail', error);
      message.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct, refreshFlag]);

  const mainImage = useMemo(() => {
    if (!product?.images?.length) return null;
    const primary = product.images.find((img) => img.isPrimary) || product.images[0];
    return primary?.url || (typeof primary === 'string' ? primary : null);
  }, [product]);

  const gallery = useMemo(() => {
    if (!product?.images?.length) return [];
    const imgs = product.images.filter((img) => !img.isPrimary);
    return imgs.map((img) => img.url || (typeof img === 'string' ? img : null)).filter(Boolean);
  }, [product]);

  const variantAttributes = (variant) => {
    if (!variant?.attributes?.length) return '-';
    return variant.attributes
      .map((a) => {
        const name = a.attributeId?.name || '';
        const val = a.valueId?.value || '';
        return name && val ? `${name}: ${val}` : '';
      })
      .filter(Boolean)
      .join(' | ');
  };

  const handleDelete = async () => {
    if (!productId) return;
    try {
      await productService.deleteProduct(productId);
      message.success('Đã xóa sản phẩm');
      navigate(`/${locale}/products`);
    } catch (error) {
      console.error('Delete failed', error);
      message.error(error.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const breadcrumb = (
    <Breadcrumb style={{ marginBottom: 16 }}>
      <Breadcrumb.Item onClick={() => navigate(`/${locale}`)} style={{ cursor: 'pointer' }}>
        <HomeOutlined /> Trang chủ
      </Breadcrumb.Item>
      <Breadcrumb.Item onClick={() => navigate(`/${locale}/products`)} style={{ cursor: 'pointer' }}>
        <ShoppingOutlined /> Hàng hóa
      </Breadcrumb.Item>
      <Breadcrumb.Item>{product?.name || 'Chi tiết'}</Breadcrumb.Item>
    </Breadcrumb>
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        {breadcrumb}
        <Spin />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        {breadcrumb}
        <Empty description="Không tìm thấy sản phẩm" />
        <Button icon={<ArrowLeftOutlined />} style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div>
      {breadcrumb}

      <Row justify="space-between" align="middle" style={{ marginBottom: 16, rowGap: 12 }}>
        <Col xs={24} md={16}>
          <Space size="middle">
            <Typography.Title level={3} style={{ margin: 0 }}>{product.name}</Typography.Title>
            {statusTag(product.status)}
          </Space>
          <div style={{ color: '#666', marginTop: 4 }}>
            SKU: {product.sku || '-'} | Mã vạch: {product.baseBarcodes?.[0]?.code || '-'}
          </div>
        </Col>
        <Col xs={24} md="auto" style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setModalOpen(true)}
              style={{ background: '#1A237E', borderColor: '#1A237E' }}
            >
              Chỉnh sửa
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Xóa
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10} lg={8}>
          <Card title="Hình ảnh" bodyStyle={{ padding: 12 }}>
            {mainImage ? (
              <Image src={mainImage} style={{ width: '100%', marginBottom: 8 }} />
            ) : (
              <div style={{ padding: 12, textAlign: 'center', color: '#888' }}>Không có ảnh</div>
            )}
            <Space wrap>
              {gallery.map((url, idx) => (
                <Image key={idx} src={url} width={80} height={80} style={{ objectFit: 'cover' }} />
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14} lg={16}>
          <Card title="Thông tin chung" bodyStyle={{ padding: 16 }}>
            <Descriptions column={2} labelStyle={{ fontWeight: 500 }}>
              <Descriptions.Item label="Danh mục">
                {product.categoryId?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục cha">
                {product.categoryId?.parentCategoryId?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Thương hiệu">
                {product.brandId?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusTag(product.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Cho phép bán khi hết hàng">
                {product.allowSellOutOfStock ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Có biến thể">
                {product.hasVariants ? <Tag color="blue">Có</Tag> : <Tag>Không</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {!product.hasVariants && (
              <Descriptions column={2} labelStyle={{ fontWeight: 500 }} title="Giá & Tồn kho">
                <Descriptions.Item label="Giá vốn">{currency(product.basePricing?.cost)}</Descriptions.Item>
                <Descriptions.Item label="Giá bán">{currency(product.basePricing?.sale)}</Descriptions.Item>
                <Descriptions.Item label="Tồn kho">{product.baseInventory?.stockOnHand ?? 0}</Descriptions.Item>
              </Descriptions>
            )}

            {product.description && (
              <>
                <Divider />
                <Typography.Title level={5}>Mô tả</Typography.Title>
                <div
                  style={{ color: '#444', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      {product.hasVariants ? (
        <Card title={`Biến thể (${product.variants?.length || 0})`} bodyStyle={{ padding: 16 }}>
          <Row gutter={[16, 16]}>
            {(product.variants || []).map((v, idx) => (
              <Col span={24} key={v._id || idx}>
                <Card size="small">
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8} lg={6}>
                      <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500 }}>
                        <Descriptions.Item label="Mã hàng">{v.sku || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Mã vạch">{v.barcodes?.[0]?.code || '-'}</Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col xs={24} md={10} lg={10}>
                      <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500 }}>
                        <Descriptions.Item label="Thuộc tính">{variantAttributes(v)}</Descriptions.Item>
                        <Descriptions.Item label="Giá vốn">{currency(v.pricing?.cost)}</Descriptions.Item>
                        <Descriptions.Item label="Giá bán">{currency(v.pricing?.sale)}</Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col xs={24} md={6} lg={8}>
                      <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500 }}>
                        <Descriptions.Item label="Tồn kho">{v.inventory?.totalOnHand ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="Khách đặt">{v.inventory?.totalAllocated ?? 0}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{statusTag(v.status || product.status)}</Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ) : (
        <Card title="Tồn kho & Giá" bodyStyle={{ padding: 16 }}>
          <Descriptions column={3} labelStyle={{ fontWeight: 500 }}>
            <Descriptions.Item label="Giá vốn">{currency(product.basePricing?.cost)}</Descriptions.Item>
            <Descriptions.Item label="Giá bán">{currency(product.basePricing?.sale)}</Descriptions.Item>
            <Descriptions.Item label="Tồn kho">{product.baseInventory?.stockOnHand ?? 0}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <ProductModal
        open={modalOpen}
        productId={productId}
        mode="edit"
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          message.success('Cập nhật thành công');
          setModalOpen(false);
          setRefreshFlag((x) => x + 1);
        }}
        onDelete={() => {
          message.success('Đã xóa sản phẩm');
          setModalOpen(false);
          navigate(`/${locale}/products`);
        }}
      />
    </div>
  );
};

export default ProductDetailPage;

