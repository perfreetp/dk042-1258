import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { getStatusColor, getStatusBgColor } from '@/utils/format';
import classnames from 'classnames';

interface StatusBadgeProps {
  status: number;
  statusText?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, statusText }) => {
  const color = getStatusColor(status);
  const bgColor = getStatusBgColor(status);

  return (
    <View
      className={styles.badge}
      style={{
        color,
        backgroundColor: bgColor
      }}
    >
      {status || '---'}{statusText ? ` ${statusText}` : ''}
    </View>
  );
};

export default StatusBadge;
