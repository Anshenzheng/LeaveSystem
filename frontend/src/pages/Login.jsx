import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Row, Col } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success('登录成功')
      navigate(from, { replace: true })
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={16} md={12} lg={8}>
        <Card 
          title={
            <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              请假调休管理系统
            </div>
          }
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '20px' }}>
            <p>测试账号：</p>
            <p>管理员: admin / admin123</p>
            <p>经理: manager1 / manager123</p>
            <p>员工: emp1 / emp123</p>
          </div>
        </Card>
      </Col>
    </Row>
  )
}

export default Login
