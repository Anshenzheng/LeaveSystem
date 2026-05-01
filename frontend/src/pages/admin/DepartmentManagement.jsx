import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd'
import { departmentApi } from '../../services/api'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [form] = Form.useForm()

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await departmentApi.getAll()
      setDepartments(response.data)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const showCreate = () => {
    form.resetFields()
    setCreateModalVisible(true)
  }

  const showEdit = (dept) => {
    setSelectedDepartment(dept)
    form.resetFields()
    form.setFieldsValue({ name: dept.name })
    setEditModalVisible(true)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await departmentApi.create({ name: values.name })
      message.success('创建成功')
      setCreateModalVisible(false)
      fetchDepartments()
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      await departmentApi.update(selectedDepartment.id, { name: values.name })
      message.success('更新成功')
      setEditModalVisible(false)
      fetchDepartments()
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败')
    }
  }

  const handleDelete = async (dept) => {
    try {
      await departmentApi.delete(dept.id)
      message.success('删除成功')
      fetchDepartments()
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const columns = [
    {
      title: '部门ID',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该部门吗？如果部门下有员工则无法删除。"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="部门管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreate}>
          新增部门
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={departments}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title="新增部门"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称，如：技术部" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑部门"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default DepartmentManagement
