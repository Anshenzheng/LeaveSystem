import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Select, InputNumber, message, Space, Divider, Transfer } from 'antd'
import { quotaApi, departmentApi, userApi, leaveTypeApi } from '../../services/api'
import dayjs from 'dayjs'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

const QuotaManagement = () => {
  const [quotas, setQuotas] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    year: dayjs().year(),
    department_id: undefined
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [selectedQuota, setSelectedQuota] = useState(null)
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i)

  const fetchQuotas = async () => {
    setLoading(true)
    try {
      const params = { year: filters.year }
      if (filters.department_id) {
        params.department_id = filters.department_id
      }
      const response = await quotaApi.getAll(params)
      setQuotas(response.data)
    } catch (error) {
      console.error('获取额度列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll()
      setDepartments(response.data)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchEmployees = async (departmentId) => {
    try {
      const response = await userApi.getAll()
      let emps = response.data.filter(u => u.role === 'employee' || u.role === 'manager')
      if (departmentId) {
        emps = emps.filter(u => u.department_id === departmentId)
      }
      setEmployees(emps)
    } catch (error) {
      console.error('获取员工列表失败:', error)
    }
  }

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypeApi.getAll()
      setLeaveTypes(response.data)
    } catch (error) {
      console.error('获取假期类型失败:', error)
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchEmployees()
    fetchLeaveTypes()
  }, [])

  useEffect(() => {
    fetchQuotas()
  }, [filters])

  const handleDepartmentChange = (value) => {
    setFilters({ ...filters, department_id: value })
    fetchEmployees(value)
  }

  const showCreate = () => {
    form.resetFields()
    form.setFieldsValue({ year: dayjs().year() })
    setCreateModalVisible(true)
  }

  const showEdit = (quota) => {
    setSelectedQuota(quota)
    form.resetFields()
    form.setFieldsValue({
      total_days: quota.total_days
    })
    setEditModalVisible(true)
  }

  const showBatchCreate = () => {
    batchForm.resetFields()
    batchForm.setFieldsValue({ year: dayjs().year() })
    setBatchModalVisible(true)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await quotaApi.create({
        employee_id: values.employee_id,
        leave_type_id: values.leave_type_id,
        year: values.year,
        total_days: values.total_days
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      fetchQuotas()
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      await quotaApi.update(selectedQuota.id, {
        total_days: values.total_days
      })
      message.success('更新成功')
      setEditModalVisible(false)
      fetchQuotas()
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败')
    }
  }

  const handleBatchCreate = async () => {
    try {
      const values = await batchForm.validateFields()
      await quotaApi.createBatch({
        employee_ids: values.employee_ids,
        leave_type_id: values.leave_type_id,
        year: values.year,
        total_days: values.total_days
      })
      message.success('批量创建成功')
      setBatchModalVisible(false)
      fetchQuotas()
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120
    },
    {
      title: '假期类型',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
      width: 100
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 80
    },
    {
      title: '总天数',
      dataIndex: 'total_days',
      key: 'total_days',
      width: 100
    },
    {
      title: '已使用',
      dataIndex: 'used_days',
      key: 'used_days',
      width: 100
    },
    {
      title: '剩余天数',
      dataIndex: 'remaining_days',
      key: 'remaining_days',
      width: 100,
      render: (text, record) => {
        const color = text > 5 ? '#52c41a' : text > 0 ? '#faad14' : '#ff4d4f'
        return <span style={{ color, fontWeight: 'bold' }}>{text}</span>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => showEdit(record)}
        >
          编辑
        </Button>
      )
    }
  ]

  const transferDataSource = employees.map(emp => ({
    key: emp.id,
    title: emp.department_name ? `${emp.name}(${emp.department_name})` : emp.name
  }))

  return (
    <div>
      <Card
        title="假期额度管理"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={showCreate}>
              新增额度
            </Button>
            <Button onClick={showBatchCreate}>批量配置</Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="选择年度"
              style={{ width: 120 }}
              value={filters.year}
              onChange={(value) => setFilters({ ...filters, year: value })}
              options={years.map(y => ({ label: `${y}年`, value: y }))}
            />
            <Select
              placeholder="选择部门"
              style={{ width: 150 }}
              allowClear
              value={filters.department_id}
              onChange={handleDepartmentChange}
              options={departments.map(d => ({ label: d.name, value: d.id }))}
            />
            <Button type="primary" onClick={fetchQuotas}>查询</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={quotas}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="新增额度"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employee_id"
            label="员工"
            rules={[{ required: true, message: '请选择员工' }]}
          >
            <Select placeholder="请选择员工">
              {employees.map(emp => (
                <Select.Option key={emp.id} value={emp.id}>
                  {emp.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="leave_type_id"
            label="假期类型"
            rules={[{ required: true, message: '请选择假期类型' }]}
          >
            <Select placeholder="请选择假期类型">
              {leaveTypes.map(lt => (
                <Select.Option key={lt.id} value={lt.id}>
                  {lt.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="year"
            label="年度"
            rules={[{ required: true, message: '请选择年度' }]}
          >
            <Select placeholder="请选择年度">
              {years.map(y => (
                <Select.Option key={y} value={y}>{y}年</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="total_days"
            label="总额度(天)"
            rules={[{ required: true, message: '请输入总额度' }]}
          >
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑额度"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        {selectedQuota && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>员工：</strong>{selectedQuota.employee_name}</p>
              <p><strong>假期类型：</strong>{selectedQuota.leave_type_name}</p>
              <p><strong>年度：</strong>{selectedQuota.year}年</p>
              <p><strong>已使用：</strong>{selectedQuota.used_days} 天</p>
              <p style={{ color: '#999' }}>提示：总额度不能小于已使用天数</p>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="total_days"
                label="总额度(天)"
                rules={[{ required: true, message: '请输入总额度' }]}
              >
                <InputNumber min={selectedQuota.used_days} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="批量配置额度"
        open={batchModalVisible}
        onOk={handleBatchCreate}
        onCancel={() => setBatchModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={700}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="employee_ids"
            label="选择员工"
            rules={[{ required: true, message: '请选择员工' }]}
          >
            <Transfer
              dataSource={transferDataSource}
              titles={['待选', '已选']}
              targetKeys={[]}
              onChange={(targetKeys) => batchForm.setFieldValue('employee_ids', targetKeys)}
              render={item => item.title}
              listStyle={{ width: 280, height: 250 }}
            />
          </Form.Item>
          <Form.Item
            name="leave_type_id"
            label="假期类型"
            rules={[{ required: true, message: '请选择假期类型' }]}
          >
            <Select placeholder="请选择假期类型">
              {leaveTypes.map(lt => (
                <Select.Option key={lt.id} value={lt.id}>
                  {lt.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="year"
            label="年度"
            rules={[{ required: true, message: '请选择年度' }]}
          >
            <Select placeholder="请选择年度">
              {years.map(y => (
                <Select.Option key={y} value={y}>{y}年</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="total_days"
            label="总额度(天)"
            rules={[{ required: true, message: '请输入总额度' }]}
          >
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuotaManagement
