import React, { useState, useEffect } from 'react'
import { Card, Form, Select, DatePicker, Input, Button, message, Row, Col } from 'antd'
import { leaveTypeApi, quotaApi, applicationApi } from '../../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

const ApplyLeave = () => {
  const [form] = Form.useForm()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [quotas, setQuotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState(null)

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveTypeApi.getAll()
      setLeaveTypes(response.data)
    } catch (error) {
      console.error('获取假期类型失败:', error)
    }
  }

  const fetchQuotas = async () => {
    try {
      const response = await quotaApi.getMy({ year: dayjs().year() })
      setQuotas(response.data)
    } catch (error) {
      console.error('获取额度失败:', error)
    }
  }

  useEffect(() => {
    fetchLeaveTypes()
    fetchQuotas()
  }, [])

  const getRemainingDays = (leaveTypeId) => {
    const quota = quotas.find(q => q.leave_type_id === leaveTypeId)
    return quota ? quota.remaining_days : 0
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const [startDate, endDate] = values.date_range
      const days = endDate.diff(startDate, 'day') + 1
      
      await applicationApi.create({
        leave_type_id: values.leave_type,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        reason: values.reason
      })
      
      message.success('请假申请提交成功')
      form.resetFields()
      fetchQuotas()
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveTypeChange = (value) => {
    setSelectedType(value)
  }

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day')
  }

  return (
    <Card title="申请请假">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          date_range: [dayjs(), dayjs().add(1, 'day')]
        }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="leave_type"
              label="假期类型"
              rules={[{ required: true, message: '请选择假期类型' }]}
            >
              <Select
                placeholder="请选择假期类型"
                onChange={handleLeaveTypeChange}
                options={leaveTypes.map(lt => ({
                  label: lt.name,
                  value: lt.id
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="剩余额度">
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {selectedType ? getRemainingDays(selectedType) : '-'} 天
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="date_range"
          label="请假日期"
          rules={[{ required: true, message: '请选择请假日期' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            disabledDate={disabledDate}
            onChange={(dates) => {
              if (dates) {
                const [start, end] = dates
                const days = end.diff(start, 'day') + 1
                form.setFieldValue('days', days)
              }
            }}
          />
        </Form.Item>

        <Form.Item name="days" label="请假天数">
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
            {form.getFieldValue('days') || '请选择日期'} 天
          </div>
        </Form.Item>

        <Form.Item
          name="reason"
          label="请假原因"
          rules={[{ required: true, message: '请输入请假原因' }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细说明请假原因"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            提交申请
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ApplyLeave
