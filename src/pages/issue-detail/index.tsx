import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { IssueStatus, IssueActivity } from '@/types';
import { formatTime } from '@/utils/format';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';

const STATUS_TEXT: Record<IssueStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const STATUS_FLOW: IssueStatus[] = ['pending', 'processing', 'resolved', 'closed'];

const PRIORITY_TEXT = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急'
};

const PRIORITY_COLOR = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#F97316',
  critical: '#EF4444'
};

const ACTIVITY_TEXT: Record<IssueActivity['type'], string> = {
  issue_created: '创建了问题',
  status_changed: '更新了状态',
  comment_added: '添加了评论',
  screenshot_added: '上传了截图',
  screenshot_removed: '删除了截图',
  shared: '分享给了成员',
  assigned: '指派了负责人',
  request_linked: '关联了请求',
  description_updated: '更新了描述'
};

const IssueDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    issues,
    updateIssueStatus,
    history,
    setCurrentRequest,
    environments,
    currentEnvId,
    addIssueComment,
    addScreenshot,
    addScreenshotToIssue,
    removeScreenshotFromIssue,
    screenshots: allScreenshots
  } = useAppStore();
  const [newComment, setNewComment] = useState('');

  const issue = useMemo(() => {
    const id = router.params.id;
    return issues.find(i => i.id === id) || null;
  }, [router.params.id, issues]);

  const linkedRecord = useMemo(() => {
    if (!issue?.requestRecordId) return null;
    return history.find(h => h.id === issue.requestRecordId) || null;
  }, [issue?.requestRecordId, history]);

  const screenshots = useMemo(() => {
    if (!issue?.screenshotIds) return [];
    return issue.screenshotIds.map(id => allScreenshots.find(s => s.id === id)).filter(Boolean) as any[];
  }, [issue?.screenshotIds, allScreenshots]);

  const handleChangeStatus = (status: IssueStatus) => {
    if (!issue) return;
    updateIssueStatus(issue.id, status);
  };

  const handleReplayRequest = () => {
    if (!linkedRecord) return;

    const currentEnv = environments.find(e => e.id === currentEnvId);
    let url = linkedRecord.url;
    if (currentEnv) {
      const pathMatch = linkedRecord.url.match(/^https?:\/\/[^/]+(.*)/);
      if (pathMatch) {
        url = currentEnv.baseUrl + pathMatch[1];
      }
    }

    const envHeaders = currentEnv?.headers || [];
    const nonEnvHeaderKeys = environments.flatMap(e => e.headers?.map(h => h.key) || []);
    const filteredRecordHeaders = linkedRecord.headers.filter(h => !nonEnvHeaderKeys.includes(h.key));
    const mergedHeaders = [...envHeaders, ...filteredRecordHeaders];

    setCurrentRequest({
      name: linkedRecord.name,
      method: linkedRecord.method,
      url,
      headers: mergedHeaders,
      queryParams: [...linkedRecord.queryParams],
      body: linkedRecord.body || '',
      bodyType: linkedRecord.bodyType || 'json',
      assertNote: linkedRecord.assertNote || ''
    });

    Taro.switchTab({
      url: '/pages/debug/index'
    });
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
          addScreenshotToIssue(issue.id, screenshot.id);
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
    if (!issue) return;
    removeScreenshotFromIssue(issue.id, id);
  };

  const getNextStatus = () => {
    if (!issue) return null;
    const currentIndex = STATUS_FLOW.indexOf(issue.status);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  const renderActivityTimeline = () => {
    if (!issue?.activities || issue.activities.length === 0) return null;

    return (
      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>⏱️ 操作时间线</Text>
        <View className={styles.timeline}>
          {issue.activities.map((activity, index) => (
            <View key={activity.id} className={styles.timelineItem}>
              <View className={styles.timelineDot} />
              {index < issue.activities.length - 1 && (
                <View className={styles.timelineLine} />
              )}
              <View className={styles.timelineContent}>
                <View className={styles.timelineHeader}>
                  <Text className={styles.timelineUser}>{activity.userName}</Text>
                  <Text className={styles.timelineTime}>
                    {formatTime(activity.createdAt)}
                  </Text>
                </View>
                <Text className={styles.timelineAction}>
                  {ACTIVITY_TEXT[activity.type]}
                  {activity.details.oldStatus && activity.details.newStatus && (
                    <Text>
                      {' '}
                      <Text style={{ color: '#64748B' }}>
                        {STATUS_TEXT[activity.details.oldStatus]}
                      </Text>
                      {' → '}
                      <Text style={{ color: '#22C55E' }}>
                        {STATUS_TEXT[activity.details.newStatus]}
                      </Text>
                    </Text>
                  )}
                  {activity.details.comment && (
                    <Text className={styles.timelineComment}>
                      "{activity.details.comment}"
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!issue) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text>问题不存在或已被删除</Text>
        </View>
      </View>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.issueHeader}>
        <Text className={styles.issueTitle}>{issue.title}</Text>
        <View className={styles.issueMeta}>
          <View
            className={styles.statusBadge}
            style={{ backgroundColor: issue.status === 'resolved' ? '#22C55E' : issue.status === 'processing' ? '#3B82F6' : issue.status === 'closed' ? '#64748B' : '#F97316' }}
          >
            {STATUS_TEXT[issue.status]}
          </View>
          <View
            className={styles.priorityBadge}
            style={{ color: PRIORITY_COLOR[issue.priority], borderColor: PRIORITY_COLOR[issue.priority] }}
          >
            {PRIORITY_TEXT[issue.priority]}优先级
          </View>
        </View>
        <Text className={styles.issueDesc}>{issue.description}</Text>
        <View className={styles.issueInfo}>
          <Text className={styles.infoItem}>创建人：{issue.reporter}</Text>
          <Text className={styles.infoItem}>创建时间：{formatTime(issue.createdAt)}</Text>
          <Text className={styles.infoItem}>更新时间：{formatTime(issue.updatedAt)}</Text>
        </View>
      </View>

      {nextStatus && (
        <View className={styles.statusFlow}>
          <Text className={styles.flowLabel}>流转状态</Text>
          <View
            className={styles.flowBtn}
            onClick={() => handleChangeStatus(nextStatus)}
          >
            标记为「{STATUS_TEXT[nextStatus]}」
          </View>
        </View>
      )}

      {linkedRecord && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🔗 关联请求</Text>
          <View className={styles.linkedRequest}>
            <View className={styles.linkedHeader}>
              <MethodTag method={linkedRecord.method} />
              <Text className={styles.linkedName}>{linkedRecord.name}</Text>
            </View>
            <Text className={styles.linkedUrl}>{linkedRecord.url}</Text>
            {linkedRecord.response && (
              <View className={styles.linkedMeta}>
                <StatusBadge
                  status={linkedRecord.response.status}
                  statusText={linkedRecord.response.statusText}
                />
                <Text className={styles.linkedTime}>
                  {formatTime(linkedRecord.createdAt)}
                </Text>
              </View>
            )}
            <View className={styles.linkedActions}>
              <View className={styles.actionBtn} onClick={handleReplayRequest}>
                🔄 复现请求
              </View>
              <View
                className={styles.actionBtn}
                onClick={() => Taro.navigateTo({
                  url: `/pages/response/index?id=${linkedRecord.id}`
                })}
              >
                📄 查看详情
              </View>
            </View>
          </View>
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
      </View>

      {renderActivityTimeline()}

      {issue.comments && issue.comments.length > 0 && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>� 评论讨论</Text>
          <View className={styles.commentList}>
            {issue.comments.map(comment => (
              <View key={comment.id} className={styles.commentItem}>
                <View className={styles.commentAvatar}>
                  {comment.userName.charAt(0)}
                </View>
                <View className={styles.commentContent}>
                  <View className={styles.commentHeader}>
                    <Text className={styles.commentName}>{comment.userName}</Text>
                    <Text className={styles.commentTime}>
                      {formatTime(comment.createdAt)}
                    </Text>
                  </View>
                  <Text className={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📝 添加评论</Text>
        <Textarea
          className={styles.commentInput}
          placeholder="输入评论内容..."
          placeholderTextColor="#64748B"
          value={newComment}
          onInput={(e) => setNewComment(e.detail.value)}
        />
        <View className={styles.commentActions}>
          <View className={styles.shareBtn} onClick={handleShare}>
            📤 分享
          </View>
          <View
            className={classnames(styles.sendBtn, !newComment.trim() && styles.disabled)}
            onClick={handleSubmitComment}
          >
            发送
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default IssueDetailPage;
