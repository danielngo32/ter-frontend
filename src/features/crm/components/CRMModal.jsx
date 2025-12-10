import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Space, Button, message, Upload, Avatar, AutoComplete } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { crmService } from '../crm.service';
import { crmValidator } from '../crm.validator';
import { useTranslation } from 'react-i18next';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';

dayjs.extend(customParseFormat);

const genderOptions = (t) => [
  { value: 'male', label: t('title.male') },
  { value: 'female', label: t('title.female') },
  { value: 'other', label: t('title.other') },
];

const emailDomains = ['@gmail.com', '@outlook.com', '@yahoo.com', '@hotmail.com', '@icloud.com', '@mail.com', '@protonmail.com'];

const emptyForm = {
  gender: 'other',
  name: '',
  birthday: null,
  phone1: '',
  phone2: '',
  email1: '',
  email2: '',
  addressLine: '',
  province: null,
  ward: null,
  note: '',
};

const CRMModal = ({ open, customerId = null, mode = 'create', onClose, onSuccess, onDelete }) => {
  const { t } = useTranslation('crm');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [email1Value, setEmail1Value] = useState('');
  const [email2Value, setEmail2Value] = useState('');
  const [birthdayInput, setBirthdayInput] = useState('');

  useEffect(() => {
    if (open) {
      fetchProvinces();
    }
    if (open && customerId) {
      loadCustomer(customerId);
    } else if (open) {
      form.setFieldsValue(emptyForm);
      setAvatarFile(null);
      setAvatarPreview('');
      setWards([]);
      setEmail1Value('');
      setEmail2Value('');
      setBirthdayInput('');
    }
  }, [open, customerId]);

  const toArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  };

  const fetchProvinces = async () => {
    try {
      const data = await crmService.getProvinces();
      setProvinces(toArray(data));
    } catch (err) {
      setProvinces([]);
    }
  };

  const fetchWards = async (provinceCode) => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    try {
      const data = await crmService.getWards(provinceCode);
      setWards(toArray(data));
    } catch (err) {
      setWards([]);
    }
  };

  const loadCustomer = async (id) => {
    try {
      setLoading(true);
      const data = await crmService.getCustomerById(id);
      if (data.address?.provinceCode) {
        fetchWards(data.address.provinceCode);
      }
      
      // Name is stored without prefix, gender is stored separately
      const gender = data.gender || 'other';
      const name = data.name || '';
      
      const birthdayDate = data.birthday ? (dayjs(data.birthday, 'DD/MM/YYYY').isValid() ? dayjs(data.birthday, 'DD/MM/YYYY') : dayjs(data.birthday)) : null;
      const birthdayFormatted = birthdayDate ? birthdayDate.format('DD/MM/YYYY') : '';
      
      form.setFieldsValue({
        gender,
        name,
        birthday: birthdayDate,
        phone1: data.phone1 || '',
        phone2: data.phone2 || '',
        email1: data.email1 || '',
        email2: data.email2 || '',
        addressLine: data.address?.addressLine || '',
        province: data.address?.provinceCode
          ? {
              value: data.address?.provinceCode,
              label: data.address?.provinceName,
              code: data.address?.provinceCode,
              name: data.address?.provinceName,
            }
          : null,
        ward: data.address?.wardCode
          ? {
              value: data.address?.wardCode,
              label: data.address?.wardName,
              code: data.address?.wardCode,
              name: data.address?.wardName,
            }
          : null,
        note: data.note || '',
      });
      setEmail1Value(data.email1 || '');
      setEmail2Value(data.email2 || '');
      setBirthdayInput(birthdayFormatted);
      setAvatarPreview(data.avatarUrl || '');
    } catch (error) {
      console.error('Failed to load customer', error);
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (values) => {
    const province = values.province;
    const ward = values.ward;
    
    // Only save name without prefix, but save gender separately
    const gender = values.gender || 'other';
    const name = values.name?.trim() || '';
    
    // Parse birthday from birthdayInput state (not from form values)
    let birthdayValue = undefined;
    if (birthdayInput && birthdayInput.replace(/\D/g, '').length === 8) {
      const parsed = dayjs(birthdayInput, 'DD/MM/YYYY', true);
      if (parsed.isValid()) {
        birthdayValue = parsed.toISOString();
      }
    }
    
    const payload = {
      name,
      gender,
      birthday: birthdayValue,
      note: values.note?.trim() || undefined,
      phone1: values.phone1?.trim() || undefined,
      phone2: values.phone2?.trim() || undefined,
      email1: values.email1?.trim()?.toLowerCase() || undefined,
      email2: values.email2?.trim()?.toLowerCase() || undefined,
      address: {
        addressLine: values.addressLine?.trim() || undefined,
        provinceName: province?.name || undefined,
        provinceCode: province?.code || undefined,
        wardName: ward?.name || undefined,
        wardCode: ward?.code || undefined,
      },
    };
    if (!payload.address.addressLine && !payload.address.provinceName && !payload.address.wardName) {
      payload.address = undefined;
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const errors = crmValidator.validateCustomerForm(values, t);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, err]) => {
          form.setFields([{ name: field, errors: [err] }]);
        });
        return;
      }

      setLoading(true);
      const payload = buildPayload(values);
      const files = { avatar: avatarFile };
      if (mode === 'edit' && customerId) {
        await crmService.updateCustomer(customerId, payload, files);
        message.success(t('messages.updateSuccess'));
      } else {
        await crmService.createCustomer(payload, files);
        message.success(t('messages.createSuccess'));
      }
      onSuccess?.();
      onClose?.();
      form.resetFields();
      setAvatarFile(null);
      setAvatarPreview('');
    } catch (error) {
      if (error?.errorFields) return; // antd validation
      console.error('Failed to submit customer', error);
      message.error(error?.response?.data?.message || t('messages.actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(mode === 'edit' && customerId)) return;
    Modal.confirm({
      title: t('actions.deleteTitle'),
      content: t('actions.deleteConfirm'),
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await crmService.deleteCustomer(customerId);
          message.success(t('messages.deleteSuccess'));
          onDelete?.();
          onClose?.();
          form.resetFields();
        } catch (error) {
          console.error('Failed to delete', error);
          message.error(error?.response?.data?.message || t('messages.deleteFailed'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (!loading) {
          form.resetFields();
          onClose?.();
        }
      }}
      width={700}
      title={mode === 'edit' ? t('modal.editTitle') : t('modal.createTitle')}
      maskClosable={false}
      style={{ top: '7vh' }}
      zIndex={3001}
      footer={
        <Space style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {mode === 'edit' && customerId && (
              <Button danger onClick={handleDelete} loading={loading}>
                {t('actions.delete')}
              </Button>
            )}
          </div>
          <Space>
            <Button onClick={() => onClose?.()} disabled={loading}>{t('actions.cancel')}</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {t('actions.save')}
            </Button>
          </Space>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={emptyForm}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Upload
              beforeUpload={(file) => {
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
                return false;
              }}
              showUploadList={false}
              accept="image/*"
            >
              <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
                <Avatar
                  size={96}
                  src={avatarPreview}
                  icon={<UserOutlined />}
                  style={{ border: '1px dashed #d9d9d9' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    borderRadius: '50%',
                    opacity: 0.85,
                    cursor: 'pointer',
                  }}
                >
                  <CameraOutlined />
                </div>
              </div>
            </Upload>
          </Col>
          <Col span={12}>
            <Form.Item 
              label={t('fields.name')}
              required
            >
              <Input.Group compact>
                <Form.Item name="gender" noStyle>
                  <Select 
                    style={{ width: '30%' }} 
                    options={genderOptions(t)}
                    placeholder={t('placeholders.gender')}
                  />
                </Form.Item>
                <Form.Item 
                  name="name" 
                  noStyle 
                  rules={[{ required: true, message: t('errors.nameRequired') }]}
                >
                  <Input 
                    style={{ width: '70%' }} 
                    placeholder={t('placeholders.name')} 
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label={t('fields.birthday')}
            >
              <Input
                style={{ width: '100%' }}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={birthdayInput}
                onChange={(e) => {
                  let inputValue = e.target.value;
                  
                  // Chỉ lấy số, giới hạn 8 số
                  let numbers = inputValue.replace(/\D/g, '');
                  if (numbers.length > 8) {
                    numbers = numbers.slice(0, 8);
                  }
                  
                  // Tự động format khi nhập
                  let formatted = '';
                  if (numbers.length === 0) {
                    formatted = '';
                  } else if (numbers.length <= 2) {
                    formatted = numbers;
                  } else if (numbers.length <= 4) {
                    formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
                  } else {
                    formatted = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
                  }
                  
                  setBirthdayInput(formatted);
                }}
                onBlur={() => {
                  // Chỉ parse khi blur và đủ 8 số
                  const numbers = birthdayInput.replace(/\D/g, '');
                  if (numbers.length === 8) {
                    const parsed = dayjs(birthdayInput, 'DD/MM/YYYY', true);
                    if (parsed.isValid()) {
                      form.setFieldsValue({ birthday: parsed });
                    } else {
                      form.setFieldsValue({ birthday: null });
                    }
                  } else {
                    form.setFieldsValue({ birthday: null });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="phone1" 
              label={t('fields.phone1')}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!crmValidator.validatePhone(value)) {
                      return Promise.reject(new Error(t('errors.phoneInvalid')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder={t('placeholders.phone1')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="phone2" 
              label={t('fields.phone2')}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!crmValidator.validatePhone(value)) {
                      return Promise.reject(new Error(t('errors.phoneInvalid')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder={t('placeholders.phone2')} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="email1" 
              label={t('fields.email1')}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!crmValidator.validateEmail(value)) {
                      return Promise.reject(new Error(t('errors.emailInvalid')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <AutoComplete
                placeholder={t('placeholders.email1')}
                value={email1Value}
                onSearch={(text) => {
                  setEmail1Value(text);
                  form.setFieldsValue({ email1: text });
                }}
                onSelect={(value) => {
                  setEmail1Value(value);
                  form.setFieldsValue({ email1: value });
                }}
                options={(() => {
                  const currentValue = email1Value || '';
                  if (!currentValue.includes('@')) {
                    // Show all domains if no @
                    const beforeAt = currentValue || '';
                    return emailDomains.map(domain => ({
                      value: `${beforeAt}${domain}`,
                      label: `${beforeAt}${domain}`,
                    }));
                  }
                  // If @ exists, filter domains based on what's after @
                  const parts = currentValue.split('@');
                  const beforeAt = parts[0] || '';
                  const afterAt = parts[1] || '';
                  return emailDomains
                    .filter(domain => !afterAt || domain.toLowerCase().includes(afterAt.toLowerCase()))
                    .map(domain => ({
                      value: `${beforeAt}@${domain.replace('@', '')}`,
                      label: `${beforeAt}@${domain.replace('@', '')}`,
                    }));
                })()}
                filterOption={false}
              >
                <Input type="email" />
              </AutoComplete>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="email2" 
              label={t('fields.email2')}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!crmValidator.validateEmail(value)) {
                      return Promise.reject(new Error(t('errors.emailInvalid')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <AutoComplete
                placeholder={t('placeholders.email2')}
                value={email2Value}
                onSearch={(text) => {
                  setEmail2Value(text);
                  form.setFieldsValue({ email2: text });
                }}
                onSelect={(value) => {
                  setEmail2Value(value);
                  form.setFieldsValue({ email2: value });
                }}
                options={(() => {
                  const currentValue = email2Value || '';
                  if (!currentValue.includes('@')) {
                    // Show all domains if no @
                    const beforeAt = currentValue || '';
                    return emailDomains.map(domain => ({
                      value: `${beforeAt}${domain}`,
                      label: `${beforeAt}${domain}`,
                    }));
                  }
                  // If @ exists, filter domains based on what's after @
                  const parts = currentValue.split('@');
                  const beforeAt = parts[0] || '';
                  const afterAt = parts[1] || '';
                  return emailDomains
                    .filter(domain => !afterAt || domain.toLowerCase().includes(afterAt.toLowerCase()))
                    .map(domain => ({
                      value: `${beforeAt}@${domain.replace('@', '')}`,
                      label: `${beforeAt}@${domain.replace('@', '')}`,
                    }));
                })()}
                filterOption={false}
              >
                <Input type="email" />
              </AutoComplete>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="province" label={t('fields.provinceName')}>
              <Select
                showSearch
                allowClear
                placeholder={t('placeholders.provinceName')}
                optionFilterProp="label"
                labelInValue
                options={(provinces || []).map((p) => {
                  const label = p.fullName || p.name;
                  return {
                    value: p.code,
                    label,
                    data: { ...p, displayName: label },
                  };
                })}
                onChange={(val, option) => {
                  const data = option?.data;
                  form.setFieldsValue({
                    province: val
                      ? { value: val.value, label: val.label, code: val.value, name: val.label }
                      : null,
                    ward: null,
                  });
                  fetchWards(data?.code || val?.value);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="ward" label={t('fields.wardName')}>
              <Select
                showSearch
                allowClear
                placeholder={t('placeholders.wardName')}
                optionFilterProp="label"
                labelInValue
                options={(wards || []).map((w) => ({
                  value: w.code,
                  label: w.name,
                  data: w,
                }))}
                onChange={(val, option) => {
                  const data = option?.data;
                  form.setFieldsValue({
                    ward: val ? { value: val.value, label: val.label, code: val.value, name: val.label } : null,
                  });
                }}
                disabled={!form.getFieldValue('province')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="addressLine" label={t('fields.addressLine')}>
              <Input placeholder={t('placeholders.addressLine')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="note" label={t('fields.note')}>
          <Input.TextArea rows={3} placeholder={t('placeholders.note')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CRMModal;

