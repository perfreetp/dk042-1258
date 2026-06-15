import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { IssueStatus, Issue } from '@/types';
import { formatTime } from '@/utils/format';
import MethodTag from '@/components/MethodTag';
import classnames from 'classnames';

const STATUS_OPTIONS: { key: IssueStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' }
];

const IssueDetailPage: React.FC = () => {
  const router = useRouter();
  const { issues, updateIssueStatus, history, setCurrentRequest, environments, currentEnvId, addIssueComment, addScreenshotToIssue } = useAppStore();
  const [newComment, setNewComment] = useState('');

  const issue = useMemo(() => {
    const id = router.params.id;
    return issues.find(i => i.id === id) || null;
  }, [router.params.id, issues]);

  if (!issue) {
    return (
      <View className={styles.page}>
        <Text>未找到问题</Text>
      </View>
    );
  }

  const linkedRecord = issue.requestRecordId
    ? history.find(h => h.id === issue.requestRecordId)
    : null;

  const getStatusClass = (status: IssueStatus) => {
    const map: Record<IssueStatus, string> = {
      pending: styles.statusPending,
      processing: styles.statusProcessing,
      resolved: styles.statusResolved,
      closed: styles.statusClosed
    };
    return map[status];
  };

  const getPriorityClass = (priority: string) => {
    const map: Record<string, string> = {
      critical: styles.priorityCritical,
      high: styles.priorityHigh,
      medium: styles.priorityMedium,
      low: styles.priorityLow
    };
    return map[priority] || styles.priorityLow;
  };

  const getPriorityText = (priority: string) => {
    const map: Record<string, string> = {
      critical: '紧急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return map[priority] || priority;
  };

  const handleStatusChange = (status: IssueStatus) => {
    updateIssueStatus(issue.id, status);
    Taro.showToast({ title: '状态已更新', icon: 'success' });
  };

  const handleViewRequest = () => {
    if (linkedRecord) {
      Taro.navigateTo({
        url: `/pages/response/index?id=${linkedRecord.id}`
      });
    }
  };

  const handleRetryRequest = () => {
    if (!linkedRecord) return;
    const env = environments.find(e => e.id === currentEnvId);
    let url = linkedRecord.url;
    if (env) {
      const path = linkedRecord.url.replace(/^https?:\/\/[^/]+/, '');
      url = env.baseUrl + path;
    }
    setCurrentRequest({
      name: linkedRecord.name,
      method: linkedRecord.method,
      url,
      headers: [...linkedRecord.headers],
      queryParams: [...linkedRecord.queryParams],
      body: linkedRecord.body || '',
      bodyType: linkedRecord.bodyType || 'json'
    });
    Taro.switchTab({ url: '/pages/debug/index' });
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    if (!issue) return;

    const comment = {
      id: Date.now().toString(),
      userId: 'me',
      userName: '我',
      content: newComment.trim(),
      createdAt: Date.now(),
      attachments: []
    };

    addIssueComment(issue.id, comment);
    setNewComment('');
    Taro.showToast({ title: '评论已发送', icon: 'success' });
  };

  const handleShare = () => {
    Taro.navigateTo({
      url: `/pages/share/index?type=issue&id=${issue.id}`
    });
  };

  const handleChooseImage = () => {
    if (!issue) return;
    const currentScreenshots = issue.screenshots || [];
    Taro.chooseImage({
      count: 9 - currentScreenshots.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFilePaths.length > 0) {
          res.tempFilePaths.forEach(path => {
            addScreenshotToIssue(issue.id, path);
          });
        }
      }
    });
  };

  const handlePreviewScreenshot = (url: string) => {
    const allScreenshots = issue?.screenshots || [];
    Taro.previewImage({
      urls: allScreenshots,
      current: url
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.issueHeader}>
        <Text className={styles.issueTitle}>{issue.title}</Text>

        <View className={styles.issueMeta}>
          <View className={classnames(styles.tag, styles.statusBadge, getStatusClass(issue.status))}>
            {STATUS_OPTIONS.find(s => s.key === issue.status)?.label}
          </View>
          <View className={classnames(styles.tag, getPriorityClass(issue.priority))}>
            {getPriorityText(issue.priority)}
          </View>
          {issue.labels?.map(label => (
            <View key={label} className={classnames(styles.tag, styles.labelTag)}>
              {label}
            </View>
          ))}
        </View>

        <View className={styles.issueInfo}>
          <Text className={styles.infoItem}>👤 报告人: {issue.reporter}</Text>
          {issue.assignee && (
            <Text className={styles.infoItem}>🎯 负责人: {issue.assignee}</Text>
          )}
          <Text className={styles.infoItem}>🕐 创建: {formatTime(issue.createdAt)}</Text>
          <Text className={styles.infoItem}>📝 更新: {formatTime(issue.updatedAt)}</Text>
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>状态流转</Text>
        <View className={styles.statusActions}>
          {STATUS_OPTIONS.map(opt => (
            <View
              key={opt.key}
              className={classnames(styles.statusBtn, issue.status === opt.key && styles.active)}
              onClick={() => handleStatusChange(opt.key)}
            >
              {opt.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>问题描述</Text>
        <Text className={styles.descText}>{issue.description}</Text>

        {linkedRecord && (
          <View className={styles.requestLink} onClick={handleViewRequest}>
            <Text className={styles.linkIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MethodTag method={linkedRecord.method} />
                <Text className={styles.linkText}>关联请求记录</Text>
              </View>
              <Text style={{ fontSize: 22, color: '#64748B', marginTop: 4, fontFamily: 'Menlo, Monaco, Consolas, monospace' }}>
                {linkedRecord.url}
              </Text>
            </View>
            <Text className={styles.linkArrow}>›</Text>
          </View>
        )}
      </View>

      {issue.screenshots && issue.screenshots.length > 0 && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📸 错误截图</Text>
          <View className={styles.screenshotGrid}>
            {issue.screenshots.map((url, i) => (
              <View
                key={i}
                className={styles.screenshotItem}
                onClick={() => handlePreviewScreenshot(url)}
              >
                <Image src={url} mode="aspectFill" />
              </View>
            ))}
            {issue.screenshots.length < 9 && (
              <View className={styles.screenshotAdd} onClick={handleChooseImage}>
                <Text className={styles.addIcon}>+</Text>
                <Text>上传</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {(!issue.screenshots || issue.screenshots.length === 0) && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📸 错误截图</Text>
          <View className={styles.screenshotGrid}>
            <View className={styles.screenshotAdd} onClick={handleChooseImage}>
              <Text className={styles.addIcon}>+</Text>
              <Text>上传</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>💬 讨论记录</Text>
        <View className={styles.commentList}>
          {issue.comments && issue.comments.length > 0 ? (
            issue.comments.map(comment => (
              <View key={comment.id} className={styles.commentItem}>
                <View className={styles.commentHeader}>
                  <Text className={styles.commentUser}>{comment.userName}</Text>
                  <Text className={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                </View>
                <Text className={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 26, color: '#64748B', textAlign: 'center', padding: 32 }}>
              暂无讨论
            </Text>
          )}
        </View>
        <View className={styles.inputRow}>
          <Input
            className={styles.commentInput}
            placeholder="添加评论..."
            placeholderTextColor="#64748B"
            value={newComment}
            onInput={(e) => setNewComment(e.detail.value)}
          />
          <View className={styles.submitBtn} onClick={handleSubmitComment}>
            发送
          </View>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.secondaryBtn} onClick={handleShare}>
          分享
        </View>
        <View className={styles.primaryBtn} onClick={handleRetryRequest}>
          复现请求
        </View>
      </View>
    </ScrollView>
  );
};

export default IssueDetailPage;
