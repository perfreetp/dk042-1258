import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { Issue } from '@/types';
import { generateId } from '@/utils/format';
import MethodTag from '@/components/MethodTag';
import classnames from 'classnames';

const PRIORITY_OPTIONS = [
  { key: 'low', label: '低', className: styles.priorityLow },
  { key: 'medium', label: '中', className: styles.priorityMedium },
  { key: 'high', label: '高', className: styles.priorityHigh },
  { key: 'critical', label: '紧急', className: styles.priorityCritical }
];

const IssueCreatePage: React.FC = () => {
  const router = useRouter();
  const { addIssue, history } = useAppStore();

  const recordId = router.params.recordId || '';
  const linkedRecord = useMemo(() => {
    return history.find(h => h.id === recordId) || null;
  }, [recordId, history]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(linkedRecord ? `接口 ${linkedRecord.name} 出现异常\n\n请求地址: ${linkedRecord.url}` : '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入问题标题', icon: 'none' });
      return;
    }

    const newIssue: Issue = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
      priority,
      reporter: '我',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      requestRecordId: linkedRecord?.id,
      screenshots: linkedRecord?.screenshots || [],
      comments: [],
      labels: []
    };

    addIssue(newIssue);
    Taro.showToast({ title: '创建成功', icon: 'success' });

    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/issue-detail/index?id=${newIssue.id}`
      });
    }, 1000);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleClearLink = () => {
    Taro.navigateBack();
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.formCard}>
        <Text className={styles.label}>问题标题 *</Text>
        <Input
          className={styles.titleInput}
          placeholder="请输入问题标题"
          placeholderTextColor="#64748B"
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
        />
      </View>

      <View className={styles.formCard}>
        <Text className={styles.label}>问题描述</Text>
        <Textarea
          className={styles.descInput}
          placeholder="详细描述问题现象、复现步骤、预期结果..."
          placeholderTextColor="#64748B"
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
        />
      </View>

      <View className={styles.formCard}>
        <Text className={styles.label}>优先级</Text>
        <View className={styles.priorityRow}>
          {PRIORITY_OPTIONS.map(opt => (
            <View
              key={opt.key}
              className={classnames(styles.priorityOption, opt.className, priority === opt.key && styles.active)}
              onClick={() => setPriority(opt.key as any)}
            >
              {opt.label}
            </View>
          ))}
        </View>
      </View>

      {linkedRecord && (
        <View className={styles.formCard}>
          <View className={styles.linkedHeader}>
            <Text className={styles.linkedLabel}>关联请求</Text>
            <Text className={styles.clearLink} onClick={handleClearLink}>
              取消关联
            </Text>
          </View>
          <View className={styles.linkedInfo}>
            <MethodTag method={linkedRecord.method} />
            <Text className={styles.linkedUrl}>{linkedRecord.url}</Text>
          </View>
        </View>
      )}

      <View className={styles.actionBar}>
        <View className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </View>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          创建问题
        </View>
      </View>
    </ScrollView>
  );
};

export default IssueCreatePage;
