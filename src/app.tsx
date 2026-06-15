import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { AppContext, AppStore, initialState, AppState } from '@/store/appStore';
import { RequestRecord, Issue, ApiItem, HttpMethod, IssueStatus } from '@/types';
import { getStorageItem, setStorageItem, isFirstLaunch, markInitialized } from '@/utils/storage';

const STORAGE_KEYS = {
  HISTORY: 'api_debug_history',
  FAVORITES: 'api_debug_favorites',
  ISSUES: 'api_debug_issues',
  CURRENT_ENV: 'api_debug_current_env'
};

function App(props) {
  const [state, setState] = useState<AppState>(() => {
    if (isFirstLaunch()) {
      markInitialized();
      return initialState;
    }
    const savedHistory = getStorageItem<RequestRecord[]>(STORAGE_KEYS.HISTORY, initialState.history);
    const savedFavorites = getStorageItem<string[]>(STORAGE_KEYS.FAVORITES, initialState.favorites);
    const savedIssues = getStorageItem<Issue[]>(STORAGE_KEYS.ISSUES, initialState.issues);
    const savedEnvId = getStorageItem<string>(STORAGE_KEYS.CURRENT_ENV, initialState.currentEnvId);

    const apiGroupsWithFavorites = initialState.apiGroups.map(group => ({
      ...group,
      apis: group.apis.map(api => ({
        ...api,
        isFavorite: savedFavorites.includes(api.id)
      }))
    }));

    return {
      ...initialState,
      history: savedHistory,
      favorites: savedFavorites,
      issues: savedIssues,
      currentEnvId: savedEnvId,
      apiGroups: apiGroupsWithFavorites
    };
  });

  const isFirstRender = useRef(true);

  const setCurrentEnv = useCallback((envId: string) => {
    setState(prev => {
      const newEnv = prev.environments.find(e => e.id === envId);
      if (!newEnv) return { ...prev, currentEnvId: envId };

      let newUrl = prev.currentRequest.url;
      if (prev.currentRequest.url) {
        const pathMatch = prev.currentRequest.url.match(/^https?:\/\/[^/]+(.*)/);
        if (pathMatch) {
          newUrl = newEnv.baseUrl + pathMatch[1];
        }
      }

      const envHeaders = newEnv.headers || [];
      const currentHeaders = prev.currentRequest.headers || [];
      const mergedHeaders = [...envHeaders];
      currentHeaders.forEach(h => {
        if (!mergedHeaders.find(eh => eh.key === h.key)) {
          mergedHeaders.push(h);
        }
      });

      return {
        ...prev,
        currentEnvId: envId,
        currentRequest: {
          ...prev.currentRequest,
          url: newUrl,
          headers: mergedHeaders
        }
      };
    });
  }, []);

  const toggleFavorite = useCallback((apiId: string) => {
    setState(prev => {
      const isFav = prev.favorites.includes(apiId);
      const newFavorites = isFav
        ? prev.favorites.filter(id => id !== apiId)
        : [...prev.favorites, apiId];
      const newGroups = prev.apiGroups.map(group => ({
        ...group,
        apis: group.apis.map(api =>
          api.id === apiId ? { ...api, isFavorite: !isFav } : api
        )
      }));
      return { ...prev, favorites: newFavorites, apiGroups: newGroups };
    });
  }, []);

  const addHistory = useCallback((record: RequestRecord) => {
    setState(prev => ({
      ...prev,
      history: [record, ...prev.history]
    }));
  }, []);

  const removeHistory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      history: prev.history.filter(h => h.id !== id)
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  const setCurrentRequest = useCallback((request: Partial<AppState['currentRequest']>) => {
    setState(prev => ({
      ...prev,
      currentRequest: { ...prev.currentRequest, ...request }
    }));
  }, []);

  const loadApiToRequest = useCallback((api: ApiItem) => {
    const currentEnv = state.environments.find(e => e.id === state.currentEnvId);
    const baseUrl = currentEnv?.baseUrl || '';
    const fullUrl = baseUrl + api.path;

    const envHeaders = currentEnv?.headers || [];
    const apiHeaders = api.headers || [];
    const mergedHeaders = [...envHeaders];
    apiHeaders.forEach(h => {
      if (!mergedHeaders.find(eh => eh.key === h.key)) {
        mergedHeaders.push(h);
      }
    });

    setState(prev => ({
      ...prev,
      currentRequest: {
        name: api.name,
        method: api.method as HttpMethod,
        url: fullUrl,
        headers: mergedHeaders,
        queryParams: api.queryParams ? [...api.queryParams] : [],
        body: api.body || '',
        bodyType: api.bodyType || 'json'
      }
    }));
  }, [state.environments, state.currentEnvId]);

  const addIssue = useCallback((issue: Issue) => {
    setState(prev => ({
      ...prev,
      issues: [issue, ...prev.issues]
    }));
  }, []);

  const updateIssueStatus = useCallback((issueId: string, status: IssueStatus) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? { ...issue, status, updatedAt: Date.now() }
          : issue
      )
    }));
  }, []);

  const addIssueComment = useCallback((issueId: string, comment: any) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              comments: [...(issue.comments || []), comment],
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, []);

  const addScreenshotToRecord = useCallback((recordId: string, screenshot: string) => {
    setState(prev => ({
      ...prev,
      history: prev.history.map(record =>
        record.id === recordId
          ? {
              ...record,
              screenshots: [...(record.screenshots || []), screenshot]
            }
          : record
      )
    }));
  }, []);

  const addScreenshotToIssue = useCallback((issueId: string, screenshot: string) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              screenshots: [...(issue.screenshots || []), screenshot],
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setStorageItem(STORAGE_KEYS.HISTORY, state.history);
    setStorageItem(STORAGE_KEYS.FAVORITES, state.favorites);
    setStorageItem(STORAGE_KEYS.ISSUES, state.issues);
    setStorageItem(STORAGE_KEYS.CURRENT_ENV, state.currentEnvId);
  }, [state.history, state.favorites, state.issues, state.currentEnvId]);

  useDidShow(() => {
    console.log('[App] onShow');
  });

  useDidHide(() => {
    console.log('[App] onHide');
  });

  const storeValue: AppStore = {
    ...state,
    setCurrentEnv,
    toggleFavorite,
    addHistory,
    removeHistory,
    clearHistory,
    setCurrentRequest,
    loadApiToRequest,
    addIssue,
    updateIssueStatus,
    addIssueComment,
    addScreenshotToRecord,
    addScreenshotToIssue
  };

  return (
    <AppContext.Provider value={storeValue}>
      {props.children}
    </AppContext.Provider>
  );
}

export default App;
