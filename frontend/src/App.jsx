import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/Layout'
import Login from './pages/Login'

import MyQuota from './pages/employee/MyQuota'
import ApplyLeave from './pages/employee/ApplyLeave'
import MyHistory from './pages/employee/MyHistory'

import ReviewApplications from './pages/admin/ReviewApplications'
import CalendarView from './pages/admin/CalendarView'
import LeaveRecords from './pages/admin/LeaveRecords'
import QuotaManagement from './pages/admin/QuotaManagement'
import LeaveTypeManagement from './pages/admin/LeaveTypeManagement'
import DepartmentManagement from './pages/admin/DepartmentManagement'
import UserManagement from './pages/admin/UserManagement'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />
  }
  
  if (requireAdmin && user.role !== 'admin' && user.role !== 'manager') {
    return <Navigate to="/" replace />
  }
  
  return children
}

const AppRoutes = () => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route 
          index 
          element={
            user?.role === 'admin' || user?.role === 'manager' 
              ? <ReviewApplications /> 
              : <MyQuota />
          } 
        />
        
        <Route path="apply" element={<ApplyLeave />} />
        <Route path="history" element={<MyHistory />} />
        
        <Route path="calendar" element={
          <ProtectedRoute requireAdmin>
            <CalendarView />
          </ProtectedRoute>
        } />
        <Route path="records" element={
          <ProtectedRoute requireAdmin>
            <LeaveRecords />
          </ProtectedRoute>
        } />
        <Route path="quotas" element={
          <ProtectedRoute requireAdmin>
            <QuotaManagement />
          </ProtectedRoute>
        } />
        <Route path="leave-types" element={
          <ProtectedRoute requireAdmin>
            <LeaveTypeManagement />
          </ProtectedRoute>
        } />
        <Route path="departments" element={
          <ProtectedRoute requireAdmin>
            <DepartmentManagement />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
