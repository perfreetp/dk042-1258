import { RequestRecord } from '@/types';

const now = Date.now();

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
