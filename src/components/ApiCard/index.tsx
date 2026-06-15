import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { ApiItem } from '@/types';
import MethodTag from '@/components/MethodTag';
import { useAppStore } from '@/store/appStore';
import classnames from 'classnames';

interface ApiCardProps {
  api: ApiItem;
  onClick?: () => void;
}

const ApiCard: React.FC<ApiCardProps> = ({ api, onClick }) => {
  const { toggleFavorite, loadApiToRequest } = useAppStore();

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    toggleFavorite(api.id);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      loadApiToRequest(api);
      Taro.switchTab({ url: '/pages/debug/index' });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <MethodTag method={api.method} />
        <Text className={styles.name}>{api.name}</Text>
        <View className={styles.favorite} onClick={handleFavorite}>
          {api.isFavorite ? '★' : '☆'}
        </View>
      </View>
      <Text className={styles.path}>{api.path}</Text>
      {api.description && (
        <Text className={styles.description}>{api.description}</Text>
      )}
    </View>
  );
};

export default ApiCard;
