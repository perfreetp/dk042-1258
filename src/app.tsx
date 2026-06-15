import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { AppContext, AppStore, initialState, AppState } from '@/store/appStore';
import { RequestRecord, Issue, ApiItem, HttpMethod, IssueStatus, Draft, Screenshot, IssueActivity, DebugSession, SessionEvent } from '@/types';
import { getStorageItem, setStorageItem, isFirstLaunch, markInitialized } from '@/utils/storage';
import { generateId } from '@/utils/format';

const STORAGE_KEYS = {
  HISTORY: 'api_debug_history',
  FAVORITES: 'api_debug_favorites',
  ISSUES: 'api_debug_issues',
  CURRENT_ENV: 'api_debug_current_env',
  DRAFTS: 'api_debug_drafts',
  SCREENSHOTS: 'api_debug_screenshots',
  CURRENT_REQUEST: 'api_debug_current_request',
  SESSIONS: 'api_debug_sessions'
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
    const savedDrafts = getStorageItem<Draft[]>(STORAGE_KEYS.DRAFTS, initialState.drafts);
    const savedScreenshots = getStorageItem<Screenshot[]>(STORAGE_KEYS.SCREENSHOTS, initialState.screenshots);
    const savedCurrentRequest = getStorageItem<AppState['currentRequest']>(STORAGE_KEYS.CURRENT_REQUEST, initialState.currentRequest);
    const savedSessions = getStorageItem<DebugSession[]>(STORAGE_KEYS.SESSIONS, initialState.sessions);

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
      drafts: savedDrafts,
      screenshots: savedScreenshots,
      currentRequest: savedCurrentRequest,
      sessions: savedSessions,
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
      const nonEnvHeaderKeys = prev.environments.flatMap(e => e.headers?.map(h => h.key) || []);
      const filteredCurrentHeaders = currentHeaders.filter(h => !nonEnvHeaderKeys.includes(h.key));
      const mergedHeaders = [...envHeaders, ...filteredCurrentHeaders];

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
    setState(prev => {
      const currentEnv = prev.environments.find(e => e.id === prev.currentEnvId);
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

      const autoDraft = prev.drafts.find(d => d.apiId === api.id && d.type === 'auto');
      if (autoDraft) {
        let draftUrl = autoDraft.url;
        if (currentEnv && autoDraft.url) {
          const pathMatch = autoDraft.url.match(/^https?:\/\/[^/]+(.*)/);
          if (pathMatch) {
            draftUrl = currentEnv.baseUrl + pathMatch[1];
          }
        }
        const nonEnvHeaderKeys = prev.environments.flatMap(e => e.headers?.map(h => h.key) || []);
        const filteredDraftHeaders = autoDraft.headers.filter(h => !nonEnvHeaderKeys.includes(h.key));
        const draftMergedHeaders = [...envHeaders, ...filteredDraftHeaders];

        return {
          ...prev,
          currentRequest: {
            apiId: api.id,
            name: autoDraft.name || api.name,
            method: autoDraft.method,
            url: draftUrl,
            headers: draftMergedHeaders,
            queryParams: [...autoDraft.queryParams],
            body: autoDraft.body,
            bodyType: autoDraft.bodyType,
            assertNote: autoDraft.assertNote,
            contextScreenshotIds: [...autoDraft.screenshotIds]
          }
        };
      }

      return {
        ...prev,
        currentRequest: {
          apiId: api.id,
          name: api.name,
          method: api.method as HttpMethod,
          url: fullUrl,
          headers: mergedHeaders,
          queryParams: api.queryParams ? [...api.queryParams] : [],
          body: api.body || '',
          bodyType: api.bodyType || 'json',
          assertNote: '',
          contextScreenshotIds: [],
          sourceRecordId: undefined
        }
      };
    });
  }, []);

  const loadRecordToRequest = useCallback((record: RequestRecord) => {
    setState(prev => {
      const currentEnv = prev.environments.find(e => e.id === prev.currentEnvId);
      let url = record.url;
      if (currentEnv) {
        const pathMatch = record.url.match(/^https?:\/\/[^/]+(.*)/);
        if (pathMatch) {
          url = currentEnv.baseUrl + pathMatch[1];
        }
      }

      const envHeaders = currentEnv?.headers || [];
      const nonEnvHeaderKeys = prev.environments.flatMap(e => e.headers?.map(h => h.key) || []);
      const filteredRecordHeaders = record.headers.filter(h => !nonEnvHeaderKeys.includes(h.key));
      const mergedHeaders = [...envHeaders, ...filteredRecordHeaders];

      return {
        ...prev,
        currentRequest: {
          apiId: record.apiId,
          name: record.name,
          method: record.method,
          url,
          headers: mergedHeaders,
          queryParams: [...record.queryParams],
          body: record.body || '',
          bodyType: record.bodyType || 'json',
          assertNote: record.assertNote || '',
          contextScreenshotIds: [...(record.screenshotIds || [])],
          sourceRecordId: record.id
        }
      };
    });
  }, []);

  const addIssue = useCallback((issue: Issue) => {
    const activity: IssueActivity = {
      id: generateId(),
      type: 'issue_created',
      userId: 'me',
      userName: '我',
      createdAt: Date.now(),
      details: {}
    };
    const issueWithActivity = {
      ...issue,
      activities: [activity, ...(issue.activities || [])]
    };
    setState(prev => ({
      ...prev,
      issues: [issueWithActivity, ...prev.issues]
    }));
  }, []);

  const updateIssueStatus = useCallback((issueId: string, status: IssueStatus) => {
    setState(prev => {
      const oldIssue = prev.issues.find(i => i.id === issueId);
      const activity: IssueActivity = {
        id: generateId(),
        type: 'status_changed',
        userId: 'me',
        userName: '我',
        createdAt: Date.now(),
        details: {
          oldStatus: oldIssue?.status,
          newStatus: status
        }
      };
      return {
        ...prev,
        issues: prev.issues.map(issue =>
          issue.id === issueId
            ? {
                ...issue,
                status,
                updatedAt: Date.now(),
                activities: [activity, ...(issue.activities || [])]
              }
            : issue
        )
      };
    });
  }, []);

  const addIssueComment = useCallback((issueId: string, comment: any) => {
    const activity: IssueActivity = {
      id: generateId(),
      type: 'comment_added',
      userId: 'me',
      userName: '我',
      createdAt: Date.now(),
      details: {
        comment: comment.content
      }
    };
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              comments: [...(issue.comments || []), comment],
              activities: [activity, ...(issue.activities || [])],
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, []);

  const addIssueActivity = useCallback((issueId: string, activityData: Omit<IssueActivity, 'id' | 'createdAt'>) => {
    const activity: IssueActivity = {
      id: generateId(),
      createdAt: Date.now(),
      ...activityData
    };
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              activities: [activity, ...(issue.activities || [])],
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, []);

  const addScreenshot = useCallback((screenshotData: Omit<Screenshot, 'id' | 'createdAt'>): Screenshot => {
    const screenshot: Screenshot = {
      id: generateId(),
      createdAt: Date.now(),
      ...screenshotData
    };
    setState(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, screenshot]
    }));
    return screenshot;
  }, []);

  const removeScreenshot = useCallback((screenshotId: string) => {
    setState(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter(s => s.id !== screenshotId),
      history: prev.history.map(h => ({
        ...h,
        screenshotIds: h.screenshotIds?.filter(id => id !== screenshotId)
      })),
      issues: prev.issues.map(i => ({
        ...i,
        screenshotIds: i.screenshotIds?.filter(id => id !== screenshotId)
      })),
      sessions: prev.sessions.map(s => ({
        ...s,
        screenshotIds: s.screenshotIds?.filter(id => id !== screenshotId)
      }))
    }));
  }, []);

  const addScreenshotToRecord = useCallback((recordId: string, screenshotId: string) => {
    const screenshot = state.screenshots.find(s => s.id === screenshotId);
    setState(prev => ({
      ...prev,
      history: prev.history.map(record =>
        record.id === recordId
          ? {
              ...record,
              screenshotIds: [...(record.screenshotIds || []), screenshotId]
            }
          : record
      ),
      issues: prev.issues.map(issue =>
        issue.requestRecordId === recordId && screenshot
          ? {
              ...issue,
              screenshotIds: [...(issue.screenshotIds || []), screenshotId],
              activities: [
                {
                  id: generateId(),
                  type: 'screenshot_added',
                  userId: 'me',
                  userName: '我',
                  createdAt: Date.now(),
                  details: {
                    screenshotId,
                    screenshotUrl: screenshot.url
                  }
                },
                ...(issue.activities || [])
              ]
            }
          : issue
      ),
      sessions: prev.sessions.map(session => {
        if (!session.recordIds.includes(recordId)) return session;
        return {
          ...session,
          screenshotIds: [...(session.screenshotIds || []), screenshotId],
          events: [
            ...session.events,
            {
              id: generateId(),
              type: 'screenshot' as const,
              createdAt: Date.now(),
              userId: 'me',
              userName: '我',
              screenshotId
            }
          ]
        };
      })
    }));
  }, [state.screenshots]);

  const addScreenshotToIssue = useCallback((issueId: string, screenshotId: string) => {
    const screenshot = state.screenshots.find(s => s.id === screenshotId);
    const activity: IssueActivity | undefined = screenshot ? {
      id: generateId(),
      type: 'screenshot_added',
      userId: 'me',
      userName: '我',
      createdAt: Date.now(),
      details: {
        screenshotId,
        screenshotUrl: screenshot.url
      }
    } : undefined;

    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              screenshotIds: [...(issue.screenshotIds || []), screenshotId],
              activities: activity ? [activity, ...(issue.activities || [])] : issue.activities,
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, [state.screenshots]);

  const removeScreenshotFromRecord = useCallback((recordId: string, screenshotId: string) => {
    setState(prev => ({
      ...prev,
      history: prev.history.map(record =>
        record.id === recordId
          ? {
              ...record,
              screenshotIds: (record.screenshotIds || []).filter(id => id !== screenshotId)
            }
          : record
      )
    }));
  }, []);

  const removeScreenshotFromIssue = useCallback((issueId: string, screenshotId: string) => {
    const activity: IssueActivity = {
      id: generateId(),
      type: 'screenshot_removed',
      userId: 'me',
      userName: '我',
      createdAt: Date.now(),
      details: {
        screenshotId
      }
    };
    setState(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              screenshotIds: (issue.screenshotIds || []).filter(id => id !== screenshotId),
              activities: [activity, ...(issue.activities || [])],
              updatedAt: Date.now()
            }
          : issue
      )
    }));
  }, []);

  const saveDraft = useCallback((draftData: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Draft => {
    const now = Date.now();
    if (draftData.id) {
      const draft: Draft = {
        ...draftData,
        id: draftData.id,
        updatedAt: now
      } as Draft;
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.map(d => d.id === draftData.id ? draft : d)
      }));
      return draft;
    } else {
      const draft: Draft = {
        ...draftData,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      setState(prev => ({
        ...prev,
        drafts: [draft, ...prev.drafts]
      }));
      return draft;
    }
  }, []);

  const loadDraft = useCallback((draftId: string) => {
    setState(prev => {
      const draft = prev.drafts.find(d => d.id === draftId);
      if (!draft) return prev;

      const currentEnv = prev.environments.find(e => e.id === prev.currentEnvId);
      let url = draft.url;
      if (currentEnv && draft.url) {
        const pathMatch = draft.url.match(/^https?:\/\/[^/]+(.*)/);
        if (pathMatch) {
          url = currentEnv.baseUrl + pathMatch[1];
        }
      }

      const envHeaders = currentEnv?.headers || [];
      const draftHeaders = draft.headers || [];
      const nonEnvHeaderKeys = prev.environments.flatMap(e => e.headers?.map(h => h.key) || []);
      const filteredDraftHeaders = draftHeaders.filter(h => !nonEnvHeaderKeys.includes(h.key));
      const mergedHeaders = [...envHeaders, ...filteredDraftHeaders];

      return {
        ...prev,
        currentRequest: {
          apiId: draft.apiId,
          name: draft.name,
          method: draft.method,
          url,
          headers: mergedHeaders,
          queryParams: [...draft.queryParams],
          body: draft.body,
          bodyType: draft.bodyType,
          assertNote: draft.assertNote,
          contextScreenshotIds: [...draft.screenshotIds]
        }
      };
    });
  }, []);

  const deleteDraft = useCallback((draftId: string) => {
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.filter(d => d.id !== draftId)
    }));
  }, []);

  const clearAutoDrafts = useCallback(() => {
    setState(prev => ({
      ...prev,
      drafts: prev.drafts.filter(d => d.type !== 'auto')
    }));
  }, []);

  const saveSharedRecord = useCallback((record: RequestRecord) => {
    const newRecord: RequestRecord = {
      ...record,
      id: generateId(),
      createdAt: Date.now(),
      assertNote: ''
    };
    setState(prev => ({
      ...prev,
      history: [newRecord, ...prev.history]
    }));
  }, []);

  const createSession = useCallback((sessionData: Omit<DebugSession, 'id' | 'createdAt' | 'updatedAt' | 'events'>): DebugSession => {
    const now = Date.now();
    const session: DebugSession = {
      ...sessionData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      events: [{
        id: generateId(),
        type: 'comment' as const,
        createdAt: now,
        userId: 'me',
        userName: '我',
        comment: '创建了调试会话'
      }]
    };
    setState(prev => ({
      ...prev,
      sessions: [session, ...prev.sessions]
    }));
    return session;
  }, []);

  const updateSession = useCallback((sessionId: string, data: Partial<DebugSession>) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId
          ? { ...s, ...data, updatedAt: Date.now() }
          : s
      )
    }));
  }, []);

  const addEventToSession = useCallback((sessionId: string, eventData: Omit<SessionEvent, 'id' | 'createdAt'>) => {
    const event: SessionEvent = {
      id: generateId(),
      createdAt: Date.now(),
      ...eventData
    };
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              events: [...s.events, event],
              updatedAt: Date.now(),
              recordIds: eventData.type === 'request' && eventData.recordId
                ? [...new Set([...s.recordIds, eventData.recordId])]
                : s.recordIds,
              screenshotIds: eventData.type === 'screenshot' && eventData.screenshotId
                ? [...new Set([...s.screenshotIds, eventData.screenshotId])]
                : s.screenshotIds,
              conclusion: eventData.type === 'conclusion' && eventData.conclusion
                ? eventData.conclusion
                : s.conclusion
            }
          : s
      )
    }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId)
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
    setStorageItem(STORAGE_KEYS.DRAFTS, state.drafts);
    setStorageItem(STORAGE_KEYS.SCREENSHOTS, state.screenshots);
    setStorageItem(STORAGE_KEYS.CURRENT_REQUEST, state.currentRequest);
    setStorageItem(STORAGE_KEYS.SESSIONS, state.sessions);
  }, [state.history, state.favorites, state.issues, state.currentEnvId, state.drafts, state.screenshots, state.currentRequest, state.sessions]);

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
    loadRecordToRequest,
    addIssue,
    updateIssueStatus,
    addIssueComment,
    addIssueActivity,
    addScreenshot,
    removeScreenshot,
    addScreenshotToRecord,
    addScreenshotToIssue,
    removeScreenshotFromRecord,
    removeScreenshotFromIssue,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearAutoDrafts,
    saveSharedRecord,
    createSession,
    updateSession,
    addEventToSession,
    deleteSession
  };

  return (
    <AppContext.Provider value={storeValue}>
      {props.children}
    </AppContext.Provider>
  );
}

export default App;
