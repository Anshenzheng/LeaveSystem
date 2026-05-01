import React, { useState, useEffect } from 'react'
import { Card, Select, Tag, Button, List, Badge, DatePicker, Row, Col, message, Space, Modal, Descriptions, Calendar } from 'antd'
import { calendarApi, departmentApi } from '../../services/api'
import dayjs from 'dayjs'
import locale from 'antd/es/calendar/locale/zh_CN'

const CalendarView = () => {
  const [calendarData, setCalendarData] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [departmentId, setDepartmentId] = useState(undefined)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const monthStart = selectedDate.startOf('month')
      const monthEnd = selectedDate.endOf('month')
      
      const params = {
        start_date: monthStart.format('YYYY-MM-DD'),
        end_date: monthEnd.format('YYYY-MM-DD')
      }
      if (departmentId) {
        params.department_id = departmentId
      }
      
      const response = await calendarApi.getCalendarData(params)
      setCalendarData(response.data)
    } catch (error) {
      console.error('获取日历数据失败:', error)
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
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedDate, departmentId])

  const getApplicationsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    return calendarData.filter(app => {
      return dateStr >= app.start_date && dateStr <= app.end_date
    })
  }

  const dateCellRender = (date) => {
    const apps = getApplicationsForDate(date)
    const isToday = date.isSame(dayjs(), 'day')
    
    return (
      <div 
        style={{
          minHeight: 80,
          padding: '4px 2px',
          background: isToday ? '#e6f7ff' : 'transparent'
        }}
      >
        <List
          size="small"
          dataSource={apps}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '2px 0', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                setSelectedApplication(item)
                setDetailModalVisible(true)
              }}
            >
              <Tag color={getLeaveTypeColor(item.leave_type_name)}>
                {item.employee_name}
              </Tag>
            </List.Item>
          )}
        />
      </div>
    )
  }

  const getLeaveTypeColor = (type) => {
    const colorMap = {
      '年假': 'blue',
      '病假': 'orange',
      '事假': 'red',
      '婚假': 'purple',
      '产假': 'pink'
    }
    return colorMap[type] || 'default'
  }

  const monthPanelRender = (_, info) => {
    const { value, onChange } = info
    return (
      <div style={{ padding: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button
              size="small"
              onClick={() => onChange(value.clone().subtract(1, 'month'))}
            >
              上月
            </Button>
          </Col>
          <Col>
            <strong>{value.format('YYYY年 MM月')}</strong>
          </Col>
          <Col>
            <Button
              size="small"
              onClick={() => onChange(value.clone().add(1, 'month'))}
            >
              下月
            </Button>
          </Col>
        </Row>
      </div>
    )
  }

  const statusMap = {
    pending: { text: '待审核', color: 'orange' },
    approved: { text: '已通过', color: 'green' },
    rejected: { text: '已拒绝', color: 'red' }
  }

  return (
    <div>
      <Card
        title="日历视图"
        extra={
          <Space>
            <Select
              placeholder="选择部门"
              style={{ width: 150 }}
              allowClear
              value={departmentId}
              onChange={setDepartmentId}
              options={departments.map(d => ({ label: d.name, value: d.id }))}
            />
            <DatePicker.MonthPicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="选择月份"
              format="YYYY年MM月"
              locale={locale}
            />
          </Space>
        }
        loading={loading}
      >
        <Calendar
          fullscreen={false}
          value={selectedDate}
          cellRender={dateCellRender}
          headerRender={monthPanelRender}
          locale={locale}
        />

        <div style={{ marginTop: 20 }}>
          <h4>图例说明</h4>
          <Row gutter={16}>
            <Col><Tag color="blue">年假</Tag></Col>
            <Col><Tag color="orange">病假</Tag></Col>
            <Col><Tag color="red">事假</Tag></Col>
            <Col><Tag color="purple">婚假</Tag></Col>
            <Col><Tag color="pink">产假</Tag></Col>
          </Row>
        </div>
      </Card>

      <Modal
        title="请假详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedApplication && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="员工姓名">{selectedApplication.employee_name}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedApplication.department_name}</Descriptions.Item>
            <Descriptions.Item label="假期类型">{selectedApplication.leave_type_name}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{selectedApplication.start_date}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{selectedApplication.end_date}</Descriptions.Item>
            <Descriptions.Item label="天数">{selectedApplication.days} 天</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedApplication.status]?.color}>
                {statusMap[selectedApplication.status]?.text}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default CalendarView
