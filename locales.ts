import { Language } from './types';

export const translations = {
  en: {
    nav: {
      create: 'Generate',
      queue: 'Queue',
      gallery: 'Gallery',
      library: 'Prompt Library',
      cast: 'Characters',
      settings: 'Settings'
    },
    create: {
      subtitle: 'Video Studio', // Changed from Batch Factory
      placeholder: 'Add extra details or scene description here...', // Changed placeholder
      model: 'Model',
      ratio: 'Ratio',
      duration: 'Duration',
      style: 'Style',
      cast: 'Cast',
      standard: 'Standard',
      pro: 'Pro',
      none: 'None',
      realistic: 'Realistic',
      anime: 'Anime',
      comic: 'Comic',
      vintage: 'Vintage',
      quickPick: 'Quick Pick',
      noPrompts: 'No matching scripts found.',
      batch: 'Single Task Mode', // Changed
      consistency: 'Character Consistency',
      autoQueue: 'Auto-Queue',
      config: 'Configuration',
      library: 'Scripts',
      scripts: 'Script',
      refImage: 'Ref Image',
      activeCast: 'Active Cast',
      activeScript: 'Active Script', // New
      selectScript: 'Select a Script Base',
      selectCast: 'Select Cast',
      pasteImages: 'Paste Image URLs (one per line)',
      advanced: 'Advanced'
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Configure language, API connection and global parameters',
      language: 'Language',
      auth: 'API Authentication',
      connection: 'Connection',
      concurrency: 'Concurrency',
      save: 'Save Configuration',
      savedToast: 'Settings Saved',
      apiKeyPlaceholder: 'Your API Key (sk-...)',
      baseUrl: 'API Base URL',
      endpointPattern: 'Status Check Endpoint Pattern',
      helpText: 'All settings are auto-saved locally except API Key which requires manual save.',
      safe: 'Safe',
      fast: 'Fast',
      turbo: 'Turbo'
    },
    status: {
      processing: 'PROCESSING',
      paused: 'PAUSED',
      active: 'Active',
      pending: 'Pending'
    }
  },
  zh: {
    nav: {
      create: '开始创作',
      queue: '任务队列',
      gallery: '视频画廊',
      library: '脚本库',
      cast: '角色管理',
      settings: '系统设置'
    },
    create: {
      subtitle: '视频生成工场', // Changed
      placeholder: '在此补充画面细节或额外指令 (可选)...', // Changed
      model: '模型版本',
      ratio: '画面比例',
      duration: '视频时长',
      style: '视觉风格',
      cast: '角色植入',
      standard: '标准版',
      pro: '专业版',
      none: '无',
      realistic: '写实风格',
      anime: '日本动漫',
      comic: '美式漫画',
      vintage: '复古胶片',
      quickPick: '快速选择',
      noPrompts: '未找到匹配的脚本',
      batch: '单任务模式', // Changed
      consistency: '角色一致性',
      autoQueue: '自动队列',
      config: '参数配置',
      library: '脚本库',
      scripts: '引用脚本',
      refImage: '参考图',
      activeCast: '活跃角色',
      activeScript: '已挂载脚本', // New
      selectScript: '选择基础脚本',
      selectCast: '选择出演角色',
      pasteImages: '输入参考图链接 (每行一个)',
      advanced: '高级参数'
    },
    settings: {
      title: '系统设置',
      subtitle: '配置语言、API 连接与全局运行参数',
      language: '界面语言 (Language)',
      auth: 'API 授权',
      connection: '连接设置',
      concurrency: '并发限制',
      save: '保存配置',
      savedToast: '设置已保存',
      apiKeyPlaceholder: '请输入 API Key (sk-...)',
      baseUrl: 'API 基础地址',
      endpointPattern: '状态查询接口模式',
      helpText: '除 API Key 需手动保存外，其他修改均会自动存储在本地。',
      safe: '安全模式',
      fast: '快速模式',
      turbo: '极速模式'
    },
    status: {
      processing: '处理中',
      paused: '已暂停',
      active: '进行中',
      pending: '等待中'
    }
  }
};

export const getTranslation = (lang: Language) => translations[lang];