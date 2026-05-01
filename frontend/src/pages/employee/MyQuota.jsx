import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Statistic, Row, Col, Progress } from 'antd'
import { quotaApi } from '../../services/api'
import dayjs from 'dayjs'

const { Option } = Select

const MyQuota = () => {
  const [quotas, setQuotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(dayjs().year())

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i)

  const fetchQuotas = async () => {
    setLoading(true)
    try {
      const response = await quotaApi.getMy({ year })
      setQuotas(response.data)
    } catch (error) {
      console.error('获取额度失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotas()
  }, [year])

  const columns = [
    {
      title: '假期类型',
      dataIndex: 'leave_type_name',
      key: 'leave_type_name',
      width: 150
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 100
    },
    {
      title: '总天数',
      dataIndex: 'total_days',
      key: 'total_days',
      width: 100
    },
    {
      title: '已使用',
      dataIndex: 'used_days',
      key: 'used_days',
      width: 100
    },
    {
      title: '剩余天数',
      dataIndex: 'remaining_days',
      key: 'remaining_days',
      width: 120,
      render: (text, record) => {
        const percent = record.total_days > 0 ? (record.used_days / record.total_days) * 100 : 0
        return (
          <Progress
            percent={parseFloat(percent.toFixed(1))}
            format={() => (
              <span style={{ color: text > 5 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                {text} 天
              </span>
            )}
            strokeColor={text > 5 ? '#52c41a' : '#ff4d4f'}
          />
        )
      }
    }
  ]

  const totalQuotas = quotas.reduce((sum, q) => sum + q.total_days, 0)
  const totalUsed = quotas.reduce((sum, q) => sum + q.used_days, 0)
  const totalRemaining = totalQuotas - totalUsed

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总额度" 
              value={totalQuotas} 
              suffix="天"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已使用" 
              value={totalUsed} 
              suffix="天"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="剩余" 
              value={totalRemaining} 
              suffix="天"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="使用率" 
              value={totalQuotas > 0 ? ((totalUsed / totalQuotas) * 100).toFixed(1) : 0} 
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="我的假期额度"
        extra={
          <Select value={year} onChange={setYear} style={{ width: 120 }}>
            {years.map(y => (
              <Option key={y} value={y}>{y}年</Option>
            ))}
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={quotas}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default MyQuota
