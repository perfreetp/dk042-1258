import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { HttpMethod } from '@/types';
import { getMethodColor } from '@/utils/format';
import classnames from 'classnames';

interface MethodTagProps {
  method: HttpMethod;
  size?: 'sm' | 'md' | 'lg';
}

const MethodTag: React.FC<MethodTagProps> = ({ method, size = 'sm' }) => {
  const color = getMethodColor(method);
  const bgColor = `${color}20`;

  const sizeClass = {
    sm: styles.tag,
    md: styles.tag,
    lg: styles.tag
  }[size];

  return (
    <View
      className={classnames(styles.tag, sizeClass)}
      style={{
        color,
        backgroundColor: bgColor
      }}
    >
      {method}
    </View>
  );
};

export default MethodTag;
