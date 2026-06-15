import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import { formatJson, formatTime, formatDuration, formatBytes } from '@/utils/format';
import classnames from 'classnames';

const STATUS_CLASS: Record<string, string> = {
  pending: styles.statusPending,
  processing: styles.statusProcessing,
  resolved: styles.statusResolved,
  closed: styles.statusClosed
};

const STATUS_TEXT: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const PRIORITY_CLASS: Record<string, string> = {
  low: styles.priorityLow,
  medium: styles.priorityMedium,
  high: styles.priorityHigh,
  critical: styles.priorityCritical
};

const PRIORITY_TEXT: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急'
};

const ShareViewPage: React.FC = () => {
  const router = useRouter();
  const { history, issues, screenshots: allScreenshots, environments, saveSharedRecord, loadRecordToRequest } = useAppStore();

  const shareType = router.params.type || 'record';
  const shareId = router.params.id;

  const record = useMemo(() => {
    if (shareType !== 'record') return null;
    return history.find(h => h.id === shareId) || null;
  }, [shareType, shareId, history]);

  const issue = useMemo(() => {
    if (shareType !== 'issue') return null;
    return issues.find(i => i.id === shareId) || null;
  }, [shareType, shareId, issues]);

  const linkedRecord = useMemo(() => {
    if (!issue?.requestRecordId) return null;
    return history.find(h => h.id === issue.requestRecordId) || null;
  }, [issue?.requestRecordId, history]);

  const recordScreenshots = useMemo(() => {
    if (!record?.screenshotIds) return [];
    return record.screenshotIds.map(id => allScreenshots.find(s => s.id === id)).filter(Boolean) as any[];
  }, [record?.screenshotIds, allScreenshots]);

  const issueScreenshots = useMemo(() => {
    if (!issue?.screenshotIds) return [];
    return issue.screenshotIds.map(id => allScreenshots.find(s => s.id === id)).filter(Boolean) as any[];
  }, [issue?.screenshotIds, allScreenshots]);

  const handleCopyParams = () => {
    if (shareType === 'record' && record) {
      const params = {
        method: record.method,
        url: record.url,
        headers: record.headers.filter(h => h.enabled).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
        queryParams: record.queryParams.filter(p => p.enabled).reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {}),
        body: record.body
      };
      Taro.setClipboardData({
        data: JSON.stringify(params, null, 2),
        success: () => {
          Taro.showToast({ title: '已复制请求参数', icon: 'success' });
        }
      });
    } else if (shareType === 'issue' && issue) {
      Taro.setClipboardData({
        data: `${issue.title}\n\n${issue.description}`,
        success: () => {
          Taro.showToast({ title: '已复制问题信息', icon: 'success' });
        }
      });
    }
  };

  const handleReplayRequest = () => {
    const targetRecord = shareType === 'record' ? record : linkedRecord;
    if (!targetRecord) {
      Taro.showToast({ title: '无可复现的请求', icon: 'none' });
      return;
    }
    loadRecordToRequest(targetRecord);
    Taro.switchTab({ url: '/pages/debug/index' });
  };

  const handleSaveToHistory = () => {
    if (shareType === 'record' && record) {
      saveSharedRecord(record);
      Taro.showToast({ title: '已保存到我的历史', icon: 'success' });
    } else if (shareType === 'issue' && issue && linkedRecord) {
      saveSharedRecord(linkedRecord);
      Taro.showToast({ title: '已保存关联请求到我的历史', icon: 'success' });
    } else {
      Taro.showToast({ title: '无请求可保存', icon: 'none' });
    }
  };

  const handlePreviewScreenshot = (url: string, allUrls: string[]) => {
    Taro.previewImage({
      urls: allUrls,
      current: url
    });
  };

  const getEnvName = (envId?: string) => {
    if (!envId) return '未知环境';
    const env = environments.find(e => e.id === envId);
    return env?.name || '未知环境';
  };

  const hasReplayTarget = shareType === 'record' ? !!record : !!linkedRecord;

  if ((shareType === 'record' && !record) || (shareType === 'issue' && !issue)) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text>分享内容不存在或已被删除</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.readOnlyBanner}>
        <Text className={styles.bannerIcon}>👁️</Text>
        <Text className={styles.bannerText}>只读分享模式，仅可查看和复制，无法修改原始数据</Text>
      </View>

      {shareType === 'record' && record && (
        <>
          <View className={styles.infoCard}>
            <View className={styles.infoHeader}>
              <MethodTag method={record.method} />
              {record.response && (
                <StatusBadge
                  status={record.response.status}
                  statusText={record.response.statusText}
                />
              )}
            </View>
            <Text className={styles.urlText}>{record.url}</Text>
            <View className={styles.metaRow}>
              <Text className={styles.metaTag}>{getEnvName(record.environmentId)}</Text>
              {record.response && (
                <>
                  <Text className={styles.metaTag}>{formatDuration(record.response.duration)}</Text>
                  <Text className={styles.metaTag}>{formatBytes(record.response.size)}</Text>
                </>
              )}
              <Text className={styles.metaTag}>{formatTime(record.createdAt)}</Text>
            </View>
          </View>

          <View className={styles.infoCard}>
            <Text className={styles.sectionTitle}>📋 请求参数</Text>

            <Text className={styles.subTitle}>Query Parameters</Text>
            {record.queryParams.filter(p => p.enabled).length === 0 ? (
              <Text className={styles.emptyText}>无参数</Text>
            ) : (
              <View className={styles.paramsList}>
                {record.queryParams.filter(p => p.enabled).map((param, i) => (
                  <View key={i} className={styles.paramItem}>
                    <Text className={styles.paramKey}>{param.key}</Text>
                    <Text className={styles.paramValue}>{param.value}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text className={styles.subTitle}>Headers</Text>
            {record.headers.filter(h => h.enabled).length === 0 ? (
              <Text className={styles.emptyText}>无 Headers</Text>
            ) : (
              <View className={styles.paramsList}>
                {record.headers.filter(h => h.enabled).map((header, i) => (
                  <View key={i} className={styles.paramItem}>
                    <Text className={styles.paramKey}>{header.key}</Text>
                    <Text className={styles.paramValue}>{header.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {record.body && (
              <>
                <Text className={styles.subTitle}>Body ({record.bodyType || 'json'})</Text>
                <View className={styles.bodyContent}>
                  {record.bodyType === 'json' ? formatJson(record.body) : record.body}
                </View>
              </>
            )}
          </View>

          {record.response && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>📄 响应数据</Text>
              <ScrollView scrollX scrollY style={{ maxHeight: 400 }}>
                <View className={styles.responseBody}>
                  {formatJson(record.response.data)}
                </View>
              </ScrollView>
            </View>
          )}

          {recordScreenshots.length > 0 && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>📸 错误截图</Text>
              <View className={styles.screenshotGrid}>
                {recordScreenshots.map((s) => (
                  <View
                    key={s.id}
                    className={styles.screenshotItem}
                    onClick={() => handlePreviewScreenshot(s.url, recordScreenshots.map(sc => sc.url))}
                  >
                    <Image src={s.url} mode="aspectFill" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {record.assertNote && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>📝 断言备注</Text>
              <Text className={styles.bodyContent}>{record.assertNote}</Text>
            </View>
          )}
        </>
      )}

      {shareType === 'issue' && issue && (
        <>
          <View className={styles.infoCard}>
            <View className={styles.infoHeader}>
              <View className={classnames(styles.issueStatus, STATUS_CLASS[issue.status])}>
                {STATUS_TEXT[issue.status]}
              </View>
              <View className={classnames(styles.priorityTag, PRIORITY_CLASS[issue.priority])}>
                {PRIORITY_TEXT[issue.priority]}优先级
              </View>
            </View>
            <Text className={styles.infoTitle}>{issue.title}</Text>
            <Text className={styles.issueDesc}>{issue.description}</Text>
            <View style={{ height: 16 }} />
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建人</Text>
              <Text className={styles.infoValue}>{issue.reporter}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatTime(issue.createdAt)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>更新时间</Text>
              <Text className={styles.infoValue}>{formatTime(issue.updatedAt)}</Text>
            </View>
          </View>

          {linkedRecord && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>🔗 关联请求</Text>
              <View className={styles.infoHeader}>
                <MethodTag method={linkedRecord.method} />
                {linkedRecord.response && (
                  <StatusBadge
                    status={linkedRecord.response.status}
                    statusText={linkedRecord.response.statusText}
                  />
                )}
              </View>
              <Text className={styles.urlText}>{linkedRecord.url}</Text>
              <View className={styles.metaRow}>
                <Text className={styles.metaTag}>{getEnvName(linkedRecord.environmentId)}</Text>
                <Text className={styles.metaTag}>{formatTime(linkedRecord.createdAt)}</Text>
              </View>
            </View>
          )}

          {issueScreenshots.length > 0 && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>📸 错误截图</Text>
              <View className={styles.screenshotGrid}>
                {issueScreenshots.map((s) => (
                  <View
                    key={s.id}
                    className={styles.screenshotItem}
                    onClick={() => handlePreviewScreenshot(s.url, issueScreenshots.map(sc => sc.url))}
                  >
                    <Image src={s.url} mode="aspectFill" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {issue.comments && issue.comments.length > 0 && (
            <View className={styles.infoCard}>
              <Text className={styles.sectionTitle}>💬 评论讨论</Text>
              {issue.comments.map(comment => (
                <View key={comment.id} style={{ marginBottom: 16 }}>
                  <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 26, fontWeight: 500, color: '#F1F5F9' }}>
                      {comment.userName}
                    </Text>
                    <Text style={{ fontSize: 22, color: '#64748B' }}>
                      {formatTime(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 26, color: '#94A3B8', lineHeight: 1.6 }}>
                    {comment.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <View className={styles.actionBar}>
        <View className={styles.actionBtn} onClick={handleCopyParams}>
          📋 复制
        </View>
        <View className={styles.actionBtn} onClick={handleSaveToHistory}>
          💾 保存
        </View>
        <View
          className={classnames(styles.actionBtn, styles.primaryBtn, !hasReplayTarget && { opacity: 0.5 })}
          onClick={handleReplayRequest}
        >
          🔄 带回复现
        </View>
      </View>
    </ScrollView>
  );
};

export default ShareViewPage;
