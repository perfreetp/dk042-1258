import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import EnvSwitcher from '@/components/EnvSwitcher';
import ApiCard from '@/components/ApiCard';
import classnames from 'classnames';

const ApisPage: React.FC = () => {
  const { apiGroups, favorites } = useAppStore();
  const [activeGroupId, setActiveGroupId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const favoriteApis = useMemo(() => {
    return apiGroups.flatMap(g => g.apis).filter(a => favorites.includes(a.id));
  }, [apiGroups, favorites]);

  const filteredApis = useMemo(() => {
    let result: any[] = [];
    if (activeGroupId === 'all') {
      result = apiGroups.flatMap(g => g.apis.map(a => ({ ...a, groupName: g.name })));
    } else {
      const group = apiGroups.find(g => g.id === activeGroupId);
      if (group) {
        result = group.apis.map(a => ({ ...a, groupName: group.name }));
      }
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(keyword) ||
          a.path.toLowerCase().includes(keyword) ||
          (a.description && a.description.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [apiGroups, activeGroupId, searchKeyword]);

  const groupedApis = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredApis.forEach(api => {
      if (!map.has(api.groupName)) {
        map.set(api.groupName, []);
      }
      map.get(api.groupName)!.push(api);
    });
    return Array.from(map.entries());
  }, [filteredApis]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>API 目录</Text>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索接口名称、路径..."
            placeholderTextColor="#64748B"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.envSection}>
        <EnvSwitcher />
      </View>

      <ScrollView className={styles.groupTabs} scrollX>
        <View
          className={classnames(styles.groupTab, activeGroupId === 'all' && styles.active)}
          onClick={() => setActiveGroupId('all')}
        >
          全部
        </View>
        {apiGroups.map(group => (
          <View
            key={group.id}
            className={classnames(styles.groupTab, activeGroupId === group.id && styles.active)}
            onClick={() => setActiveGroupId(group.id)}
          >
            {group.name}
          </View>
        ))}
      </ScrollView>

      {favoriteApis.length > 0 && activeGroupId === 'all' && !searchKeyword && (
        <View className={styles.favoriteSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>⭐ 收藏接口</Text>
            <Text className={styles.sectionCount}>{favoriteApis.length}</Text>
          </View>
          {favoriteApis.map(api => (
            <ApiCard key={api.id} api={api} />
          ))}
        </View>
      )}

      <View>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {activeGroupId === 'all' ? '全部接口' : '接口列表'}
          </Text>
          <Text className={styles.sectionCount}>{filteredApis.length}</Text>
        </View>

        {filteredApis.length === 0 ? (
          <View className={styles.emptyState}>暂无匹配的接口</View>
        ) : (
          groupedApis.map(([groupName, apis]) => (
            <View key={groupName}>
              {activeGroupId === 'all' && (
                <Text className={styles.groupTitle}>{groupName}</Text>
              )}
              {apis.map((api: any) => (
                <ApiCard key={api.id} api={api} />
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ApisPage;
