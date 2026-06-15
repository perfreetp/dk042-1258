import React, { useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { HttpMethod, KeyValue, ApiResponse } from '@/types';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import EnvSwitcher from '@/components/EnvSwitcher';
import { sendRequest } from '@/utils/request';
import { formatJson, formatDuration, formatBytes, generateId } from '@/utils/format';
import classnames from 'classnames';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const DebugPage: React.FC = () => {
  const { currentRequest, setCurrentRequest, addHistory, currentEnvId } = useAppStore();
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [assertNote, setAssertNote] = useState('');
  const [bodyType, setBodyType] = useState<'json' | 'form' | 'raw'>(currentRequest.bodyType || 'json');

  const updateKeyValue = (list: KeyValue[], index: number, field: 'key' | 'value', value: string): KeyValue[] => {
    const newList = [...list];
    newList[index] = { ...newList[index], [field]: value };
    return newList;
  };

  const toggleKeyValue = (list: KeyValue[], index: number): KeyValue[] => {
    const newList = [...list];
    newList[index] = { ...newList[index], enabled: !newList[index].enabled };
    return newList;
  };

  const deleteKeyValue = (list: KeyValue[], index: number): KeyValue[] => {
    return list.filter((_, i) => i !== index);
  };

  const addKeyValue = (): KeyValue[] => {
    return [{ key: '', value: '', enabled: true }];
  };

  const handleSend = async () => {
    if (!currentRequest.url) {
      Taro.showToast({ title: '请输入请求URL', icon: 'none' });
      return;
    }

    setLoading(true);
    setResponse(null);
    console.log('[Debug] Sending request:', {
      method: currentRequest.method,
      url: currentRequest.url
    });

    try {
      const resp = await sendRequest({
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        queryParams: currentRequest.queryParams,
        body: currentRequest.body,
        bodyType
      });

      setResponse(resp);

      const record = {
        id: generateId(),
        name: currentRequest.name || currentRequest.url,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        queryParams: currentRequest.queryParams,
        body: currentRequest.body,
        bodyType,
        createdAt: Date.now(),
        response: resp,
        assertNote,
        environmentId: currentEnvId
      };
      addHistory(record);

      if (resp.status >= 200 && resp.status < 300) {
        Taro.showToast({ title: '请求成功', icon: 'success' });
      } else if (resp.status >= 400) {
        Taro.showToast({ title: `请求失败 ${resp.status}`, icon: 'none' });
      }
    } catch (error) {
      console.error('[Debug] Request error:', error);
      Taro.showToast({ title: '请求出错', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    Taro.showToast({ title: '调试已保存', icon: 'success' });
  };

  const handleViewDetail = () => {
    if (!response) return;
    Taro.navigateTo({
      url: `/pages/response/index?id=${response.timestamp}`
    });
  };

  const renderParamList = (
    params: KeyValue[],
    onChange: (params: KeyValue[]) => void,
    paramKey: string
  ) => (
    <View>
      {params.map((param, index) => (
        <View className={styles.paramRow} key={`${paramKey}-${index}`}>
          <View
            className={classnames(styles.paramToggle, param.enabled && styles.enabled)}
            onClick={() => onChange(toggleKeyValue(params, index))}
          >
            {param.enabled ? '✓' : ''}
          </View>
          <Input
            className={styles.paramKey}
            placeholder="Key"
            placeholderTextColor="#64748B"
            value={param.key}
            onInput={(e) => onChange(updateKeyValue(params, index, 'key', e.detail.value))}
          />
          <Input
            className={styles.paramValue}
            placeholder="Value"
            placeholderTextColor="#64748B"
            value={param.value}
            onInput={(e) => onChange(updateKeyValue(params, index, 'value', e.detail.value))}
          />
          <View
            className={styles.paramDelete}
            onClick={() => onChange(deleteKeyValue(params, index))}
          >
            ×
          </View>
        </View>
      ))}
      <View
        className={styles.addBtn}
        onClick={() => onChange([...params, ...addKeyValue()])}
      >
        + 添加{paramKey === 'queryParams' ? '参数' : paramKey === 'headers' ? 'Header' : '项'}
      </View>
    </View>
  );

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>调试面板</Text>
        <Text className={styles.subtitle}>填写请求参数，发送并调试接口</Text>
      </View>

      <View style={{ marginBottom: 24 }}>
        <EnvSwitcher />
      </View>

      <View className={styles.requestCard}>
        <View className={styles.urlRow}>
          <View className={styles.methodSelect}>
            <View
              className={styles.methodBtn}
              onClick={() => setShowMethodDropdown(!showMethodDropdown)}
            >
              <Text className={styles.methodText} style={{ color: '#6366F1' }}>
                {currentRequest.method || 'GET'}
              </Text>
              <Text className={styles.methodArrow}>▼</Text>
            </View>
            {showMethodDropdown && (
              <View className={styles.methodDropdown}>
                {HTTP_METHODS.map(method => (
                  <View
                    key={method}
                    className={styles.methodOption}
                    onClick={() => {
                      setCurrentRequest({ method });
                      setShowMethodDropdown(false);
                    }}
                  >
                    <MethodTag method={method} />
                  </View>
                ))}
              </View>
            )}
          </View>
          <Input
            className={styles.urlInput}
            placeholder="输入请求 URL"
            placeholderTextColor="#64748B"
            value={currentRequest.url}
            onInput={(e) => setCurrentRequest({ url: e.detail.value })}
          />
          <View
            className={classnames(styles.sendBtn, loading && styles.loading)}
            onClick={handleSend}
          >
            {loading ? '发送中...' : '发送'}
          </View>
        </View>

        <View className={styles.tabs}>
          <View
            className={classnames(styles.tab, activeTab === 'params' && styles.active)}
            onClick={() => setActiveTab('params')}
          >
            Query Params
          </View>
          <View
            className={classnames(styles.tab, activeTab === 'headers' && styles.active)}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </View>
          <View
            className={classnames(styles.tab, activeTab === 'body' && styles.active)}
            onClick={() => setActiveTab('body')}
          >
            Body
          </View>
        </View>

        <View className={styles.paramsSection}>
          {activeTab === 'params' && renderParamList(
            currentRequest.queryParams,
            (params) => setCurrentRequest({ queryParams: params }),
            'queryParams'
          )}
          {activeTab === 'headers' && renderParamList(
            currentRequest.headers,
            (headers) => setCurrentRequest({ headers }),
            'headers'
          )}
          {activeTab === 'body' && (
            <View>
              <View className={styles.bodyTypeSelector}>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'json' && styles.active)}
                  onClick={() => setBodyType('json')}
                >
                  JSON
                </View>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'form' && styles.active)}
                  onClick={() => setBodyType('form')}
                >
                  Form
                </View>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'raw' && styles.active)}
                  onClick={() => setBodyType('raw')}
                >
                  Raw
                </View>
              </View>
              <Textarea
                className={styles.bodyTextarea}
                placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : '输入请求体...'}
                placeholderTextColor="#64748B"
                value={currentRequest.body}
                onInput={(e) => setCurrentRequest({ body: e.detail.value })}
              />
            </View>
          )}
        </View>
      </View>

      {response && (
        <View className={styles.responsePreview}>
          <View className={styles.responseCard}>
            <View className={styles.responseHeader}>
              <Text className={styles.responseTitle}>响应结果</Text>
              <View className={styles.responseMeta}>
                <StatusBadge status={response.status} statusText={response.statusText} />
                <Text className={styles.metaItem}>{formatDuration(response.duration)}</Text>
                <Text className={styles.metaItem}>{formatBytes(response.size)}</Text>
              </View>
            </View>

            <View className={styles.responseTabs}>
              <View
                className={classnames(styles.responseTab, activeResponseTab === 'body' && styles.active)}
                onClick={() => setActiveResponseTab('body')}
              >
                Body
              </View>
              <View
                className={classnames(styles.responseTab, activeResponseTab === 'headers' && styles.active)}
                onClick={() => setActiveResponseTab('headers')}
              >
                Headers
              </View>
            </View>

            {activeResponseTab === 'body' && (
              <ScrollView scrollY style={{ maxHeight: 400 }}>
                <View className={styles.responseBody}>
                  {formatJson(response.data)}
                </View>
              </ScrollView>
            )}

            {activeResponseTab === 'headers' && (
              <ScrollView scrollY style={{ maxHeight: 400 }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <View key={key} className={styles.headerItem}>
                    <Text className={styles.headerKey}>{key}</Text>
                    <Text className={styles.headerValue}>{value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <View className={styles.noteSection}>
        <Text className={styles.noteLabel}>断言备注</Text>
        <Textarea
          className={styles.noteInput}
          placeholder="记录测试结果、断言条件或备注信息..."
          placeholderTextColor="#64748B"
          value={assertNote}
          onInput={(e) => setAssertNote(e.detail.value)}
        />
      </View>

      <View className={styles.actionRow}>
        <View className={styles.secondaryBtn} onClick={handleSave}>
          保存调试
        </View>
        <View className={styles.primaryBtn} onClick={handleViewDetail}>
          查看详情
        </View>
      </View>
    </ScrollView>
  );
};

export default DebugPage;
