import { createContext, useContext } from 'react';
import { EnvironmentConfig, ApiGroup, RequestRecord, Issue, ApiItem, KeyValue, HttpMethod, Draft, Screenshot, IssueActivity, DebugSession, SessionEvent, SessionStatus } from '@/types';
import { mockEnvironments, mockApiGroups } from '@/data/mockApis';
import { mockHistory, mockIssues, mockScreenshots, mockSessions } from '@/data/mockHistory';

export interface AppState {
  environments: EnvironmentConfig[];
  currentEnvId: string;
  apiGroups: ApiGroup[];
  history: RequestRecord[];
  issues: Issue[];
  drafts: Draft[];
  screenshots: Screenshot[];
  sessions: DebugSession[];
  currentRequest: {
    apiId?: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: KeyValue[];
    queryParams: KeyValue[];
    body: string;
    bodyType: 'json' | 'form' | 'raw';
    assertNote: string;
    contextScreenshotIds?: string[];
    sourceRecordId?: string;
  };
  favorites: string[];
}

export interface AppActions {
  setCurrentEnv: (envId: string) => void;
  toggleFavorite: (apiId: string) => void;
  addHistory: (record: RequestRecord) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  setCurrentRequest: (request: Partial<AppState['currentRequest']>) => void;
  loadApiToRequest: (api: ApiItem) => void;
  loadRecordToRequest: (record: RequestRecord) => void;
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (issueId: string, status: Issue['status']) => void;
  addIssueComment: (issueId: string, comment: Issue['comments'][0]) => void;
  addIssueActivity: (issueId: string, activity: Omit<IssueActivity, 'id' | 'createdAt'>) => void;
  addScreenshot: (screenshot: Omit<Screenshot, 'id' | 'createdAt'>) => Screenshot;
  removeScreenshot: (screenshotId: string) => void;
  addScreenshotToRecord: (recordId: string, screenshotId: string) => void;
  addScreenshotToIssue: (issueId: string, screenshotId: string) => void;
  removeScreenshotFromRecord: (recordId: string, screenshotId: string) => void;
  removeScreenshotFromIssue: (issueId: string, screenshotId: string) => void;
  saveDraft: (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Draft;
  loadDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;
  clearAutoDrafts: () => void;
  renameDraft: (draftId: string, newName: string) => void;
  duplicateDraft: (draftId: string) => Draft;
  saveSharedRecord: (record: RequestRecord) => void;
  createSession: (session: Omit<DebugSession, 'id' | 'createdAt' | 'updatedAt' | 'events'>) => DebugSession;
  updateSession: (sessionId: string, data: Partial<DebugSession>) => void;
  addEventToSession: (sessionId: string, event: Omit<SessionEvent, 'id' | 'createdAt'>) => void;
  deleteSession: (sessionId: string) => void;
}

export type AppStore = AppState & AppActions;

export const initialState: AppState = {
  environments: mockEnvironments,
  currentEnvId: mockEnvironments[1].id,
  apiGroups: mockApiGroups,
  history: mockHistory,
  issues: mockIssues,
  drafts: [],
  screenshots: mockScreenshots,
  sessions: mockSessions,
  currentRequest: {
    name: '',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'json',
    assertNote: ''
  },
  favorites: mockApiGroups.flatMap(g => g.apis.filter(a => a.isFavorite).map(a => a.id))
};

export const AppContext = createContext<AppStore | null>(null);

export const useAppStore = (): AppStore => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
};
