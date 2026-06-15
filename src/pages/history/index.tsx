import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { RequestRecord, HttpMethod } from '@/types';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import { formatRelativeTime, formatDuration } from '@/utils/format';
import classnames from 'classnames';

const METHOD_FILTERS: (HttpMethod | 'ALL')[] = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const STATUS_FILTERS = ['ALL', '2xx', '4xx', '5xx'];

const HistoryPage: React.FC = () => {
  const { history, removeHistory, clearHistory, setCurrentRequest, currentEnvId, environments } = useAppStore();
  const [methodFilter, setMethodFilter] = useState<HttpMethod | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (methodFilter !== 'ALL' && item.method !== methodFilter) return false;
      if (statusFilter !== 'ALL') {
        if (!item.response) return statusFilter === '5xx';
        const status = item.response.status;
        if (statusFilter === '2xx' && !(status >= 200 && status < 300)) return false;
        if (statusFilter === '4xx' && !(status >= 400 && status < 500)) return false;
        if (statusFilter === '5xx' && !(status >= 500)) return false;
      }
      return true;
    });
  }, [history, methodFilter, statusFilter]);

  const handleRetry = (record: RequestRecord) => {
    const env = environments.find(e => e.id === currentEnvId);
    let url = record.url;
    if (env) {
      const path = record.url.replace(/^https?:\/\/[^/]+/, '');
      url = env.baseUrl + path;
    }
    setCurrentRequest({
      name: record.name,
      method: record.method,
      url,
      headers: [...record.headers],
      queryParams: [...record.queryParams],
      body: record.body || '',
      bodyType: record.bodyType || 'json'
    });
    Taro.switchTab({ url: '/pages/debug/index' });
  };

  const handleViewDetail = (record: RequestRecord) => {
    Taro.navigateTo({
      url: `/pages/response/index?id=${record.id}`
    });
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          removeHistory(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleClearAll = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  };

  const handleShare = (record: RequestRecord) => {
    Taro.navigateTo({
      url: `/pages/share/index?type=record&id=${record.id}`
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>历史记录</Text>
        <Text className={styles.subtitle}>查看和复现历史调试记录</Text>
      </View>

      <View className={styles.filterBar}>
        {METHOD_FILTERS.map(method => (
          <View
            key={method}
            className={classnames(styles.filterItem, methodFilter === method && styles.active)}
            onClick={() => setMethodFilter(method)}
          >
            {method}
          </View>
        ))}
      </View>

      <View className={styles.filterBar}>
        {STATUS_FILTERS.map(status => (
          <View
            key={status}
            className={classnames(styles.filterItem, statusFilter === status && styles.active)}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'ALL' ? '全部状态' : `${status} 状态`}
          </View>
        ))}
        {history.length > 0 && (
          <View className={styles.clearBtn} onClick={handleClearAll}>
            清空全部
          </View>
        )}
      </View>

      {filteredHistory.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无历史记录</Text>
          <Text className={styles.emptyHint}>去调试面板发送请求吧</Text>
        </View>
      ) : (
        filteredHistory.map(record => (
          <View className={styles.historyCard} key={record.id}>
            <View className={styles.cardHeader}>
              <View className={styles.cardLeft}>
                <MethodTag method={record.method} />
                <Text className={styles.apiName}>{record.name}</Text>
              </View>
              {record.response && (
                <StatusBadge status={record.response.status} />
              )}
            </View>

            <Text className={styles.urlText}>{record.url}</Text>

            <View className={styles.cardMeta}>
              <Text className={styles.metaItem}>
                🕐 {formatRelativeTime(record.createdAt)}
              </Text>
              {record.response && (
                <Text className={styles.metaItem}>
                  ⚡ {formatDuration(record.response.duration)}
                </Text>
              )}
            </View>

            {record.assertNote && (
              <Text className={styles.noteText}>📝 {record.assertNote}</Text>
            )}

            <View className={styles.cardActions}>
              <View className={styles.actionBtn} onClick={() => handleShare(record)}>
                分享
              </View>
              <View
                className={classnames(styles.actionBtn, styles.danger)}
                onClick={() => handleDelete(record.id)}
              >
                删除
              </View>
              <View
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={() => handleRetry(record)}
              >
                重放
              </View>
              <View
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={() => handleViewDetail(record)}
              >
                详情
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default HistoryPage;
