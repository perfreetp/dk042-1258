import { ApiGroup, EnvironmentConfig, TeamMember } from '@/types';

export const mockEnvironments: EnvironmentConfig[] = [
  {
    id: 'env-1',
    name: '开发环境',
    baseUrl: 'https://dev-api.example.com',
    type: 'dev',
    headers: [
      { key: 'X-Env', value: 'dev', enabled: true }
    ]
  },
  {
    id: 'env-2',
    name: '测试环境',
    baseUrl: 'https://test-api.example.com',
    type: 'test',
    headers: [
      { key: 'X-Env', value: 'test', enabled: true }
    ]
  },
  {
    id: 'env-3',
    name: '预发环境',
    baseUrl: 'https://staging-api.example.com',
    type: 'staging',
    headers: [
      { key: 'X-Env', value: 'staging', enabled: true }
    ]
  },
  {
    id: 'env-4',
    name: '生产环境',
    baseUrl: 'https://api.example.com',
    type: 'production',
    headers: []
  }
];

export const mockApiGroups: ApiGroup[] = [
  {
    id: 'group-1',
    name: '用户模块',
    apis: [
      {
        id: 'api-1',
        name: '用户登录',
        method: 'POST',
        path: '/api/v1/auth/login',
        description: '用户账号密码登录',
        groupId: 'group-1',
        isFavorite: true,
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true }
        ],
        bodyType: 'json',
        body: JSON.stringify({ username: 'admin', password: '123456' }, null, 2)
      },
      {
        id: 'api-2',
        name: '获取用户信息',
        method: 'GET',
        path: '/api/v1/user/info',
        description: '获取当前登录用户信息',
        groupId: 'group-1',
        isFavorite: false,
        headers: [
          { key: 'Authorization', value: 'Bearer {token}', enabled: true }
        ],
        queryParams: [
          { key: 'include', value: 'roles,permissions', enabled: true }
        ]
      },
      {
        id: 'api-3',
        name: '用户注册',
        method: 'POST',
        path: '/api/v1/auth/register',
        description: '新用户注册',
        groupId: 'group-1',
        isFavorite: false,
        bodyType: 'json',
        body: JSON.stringify({ username: '', email: '', password: '' }, null, 2)
      },
      {
        id: 'api-4',
        name: '更新用户信息',
        method: 'PUT',
        path: '/api/v1/user/{id}',
        description: '更新用户基本信息',
        groupId: 'group-1',
        isFavorite: false
      },
      {
        id: 'api-5',
        name: '删除用户',
        method: 'DELETE',
        path: '/api/v1/user/{id}',
        description: '删除指定用户',
        groupId: 'group-1',
        isFavorite: false
      }
    ]
  },
  {
    id: 'group-2',
    name: '订单模块',
    apis: [
      {
        id: 'api-6',
        name: '订单列表',
        method: 'GET',
        path: '/api/v1/orders',
        description: '分页获取订单列表',
        groupId: 'group-2',
        isFavorite: true,
        queryParams: [
          { key: 'page', value: '1', enabled: true },
          { key: 'pageSize', value: '20', enabled: true },
          { key: 'status', value: '', enabled: false }
        ]
      },
      {
        id: 'api-7',
        name: '订单详情',
        method: 'GET',
        path: '/api/v1/orders/{id}',
        description: '获取订单详细信息',
        groupId: 'group-2',
        isFavorite: false
      },
      {
        id: 'api-8',
        name: '创建订单',
        method: 'POST',
        path: '/api/v1/orders',
        description: '创建新订单',
        groupId: 'group-2',
        isFavorite: false,
        bodyType: 'json',
        body: JSON.stringify({ productId: 0, quantity: 1, address: '' }, null, 2)
      },
      {
        id: 'api-9',
        name: '取消订单',
        method: 'PATCH',
        path: '/api/v1/orders/{id}/cancel',
        description: '取消指定订单',
        groupId: 'group-2',
        isFavorite: false
      }
    ]
  },
  {
    id: 'group-3',
    name: '商品模块',
    apis: [
      {
        id: 'api-10',
        name: '商品列表',
        method: 'GET',
        path: '/api/v1/products',
        description: '获取商品列表',
        groupId: 'group-3',
        isFavorite: false,
        queryParams: [
          { key: 'category', value: '', enabled: false },
          { key: 'keyword', value: '', enabled: false }
        ]
      },
      {
        id: 'api-11',
        name: '商品详情',
        method: 'GET',
        path: '/api/v1/products/{id}',
        description: '获取商品详情',
        groupId: 'group-3',
        isFavorite: false
      },
      {
        id: 'api-12',
        name: '商品分类',
        method: 'GET',
        path: '/api/v1/products/categories',
        description: '获取商品分类列表',
        groupId: 'group-3',
        isFavorite: true
      }
    ]
  },
  {
    id: 'group-4',
    name: '系统模块',
    apis: [
      {
        id: 'api-13',
        name: '系统配置',
        method: 'GET',
        path: '/api/v1/system/config',
        description: '获取系统配置信息',
        groupId: 'group-4',
        isFavorite: false
      },
      {
        id: 'api-14',
        name: '上传文件',
        method: 'POST',
        path: '/api/v1/system/upload',
        description: '上传文件到服务器',
        groupId: 'group-4',
        isFavorite: false
      },
      {
        id: 'api-15',
        name: '健康检查',
        method: 'GET',
        path: '/api/v1/system/health',
        description: '服务健康检查',
        groupId: 'group-4',
        isFavorite: true
      }
    ]
  }
];

export const mockTeamMembers: TeamMember[] = [
  { id: 'user-1', name: '张三', role: 'developer' },
  { id: 'user-2', name: '李四', role: 'tester' },
  { id: 'user-3', name: '王五', role: 'product' },
  { id: 'user-4', name: '赵六', role: 'developer' },
  { id: 'user-5', name: '钱七', role: 'admin' }
];
