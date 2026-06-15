export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type StatusCategory = '2xx' | '3xx' | '4xx' | '5xx';

export type IssueStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type Environment = 'dev' | 'test' | 'staging' | 'production';

export interface EnvironmentConfig {
  id: string;
  name: string;
  baseUrl: string;
  type: Environment;
  headers?: KeyValue[];
}

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiGroup {
  id: string;
  name: string;
  icon?: string;
  apis: ApiItem[];
}

export interface ApiItem {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  description?: string;
  groupId: string;
  isFavorite?: boolean;
  headers?: KeyValue[];
  queryParams?: KeyValue[];
  body?: string;
  bodyType?: 'json' | 'form' | 'raw';
}

export interface RequestRecord {
  id: string;
  apiId?: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body?: string;
  bodyType?: 'json' | 'form' | 'raw';
  createdAt: number;
  response?: ApiResponse;
  assertNote?: string;
  screenshots?: string[];
  environmentId?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  size: number;
  timestamp: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  apiId?: string;
  requestRecordId?: string;
  assignee?: string;
  reporter: string;
  createdAt: number;
  updatedAt: number;
  screenshots?: string[];
  comments?: IssueComment[];
  labels?: string[];
}

export interface IssueComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
  attachments?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'tester' | 'product';
}
