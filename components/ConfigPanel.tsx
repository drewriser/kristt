import React, { useState, useEffect } from 'react';
import { ApiConfig, DEFAULT_CONFIG, SoraModel, SoraStyle, SoraCharacter } from '../types';
import { Settings, Save, RotateCcw, HelpCircle, Palette, Lock, Zap, Server, Image as ImageIcon, User, Film, PlusCircle } from 'lucide-react';
import CharacterLibrary from './CharacterLibrary';

interface Props {
  config: ApiConfig;
  onUpdate: (newConfig: ApiConfig) => void;
  // Character props passed from App
  characters: SoraCharacter[];
  onUpdateCharacters: (chars: SoraCharacter[]) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onUpdate, characters, onUpdateCharacters }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLibOpen, setIsLibOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);
  const [imageUrlsText, setImageUrlsText] = useState(config.imageUrls ? config.imageUrls.join('\n') : '');

  useEffect(() => {
    setLocalConfig(config);
    setImageUrlsText(config.imageUrls ? config.imageUrls.join('\n') : '');
  }, [config]);

  const handleSave = () => {
    onUpdate(localConfig);
  };

  const handleReset = () => {
    const newConfig = { ...DEFAULT_CONFIG, apiKey: config.apiKey };
    setLocalConfig(newConfig);
    setImageUrlsText('');
    onUpdate(newConfig);
  };

  const handleImageUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setImageUrlsText(text);
    setLocalConfig({
      ...localConfig,
      imageUrls: text.split('\n').map(s => s.trim()).filter(s => s !== '')
    });
  };

  const toggleCharacterSelection = (charId: string) => {
    const current = localConfig.selectedCharacterIds || [];
    let newSelection;
    if (current.includes(charId)) {
      newSelection = current.filter(id => id !== charId);
    } else {
      newSelection = [...current, charId];
    }
    setLocalConfig({ ...localConfig, selectedCharacterIds: newSelection });
  };

  // Duration options depend on the model
  const getDurationOptions = (model: SoraModel) => {
    if (model === 'sora-2-pro') {
      return [10, 15, 25];
    }
    return [10, 15]; // sora-2 strictly supports 10 or 15
  };

  // Helper to ensure config consistency
  const updateConfigWithModelCheck = (newModel: SoraModel) => {
    let newDuration = localConfig.duration;
    // Auto-fix duration if switching to standard model which supports max 15s
    if (newModel === 'sora-2' && newDuration > 15) {
      newDuration = 15;
    }
    setLocalConfig({...localConfig, model: newModel, duration: newDuration});
  };

  const styleOptions: {value: SoraStyle, label: string}[] = [
    { value: 'none', label: '✨ 默认 (写实风格)' },
    { value: 'anime', label: '🎌 动漫 (Anime)' },
    { value: 'comic', label: '📚 漫画 (Comic Book)' },
    { value: 'nostalgic', label: '🎞️ 复古/怀旧 (Nostalgic)' },
    { value: 'thanksgiving', label: '🦃 感恩节 (Thanksgiving)' },
    { value: 'news', label: '📺 新闻广播 (News)' },
    { value: 'selfie', label: '🤳 自拍 (Selfie)' },
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mb-6 flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-600 transition-colors">
            <Settings className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200">生成参数配置</h3>
            <p className="text-xs text-slate-500">点击展开详细设置 (模型、风格、参考图、角色)</p>
          </div>
        </div>
        <span className="text-xs text-indigo-400 font-medium">修改配置 &rarr;</span>
      </button>
    );
  }

  return (
    <div className="mb-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
      <CharacterLibrary 
        isOpen={isLibOpen} 
        onClose={() => setIsLibOpen(false)} 
        characters={characters}
        onUpdateCharacters={onUpdateCharacters}
      />

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          生成参数配置
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          收起
        </button>
      </div>

      <div className="p-5 space-y-8 max-h-[800px] overflow-y-auto custom-scrollbar">
        
        {/* --- Section 1: Core Params --- */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3 h-3" /> 模型与风格
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">模型版本</label>
              <div className="relative">
                <select 
                  value={localConfig.model}
                  onChange={(e) => updateConfigWithModelCheck(e.target.value as SoraModel)}
                  className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all hover:border-slate-600"
                >
                  <option value="sora-2">Sora 2 (标准版)</option>
                  <option value="sora-2-pro">Sora 2 Pro (专业版)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">时长</label>
              <div className="relative">
                <select 
                  value={localConfig.duration}
                  onChange={(e) => setLocalConfig({...localConfig, duration: Number(e.target.value)})}
                  className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all hover:border-slate-600"
                >
                  {getDurationOptions(localConfig.model).map(d => (
                    <option key={d} value={d}>{d} 秒</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Palette className="w-3 h-3" /> 视觉风格
            </label>
            <div className="relative">
              <select 
                value={localConfig.style}
                onChange={(e) => setLocalConfig({...localConfig, style: e.target.value as SoraStyle})}
                className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all hover:border-slate-600"
              >
                {styleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">画面比例</label>
            <div className="grid grid-cols-2 gap-3">
              {['16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setLocalConfig({...localConfig, aspectRatio: ratio})}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                    localConfig.aspectRatio === ratio 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Section 2: Character Library & Selection (NEW) --- */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-3 h-3" /> 使用角色
            </h4>
            <button 
              onClick={() => setIsLibOpen(true)}
              className="text-[10px] flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              <PlusCircle className="w-3 h-3" /> 管理角色库
            </button>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
             {characters.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 mb-2">暂无可用角色</p>
                  <button 
                    onClick={() => setIsLibOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                  >
                    去添加
                  </button>
                </div>
             ) : (
               <div className="grid grid-cols-2 gap-2">
                 {characters.map(char => {
                   const isSelected = localConfig.selectedCharacterIds?.includes(char.id);
                   return (
                     <button
                       key={char.id}
                       onClick={() => toggleCharacterSelection(char.id)}
                       className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                         isSelected 
                           ? 'bg-purple-600/20 border-purple-500/50' 
                           : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                       }`}
                     >
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${char.avatarColor || 'bg-slate-600'}`}>
                         {char.name[0]}
                       </div>
                       <div className="min-w-0">
                         <div className={`text-xs font-bold truncate ${isSelected ? 'text-purple-200' : 'text-slate-300'}`}>{char.name}</div>
                         <div className="text-[9px] text-slate-500 truncate font-mono">{char.username}</div>
                       </div>
                       {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
                     </button>
                   );
                 })}
               </div>
             )}
             {localConfig.selectedCharacterIds?.length > 0 && (
               <div className="mt-2 text-[10px] text-purple-400/80 bg-purple-950/20 p-2 rounded border border-purple-900/30">
                 ✨ 选中的角色 ID 将自动追加到所有提示词末尾。
               </div>
             )}
          </div>
        </div>


        {/* --- Section 3: Image & Character Options --- */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> 参考图与角色视频 (高级)
          </h4>

          {/* Image URLs */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex justify-between">
              参考图 URL <span className="text-[10px] text-slate-500 font-normal">每行一个链接 (jpg/png)</span>
            </label>
            <textarea
              value={imageUrlsText}
              onChange={handleImageUrlsChange}
              placeholder="https://example.com/image1.jpg"
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none"
              spellCheck={false}
            />
          </div>

           <div className="grid grid-cols-1 gap-4">
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                   <User className="w-3 h-3 text-slate-500" /> 参考角色视频 URL
                   <span className="text-[10px] text-yellow-500/80 ml-auto">⚠️ 生成时长将 -1s</span>
                </label>
                <input 
                  type="text"
                  value={localConfig.characterUrl || ''}
                  onChange={(e) => setLocalConfig({...localConfig, characterUrl: e.target.value})}
                  placeholder="https://.../video.mp4"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                   角色时间戳 (Start, End)
                   <span className="text-[10px] text-slate-500 ml-auto">仅支持2秒片段 (如 1,3)</span>
                </label>
                <input 
                  type="text"
                  value={localConfig.characterTimestamps || ''}
                  onChange={(e) => setLocalConfig({...localConfig, characterTimestamps: e.target.value})}
                  placeholder="1,3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                />
             </div>
           </div>
        </div>

        {/* --- Section 4: Advanced Options --- */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Film className="w-3 h-3" /> 高级选项
          </h4>

          <div className="grid grid-cols-2 gap-3">
             {/* Storyboard Toggle */}
             <button
                onClick={() => setLocalConfig({...localConfig, storyboard: !localConfig.storyboard})}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  localConfig.storyboard 
                    ? 'bg-indigo-950/30 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`text-xs font-medium ${localConfig.storyboard ? 'text-indigo-200' : 'text-slate-400'}`}>故事板 (Storyboard)</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${localConfig.storyboard ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                   <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.storyboard ? 'translate-x-4' : ''}`} />
                </div>
             </button>

             {/* Thumbnail Toggle */}
             <button
                onClick={() => setLocalConfig({...localConfig, thumbnail: !localConfig.thumbnail})}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  localConfig.thumbnail 
                    ? 'bg-indigo-950/30 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`text-xs font-medium ${localConfig.thumbnail ? 'text-indigo-200' : 'text-slate-400'}`}>生成缩略图</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${localConfig.thumbnail ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                   <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.thumbnail ? 'translate-x-4' : ''}`} />
                </div>
             </button>

             {/* Watermark Toggle */}
             <button
                onClick={() => setLocalConfig({...localConfig, watermark: !localConfig.watermark})}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  localConfig.watermark 
                    ? 'bg-indigo-950/30 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`text-xs font-medium ${localConfig.watermark ? 'text-indigo-200' : 'text-slate-400'}`}>官方水印</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${localConfig.watermark ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                   <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.watermark ? 'translate-x-4' : ''}`} />
                </div>
             </button>

             {/* Private Toggle */}
             <button
                onClick={() => setLocalConfig({...localConfig, isPrivate: !localConfig.isPrivate})}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  localConfig.isPrivate 
                    ? 'bg-indigo-950/30 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className={`text-xs font-medium ${localConfig.isPrivate ? 'text-indigo-200' : 'text-slate-400'}`}>隐私模式 (No Remix)</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${localConfig.isPrivate ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                   <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.isPrivate ? 'translate-x-4' : ''}`} />
                </div>
             </button>
          </div>
        </div>

        {/* --- Section 5: Advanced API (Debug) --- */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-3 h-3" /> 高级接口设置 (DEBUG)
          </h4>
          
          <div className="space-y-3">
             <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400">查询接口模式 (Query Pattern)</label>
                <div className="relative">
                   <input 
                    type="text" 
                    value={localConfig.queryEndpointPattern}
                    onChange={(e) => setLocalConfig({...localConfig, queryEndpointPattern: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none"
                  />
                  <div className="absolute right-2 top-2 text-slate-600">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-medium text-slate-400">并发任务数 (Risk)</label>
                   <span className="text-[10px] font-mono text-yellow-500">{localConfig.concurrency}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  value={localConfig.concurrency}
                  onChange={(e) => setLocalConfig({...localConfig, concurrency: Number(e.target.value)})}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> 重置
        </button>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95"
        >
          <Save className="w-3.5 h-3.5" /> 保存配置
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;