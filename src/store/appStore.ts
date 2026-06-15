import { createContext, useContext } from 'react';
import { EnvironmentConfig, ApiGroup, RequestRecord, Issue, ApiItem, KeyValue, HttpMethod } from '@/types';
import { mockEnvironments, mockApiGroups } from '@/data/mockApis';
import { mockHistory } from '@/data/mockHistory';
import { mockIssues } from '@/data/mockIssues';

export interface AppState {
  environments: EnvironmentConfig[];
  currentEnvId: string;
  apiGroups: ApiGroup[];
  history: RequestRecord[];
  issues: Issue[];
  currentRequest: {
    name: string;
    method: HttpMethod;
    url: string;
    headers: KeyValue[];
    queryParams: KeyValue[];
    body: string;
    bodyType: 'json' | 'form' | 'raw';
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
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (issueId: string, status: Issue['status']) => void;
}

export type AppStore = AppState & AppActions;

export const initialState: AppState = {
  environments: mockEnvironments,
  currentEnvId: mockEnvironments[1].id,
  apiGroups: mockApiGroups,
  history: mockHistory,
  issues: mockIssues,
  currentRequest: {
    name: '',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'json'
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
