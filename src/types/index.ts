export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type StatusCategory = '2xx' | '3xx' | '4xx' | '5xx';

export type IssueStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type Environment = 'dev' | 'test' | 'staging' | 'production';

export type DraftType = 'auto' | 'manual';

export type ActivityType = 
  | 'issue_created' 
  | 'status_changed' 
  | 'comment_added' 
  | 'screenshot_added'
  | 'screenshot_removed'
  | 'shared' 
  | 'assigned'
  | 'request_linked'
  | 'description_updated'
  | 'session_created'
  | 'request_added_to_session'
  | 'conclusion_updated';

export type SessionStatus = 'active' | 'resolved' | 'archived';

export interface SessionEvent {
  id: string;
  type: 'request' | 'comment' | 'screenshot' | 'conclusion';
  createdAt: number;
  userId: string;
  userName: string;
  recordId?: string;
  comment?: string;
  screenshotId?: string;
  conclusion?: string;
}

export interface DebugSession {
  id: string;
  title: string;
  description?: string;
  issueId?: string;
  apiId?: string;
  status: SessionStatus;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  events: SessionEvent[];
  recordIds: string[];
  screenshotIds: string[];
  conclusion?: string;
}

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

export interface Screenshot {
  id: string;
  url: string;
  createdAt: number;
  uploader: string;
  description?: string;
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
  screenshotIds?: string[];
  environmentId?: string;
  sessionId?: string;
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

export interface Draft {
  id: string;
  apiId?: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: string;
  bodyType: 'json' | 'form' | 'raw';
  assertNote: string;
  screenshotIds: string[];
  type: DraftType;
  createdAt: number;
  updatedAt: number;
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
  screenshotIds?: string[];
  comments?: IssueComment[];
  activities?: IssueActivity[];
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

export interface IssueActivity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  createdAt: number;
  details: {
    oldStatus?: IssueStatus;
    newStatus?: IssueStatus;
    comment?: string;
    screenshotId?: string;
    screenshotUrl?: string;
    sharedTo?: string[];
    assignee?: string;
    requestId?: string;
    requestName?: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'tester' | 'product';
}
