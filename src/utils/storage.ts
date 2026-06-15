import Taro from '@tarojs/taro';

const STORAGE_KEYS = {
  HISTORY: 'api_debug_history',
  FAVORITES: 'api_debug_favorites',
  ISSUES: 'api_debug_issues',
  CURRENT_ENV: 'api_debug_current_env',
  DRAFTS: 'api_debug_drafts',
  SCREENSHOTS: 'api_debug_screenshots',
  CURRENT_REQUEST: 'api_debug_current_request',
  INITIALIZED: 'api_debug_initialized'
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data === '' || data === null || data === undefined) {
      return defaultValue;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('[Storage] Get error:', key, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (error) {
    console.error('[Storage] Set error:', key, error);
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    Taro.removeStorageSync(key);
  } catch (error) {
    console.error('[Storage] Remove error:', key, error);
  }
};

export const isFirstLaunch = (): boolean => {
  return !getStorageItem<boolean>(STORAGE_KEYS.INITIALIZED, false);
};

export const markInitialized = (): void => {
  setStorageItem(STORAGE_KEYS.INITIALIZED, true);
};

export default {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isFirstLaunch,
  markInitialized
};
