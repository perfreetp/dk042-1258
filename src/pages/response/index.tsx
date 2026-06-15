import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import { formatJson, formatTime, formatDuration, formatBytes } from '@/utils/format';
import classnames from 'classnames';

const ResponsePage: React.FC = () => {
  const router = useRouter();
  const {
    history,
    setCurrentRequest,
    environments,
    currentEnvId,
    addScreenshot,
    addScreenshotToRecord,
    removeScreenshotFromRecord,
    screenshots: allScreenshots
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'request'>('body');

  const record = useMemo(() => {
    const id = router.params.id;
    return history.find(h => h.id === id) || null;
  }, [router.params.id, history]);

  const screenshots = useMemo(() => {
    if (!record?.screenshotIds) return [];
    return record.screenshotIds.map(id => allScreenshots.find(s => s.id === id)).filter(Boolean) as any[];
  }, [record?.screenshotIds, allScreenshots]);

  const handleReplayRequest = () => {
    if (!record) return;

    const currentEnv = environments.find(e => e.id === currentEnvId);
    let url = record.url;
    if (currentEnv) {
      const pathMatch = record.url.match(/^https?:\/\/[^/]+(.*)/);
      if (pathMatch) {
        url = currentEnv.baseUrl + pathMatch[1];
      }
    }

    const envHeaders = currentEnv?.headers || [];
    const nonEnvHeaderKeys = environments.flatMap(e => e.headers?.map(h => h.key) || []);
    const filteredRecordHeaders = record.headers.filter(h => !nonEnvHeaderKeys.includes(h.key));
    const mergedHeaders = [...envHeaders, ...filteredRecordHeaders];

    setCurrentRequest({
      name: record.name,
      method: record.method,
      url,
      headers: mergedHeaders,
      queryParams: [...record.queryParams],
      body: record.body || '',
      bodyType: record.bodyType || 'json',
      assertNote: record.assertNote || ''
    });

    Taro.switchTab({
      url: '/pages/debug/index'
    });
  };

  const handleCreateIssue = () => {
    if (!record) return;
    Taro.navigateTo({
      url: `/pages/issue-create/index?recordId=${record.id}`
    });
  };

  const handleChooseImage = () => {
    if (!record) return;
    const canUpload = 9 - screenshots.length;
    if (canUpload <= 0) {
      Taro.showToast({ title: '最多上传9张', icon: 'none' });
      return;
    }

    Taro.chooseImage({
      count: canUpload,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        res.tempFilePaths.forEach(path => {
          const screenshot = addScreenshot({
            url: path,
            uploader: '我'
          });
          addScreenshotToRecord(record.id, screenshot.id);
        });
      }
    });
  };

  const handlePreviewScreenshot = (url: string) => {
    const urls = screenshots.map(s => s.url);
    Taro.previewImage({
      urls,
      current: url
    });
  };

  const handleDeleteScreenshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!record) return;
    removeScreenshotFromRecord(record.id, id);
  };

  const handleCopyCurl = () => {
    if (!record) return;
    const curl = `curl -X ${record.method} "${record.url}"`;
    Taro.setClipboardData({
      data: curl,
      success: () => {
        Taro.showToast({ title: '已复制 cURL', icon: 'success' });
      }
    });
  };

  const handleCopyParams = () => {
    if (!record) return;
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
  };

  const handleShare = () => {
    if (!record) return;
    Taro.navigateTo({
      url: `/pages/share/index?type=record&id=${record.id}`
    });
  };

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text>未找到请求记录</Text>
        </View>
      </View>
    );
  }

  const getEnvName = () => {
    const env = environments.find(e => e.id === record.environmentId);
    return env?.name || '未知环境';
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.responseHeader}>
        <View className={styles.headerRow}>
          <MethodTag method={record.method} />
          <StatusBadge
            status={record.response?.status || 0}
            statusText={record.response?.statusText || ''}
          />
        </View>
        <Text className={styles.responseUrl}>{record.url}</Text>
        <View className={styles.responseMeta}>
          <Text className={styles.metaItem}>{getEnvName()}</Text>
          {record.response && (
            <>
              <Text className={styles.metaItem}>
                {formatDuration(record.response.duration)}
              </Text>
              <Text className={styles.metaItem}>
                {formatBytes(record.response.size)}
              </Text>
            </>
          )}
          <Text className={styles.metaItem}>
            {formatTime(record.createdAt)}
          </Text>
        </View>
      </View>

      <View className={styles.actionButtons}>
        <View className={styles.actionBtn} onClick={handleReplayRequest}>
          🔄 复现请求
        </View>
        <View className={styles.actionBtn} onClick={handleCreateIssue}>
          🐛 创建问题
        </View>
        <View className={styles.actionBtn} onClick={handleShare}>
          📤 分享
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'body' && styles.active)}
          onClick={() => setActiveTab('body')}
        >
          响应 Body
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'headers' && styles.active)}
          onClick={() => setActiveTab('headers')}
        >
          响应 Headers
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'request' && styles.active)}
          onClick={() => setActiveTab('request')}
        >
          请求信息
        </View>
      </View>

      {activeTab === 'body' && record.response && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📄 响应数据</Text>
            <Text className={styles.copyBtn} onClick={handleCopyParams}>
              📋 复制参数
            </Text>
          </View>
          <ScrollView scrollX scrollY style={{ maxHeight: 600 }}>
            <View className={styles.responseBody}>
              {formatJson(record.response.data)}
            </View>
          </ScrollView>
        </View>
      )}

      {activeTab === 'headers' && record.response && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🔍 响应 Headers</Text>
          <View className={styles.headersList}>
            {Object.entries(record.response.headers).map(([key, value]) => (
              <View key={key} className={styles.headerItem}>
                <Text className={styles.headerKey}>{key}</Text>
                <Text className={styles.headerValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'request' && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📋 请求信息</Text>
            <Text className={styles.copyBtn} onClick={handleCopyCurl}>
              📋 复制 cURL
            </Text>
          </View>

          <Text className={styles.subTitle}>Query Parameters</Text>
          <View className={styles.paramsList}>
            {record.queryParams.length === 0 ? (
              <Text className={styles.emptyText}>无参数</Text>
            ) : (
              record.queryParams.filter(p => p.enabled).map((param, i) => (
                <View key={i} className={styles.paramItem}>
                  <Text className={styles.paramKey}>{param.key}</Text>
                  <Text className={styles.paramValue}>{param.value}</Text>
                </View>
              ))
            )}
          </View>

          <Text className={styles.subTitle}>Headers</Text>
          <View className={styles.paramsList}>
            {record.headers.filter(h => h.enabled).length === 0 ? (
              <Text className={styles.emptyText}>无 Headers</Text>
            ) : (
              record.headers.filter(h => h.enabled).map((header, i) => (
                <View key={i} className={styles.paramItem}>
                  <Text className={styles.paramKey}>{header.key}</Text>
                  <Text className={styles.paramValue}>{header.value}</Text>
                </View>
              ))
            )}
          </View>

          {record.body && (
            <>
              <Text className={styles.subTitle}>Body ({record.bodyType || 'json'})</Text>
              <ScrollView scrollX>
                <View className={styles.bodyContent}>
                  {record.bodyType === 'json' ? formatJson(record.body) : record.body}
                </View>
              </ScrollView>
            </>
          )}

          {record.assertNote && (
            <>
              <Text className={styles.subTitle}>📝 断言备注</Text>
              <Text className={styles.noteContent}>{record.assertNote}</Text>
            </>
          )}
        </View>
      )}

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📸 错误截图</Text>
        <View className={styles.screenshotGrid}>
          {screenshots.map((s) => (
            <View
              key={s.id}
              className={styles.screenshotItem}
              onClick={() => handlePreviewScreenshot(s.url)}
            >
              <Image src={s.url} mode="aspectFill" />
              <View
                className={styles.screenshotDelete}
                onClick={(e) => handleDeleteScreenshot(e, s.id)}
              >
                ×
              </View>
            </View>
          ))}
          {screenshots.length < 9 && (
            <View className={styles.screenshotAdd} onClick={handleChooseImage}>
              <Text className={styles.addIcon}>+</Text>
              <Text>上传</Text>
            </View>
          )}
        </View>
        {screenshots.length === 0 && (
          <Text className={styles.emptyText}>暂无截图，点击上传按钮添加</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default ResponsePage;
