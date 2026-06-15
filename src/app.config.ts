export default defineAppConfig({
  pages: [
    'pages/apis/index',
    'pages/debug/index',
    'pages/history/index',
    'pages/issues/index',
    'pages/mine/index',
    'pages/response/index',
    'pages/issue-detail/index',
    'pages/issue-create/index',
    'pages/share/index',
    'pages/share-view/index',
    'pages/session/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#1E293B',
    navigationBarTitleText: 'API Debug',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0F172A'
  },
  tabBar: {
    color: '#64748B',
    selectedColor: '#6366F1',
    backgroundColor: '#1E293B',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/apis/index',
        text: '接口'
      },
      {
        pagePath: 'pages/debug/index',
        text: '调试'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史'
      },
      {
        pagePath: 'pages/issues/index',
        text: '问题'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
