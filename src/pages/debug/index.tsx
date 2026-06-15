import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Input, Textarea, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import { HttpMethod, KeyValue, ApiResponse } from '@/types';
import MethodTag from '@/components/MethodTag';
import StatusBadge from '@/components/StatusBadge';
import EnvSwitcher from '@/components/EnvSwitcher';
import { sendRequest } from '@/utils/request';
import { formatJson, formatDuration, formatBytes, generateId, formatRelativeTime } from '@/utils/format';
import classnames from 'classnames';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const DebugPage: React.FC = () => {
  const {
    currentRequest,
    setCurrentRequest,
    addHistory,
    currentEnvId,
    addScreenshot,
    addScreenshotToRecord,
    screenshots: allScreenshots,
    drafts,
    saveDraft,
    loadDraft,
    deleteDraft,
    renameDraft,
    duplicateDraft,
    sessions,
    createSession,
    addEventToSession,
    history
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [bodyType, setBodyType] = useState<'json' | 'form' | 'raw'>(currentRequest.bodyType || 'json');
  const [lastRecordId, setLastRecordId] = useState<string>('');
  const [screenshotIds, setScreenshotIds] = useState<string[]>(() =>
    [...(currentRequest.contextScreenshotIds || [])]
  );
  const [showDraftPanel, setShowDraftPanel] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autoDraftId = useRef<string>('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionActionType, setSessionActionType] = useState<'new' | 'append'>('new');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameDraftId, setRenameDraftId] = useState<string>('');
  const [renameValue, setRenameValue] = useState('');

  const screenshots = screenshotIds.map(id => allScreenshots.find(s => s.id === id)).filter(Boolean) as any[];

  useEffect(() => {
    setBodyType(currentRequest.bodyType || 'json');
  }, [currentRequest.bodyType]);

  useEffect(() => {
    if (currentRequest.apiId) {
      const autoDraft = drafts.find(d => d.apiId === currentRequest.apiId && d.type === 'auto');
      autoDraftId.current = autoDraft?.id || '';
    } else {
      autoDraftId.current = '';
    }
  }, [currentRequest.apiId, drafts]);

  useEffect(() => {
    if (currentRequest.contextScreenshotIds && currentRequest.contextScreenshotIds.length > 0) {
      setScreenshotIds([...currentRequest.contextScreenshotIds]);
    }
  }, [currentRequest.contextScreenshotIds]);

  const autoSaveDraft = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      if (!currentRequest.url && !currentRequest.name) return;

      const draftData = {
        id: autoDraftId.current || undefined,
        apiId: currentRequest.apiId,
        name: currentRequest.name || currentRequest.url || '未命名草稿',
        method: currentRequest.method,
        url: currentRequest.url,
        headers: [...currentRequest.headers],
        queryParams: [...currentRequest.queryParams],
        body: currentRequest.body,
        bodyType: currentRequest.bodyType,
        assertNote: currentRequest.assertNote || '',
        screenshotIds: [...screenshotIds],
        type: 'auto' as const
      };

      const saved = saveDraft(draftData);
      if (!autoDraftId.current) {
        autoDraftId.current = saved.id;
      }
    }, 2000);
  }, [currentRequest, screenshotIds, saveDraft]);

  useEffect(() => {
    autoSaveDraft();
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [currentRequest, screenshotIds, autoSaveDraft]);

  const updateKeyValue = (list: KeyValue[], index: number, field: 'key' | 'value', value: string): KeyValue[] => {
    const newList = [...list];
    newList[index] = { ...newList[index], [field]: value };
    return newList;
  };

  const toggleKeyValue = (list: KeyValue[], index: number): KeyValue[] => {
    const newList = [...list];
    newList[index] = { ...newList[index], enabled: !newList[index].enabled };
    return newList;
  };

  const deleteKeyValue = (list: KeyValue[], index: number): KeyValue[] => {
    return list.filter((_, i) => i !== index);
  };

  const addKeyValue = (): KeyValue[] => {
    return [{ key: '', value: '', enabled: true }];
  };

  const handleSend = async () => {
    if (!currentRequest.url) {
      Taro.showToast({ title: '请输入请求URL', icon: 'none' });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const resp = await sendRequest({
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        queryParams: currentRequest.queryParams,
        body: currentRequest.body,
        bodyType
      });

      setResponse(resp);

      const recordId = generateId();
      const record = {
        id: recordId,
        apiId: currentRequest.apiId,
        name: currentRequest.name || currentRequest.url,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        queryParams: currentRequest.queryParams,
        body: currentRequest.body,
        bodyType,
        createdAt: Date.now(),
        response: resp,
        assertNote: currentRequest.assertNote,
        environmentId: currentEnvId,
        screenshotIds: [...screenshotIds]
      };
      addHistory(record);
      setLastRecordId(recordId);

      if (currentRequest.sourceRecordId) {
        const sourceRec = history.find(h => h.id === currentRequest.sourceRecordId);
        if (sourceRec?.sessionId) {
          addEventToSession(sourceRec.sessionId, {
            type: 'request',
            userId: 'me',
            userName: '我',
            recordId
          });
        }
      }

      screenshotIds.forEach(sid => {
        addScreenshotToRecord(recordId, sid);
      });

      if (autoDraftId.current) {
        deleteDraft(autoDraftId.current);
        autoDraftId.current = '';
      }

      if (resp.status >= 200 && resp.status < 300) {
        Taro.showToast({ title: '请求成功', icon: 'success' });
      } else if (resp.status >= 400) {
        Taro.showToast({ title: `请求失败 ${resp.status}`, icon: 'none' });
      }
    } catch (error) {
      console.error('[Debug] Request error:', error);
      Taro.showToast({ title: '请求出错', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseImage = () => {
    const canUpload = 9 - screenshotIds.length;
    if (canUpload <= 0) {
      Taro.showToast({ title: '最多上传9张', icon: 'none' });
      return;
    }

    Taro.chooseImage({
      count: canUpload,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newIds: string[] = [];
        res.tempFilePaths.forEach(path => {
          const screenshot = addScreenshot({
            url: path,
            uploader: '我'
          });
          newIds.push(screenshot.id);
        });

        setScreenshotIds(prev => [...prev, ...newIds]);

        if (lastRecordId && newIds.length > 0) {
          newIds.forEach(id => {
            addScreenshotToRecord(lastRecordId, id);
          });
        }
      }
    });
  };

  const handlePreviewScreenshot = (url: string) => {
    const urls = screenshots.map(s => s.url);
    Taro.previewImage({
      urls,
      current: url
    });
  };

  const handleDeleteScreenshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setScreenshotIds(prev => prev.filter(sid => sid !== id));
  };

  const handleViewDetail = () => {
    if (!response || !lastRecordId) return;
    Taro.navigateTo({
      url: `/pages/response/index?id=${lastRecordId}`
    });
  };

  const handleSaveManualDraft = () => {
    const name = draftName.trim() || currentRequest.name || currentRequest.url || '未命名草稿';
    saveDraft({
      apiId: currentRequest.apiId,
      name,
      method: currentRequest.method,
      url: currentRequest.url,
      headers: [...currentRequest.headers],
      queryParams: [...currentRequest.queryParams],
      body: currentRequest.body,
      bodyType: currentRequest.bodyType,
      assertNote: currentRequest.assertNote || '',
      screenshotIds: [...screenshotIds],
      type: 'manual'
    });
    setShowSaveDraftModal(false);
    setDraftName('');
    Taro.showToast({ title: '草稿已保存', icon: 'success' });
  };

  const handleLoadDraft = (draftId: string) => {
    loadDraft(draftId);
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      setScreenshotIds([...draft.screenshotIds]);
      setBodyType(draft.bodyType);
      if (draft.type === 'auto') {
        autoDraftId.current = draft.id;
      } else if (draft.apiId) {
        const autoDraft = drafts.find(d => d.apiId === draft.apiId && d.type === 'auto');
        autoDraftId.current = autoDraft?.id || '';
      } else {
        autoDraftId.current = '';
      }
    }
    setShowDraftPanel(false);
    Taro.showToast({ title: '已加载草稿', icon: 'success' });
  };

  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    deleteDraft(draftId);
    if (autoDraftId.current === draftId) {
      autoDraftId.current = '';
    }
  };

  const handleOpenNewSessionModal = () => {
    setSessionActionType('new');
    setSessionTitle(currentRequest.name || currentRequest.url || '未命名会话');
    setSessionDescription(currentRequest.assertNote || '');
    setShowSessionModal(true);
  };

  const handleOpenAppendSessionModal = () => {
    if (sessions.length === 0) {
      Taro.showToast({ title: '暂无可追加的会话', icon: 'none' });
      return;
    }
    setSessionActionType('append');
    setShowSessionModal(true);
  };

  const handleCreateSessionAndAppend = () => {
    const title = sessionTitle.trim() || '未命名会话';
    const session = createSession({
      title,
      description: sessionDescription,
      apiId: currentRequest.apiId,
      status: 'active',
      createdBy: '我',
      recordIds: lastRecordId ? [lastRecordId] : [],
      screenshotIds: [...screenshotIds],
      conclusion: ''
    });
    if (lastRecordId) {
      addEventToSession(session.id, {
        type: 'request',
        userId: 'me',
        userName: '我',
        recordId: lastRecordId
      });
    }
    screenshotIds.forEach(sid => {
      addEventToSession(session.id, {
        type: 'screenshot',
        userId: 'me',
        userName: '我',
        screenshotId: sid
      });
    });
    setShowSessionModal(false);
    setSessionTitle('');
    setSessionDescription('');
    Taro.navigateTo({ url: `/pages/session/index?id=${session.id}` });
  };

  const handleAppendToSession = (sessionId: string) => {
    if (lastRecordId) {
      addEventToSession(sessionId, {
        type: 'request',
        userId: 'me',
        userName: '我',
        recordId: lastRecordId
      });
    }
    screenshotIds.forEach(sid => {
      addEventToSession(sessionId, {
        type: 'screenshot',
        userId: 'me',
        userName: '我',
        screenshotId: sid
      });
    });
    setShowSessionModal(false);
    Taro.navigateTo({ url: `/pages/session/index?id=${sessionId}` });
  };

  const handleRenameDraft = (draftId: string, currentName: string) => {
    setRenameDraftId(draftId);
    setRenameValue(currentName);
    setShowRenameModal(true);
  };

  const handleConfirmRename = () => {
    if (!renameDraftId) return;
    const name = renameValue.trim();
    if (!name) {
      Taro.showToast({ title: '请输入草稿名称', icon: 'none' });
      return;
    }
    renameDraft(renameDraftId, name);
    setShowRenameModal(false);
    setRenameDraftId('');
    setRenameValue('');
    Taro.showToast({ title: '已重命名', icon: 'success' });
  };

  const handleDuplicateDraft = (draftId: string) => {
    duplicateDraft(draftId);
    Taro.showToast({ title: '已复制一份草稿', icon: 'success' });
  };

  const handleNoteChange = (e: any) => {
    setCurrentRequest({ assertNote: e.detail.value });
  };

  const renderParamList = (
    params: KeyValue[],
    onChange: (params: KeyValue[]) => void,
    paramKey: string
  ) => (
    <View>
      {params.map((param, index) => (
        <View className={styles.paramRow} key={`${paramKey}-${index}`}>
          <View
            className={classnames(styles.paramToggle, param.enabled && styles.enabled)}
            onClick={() => onChange(toggleKeyValue(params, index))}
          >
            {param.enabled ? '✓' : ''}
          </View>
          <Input
            className={styles.paramKey}
            placeholder="Key"
            placeholderTextColor="#64748B"
            value={param.key}
            onInput={(e) => onChange(updateKeyValue(params, index, 'key', e.detail.value))}
          />
          <Input
            className={styles.paramValue}
            placeholder="Value"
            placeholderTextColor="#64748B"
            value={param.value}
            onInput={(e) => onChange(updateKeyValue(params, index, 'value', e.detail.value))}
          />
          <View
            className={styles.paramDelete}
            onClick={() => onChange(deleteKeyValue(params, index))}
          >
            ×
          </View>
        </View>
      ))}
      <View
        className={styles.addBtn}
        onClick={() => onChange([...params, ...addKeyValue()])}
      >
        + 添加{paramKey === 'queryParams' ? '参数' : paramKey === 'headers' ? 'Header' : '项'}
      </View>
    </View>
  );

  const apiDrafts = drafts.filter(d => !d.apiId || d.apiId === currentRequest.apiId);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View style={{ flex: 1 }}>
          <Text className={styles.title}>调试面板</Text>
          <Text className={styles.subtitle}>填写请求参数，发送并调试接口</Text>
        </View>
        <View className={styles.draftBtn} onClick={() => setShowDraftPanel(true)}>
          📝 草稿
          {apiDrafts.length > 0 && (
            <View className={styles.draftBadge}>{apiDrafts.length}</View>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <EnvSwitcher />
      </View>

      <View className={styles.requestCard}>
        <View className={styles.urlRow}>
          <View className={styles.methodSelect}>
            <View
              className={styles.methodBtn}
              onClick={() => setShowMethodDropdown(!showMethodDropdown)}
            >
              <Text className={styles.methodText} style={{ color: '#6366F1' }}>
                {currentRequest.method || 'GET'}
              </Text>
              <Text className={styles.methodArrow}>▼</Text>
            </View>
            {showMethodDropdown && (
              <View className={styles.methodDropdown}>
                {HTTP_METHODS.map(method => (
                  <View
                    key={method}
                    className={styles.methodOption}
                    onClick={() => {
                      setCurrentRequest({ method });
                      setShowMethodDropdown(false);
                    }}
                  >
                    <MethodTag method={method} />
                  </View>
                ))}
              </View>
            )}
          </View>
          <Input
            className={styles.urlInput}
            placeholder="输入请求 URL"
            placeholderTextColor="#64748B"
            value={currentRequest.url}
            onInput={(e) => setCurrentRequest({ url: e.detail.value })}
          />
          <View
            className={classnames(styles.sendBtn, loading && styles.loading)}
            onClick={handleSend}
          >
            {loading ? '发送中...' : '发送'}
          </View>
        </View>

        <View className={styles.tabs}>
          <View
            className={classnames(styles.tab, activeTab === 'params' && styles.active)}
            onClick={() => setActiveTab('params')}
          >
            Query Params
          </View>
          <View
            className={classnames(styles.tab, activeTab === 'headers' && styles.active)}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </View>
          <View
            className={classnames(styles.tab, activeTab === 'body' && styles.active)}
            onClick={() => setActiveTab('body')}
          >
            Body
          </View>
        </View>

        <View className={styles.paramsSection}>
          {activeTab === 'params' && renderParamList(
            currentRequest.queryParams,
            (params) => setCurrentRequest({ queryParams: params }),
            'queryParams'
          )}
          {activeTab === 'headers' && renderParamList(
            currentRequest.headers,
            (headers) => setCurrentRequest({ headers }),
            'headers'
          )}
          {activeTab === 'body' && (
            <View>
              <View className={styles.bodyTypeSelector}>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'json' && styles.active)}
                  onClick={() => {
                    setBodyType('json');
                    setCurrentRequest({ bodyType: 'json' });
                  }}
                >
                  JSON
                </View>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'form' && styles.active)}
                  onClick={() => {
                    setBodyType('form');
                    setCurrentRequest({ bodyType: 'form' });
                  }}
                >
                  Form
                </View>
                <View
                  className={classnames(styles.bodyTypeOption, bodyType === 'raw' && styles.active)}
                  onClick={() => {
                    setBodyType('raw');
                    setCurrentRequest({ bodyType: 'raw' });
                  }}
                >
                  Raw
                </View>
              </View>
              <Textarea
                className={styles.bodyTextarea}
                placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : '输入请求体...'}
                placeholderTextColor="#64748B"
                value={currentRequest.body}
                onInput={(e) => setCurrentRequest({ body: e.detail.value })}
              />
            </View>
          )}
        </View>
      </View>

      {response && (
        <View className={styles.responsePreview}>
          <View className={styles.responseCard}>
            <View className={styles.responseHeader}>
              <Text className={styles.responseTitle}>响应结果</Text>
              <View className={styles.responseMeta}>
                <StatusBadge status={response.status} statusText={response.statusText} />
                <Text className={styles.metaItem}>{formatDuration(response.duration)}</Text>
                <Text className={styles.metaItem}>{formatBytes(response.size)}</Text>
              </View>
            </View>

            <View className={styles.responseTabs}>
              <View
                className={classnames(styles.responseTab, activeResponseTab === 'body' && styles.active)}
                onClick={() => setActiveResponseTab('body')}
              >
                Body
              </View>
              <View
                className={classnames(styles.responseTab, activeResponseTab === 'headers' && styles.active)}
                onClick={() => setActiveResponseTab('headers')}
              >
                Headers
              </View>
            </View>

            {activeResponseTab === 'body' && (
              <ScrollView scrollY style={{ maxHeight: 400 }}>
                <View className={styles.responseBody}>
                  {formatJson(response.data)}
                </View>
              </ScrollView>
            )}

            {activeResponseTab === 'headers' && (
              <ScrollView scrollY style={{ maxHeight: 400 }}>
                {Object.entries(response.headers).map(([key, value]) => (
                  <View key={key} className={styles.headerItem}>
                    <Text className={styles.headerKey}>{key}</Text>
                    <Text className={styles.headerValue}>{value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <View className={styles.noteSection}>
        <Text className={styles.noteLabel}>断言备注</Text>
        <Textarea
          className={styles.noteInput}
          placeholder="记录测试结果、断言条件或备注信息..."
          placeholderTextColor="#64748B"
          value={currentRequest.assertNote || ''}
          onInput={handleNoteChange}
        />
      </View>

      <View className={styles.screenshotSection}>
        <Text className={styles.screenshotTitle}>📸 错误截图</Text>
        <View className={styles.screenshotGrid}>
          {screenshots.map((s) => (
            <View
              key={s.id}
              className={styles.screenshotItem}
              onClick={() => handlePreviewScreenshot(s.url)}
            >
              <Image src={s.url} mode="aspectFill" />
              <View className={styles.screenshotDelete} onClick={(e) => handleDeleteScreenshot(e, s.id)}>
                ×
              </View>
            </View>
          ))}
          {screenshotIds.length < 9 && (
            <View className={styles.screenshotAdd} onClick={handleChooseImage}>
              <Text className={styles.addIcon}>+</Text>
              <Text>上传</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.secondaryBtn} onClick={() => setShowSaveDraftModal(true)}>
          💾 存为草稿
        </View>
        <View className={styles.sessionActions}>
          <View
            className={classnames(styles.sessionBtn, !lastRecordId && { opacity: 0.5 })}
            onClick={() => {
              if (!lastRecordId) {
                Taro.showToast({ title: '请先发送请求', icon: 'none' });
                return;
              }
              handleOpenNewSessionModal();
            }}
          >
            🆕 新建会话
          </View>
          <View
            className={classnames(styles.sessionBtn, !lastRecordId && { opacity: 0.5 })}
            onClick={() => {
              if (!lastRecordId) {
                Taro.showToast({ title: '请先发送请求', icon: 'none' });
                return;
              }
              handleOpenAppendSessionModal();
            }}
          >
            ➕ 加入会话
          </View>
        </View>
        <View
          className={classnames(styles.primaryBtn, !response && styles.disabled)}
          onClick={handleViewDetail}
        >
          查看详情
        </View>
      </View>

      {showDraftPanel && (
        <View className={styles.modalOverlay} onClick={() => setShowDraftPanel(false)}>
          <View className={styles.draftPanel} onClick={(e) => e.stopPropagation()}>
            <View className={styles.draftPanelHeader}>
              <Text className={styles.draftPanelTitle}>草稿箱</Text>
              <Text className={styles.draftPanelClose} onClick={() => setShowDraftPanel(false)}>
                ×
              </Text>
            </View>
            <ScrollView className={styles.draftList} scrollY>
              {(() => {
                const apiDrafts = drafts.filter(d => 
                  currentRequest.apiId ? d.apiId === currentRequest.apiId : !d.apiId
                );
                const autoDrafts = apiDrafts.filter(d => d.type === 'auto');
                const manualDrafts = apiDrafts.filter(d => d.type === 'manual');
                const otherDrafts = drafts.filter(d => 
                  currentRequest.apiId ? d.apiId !== currentRequest.apiId : !!d.apiId
                );
                const allEmpty = apiDrafts.length === 0 && otherDrafts.length === 0;

                const renderDraftCard = (draft: any) => (
                  <View key={draft.id} className={styles.draftItem} onClick={() => handleLoadDraft(draft.id)}>
                    <View className={styles.draftItemHeader}>
                      <MethodTag method={draft.method} />
                      <Text className={styles.draftItemName}>{draft.name}</Text>
                      {draft.type === 'auto' && (
                        <Text className={styles.draftAutoTag}>自动</Text>
                      )}
                    </View>
                    <Text className={styles.draftItemUrl} numberOfLines={1}>
                      {draft.url}
                    </Text>
                    <View className={styles.draftItemFooter}>
                      <Text className={styles.draftItemTime}>
                        {formatRelativeTime(draft.updatedAt)}
                      </Text>
                      <View className={styles.draftItemActions}>
                        <Text
                          className={styles.draftItemAction}
                          onClick={(e) => { e.stopPropagation(); handleRenameDraft(draft.id, draft.name); }}
                        >
                          ✏️
                        </Text>
                        <Text
                          className={styles.draftItemAction}
                          onClick={(e) => { e.stopPropagation(); handleDuplicateDraft(draft.id); }}
                        >
                          📋
                        </Text>
                        <Text
                          className={styles.draftItemAction}
                          onClick={(e) => handleDeleteDraft(e, draft.id)}
                        >
                          🗑️
                        </Text>
                      </View>
                    </View>
                  </View>
                );

                return (
                  <>
                    {allEmpty && (
                      <View className={styles.draftEmpty}>
                        <Text>暂无草稿</Text>
                      </View>
                    )}
                    {autoDrafts.length > 0 && (
                      <>
                        <Text className={styles.draftSectionTitle}>自动草稿</Text>
                        {autoDrafts.map(renderDraftCard)}
                      </>
                    )}
                    {manualDrafts.length > 0 && (
                      <>
                        <Text className={styles.draftSectionTitle}>手动草稿</Text>
                        {manualDrafts.map(renderDraftCard)}
                      </>
                    )}
                    {otherDrafts.length > 0 && (
                      <>
                        <Text className={styles.draftSectionTitle}>其他接口草稿</Text>
                        {otherDrafts.map(renderDraftCard)}
                      </>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      )}

      {showSaveDraftModal && (
        <View className={styles.modalOverlay} onClick={() => setShowSaveDraftModal(false)}>
          <View className={styles.saveDraftModal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>保存草稿</Text>
            <Input
              className={styles.modalInput}
              placeholder="输入草稿名称"
              placeholderTextColor="#64748B"
              value={draftName}
              onInput={(e) => setDraftName(e.detail.value)}
            />
            <View className={styles.modalActions}>
              <View
                className={styles.modalCancelBtn}
                onClick={() => setShowSaveDraftModal(false)}
              >
                取消
              </View>
              <View className={styles.modalConfirmBtn} onClick={handleSaveManualDraft}>
                保存
              </View>
            </View>
          </View>
        </View>
      )}

      {showSessionModal && (
        <View className={styles.modalMask} onClick={() => setShowSessionModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              {sessionActionType === 'new' ? '新建调试会话' : '追加到会话'}
            </Text>
            {sessionActionType === 'new' ? (
              <>
                <Text className={styles.modalLabel}>会话标题</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入会话标题"
                  placeholderTextColor="#64748B"
                  value={sessionTitle}
                  onInput={(e) => setSessionTitle(e.detail.value)}
                />
                <Text className={styles.modalLabel}>问题描述（选填）</Text>
                <Textarea
                  className={styles.modalTextarea}
                  placeholder="描述你要排查的问题..."
                  placeholderTextColor="#64748B"
                  value={sessionDescription}
                  onInput={(e) => setSessionDescription(e.detail.value)}
                />
                <View className={styles.modalActions}>
                  <View className={styles.modalCancel} onClick={() => setShowSessionModal(false)}>取消</View>
                  <View className={styles.modalConfirm} onClick={handleCreateSessionAndAppend}>创建</View>
                </View>
              </>
            ) : (
              <>
                <ScrollView scrollY style={{ maxHeight: '60vh' }}>
                  {sessions.map(session => (
                    <View key={session.id} className={styles.sessionItem} onClick={() => handleAppendToSession(session.id)}>
                      <View className={styles.sessionItemHeader}>
                        <Text className={styles.sessionItemTitle}>{session.title}</Text>
                        <View className={classnames(
                          styles.sessionItemStatus,
                          session.status === 'active' && styles.sessionStatusActive,
                          session.status === 'resolved' && styles.sessionStatusResolved,
                          session.status === 'archived' && styles.sessionStatusArchived
                        )}>
                          {session.status === 'active' ? '进行中' : session.status === 'resolved' ? '已解决' : '已归档'}
                        </View>
                      </View>
                      <Text className={styles.sessionItemMeta}>
                        {session.recordIds.length} 次请求 · {session.events.length} 条记录
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View className={styles.modalActions}>
                  <View className={styles.modalCancel} onClick={() => setShowSessionModal(false)}>取消</View>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {showRenameModal && (
        <View className={styles.modalMask} onClick={() => setShowRenameModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>重命名草稿</Text>
            <Input
              className={styles.modalInput}
              placeholder="请输入新的草稿名称"
              placeholderTextColor="#64748B"
              value={renameValue}
              onInput={(e) => setRenameValue(e.detail.value)}
            />
            <View className={styles.modalActions}>
              <View className={styles.modalCancel} onClick={() => setShowRenameModal(false)}>取消</View>
              <View className={styles.modalConfirm} onClick={handleConfirmRename}>确定</View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default DebugPage;
