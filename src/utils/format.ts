import { HttpMethod, StatusCategory } from '@/types';

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  return formatTime(timestamp);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const getMethodColor = (method: HttpMethod): string => {
  const colors: Record<HttpMethod, string> = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
    PATCH: '#8B5CF6',
    HEAD: '#06B6D4',
    OPTIONS: '#EC4899'
  };
  return colors[method] || '#64748B';
};

export const getStatusCategory = (status: number): StatusCategory => {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  return '5xx';
};

export const getStatusColor = (status: number): string => {
  const category = getStatusCategory(status);
  const colors: Record<StatusCategory, string> = {
    '2xx': '#10B981',
    '3xx': '#3B82F6',
    '4xx': '#F59E0B',
    '5xx': '#EF4444'
  };
  return colors[category];
};

export const getStatusBgColor = (status: number): string => {
  const category = getStatusCategory(status);
  const colors: Record<StatusCategory, string> = {
    '2xx': 'rgba(16, 185, 129, 0.15)',
    '3xx': 'rgba(59, 130, 246, 0.15)',
    '4xx': 'rgba(245, 158, 11, 0.15)',
    '5xx': 'rgba(239, 68, 68, 0.15)'
  };
  return colors[category];
};

export const formatJson = (data: any, indent: number = 2): string => {
  try {
    if (typeof data === 'string') {
      return JSON.stringify(JSON.parse(data), null, indent);
    }
    return JSON.stringify(data, null, indent);
  } catch {
    return String(data);
  }
};

export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
