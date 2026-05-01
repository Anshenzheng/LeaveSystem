import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Select, Input, message, Space, Descriptions, DatePicker } from 'antd'
import { applicationApi, departmentApi } from '../../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input

const statusMap = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' }
}

const ReviewApplications = () => {
  const [applications, setApplications] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({
    status: 'pending',
    department_id: undefined
  })

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) {
        params.status = filters.status
      }
      if (filters.department_id) {
        params.department_id = filters.department_id
      }
      const response = await applicationApi.getAll(params)
      setApplications(response.data)
    } catch (error) {
      console.error('获取申请列表失败:', error)
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
    fetchApplications()
  }, [filters])

  const showReview = (application) => {
    setSelectedApplication(application)
    form.resetFields()
    setReviewModalVisible(true)
  }

  const showDetail = (application) => {
    setSelectedApplication(application)
    setDetailModalVisible(true)
  }

  const handleReview = async () => {
    try {
      const values = await form.validateFields()
      await applicationApi.review(selectedApplication.id, {
        status: values.status,
        review_comment: values.review_comment
      })
      message.success('审核完成')
      setReviewModalVisible(false)
      fetchApplications()
    } catch (error) {
      message.error(error.response?.data?.error || '审核失败')
    }
  }

  const columns = [
    {
      title: '申请人',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 100
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
      title: '请假日期',
      key: 'date_range',
      width: 200,
      render: (_, record) => (
        <span>{record.start_date} 至 {record.end_date}</span>
      )
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
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => showReview(record)}>
              审核
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        title="请假申请审核"
        extra={
          <Space>
            <Select
              placeholder="选择部门"
              style={{ width: 150 }}
              allowClear
              value={filters.department_id}
              onChange={(value) => setFilters({ ...filters, department_id: value })}
              options={departments.map(d => ({ label: d.name, value: d.id }))}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已拒绝', value: 'rejected' }
              ]}
            />
            <Button type="primary" onClick={fetchApplications}>
              查询
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={applications}
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
        title="审核请假申请"
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={() => setReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        {selectedApplication && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="申请人">{selectedApplication.employee_name}</Descriptions.Item>
              <Descriptions.Item label="部门">{selectedApplication.department_name}</Descriptions.Item>
              <Descriptions.Item label="假期类型">{selectedApplication.leave_type_name}</Descriptions.Item>
              <Descriptions.Item label="请假日期">
                {selectedApplication.start_date} 至 {selectedApplication.end_date}
              </Descriptions.Item>
              <Descriptions.Item label="天数">{selectedApplication.days} 天</Descriptions.Item>
              <Descriptions.Item label="请假原因">{selectedApplication.reason}</Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical">
              <Form.Item
                name="status"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Select placeholder="请选择审核结果">
                  <Select.Option value="approved">通过</Select.Option>
                  <Select.Option value="rejected">拒绝</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="review_comment"
                label="审核意见"
              >
                <TextArea rows={3} placeholder="请输入审核意见（选填" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedApplication && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="申请人">{selectedApplication.employee_name}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedApplication.department_name}</Descriptions.Item>
            <Descriptions.Item label="假期类型">{selectedApplication.leave_type_name}</Descriptions.Item>
            <Descriptions.Item label="请假日期">
              {selectedApplication.start_date} 至 {selectedApplication.end_date}
            </Descriptions.Item>
            <Descriptions.Item label="天数">{selectedApplication.days} 天</Descriptions.Item>
            <Descriptions.Item label="请假原因">{selectedApplication.reason}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedApplication.status]?.color}>
                {statusMap[selectedApplication.status]?.text}
              </Tag>
            </Descriptions.Item>
            {selectedApplication.reviewer_name && (
              <>
                <Descriptions.Item label="审核人">{selectedApplication.reviewer_name}</Descriptions.Item>
                <Descriptions.Item label="审核意见">{selectedApplication.review_comment || '无'}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="申请时间">
              {dayjs(selectedApplication.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ReviewApplications
