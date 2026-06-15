import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import MethodTag from '@/components/MethodTag';
import { formatRelativeTime } from '@/utils/format';

const MinePage: React.FC = () => {
  const { apiGroups, favorites, history, issues, toggleFavorite, loadApiToRequest } = useAppStore();

  const favoriteApis = useMemo(() => {
    return apiGroups.flatMap(g => g.apis).filter(a => favorites.includes(a.id));
  }, [apiGroups, favorites]);

  const stats = useMemo(() => {
    return {
      totalRequests: history.length,
      totalIssues: issues.length,
      totalFavorites: favorites.length,
      successRate: history.length > 0
        ? Math.round(history.filter(h => h.response && h.response.status >= 200 && h.response.status < 300).length / history.length * 100)
        : 0
    };
  }, [history, issues, favorites]);

  const handleFavoriteClick = (api: any) => {
    loadApiToRequest(api);
    Taro.switchTab({ url: '/pages/debug/index' });
  };

  const handleToggleFavorite = (e: any, apiId: string) => {
    e.stopPropagation();
    toggleFavorite(apiId);
  };

  const handleEnvManagement = () => {
    Taro.showToast({ title: '环境管理开发中', icon: 'none' });
  };

  const handleSettings = () => {
    Taro.showToast({ title: '设置开发中', icon: 'none' });
  };

  const handleAbout = () => {
    Taro.showToast({ title: 'API Debug v1.0.0', icon: 'none' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.profileCard}>
        <View className={styles.profileInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.profileText}>
            <Text className={styles.userName}>开发者</Text>
            <Text className={styles.userRole}>API 测试工程师</Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.totalRequests}</Text>
            <Text className={styles.statLabel}>调试次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.successRate}%</Text>
            <Text className={styles.statLabel}>成功率</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.totalIssues}</Text>
            <Text className={styles.statLabel}>问题数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.totalFavorites}</Text>
            <Text className={styles.statLabel}>收藏</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⭐ 我的收藏</Text>
        <View className={styles.menuCard}>
          {favoriteApis.length === 0 ? (
            <View className={styles.emptyFavorites}>暂无收藏的接口</View>
          ) : (
            <View className={styles.favoriteList}>
              {favoriteApis.map(api => (
                <View
                  key={api.id}
                  className={styles.favoriteItem}
                  onClick={() => handleFavoriteClick(api)}
                >
                  <MethodTag method={api.method} />
                  <View className={styles.favoriteInfo}>
                    <Text className={styles.favoriteName}>{api.name}</Text>
                    <Text className={styles.favoritePath}>{api.path}</Text>
                  </View>
                  <Text
                    onClick={(e) => handleToggleFavorite(e, api.id)}
                    style={{ color: '#F59E0B', fontSize: 32, padding: 8 }}
                  >
                    ★
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能菜单</Text>
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={handleEnvManagement}>
            <View className={styles.menuIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              🌐
            </View>
            <Text className={styles.menuText}>环境管理</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={handleSettings}>
            <View className={styles.menuIcon} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
              ⚙️
            </View>
            <Text className={styles.menuText}>系统设置</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={handleAbout}>
            <View className={styles.menuIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
              ℹ️
            </View>
            <Text className={styles.menuText}>关于我们</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
