import React, { useEffect, useState, useCallback } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { AppContext, AppStore, initialState, AppState } from '@/store/appStore';
import { RequestRecord, Issue, ApiItem, HttpMethod, IssueStatus } from '@/types';

function App(props) {
  const [state, setState] = useState<AppState>(initialState);

  const setCurrentEnv = useCallback((envId: string) => {
    setState(prev => ({ ...prev, currentEnvId: envId }));
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

  useEffect(() => {
    console.log('[App] Store initialized');
  }, []);

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
    updateIssueStatus
  };

  return (
    <AppContext.Provider value={storeValue}>
      {props.children}
    </AppContext.Provider>
  );
}

export default App;
