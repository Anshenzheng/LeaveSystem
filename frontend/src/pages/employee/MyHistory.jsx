import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Descriptions, message, Space, Select, DatePicker } from 'antd'
import { applicationApi } from '../../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const statusMap = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' }
}

const MyHistory = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [filters, setFilters] = useState({
    status: undefined,
    dateRange: undefined
  })

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) {
        params.status = filters.status
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const response = await applicationApi.getAll(params)
      setApplications(response.data)
    } catch (error) {
      console.error('获取申请记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const showDetail = (application) => {
    setSelectedApplication(application)
    setDetailModalVisible(true)
  }

  const handleCancel = async (application) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消此请假申请吗？',
      onOk: async () => {
        try {
          await applicationApi.cancel(application.id)
          message.success('申请已取消')
          fetchApplications()
        } catch (error) {
          message.error(error.response?.data?.error || '取消失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '假期类型',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
      width: 120
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
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
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
            <Button type="link" size="small" danger onClick={() => handleCancel(record)}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        title="我的申请记录"
        extra={
          <Space>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
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
        title="申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedApplication && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="假期类型">
              {selectedApplication.leave_type_name}
            </Descriptions.Item>
            <Descriptions.Item label="请假日期">
              {selectedApplication.start_date} 至 {selectedApplication.end_date}
            </Descriptions.Item>
            <Descriptions.Item label="请假天数">
              {selectedApplication.days} 天
            </Descriptions.Item>
            <Descriptions.Item label="请假原因">
              {selectedApplication.reason}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedApplication.status]?.color}>
                {statusMap[selectedApplication.status]?.text}
              </Tag>
            </Descriptions.Item>
            {selectedApplication.reviewer_name && (
              <>
                <Descriptions.Item label="审核人">
                  {selectedApplication.reviewer_name}
                </Descriptions.Item>
                <Descriptions.Item label="审核意见">
                  {selectedApplication.review_comment || '无'}
                </Descriptions.Item>
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

export default MyHistory
