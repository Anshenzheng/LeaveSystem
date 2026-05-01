import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Select, DatePicker, Input, message, Descriptions, Modal } from 'antd'
import { applicationApi, departmentApi, userApi } from '../../services/api'
import dayjs from 'dayjs'
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker
const { Search } = Input

const statusMap = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' }
}

const LeaveRecords = () => {
  const [records, setRecords] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    department_id: undefined,
    employee_id: undefined,
    status: undefined,
    dateRange: undefined
  })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.department_id) {
        params.department_id = filters.department_id
      }
      if (filters.employee_id) {
        params.employee_id = filters.employee_id
      }
      if (filters.status) {
        params.status = filters.status
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
      }
      
      const response = await applicationApi.getAll(params)
      setRecords(response.data)
    } catch (error) {
      console.error('获取请假记录失败:', error)
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

  useEffect(() => {
    fetchDepartments()
    fetchEmployees()
  }, [])

  const handleDepartmentChange = (value) => {
    setFilters({ ...filters, department_id: value, employee_id: undefined })
    fetchEmployees(value)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.department_id) {
      params.append('department_id', filters.department_id)
    }
    if (filters.employee_id) {
      params.append('employee_id', filters.employee_id)
    }
    if (filters.status) {
      params.append('status', filters.status)
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.append('start_date', filters.dateRange[0].format('YYYY-MM-DD'))
      params.append('end_date', filters.dateRange[1].format('YYYY-MM-DD'))
    }

    const queryString = params.toString()
    const url = queryString ? `/api/export/applications?${queryString}` : '/api/export/applications'
    
    window.open(url, '_blank')
    message.success('正在导出数据...')
  }

  const showDetail = (record) => {
    setSelectedRecord(record)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 100,
      fixed: 'left'
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 100
    },
    {
      title: '假期类型',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
      width: 100
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      )
    },
    {
      title: '审核人',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <Card
        title="请假记录查询"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出Excel
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="选择部门"
              style={{ width: 150 }}
              allowClear
              value={filters.department_id}
              onChange={handleDepartmentChange}
              options={departments.map(d => ({ label: d.name, value: d.id }))}
            />
            <Select
              placeholder="选择员工"
              style={{ width: 150 }}
              allowClear
              value={filters.employee_id}
              onChange={(value) => setFilters({ ...filters, employee_id: value })}
              options={employees.map(e => ({ label: e.name, value: e.id }))}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已拒绝', value: 'rejected' }
              ]}
            />
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
            <Button type="primary" onClick={fetchRecords}>
              查询
            </Button>
            <Button onClick={() => {
              setFilters({
                department_id: undefined,
                employee_id: undefined,
                status: undefined,
                dateRange: undefined
              })
              fetchEmployees()
            }}>
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      <Modal
        title="请假详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="员工姓名">{selectedRecord.employee_name}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedRecord.department_name}</Descriptions.Item>
            <Descriptions.Item label="假期类型">{selectedRecord.leave_type_name}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{selectedRecord.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{selectedRecord.end_date}</Descriptions.Item>
            <Descriptions.Item label="请假天数">{selectedRecord.days} 天</Descriptions.Item>
            <Descriptions.Item label="请假原因">{selectedRecord.reason}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedRecord.status]?.color}>
                {statusMap[selectedRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            {selectedRecord.reviewer_name && (
              <>
                <Descriptions.Item label="审核人">{selectedRecord.reviewer_name}</Descriptions.Item>
                <Descriptions.Item label="审核意见">{selectedRecord.review_comment || '无'}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="申请时间">
              {dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default LeaveRecords
