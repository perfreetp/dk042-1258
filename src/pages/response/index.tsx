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
  const { history, setCurrentRequest, environments, currentEnvId, addScreenshotToRecord } = useAppStore();
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'request'>('body');

  const record = useMemo(() => {
    const id = router.params.id;
    return history.find(h => h.id === id) || null;
  }, [router.params.id, history]);

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>未找到请求记录</Text>
        </View>
      </View>
    );
  }

  const handleRetry = () => {
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

  const handleShare = () => {
    Taro.navigateTo({
      url: `/pages/share/index?type=record&id=${record.id}`
    });
  };

  const handleCreateIssue = () => {
    Taro.navigateTo({
      url: `/pages/issue-create/index?recordId=${record.id}`
    });
  };

  const handleChooseImage = () => {
    const currentScreenshots = record?.screenshots || [];
    Taro.chooseImage({
      count: 9 - currentScreenshots.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (record && res.tempFilePaths.length > 0) {
          res.tempFilePaths.forEach(path => {
            addScreenshotToRecord(record.id, path);
          });
        }
      }
    });
  };

  const handlePreviewScreenshot = (url: string) => {
    const allScreenshots = record?.screenshots || [];
    Taro.previewImage({
      urls: allScreenshots,
      current: url
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.requestInfo}>
        <View className={styles.requestHeader}>
          <MethodTag method={record.method} />
          <Text className={styles.requestTitle}>{record.name}</Text>
          {record.response && (
            <StatusBadge status={record.response.status} statusText={record.response.statusText} />
          )}
        </View>
        <Text className={styles.requestUrl}>{record.url}</Text>
        <View className={styles.requestMeta}>
          <Text className={styles.metaItem}>
            🕐 {formatTime(record.createdAt)}
          </Text>
          {record.response && (
            <>
              <Text className={styles.metaItem}>
                ⚡ {formatDuration(record.response.duration)}
              </Text>
              <Text className={styles.metaItem}>
                📦 {formatBytes(record.response.size)}
              </Text>
            </>
          )}
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

      <View className={styles.contentCard}>
        {activeTab === 'body' && record.response && (
          <View>
            <Text className={styles.sectionTitle}>响应数据</Text>
            <ScrollView scrollY style={{ maxHeight: 600 }}>
              <View className={styles.responseBody}>
                {formatJson(record.response.data)}
              </View>
            </ScrollView>
          </View>
        )}

        {activeTab === 'headers' && record.response && (
          <View>
            <Text className={styles.sectionTitle}>响应头</Text>
            {Object.entries(record.response.headers).map(([key, value]) => (
              <View key={key} className={styles.headerItem}>
                <Text className={styles.headerKey}>{key}</Text>
                <Text className={styles.headerValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'request' && (
          <View>
            <Text className={styles.sectionTitle}>请求 Headers</Text>
            {record.headers.filter(h => h.enabled).map((h, i) => (
              <View key={i} className={styles.headerItem}>
                <Text className={styles.headerKey}>{h.key}</Text>
                <Text className={styles.headerValue}>{h.value}</Text>
              </View>
            ))}
            {record.queryParams.filter(p => p.enabled).length > 0 && (
              <>
                <Text className={styles.sectionTitle} style={{ marginTop: 24 }}>Query Params</Text>
                {record.queryParams.filter(p => p.enabled).map((p, i) => (
                  <View key={i} className={styles.headerItem}>
                    <Text className={styles.headerKey}>{p.key}</Text>
                    <Text className={styles.headerValue}>{p.value}</Text>
                  </View>
                ))}
              </>
            )}
            {record.body && (
              <>
                <Text className={styles.sectionTitle} style={{ marginTop: 24 }}>请求 Body</Text>
                <View className={styles.responseBody}>
                  {record.body}
                </View>
              </>
            )}
          </View>
        )}

        {record.assertNote && (
          <View className={styles.noteCard}>
            <Text className={styles.noteLabel}>📝 断言备注</Text>
            <Text className={styles.noteContent}>{record.assertNote}</Text>
          </View>
        )}
      </View>

      <View className={styles.screenshotSection}>
        <Text className={styles.sectionTitle}>📸 错误截图</Text>
        <View className={styles.screenshotGrid}>
          {record.screenshots?.map((url, i) => (
            <View
              key={i}
              className={styles.screenshotItem}
              onClick={() => handlePreviewScreenshot(url)}
            >
              <Image src={url} mode="aspectFill" />
            </View>
          ))}
          {(!record.screenshots || record.screenshots.length < 9) && (
            <View className={styles.screenshotAdd} onClick={handleChooseImage}>
              <Text className={styles.addIcon}>+</Text>
              <Text>上传</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.secondaryBtn} onClick={handleShare}>
          分享
        </View>
        <View className={styles.secondaryBtn} onClick={handleCreateIssue}>
          创建问题
        </View>
        <View className={styles.primaryBtn} onClick={handleRetry}>
          重放请求
        </View>
      </View>
    </ScrollView>
  );
};

export default ResponsePage;
