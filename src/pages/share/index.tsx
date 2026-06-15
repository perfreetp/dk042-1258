import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { mockTeamMembers } from '@/data/mockApis';
import { TeamMember } from '@/types';
import MethodTag from '@/components/MethodTag';
import classnames from 'classnames';

const ROLE_TEXT: Record<string, string> = {
  admin: '管理员',
  developer: '开发工程师',
  tester: '测试工程师',
  product: '产品经理'
};

type PermissionType = 'view' | 'comment' | 'edit';

const SharePage: React.FC = () => {
  const router = useRouter();
  const { history, issues, addIssueActivity } = useAppStore();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [permission, setPermission] = useState<PermissionType>('view');

  const shareType = router.params.type || 'record';
  const shareId = router.params.id;

  const shareContent = useMemo(() => {
    if (shareType === 'record') {
      return history.find(h => h.id === shareId) || history[0];
    } else {
      return issues.find(i => i.id === shareId) || issues[0];
    }
  }, [shareType, shareId, history, issues]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === mockTeamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(mockTeamMembers.map(m => m.id));
    }
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleShare = () => {
    if (selectedMembers.length === 0) {
      Taro.showToast({ title: '请选择分享对象', icon: 'none' });
      return;
    }

    Taro.showToast({ title: '分享成功', icon: 'success' });

    if (shareType === 'issue' && shareContent) {
      addIssueActivity(shareId, {
        type: 'shared',
        userId: 'me',
        userName: '我',
        details: {
          sharedTo: selectedMembers
        }
      });
    }

    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/share-view/index?type=${shareType}&id=${shareId}`
      });
    }, 1500);
  };

  const getMemberAvatar = (name: string) => {
    return name.charAt(0);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.shareInfo}>
        <Text className={styles.shareTitle}>
          {shareType === 'record' ? '📋 分享请求记录' : '🐛 分享问题'}
        </Text>
        <Text className={styles.shareDesc}>
          {shareType === 'record'
            ? '将 API 调试记录分享给团队成员，包含完整的请求参数、响应数据和断言备注'
            : '将问题跟踪卡片分享给团队成员，协同处理和跟进'}
        </Text>

        {shareType === 'record' && shareContent && (
          <View className={styles.requestPreview}>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>方法</Text>
              <MethodTag method={(shareContent as any).method} />
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>名称</Text>
              <Text className={styles.previewValue}>{(shareContent as any).name}</Text>
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>URL</Text>
              <Text className={styles.previewValue}>{(shareContent as any).url}</Text>
            </View>
          </View>
        )}

        {shareType === 'issue' && shareContent && (
          <View className={styles.requestPreview}>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>标题</Text>
              <Text className={styles.previewValue}>{(shareContent as any).title}</Text>
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>状态</Text>
              <Text className={styles.previewValue}>{(shareContent as any).status}</Text>
            </View>
          </View>
        )}
      </View>

      <Text className={styles.sectionTitle}>👥 选择成员</Text>
      <Text className={styles.selectedCount}>
        已选择 {selectedMembers.length} / {mockTeamMembers.length} 人
        <Text
          style={{ color: '#6366F1', marginLeft: 16 }}
          onClick={handleSelectAll}
        >
          {selectedMembers.length === mockTeamMembers.length ? '取消全选' : '全选'}
        </Text>
      </Text>
      <View className={styles.memberList}>
        {mockTeamMembers.map(member => (
          <View
            key={member.id}
            className={styles.memberItem}
            onClick={() => toggleMember(member.id)}
          >
            <View className={styles.memberAvatar}>
              {getMemberAvatar(member.name)}
            </View>
            <View className={styles.memberInfo}>
              <Text className={styles.memberName}>{member.name}</Text>
              <Text className={styles.memberRole}>{ROLE_TEXT[member.role]}</Text>
            </View>
            <View
              className={classnames(
                styles.checkbox,
                selectedMembers.includes(member.id) && styles.checked
              )}
            >
              {selectedMembers.includes(member.id) ? '✓' : ''}
            </View>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>🔐 权限设置</Text>
      <View className={styles.permissionSection}>
        <View className={styles.permissionOption} onClick={() => setPermission('view')}>
          <View className={styles.permissionInfo}>
            <Text className={styles.permissionTitle}>仅查看</Text>
            <Text className={styles.permissionDesc}>成员只能查看分享内容，无法进行任何操作</Text>
          </View>
          <View className={classnames(styles.radio, permission === 'view' && styles.checked)} />
        </View>
        <View className={styles.permissionOption} onClick={() => setPermission('comment')}>
          <View className={styles.permissionInfo}>
            <Text className={styles.permissionTitle}>可评论</Text>
            <Text className={styles.permissionDesc}>成员可以查看并添加评论和备注</Text>
          </View>
          <View className={classnames(styles.radio, permission === 'comment' && styles.checked)} />
        </View>
        <View className={styles.permissionOption} onClick={() => setPermission('edit')}>
          <View className={styles.permissionInfo}>
            <Text className={styles.permissionTitle}>可编辑</Text>
            <Text className={styles.permissionDesc}>成员可以编辑内容、修改状态、重放请求等</Text>
          </View>
          <View className={classnames(styles.radio, permission === 'edit' && styles.checked)} />
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.secondaryBtn} onClick={handleCancel}>
          取消
        </View>
        <View className={styles.primaryBtn} onClick={handleShare}>
          确认分享
        </View>
      </View>
    </ScrollView>
  );
};

export default SharePage;
