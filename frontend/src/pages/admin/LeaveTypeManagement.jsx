import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Switch, message, Space, Descriptions } from 'antd'
import { leaveTypeApi } from '../../services/api'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'

const LeaveTypeManagement = () => {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [form] = Form.useForm()

  const fetchLeaveTypes = async () => {
    setLoading(true)
    try {
      const response = await leaveTypeApi.getAll()
      setLeaveTypes(response.data)
    } catch (error) {
      console.error('获取假期类型失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const showCreate = () => {
    form.resetFields()
    form.setFieldsValue({ is_active: true })
    setCreateModalVisible(true)
  }

  const showEdit = (type) => {
    setSelectedType(type)
    form.resetFields()
    form.setFieldsValue({
      name: type.name,
      description: type.description,
      is_active: type.is_active
    })
    setEditModalVisible(true)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await leaveTypeApi.create({
        name: values.name,
        code: values.code,
        description: values.description
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      fetchLeaveTypes()
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      await leaveTypeApi.update(selectedType.id, {
        name: values.name,
        description: values.description,
        is_active: values.is_active
      })
      message.success('更新成功')
      setEditModalVisible(false)
      fetchLeaveTypes()
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败')
    }
  }

  const columns = [
    {
      title: '假期名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
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

  return (
    <Card
      title="假期类型管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreate}>
          新增类型
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={leaveTypes}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title="新增假期类型"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="假期名称"
            rules={[{ required: true, message: '请输入假期名称' }]}
          >
            <Input placeholder="请输入假期名称，如：年假" />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[{ required: true, message: '请输入代码' }]}
          >
            <Input placeholder="请输入唯一代码，如：annual" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑假期类型"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        {selectedType && (
          <Form form={form} layout="vertical">
            <Form.Item label="代码">
              <Input value={selectedType.code} disabled />
            </Form.Item>
            <Form.Item
              name="name"
              label="假期名称"
              rules={[{ required: true, message: '请输入假期名称' }]}
            >
              <Input placeholder="请输入假期名称" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="请输入描述（选填）" />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  )
}

export default LeaveTypeManagement
