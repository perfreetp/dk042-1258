import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import classnames from 'classnames';

const EnvSwitcher: React.FC = () => {
  const { environments, currentEnvId, setCurrentEnv } = useAppStore();

  return (
    <View className={styles.container}>
      <View className={styles.envList}>
        {environments.map(env => (
          <View
            key={env.id}
            className={classnames(
              styles.envItem,
              env.id === currentEnvId && styles.active
            )}
            onClick={() => setCurrentEnv(env.id)}
          >
            {env.name}
          </View>
        ))}
      </View>
    </View>
  );
};

export default EnvSwitcher;
