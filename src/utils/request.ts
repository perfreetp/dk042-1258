import Taro from '@tarojs/taro';
import { HttpMethod, KeyValue, ApiResponse } from '@/types';

interface SendRequestOptions {
  method: HttpMethod;
  url: string;
  headers?: KeyValue[];
  queryParams?: KeyValue[];
  body?: string;
  bodyType?: 'json' | 'form' | 'raw';
  timeout?: number;
}

const buildUrl = (baseUrl: string, queryParams?: KeyValue[]): string => {
  if (!queryParams || queryParams.length === 0) return baseUrl;
  const enabledParams = queryParams.filter(p => p.enabled && p.key);
  if (enabledParams.length === 0) return baseUrl;
  const queryString = enabledParams
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  return baseUrl.includes('?') ? `${baseUrl}&${queryString}` : `${baseUrl}?${queryString}`;
};

const buildHeaders = (headers?: KeyValue[]): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!headers) return result;
  headers.forEach(h => {
    if (h.enabled && h.key) {
      result[h.key] = h.value;
    }
  });
  return result;
};

export const sendRequest = async (options: SendRequestOptions): Promise<ApiResponse> => {
  const { method, url, headers, queryParams, body, bodyType = 'json', timeout = 30000 } = options;
  const startTime = Date.now();
  const fullUrl = buildUrl(url, queryParams);
  const headerObj = buildHeaders(headers);

  console.log('[Request] Starting request:', { method, fullUrl, headers: headerObj });

  try {
    let data: any = body;
    if (body && bodyType === 'json') {
      try {
        data = JSON.parse(body);
      } catch {
        data = body;
      }
    }

    const response = await Taro.request({
      url: fullUrl,
      method,
      header: headerObj,
      data,
      timeout,
      fail: (res) => {
        console.error('[Request] Taro.request fail:', res);
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const responseData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    console.log('[Request] Completed:', {
      status: response.statusCode,
      duration,
      size: responseData.length
    });

    return {
      status: response.statusCode,
      statusText: response.errMsg || getStatusText(response.statusCode),
      headers: (response.header || {}) as Record<string, string>,
      data: response.data,
      duration,
      size: responseData.length,
      timestamp: endTime
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Request] Error:', error);

    return {
      status: 0,
      statusText: error instanceof Error ? error.message : '请求失败',
      headers: {},
      data: null,
      duration,
      size: 0,
      timestamp: endTime
    };
  }
};

const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return statusTexts[status] || 'Unknown';
};
