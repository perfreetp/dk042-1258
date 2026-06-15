import { RequestRecord, Issue, Screenshot, IssueActivity } from '@/types';

const now = Date.now();

export const mockScreenshots: Screenshot[] = [
  {
    id: 'screenshot-1',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    createdAt: now - 1000 * 60 * 60 * 2,
    uploader: '李四'
  },
  {
    id: 'screenshot-2',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    createdAt: now - 1000 * 60 * 60 * 1,
    uploader: '张三'
  }
];

export const mockHistory: RequestRecord[] = [
  {
    id: 'req-1',
    apiId: 'api-1',
    name: '用户登录',
    method: 'POST',
    url: 'https://test-api.example.com/api/v1/auth/login',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    queryParams: [],
    body: JSON.stringify({ username: 'admin', password: '123456' }),
    bodyType: 'json',
    createdAt: now - 1000 * 60 * 5,
    environmentId: 'env-2',
    assertNote: '登录成功，Token已获取',
    screenshotIds: [],
    response: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'abc123'
      },
      data: {
        code: 0,
        message: 'success',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            username: 'admin',
            nickname: '管理员'
          }
        }
      },
      duration: 234,
      size: 512,
      timestamp: now - 1000 * 60 * 5
    }
  },
  {
    id: 'req-2',
    apiId: 'api-6',
    name: '订单列表',
    method: 'GET',
    url: 'https://test-api.example.com/api/v1/orders',
    headers: [
      { key: 'Authorization', value: 'Bearer tokenxxx', enabled: true }
    ],
    queryParams: [
      { key: 'page', value: '1', enabled: true },
      { key: 'pageSize', value: '20', enabled: true }
    ],
    createdAt: now - 1000 * 60 * 30,
    environmentId: 'env-2',
    assertNote: '分页参数验证通过',
    screenshotIds: [],
    response: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        code: 0,
        message: 'success',
        data: {
          list: [
            { id: 1001, status: 'paid', amount: 299.00, createdAt: '2024-01-15 10:30:00' }
          ],
          total: 156,
          page: 1,
          pageSize: 20
        }
      },
      duration: 156,
      size: 2048,
      timestamp: now - 1000 * 60 * 30
    }
  },
  {
    id: 'req-3',
    apiId: 'api-2',
    name: '获取用户信息',
    method: 'GET',
    url: 'https://dev-api.example.com/api/v1/user/info',
    headers: [
      { key: 'Authorization', value: 'Bearer invalid_token', enabled: true }
    ],
    queryParams: [],
    createdAt: now - 1000 * 60 * 60 * 2,
    environmentId: 'env-1',
    assertNote: 'Token过期需要刷新',
    screenshotIds: ['screenshot-1'],
    response: {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        code: 40101,
        message: 'Token已过期，请重新登录'
      },
      duration: 89,
      size: 128,
      timestamp: now - 1000 * 60 * 60 * 2
    }
  },
  {
    id: 'req-4',
    apiId: 'api-8',
    name: '创建订单',
    method: 'POST',
    url: 'https://test-api.example.com/api/v1/orders',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer tokenxxx', enabled: true }
    ],
    queryParams: [],
    body: JSON.stringify({ productId: 101, quantity: 2, address: '北京市朝阳区' }),
    bodyType: 'json',
    createdAt: now - 1000 * 60 * 60 * 5,
    environmentId: 'env-2',
    assertNote: '库存不足问题',
    screenshotIds: ['screenshot-2'],
    response: {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        code: 50001,
        message: '系统异常，请稍后重试'
      },
      duration: 1250,
      size: 256,
      timestamp: now - 1000 * 60 * 60 * 5
    }
  },
  {
    id: 'req-5',
    apiId: 'api-15',
    name: '健康检查',
    method: 'GET',
    url: 'https://api.example.com/api/v1/system/health',
    headers: [],
    queryParams: [],
    createdAt: now - 1000 * 60 * 60 * 24,
    environmentId: 'env-4',
    assertNote: '生产环境正常',
    screenshotIds: [],
    response: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        status: 'healthy',
        timestamp: now - 1000 * 60 * 60 * 24,
        version: '1.2.0'
      },
      duration: 45,
      size: 86,
      timestamp: now - 1000 * 60 * 60 * 24
    }
  }
];

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
    screenshotIds: ['screenshot-1'],
    labels: ['Bug', '认证'],
    activities: [
      {
        id: 'act-1',
        type: 'issue_created',
        userId: 'user-2',
        userName: '李四',
        createdAt: now - 1000 * 60 * 60 * 24,
        details: {}
      },
      {
        id: 'act-2',
        type: 'status_changed',
        userId: 'user-1',
        userName: '张三',
        createdAt: now - 1000 * 60 * 60 * 20,
        details: {
          oldStatus: 'pending',
          newStatus: 'processing'
        }
      },
      {
        id: 'act-3',
        type: 'screenshot_added',
        userId: 'user-2',
        userName: '李四',
        createdAt: now - 1000 * 60 * 60 * 10,
        details: {
          screenshotId: 'screenshot-1',
          screenshotUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop'
        }
      },
      {
        id: 'act-4',
        type: 'comment_added',
        userId: 'user-1',
        userName: '张三',
        createdAt: now - 1000 * 60 * 60 * 5,
        details: {
          comment: '正在排查Token生成逻辑，可能是并发问题'
        }
      }
    ],
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
    screenshotIds: ['screenshot-2'],
    labels: ['Bug', '订单', '库存'],
    activities: [
      {
        id: 'act-5',
        type: 'issue_created',
        userId: 'user-2',
        userName: '李四',
        createdAt: now - 1000 * 60 * 60 * 48,
        details: {}
      },
      {
        id: 'act-6',
        type: 'screenshot_added',
        userId: 'user-2',
        userName: '李四',
        createdAt: now - 1000 * 60 * 60 * 47,
        details: {
          screenshotId: 'screenshot-2',
          screenshotUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
        }
      }
    ]
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
    screenshotIds: [],
    labels: ['性能优化'],
    activities: [
      {
        id: 'act-7',
        type: 'issue_created',
        userId: 'user-3',
        userName: '王五',
        createdAt: now - 1000 * 60 * 60 * 72,
        details: {}
      }
    ]
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
    screenshotIds: [],
    labels: ['需求'],
    activities: [
      {
        id: 'act-8',
        type: 'issue_created',
        userId: 'user-3',
        userName: '王五',
        createdAt: now - 1000 * 60 * 60 * 96,
        details: {}
      },
      {
        id: 'act-9',
        type: 'status_changed',
        userId: 'user-1',
        userName: '张三',
        createdAt: now - 1000 * 60 * 60 * 48,
        details: {
          oldStatus: 'processing',
          newStatus: 'resolved'
        }
      },
      {
        id: 'act-10',
        type: 'comment_added',
        userId: 'user-1',
        userName: '张三',
        createdAt: now - 1000 * 60 * 60 * 50,
        details: {
          comment: '已添加stock字段'
        }
      }
    ],
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
    screenshotIds: [],
    labels: ['配置'],
    activities: [
      {
        id: 'act-11',
        type: 'issue_created',
        userId: 'user-3',
        userName: '王五',
        createdAt: now - 1000 * 60 * 60 * 120,
        details: {}
      },
      {
        id: 'act-12',
        type: 'status_changed',
        userId: 'user-4',
        userName: '赵六',
        createdAt: now - 1000 * 60 * 60 * 72,
        details: {
          oldStatus: 'resolved',
          newStatus: 'closed'
        }
      }
    ]
  }
];
