import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { Issue, IssueStatus } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import classnames from 'classnames';

const STATUS_TABS: { key: IssueStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' }
];

const IssuesPage: React.FC = () => {
  const { issues } = useAppStore();
  const [activeStatus, setActiveStatus] = useState<IssueStatus | 'ALL'>('ALL');

  const stats = useMemo(() => {
    return {
      pending: issues.filter(i => i.status === 'pending').length,
      processing: issues.filter(i => i.status === 'processing').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (activeStatus === 'ALL') return issues;
    return issues.filter(i => i.status === activeStatus);
  }, [issues, activeStatus]);

  const handleAddIssue = () => {
    Taro.showToast({ title: '新建问题功能开发中', icon: 'none' });
  };

  const handleIssueClick = (issue: Issue) => {
    Taro.navigateTo({
      url: `/pages/issue-detail/index?id=${issue.id}`
    });
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

  const getStatusClass = (status: IssueStatus) => {
    const map: Record<IssueStatus, string> = {
      pending: styles.statusPending,
      processing: styles.statusProcessing,
      resolved: styles.statusResolved,
      closed: styles.statusClosed
    };
    return map[status];
  };

  const getStatusText = (status: IssueStatus) => {
    const map: Record<IssueStatus, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return map[status];
  };

  const getIssueCardClass = (status: IssueStatus) => {
    const map: Record<IssueStatus, string> = {
      pending: styles.issuePending,
      processing: styles.issueProcessing,
      resolved: styles.issueResolved,
      closed: styles.issueClosed
    };
    return map[status];
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.title}>问题看板</Text>
          <Text className={styles.subtitle}>跟踪和管理接口问题</Text>
        </View>
        <View className={styles.addBtn} onClick={handleAddIssue}>
          +
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={classnames(styles.statCard, styles.statPending)}>
          <Text className={styles.statCount}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statProcessing)}>
          <Text className={styles.statCount}>{stats.processing}</Text>
          <Text className={styles.statLabel}>处理中</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statResolved)}>
          <Text className={styles.statCount}>{stats.resolved}</Text>
          <Text className={styles.statLabel}>已解决</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statClosed)}>
          <Text className={styles.statCount}>{stats.closed}</Text>
          <Text className={styles.statLabel}>已关闭</Text>
        </View>
      </View>

      <ScrollView className={styles.statusTabs} scrollX>
        {STATUS_TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.statusTab, activeStatus === tab.key && styles.active)}
            onClick={() => setActiveStatus(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </ScrollView>

      {filteredIssues.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🐛</Text>
          <Text className={styles.emptyText}>暂无问题</Text>
        </View>
      ) : (
        filteredIssues.map(issue => (
          <View
            key={issue.id}
            className={classnames(styles.issueCard, getIssueCardClass(issue.status))}
            onClick={() => handleIssueClick(issue)}
          >
            <View className={styles.issueHeader}>
              <Text className={styles.issueTitle}>{issue.title}</Text>
              <View className={classnames(styles.priorityBadge, getPriorityClass(issue.priority))}>
                {getPriorityText(issue.priority)}
              </View>
            </View>

            <Text className={styles.issueDesc}>{issue.description}</Text>

            <View className={styles.issueMeta}>
              <View className={classnames(styles.statusBadge, getStatusClass(issue.status))}>
                {getStatusText(issue.status)}
              </View>
              {issue.labels?.map(label => (
                <View key={label} className={styles.labelTag}>
                  {label}
                </View>
              ))}
            </View>

            <View className={styles.issueFooter}>
              <Text className={styles.issueAssignee}>
                👤 {issue.assignee || '未分配'}
              </Text>
              <Text className={styles.issueTime}>
                {formatRelativeTime(issue.updatedAt)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default IssuesPage;
