import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd'
import { userApi, departmentApi } from '../../services/api'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'

const roleMap = {
  admin: { text: '管理员', color: 'purple' },
  manager: { text: '部门经理', color: 'blue' },
  employee: { text: '员工', color: 'default' }
}

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form] = Form.useForm()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userApi.getAll()
      setUsers(response.data)
    } catch (error) {
      console.error('获取用户列表失败:', error)
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

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  const showCreate = () => {
    form.resetFields()
    form.setFieldsValue({ role: 'employee' })
    setCreateModalVisible(true)
  }

  const showEdit = (user) => {
    setSelectedUser(user)
    form.resetFields()
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id
    })
    setEditModalVisible(true)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      // 这里需要调用注册接口，因为没有专门的创建用户接口
      // 实际上我们在后端有register接口，可以用它来创建用户
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          name: values.name,
          email: values.email,
          role: values.role,
          department_id: values.department_id
        }),
        credentials: 'include'
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      fetchUsers()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      await userApi.update(selectedUser.id, {
        name: values.name,
        email: values.email,
        role: values.role,
        department_id: values.department_id,
        password: values.password
      })
      message.success('更新成功')
      setEditModalVisible(false)
      fetchUsers()
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败')
    }
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={roleMap[role]?.color}>{roleMap[role]?.text}</Tag>
      )
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
      render: (dept) => dept || '-'
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
      width: 100,
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
      title="用户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreate}>
          新增用户
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title="新增用户"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱（选填）" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="employee">员工</Select.Option>
              <Select.Option value="manager">部门经理</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="department_id"
            label="部门"
          >
            <Select placeholder="请选择部门（选填）" allowClear>
              {departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        {selectedUser && (
          <Form form={form} layout="vertical">
            <Form.Item label="用户名">
              <Input value={selectedUser.username} disabled />
            </Form.Item>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input placeholder="请输入邮箱（选填）" />
            </Form.Item>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                <Select.Option value="employee">员工</Select.Option>
                <Select.Option value="manager">部门经理</Select.Option>
                <Select.Option value="admin">管理员</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="department_id"
              label="部门"
            >
              <Select placeholder="请选择部门（选填）" allowClear>
                {departments.map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="password"
              label="新密码"
            >
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  )
}

export default UserManagement
