import React from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  HistoryOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const AppLayout = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: '1',
      label: (
        <Space>
          <UserOutlined />
          <span>{user?.name}</span>
        </Space>
      ),
      disabled: true
    },
    {
      key: '2',
      label: user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '部门经理' : '员工'
    },
    { type: 'divider' },
    {
      key: '3',
      label: (
        <Space onClick={handleLogout}>
          <LogoutOutlined />
          <span>退出登录</span>
        </Space>
      )
    }
  ]

  const employeeMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '我的额度'
    },
    {
      key: '/apply',
      icon: <CalendarOutlined />,
      label: '申请请假'
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '申请记录'
    }
  ]

  const adminMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '请假申请审核'
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: '日历视图'
    },
    {
      key: '/records',
      icon: <FileTextOutlined />,
      label: '请假记录'
    },
    {
      key: '/quotas',
      icon: <SettingOutlined />,
      label: '额度管理'
    },
    {
      key: '/leave-types',
      icon: <FileTextOutlined />,
      label: '假期类型'
    },
    {
      key: '/departments',
      icon: <TeamOutlined />,
      label: '部门管理'
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理'
    }
  ]

  const menuItems = isAdmin() ? adminMenuItems : employeeMenuItems

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            请假系统
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 6
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
