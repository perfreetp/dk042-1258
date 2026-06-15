import { Issue } from '@/types';

const now = Date.now();

export const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    title: '用户登录接口返回401错误',
    description: '使用正确的用户名密码登录时，偶尔会返回401未授权错误，刷新后又正常。怀疑是Token缓存问题。',
    status: 'processing',
    priority: 'high',
    apiId: 'api-1',
    requestRecordId: 'req-3',
    assignee: '张三',
    reporter: '李四',
    createdAt: now - 1000 * 60 * 60 * 24,
    updatedAt: now - 1000 * 60 * 60 * 2,
    labels: ['Bug', '认证'],
    comments: [
      {
        id: 'comment-1',
        userId: 'user-1',
        userName: '张三',
        content: '正在排查Token生成逻辑',
        createdAt: now - 1000 * 60 * 60 * 20
      },
      {
        id: 'comment-2',
        userId: 'user-2',
        userName: '李四',
        content: '复现步骤：连续登录3次以上会出现',
        createdAt: now - 1000 * 60 * 60 * 10
      }
    ]
  },
  {
    id: 'issue-2',
    title: '创建订单接口500错误',
    description: '创建订单时，当商品库存为0时，系统没有正确返回库存不足提示，而是返回500系统异常。',
    status: 'pending',
    priority: 'critical',
    apiId: 'api-8',
    requestRecordId: 'req-4',
    assignee: '赵六',
    reporter: '李四',
    createdAt: now - 1000 * 60 * 60 * 48,
    updatedAt: now - 1000 * 60 * 60 * 5,
    labels: ['Bug', '订单', '库存']
  },
  {
    id: 'issue-3',
    title: '订单列表接口响应时间过长',
    description: '当数据量超过1000条时，接口响应时间超过2秒，需要优化查询性能。',
    status: 'pending',
    priority: 'medium',
    apiId: 'api-6',
    reporter: '王五',
    createdAt: now - 1000 * 60 * 60 * 72,
    updatedAt: now - 1000 * 60 * 60 * 24,
    labels: ['性能优化']
  },
  {
    id: 'issue-4',
    title: '商品详情接口缺少字段',
    description: '商品详情接口返回数据中缺少商品库存字段，前端需要展示库存信息。',
    status: 'resolved',
    priority: 'low',
    apiId: 'api-11',
    assignee: '张三',
    reporter: '王五',
    createdAt: now - 1000 * 60 * 60 * 96,
    updatedAt: now - 1000 * 60 * 60 * 48,
    labels: ['需求'],
    comments: [
      {
        id: 'comment-3',
        userId: 'user-1',
        userName: '张三',
        content: '已添加stock字段',
        createdAt: now - 1000 * 60 * 60 * 50
      }
    ]
  },
  {
    id: 'issue-5',
    title: '上传文件接口限制大小需调整',
    description: '当前上传文件限制为5MB，需要调整为20MB。',
    status: 'closed',
    priority: 'low',
    apiId: 'api-14',
    assignee: '赵六',
    reporter: '王五',
    createdAt: now - 1000 * 60 * 60 * 120,
    updatedAt: now - 1000 * 60 * 60 * 72,
    labels: ['配置']
  }
];
