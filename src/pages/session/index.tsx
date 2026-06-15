import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { SessionStatus } from '@/types';
import { formatTime, formatRelativeTime } from '@/utils/format';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';

const STATUS_TEXT: Record<SessionStatus, string> = {
  active: '进行中',
  resolved: '已解决',
  archived: '已归档'
};

const STATUS_COLOR: Record<SessionStatus, string> = {
  active: '#3B82F6',
  resolved: '#10B981',
  archived: '#64748B'
};

const STATUS_BG: Record<SessionStatus, string> = {
  active: 'rgba(59, 130, 246, 0.15)',
  resolved: 'rgba(16, 185, 129, 0.15)',
  archived: 'rgba(100, 116, 139, 0.15)'
};

const EVENT_ICON: Record<string, string> = {
  request: '🔗',
  comment: '💬',
  screenshot: '📸',
  conclusion: '✅'
};

const EVENT_LABEL: Record<string, string> = {
  request: '关联了请求',
  comment: '添加了评论',
  screenshot: '上传了截图',
  conclusion: '更新了结论'
};

const SessionDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    sessions,
    issues,
    history,
    screenshots: allScreenshots,
    addEventToSession,
    updateSession,
    deleteSession,
    addScreenshot,
    addScreenshotToRecord,
    loadRecordToRequest
  } = useAppStore();

  const [newComment, setNewComment] = useState('');
  const [newConclusion, setNewConclusion] = useState('');
  const [showConclusionInput, setShowConclusionInput] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const session = useMemo(() => {
    const id = router.params.id;
    return sessions.find(s => s.id === id) || null;
  }, [router.params.id, sessions]);

  const linkedIssue = useMemo(() => {
    if (!session?.issueId) return null;
    return issues.find(i => i.id === session.issueId) || null;
  }, [session?.issueId, issues]);

  const linkedRecords = useMemo(() => {
    if (!session?.recordIds) return [];
    return session.recordIds
      .map(id => history.find(r => r.id === id))
      .filter(Boolean) as typeof history;
  }, [session?.recordIds, history]);

  const sessionScreenshots = useMemo(() => {
    if (!session?.screenshotIds) return [];
    return session.screenshotIds
      .map(id => allScreenshots.find(s => s.id === id))
      .filter(Boolean) as typeof allScreenshots;
  }, [session?.screenshotIds, allScreenshots]);

  const sortedEvents = useMemo(() => {
    if (!session?.events) return [];
    return [...session.events].sort((a, b) => a.createdAt - b.createdAt);
  }, [session?.events]);

  const handleChangeStatus = (status: SessionStatus) => {
    if (!session) return;
    updateSession(session.id, { status });
    setShowStatusPicker(false);
    Taro.showToast({ title: `状态已更新为「${STATUS_TEXT[status]}」`, icon: 'success' });
  };

  const handleDeleteSession = () => {
    if (!session) return;
    Taro.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确认删除此会话？',
      success: (res) => {
        if (res.confirm) {
          deleteSession(session.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 500);
        }
      }
    });
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !session) return;
    addEventToSession(session.id, {
      type: 'comment',
      userId: 'me',
      userName: '我',
      comment: newComment.trim()
    });
    setNewComment('');
    Taro.showToast({ title: '评论已发送', icon: 'success' });
  };

  const handleSubmitConclusion = () => {
    if (!newConclusion.trim() || !session) return;
    addEventToSession(session.id, {
      type: 'conclusion',
      userId: 'me',
      userName: '我',
      conclusion: newConclusion.trim()
    });
    updateSession(session.id, { conclusion: newConclusion.trim() });
    setNewConclusion('');
    setShowConclusionInput(false);
    Taro.showToast({ title: '结论已更新', icon: 'success' });
  };

  const handleChooseImage = () => {
    if (!session) return;
    const canUpload = 9 - sessionScreenshots.length;
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
          addEventToSession(session.id, {
            type: 'screenshot',
            userId: 'me',
            userName: '我',
            screenshotId: screenshot.id
          });
          updateSession(session.id, {
            screenshotIds: [...session.screenshotIds, screenshot.id]
          });
        });
      }
    });
  };

  const handlePreviewScreenshot = (url: string) => {
    const urls = sessionScreenshots.map(s => s.url);
    Taro.previewImage({ urls, current: url });
  };

  const handleReplayRequest = (record: typeof history[0]) => {
    loadRecordToRequest(record);
    Taro.switchTab({ url: '/pages/debug/index' });
  };

  const handleViewRecord = (recordId: string) => {
    Taro.navigateTo({ url: `/pages/response/index?id=${recordId}` });
  };

  const handleNavigateToIssue = () => {
    if (!session?.issueId) return;
    Taro.navigateTo({ url: `/pages/issue-detail/index?id=${session.issueId}` });
  };

  const getEventRecord = (recordId?: string) => {
    if (!recordId) return null;
    return history.find(r => r.id === recordId) || null;
  };

  const getEventScreenshot = (screenshotId?: string) => {
    if (!screenshotId) return null;
    return allScreenshots.find(s => s.id === screenshotId) || null;
  };

  if (!session) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text>会话不存在或已被删除</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.sessionHeader}>
        <Text className={styles.sessionTitle}>{session.title}</Text>
        <View className={styles.sessionMeta}>
          <View
            className={styles.statusBadge}
            style={{ backgroundColor: STATUS_BG[session.status], color: STATUS_COLOR[session.status] }}
            onClick={() => setShowStatusPicker(!showStatusPicker)}
          >
            {STATUS_TEXT[session.status]}
          </View>
          <Text className={styles.timeText}>{formatRelativeTime(session.createdAt)}</Text>
        </View>
        {showStatusPicker && (
          <View className={styles.statusPicker}>
            {(['active', 'resolved', 'archived'] as SessionStatus[]).map(s => (
              <View
                key={s}
                className={classnames(styles.statusOption, session.status === s && styles.statusOptionActive)}
                style={{ backgroundColor: STATUS_BG[s], color: STATUS_COLOR[s] }}
                onClick={() => handleChangeStatus(s)}
              >
                {STATUS_TEXT[s]}
              </View>
            ))}
          </View>
        )}
        {session.description && (
          <Text className={styles.sessionDesc}>{session.description}</Text>
        )}
        <View className={styles.sessionInfo}>
          <Text className={styles.infoItem}>创建人：{session.createdBy}</Text>
          <Text className={styles.infoItem}>创建时间：{formatTime(session.createdAt)}</Text>
          <Text className={styles.infoItem}>更新时间：{formatTime(session.updatedAt)}</Text>
        </View>
      </View>

      {linkedIssue && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🏷️ 关联问题</Text>
          <View className={styles.issueLink} onClick={handleNavigateToIssue}>
            <View className={styles.issueLinkContent}>
              <Text className={styles.issueLinkTitle}>{linkedIssue.title}</Text>
              <Text className={styles.issueLinkDesc}>{linkedIssue.description}</Text>
            </View>
            <Text className={styles.linkArrow}>›</Text>
          </View>
        </View>
      )}

      {linkedRecords.length > 0 && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>🔗 请求记录</Text>
          <View className={styles.recordList}>
            {linkedRecords.map(record => (
              <View key={record.id} className={styles.recordItem}>
                <View className={styles.recordHeader}>
                  <View className={styles.recordMethod}>
                    <MethodTag method={record.method} />
                  </View>
                  <Text className={styles.recordName}>{record.name}</Text>
                </View>
                <Text className={styles.recordUrl}>{record.url}</Text>
                {record.response && (
                  <View className={styles.recordMeta}>
                    <StatusBadge
                      status={record.response.status}
                      statusText={record.response.statusText}
                    />
                    <Text className={styles.recordTime}>{formatTime(record.createdAt)}</Text>
                  </View>
                )}
                <View className={styles.recordActions}>
                  <View
                    className={styles.actionBtn}
                    onClick={() => handleReplayRequest(record)}
                  >
                    🔄 复现
                  </View>
                  <View
                    className={styles.actionBtn}
                    onClick={() => handleViewRecord(record.id)}
                  >
                    📄 详情
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {session.conclusion && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>✅ 调试结论</Text>
          <View className={styles.conclusionBox}>
            <Text className={styles.conclusionText}>{session.conclusion}</Text>
          </View>
        </View>
      )}

      {sessionScreenshots.length > 0 && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📸 截图</Text>
          <View className={styles.screenshotGrid}>
            {sessionScreenshots.map(s => (
              <View
                key={s.id}
                className={styles.screenshotItem}
                onClick={() => handlePreviewScreenshot(s.url)}
              >
                <Image src={s.url} mode="aspectFill" />
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>⏱️ 事件时间线</Text>
        {sortedEvents.length === 0 ? (
          <View className={styles.emptyTimeline}>
            <Text className={styles.emptyText}>暂无事件记录</Text>
          </View>
        ) : (
          <View className={styles.timeline}>
            {sortedEvents.map((event, index) => {
              const eventRecord = getEventRecord(event.recordId);
              const eventScreenshot = getEventScreenshot(event.screenshotId);

              return (
                <View key={event.id} className={styles.timelineItem}>
                  <View className={styles.timelineDot} />
                  {index < sortedEvents.length - 1 && (
                    <View className={styles.timelineLine} />
                  )}
                  <View className={styles.timelineContent}>
                    <View className={styles.timelineHeader}>
                      <Text className={styles.timelineIcon}>{EVENT_ICON[event.type]}</Text>
                      <Text className={styles.timelineUser}>{event.userName}</Text>
                      <Text className={styles.timelineLabel}>{EVENT_LABEL[event.type]}</Text>
                      <Text className={styles.timelineTime}>
                        {formatRelativeTime(event.createdAt)}
                      </Text>
                    </View>

                    {event.type === 'comment' && event.comment && (
                      <View className={styles.timelineCommentBox}>
                        <Text className={styles.timelineCommentText}>{event.comment}</Text>
                      </View>
                    )}

                    {event.type === 'request' && eventRecord && (
                      <View
                        className={styles.timelineRecord}
                        onClick={() => handleReplayRequest(eventRecord)}
                      >
                        <View className={styles.timelineRecordHeader}>
                          <MethodTag method={eventRecord.method} />
                          <Text className={styles.timelineRecordName}>{eventRecord.name}</Text>
                        </View>
                        <Text className={styles.timelineRecordUrl}>{eventRecord.url}</Text>
                        {eventRecord.response && (
                          <View className={styles.timelineRecordMeta}>
                            <StatusBadge
                              status={eventRecord.response.status}
                              statusText={eventRecord.response.statusText}
                            />
                          </View>
                        )}
                      </View>
                    )}

                    {event.type === 'screenshot' && eventScreenshot && (
                      <View
                        className={styles.timelineScreenshot}
                        onClick={() => handlePreviewScreenshot(eventScreenshot.url)}
                      >
                        <Image src={eventScreenshot.url} mode="aspectFill" />
                      </View>
                    )}

                    {event.type === 'conclusion' && event.conclusion && (
                      <View className={styles.timelineConclusionBox}>
                        <Text className={styles.timelineConclusionText}>{event.conclusion}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>📸 上传截图</Text>
        <View className={styles.screenshotGrid}>
          {sessionScreenshots.map(s => (
            <View
              key={s.id}
              className={styles.screenshotItem}
              onClick={() => handlePreviewScreenshot(s.url)}
            >
              <Image src={s.url} mode="aspectFill" />
            </View>
          ))}
          {sessionScreenshots.length < 9 && (
            <View className={styles.screenshotAdd} onClick={handleChooseImage}>
              <Text className={styles.addIcon}>+</Text>
              <Text>上传</Text>
            </View>
          )}
        </View>
      </View>

      {!session.conclusion && (
        <View className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>✅ 添加结论</Text>
          {showConclusionInput ? (
            <View className={styles.conclusionInputArea}>
              <Textarea
                className={styles.conclusionInput}
                placeholder="输入调试结论..."
                placeholderTextColor="#64748B"
                value={newConclusion}
                onInput={(e) => setNewConclusion(e.detail.value)}
              />
              <View className={styles.conclusionActions}>
                <View
                  className={styles.cancelBtn}
                  onClick={() => { setShowConclusionInput(false); setNewConclusion(''); }}
                >
                  取消
                </View>
                <View
                  className={classnames(styles.confirmBtn, !newConclusion.trim() && styles.disabled)}
                  onClick={handleSubmitConclusion}
                >
                  提交结论
                </View>
              </View>
            </View>
          ) : (
            <View
              className={styles.addConclusionBtn}
              onClick={() => setShowConclusionInput(true)}
            >
              <Text>+ 添加调试结论</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>💬 添加评论</Text>
        <Textarea
          className={styles.commentInput}
          placeholder="输入评论内容..."
          placeholderTextColor="#64748B"
          value={newComment}
          onInput={(e) => setNewComment(e.detail.value)}
        />
        <View className={styles.commentActions}>
          <View className={styles.deleteBtn} onClick={handleDeleteSession}>
            🗑️ 删除会话
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

export default SessionDetailPage;
