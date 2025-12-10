import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Typography, Button, Tag, Divider, message, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { crmService } from '../crm.service';
import CRMModal from '../components/CRMModal';

const CRMDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('crm');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await crmService.getCustomerById(customerId);
      setData(resp);
    } catch (error) {
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [customerId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    try {
      await crmService.deleteCustomer(customerId);
      message.success(t('messages.deleteSuccess'));
      navigate(-1);
    } catch (error) {
      message.error(error?.response?.data?.message || t('messages.deleteFailed'));
    }
  };

  if (loading) {
    return <Spin style={{ marginTop: 40 }} />;
  }

  if (!data) {
    return (
      <div style={{ padding: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          {t('detail.back')}
        </Button>
        <Empty description={t('detail.noData')} />
      </div>
    );
  }

  const phones = [data.phone1, data.phone2].filter(Boolean).join(', ');
  const emails = [data.email1, data.email2].filter(Boolean).join(', ');
  const address = data.address;

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('detail.back')}
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
          {t('table.actions.edit')}
        </Button>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          {t('table.actions.delete')}
        </Button>
      </Space>

      <Card title={t('detail.basic')}>
        <Row gutter={16}>
          <Col span={12}>
            <Typography.Text strong>{t('fields.name')}:</Typography.Text> {data.name || '-'}
          </Col>
          <Col span={12} style={{ marginTop: 8 }}>
            <Typography.Text strong>{t('fields.gender')}:</Typography.Text> {t(`gender.${data.gender || 'other'}`)}
          </Col>
          <Col span={12} style={{ marginTop: 8 }}>
            <Typography.Text strong>{t('fields.birthday')}:</Typography.Text> {data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : '-'}
          </Col>
          <Col span={12} style={{ marginTop: 8 }}>
            <Typography.Text strong>{t('fields.lastActivityAt')}:</Typography.Text> {data.lastActivityAt ? dayjs(data.lastActivityAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Typography.Text strong>{t('fields.phones')}:</Typography.Text> {phones || '-'}
          </Col>
          <Col span={12}>
            <Typography.Text strong>{t('fields.emails')}:</Typography.Text> {emails || '-'}
          </Col>
        </Row>
        <Divider />
        <Typography.Text strong>{t('sections.address')}:</Typography.Text>
        <div style={{ marginTop: 6 }}>
          {address?.addressLine || '-'}
          {address?.provinceName ? `, ${address.provinceName}` : ''}
          {address?.wardName ? `, ${address.wardName}` : ''}
        </div>
        <Divider />
        <Typography.Text strong>{t('fields.note')}:</Typography.Text>
        <div style={{ marginTop: 6 }}>{data.note || '-'}</div>
      </Card>

      <CRMModal
        open={modalOpen}
        customerId={customerId}
        mode="edit"
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchData();
        }}
        onDelete={() => {
          setModalOpen(false);
          navigate(-1);
        }}
      />
    </div>
  );
};

export default CRMDetailPage;

